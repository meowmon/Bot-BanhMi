const {
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const cheerio = require("cheerio");

const NEWS_API_BASE = "https://g.nexonstatic.com/maplestory/cms/v1/news";
const MEDIA_BASE = "https://g.nexonstatic.com";
const FETCH_HEADERS = {
  accept: "application/json, text/plain, */*",
  origin: "https://www.nexon.com",
  referer: "https://www.nexon.com/",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
};

// Discord giới hạn tổng text của message Components V2 ~4000 ký tự
const TEXT_BUDGET = 3600;

// ── Fetch & parse ─────────────────────────────────────────────────────────────

async function fetchSunnyData() {
  // 1. Lấy danh sách tin tức
  const listRes = await fetch(NEWS_API_BASE, { headers: FETCH_HEADERS });
  if (!listRes.ok) throw new Error("Không thể tải danh sách tin tức.");
  const articles = await listRes.json();

  // 2. Tìm bài patch notes đầu tiên
  const patchNotes = articles.find(
    (a) => a.name.toLowerCase().includes("patch notes") && a.category === "update"
  );
  if (!patchNotes) throw new Error("Không tìm thấy bài Patch Notes.");

  // 3. Lấy nội dung bài viết
  const detailRes = await fetch(`${NEWS_API_BASE}/${patchNotes.id}`, {
    headers: FETCH_HEADERS,
  });
  if (!detailRes.ok) throw new Error("Không thể tải nội dung bài viết.");
  const detail = await detailRes.json();

  // 4. Trích xuất phần Sunny Sunday
  const body = detail.body;
  const anchorIdx = body.lastIndexOf('id="SunnySunday"');
  if (anchorIdx === -1)
    throw new Error("Không tìm thấy phần Sunny Sunday trong bài viết này.");

  const sectionStart = body.lastIndexOf("<h2", anchorIdx);
  const backToTopIdx = body.indexOf("Back to Top", anchorIdx);
  const sectionHtml = body.slice(sectionStart, backToTopIdx + 20);

  // 5. Parse HTML với cheerio
  const $ = cheerio.load(sectionHtml);

  // Parse bảng ngày & perks
  const rows = [];
  $("tr").each((i, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;
    let date = $(cells[0])
      .contents()
      .filter((_, n) => n.type === "text")
      .first()
      .text()
      .trim();
    if (!date) date = $(cells[0]).text().trim();
    const perks = extractPerks($, cells[1]);
    if (date && perks.length) rows.push({ date, perks });
  });

  return { patchNotes, rows };
}

// Gom text của một node, giữ lại in đậm dạng markdown
function inlineText($, el) {
  const $el = $(el).clone();
  $el.find("strong, b").each((_, n) => {
    const t = $(n).text().replace(/\s+/g, " ").trim();
    $(n).replaceWith(t ? ` **${t}** ` : " ");
  });
  return $el
    .text()
    .replace(/\s+/g, " ")
    .replace(/\s+([.,:;!?)\]])/g, "$1") // bỏ khoảng trắng thừa do chèn **
    .trim();
}

// Trích xuất perk, flatten sub-items thành cùng cấp
function extractPerks($, td) {
  const lines = [];

  const pushListItem = (li) => {
    const $li = $(li);
    const $clone = $li.clone();
    $clone.children("ul, ol").remove();
    const direct = inlineText($, $clone);
    if (direct) lines.push(`• ${direct}`);
    $li.children("ul, ol").children("li").each((_, sub) => pushListItem(sub));
  };

  $(td)
    .children()
    .each((_, el) => {
      const tag = (el.tagName || "").toLowerCase();
      if (tag === "ul" || tag === "ol") {
        $(el).children("li").each((__, li) => pushListItem(li));
      } else {
        // Các dòng ngoài list (vd: <div><strong>Special Sunny Sunday</strong></div>)
        const text = inlineText($, el);
        if (text) lines.push(`• ${text}`);
      }
    });

  return lines;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

// Tách rows thành past/future theo ngày UTC
function splitRows(rows, now = new Date()) {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const past = [];
  const future = [];
  for (const row of rows) {
    const d = new Date(`${row.date} UTC`);
    const rowUtc = isNaN(d)
      ? Infinity
      : Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    (rowUtc < todayUtc ? past : future).push(row);
  }
  return { past, future };
}

// Sunny Sunday kéo dài trọn 1 ngày UTC -> mốc bắt đầu 00:00 và kết thúc 23:59 UTC
function dayRangeUnix(dateStr) {
  const d = new Date(`${dateStr} UTC`);
  if (isNaN(d)) return null;
  const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000;
  return { start, end: start + 24 * 3600 - 60 };
}

// Tiêu đề của một mốc: timestamp Discord để mỗi người thấy theo giờ máy mình
function formatRowHeading(dateStr) {
  const range = dayRangeUnix(dateStr);
  if (!range) return `**${dateStr}**`;
  return `**<t:${range.start}:f> → <t:${range.end}:f>**`;
}

// ── Build message ─────────────────────────────────────────────────────────────

// includePast: hiển thị cả những mốc đã diễn ra (dùng cho /sunnytest)
function buildSunnyMessage({ patchNotes, rows }, { now, includePast = false } = {}) {
  const { past, future } = splitRows(rows, now);
  const listed = includePast ? rows : future;
  const articleUrl = `https://www.nexon.com/maplestory/news/update/${patchNotes.id}/`;

  // Trích version từ tên bài viết (vd: "v.270 - ...")
  const versionMatch = patchNotes.name.match(/v\.\d+/);
  const version = versionMatch ? versionMatch[0] : "";

  const container = new ContainerBuilder().setAccentColor(0xffb300);

  // Banner: dùng thumbnail của bài patch notes
  if (patchNotes.imageThumbnail) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(`${MEDIA_BASE}${patchNotes.imageThumbnail}`)
      )
    );
  }

  // Tiêu đề + nút mở patch notes
  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## ☀️ Sunny Sundays ${version} (${listed.length})`.replace(/\s+\(/, " (")
        )
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Patch URL")
          .setURL(articleUrl)
      )
  );

  // Ghi chú các mốc đã qua
  const headerLines = [];
  if (future.length === 0) {
    headerLines.push("Không còn Sunny Sunday nào sắp tới trong patch notes này.");
  }
  if (past.length > 0) {
    headerLines.push(
      includePast
        ? `-# Bao gồm cả ${past.length} sunny sunday đã diễn ra.`
        : `-# ${past.length} sunny sunday đã diễn ra nên không còn hiển thị.`
    );
  }
  if (headerLines.length > 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(headerLines.join("\n"))
    );
  }

  // Danh sách các mốc sắp tới
  let used = headerLines.join("\n").length + 60;
  let skipped = 0;
  for (const row of listed) {
    const block = [formatRowHeading(row.date), ...row.perks].join("\n");
    if (used + block.length > TEXT_BUDGET) {
      skipped++;
      continue;
    }
    used += block.length;
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(block));
  }
  if (skipped > 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Còn ${skipped} mốc nữa, xem đầy đủ tại [patch notes](${articleUrl}).`
      )
    );
  }

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

module.exports = {
  fetchSunnyData,
  splitRows,
  buildSunnyMessage,
  NEWS_API_BASE,
  FETCH_HEADERS,
};
