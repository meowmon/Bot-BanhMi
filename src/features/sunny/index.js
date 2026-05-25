const { EmbedBuilder } = require("discord.js");
const cheerio = require("cheerio");

const NEWS_API_BASE = "https://g.nexonstatic.com/maplestory/cms/v1/news";
const FETCH_HEADERS = {
  accept: "application/json, text/plain, */*",
  origin: "https://www.nexon.com",
  referer: "https://www.nexon.com/",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
};

const data = {
  name: "sunny",
  description: "Xem lịch Sunny Sunday từ patch notes mới nhất",
};

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
  const detailRes = await fetch(`${NEWS_API_BASE}/${patchNotes.id}`, { headers: FETCH_HEADERS });
  if (!detailRes.ok) throw new Error("Không thể tải nội dung bài viết.");
  const detail = await detailRes.json();

  // 4. Trích xuất phần Sunny Sunday
  const body = detail.body;
  const anchorIdx = body.lastIndexOf('id="SunnySunday"');
  if (anchorIdx === -1) throw new Error("Không tìm thấy phần Sunny Sunday trong bài viết này.");

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
      const date = $(cells[0]).contents().filter((_, n) => n.type === "text").first().text().trim();
    const perks = extractPerks($, cells[1]);
    if (date && perks.length) rows.push({ date, perks });
  });

  return { patchNotes, rows };
}

// Trích xuất perk, flatten sub-items thành cùng cấp
function extractPerks($, td) {
  const lines = [];
  $(td).find("> ul > li").each((i, li) => {
    const $li = $(li);
    const directText = $li.clone().children("ul, ol").remove().end().text().trim();
    if (directText) lines.push(`• ${directText}`);
    $li.find("li").each((j, subli) => {
      lines.push(`• ${$(subli).text().trim()}`);
    });
  });
  return lines;
}

// Tách rows thành past/future theo ngày UTC
function splitRows(rows) {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const past = [];
  const future = [];
  for (const row of rows) {
    const d = new Date(row.date);
    const rowUtc = isNaN(d) ? Infinity : Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    (rowUtc < todayUtc ? past : future).push(row);
  }
  return { past, future };
}

async function execute(interaction) {
  await interaction.deferReply();

  try {
    const { patchNotes, rows } = await fetchSunnyData();

    if (rows.length === 0) {
      return interaction.editReply({ content: "❌ Không tìm thấy dữ liệu Sunny Sunday." });
    }

    const { past, future } = splitRows(rows);
    const articleUrl = `https://www.nexon.com/maplestory/news/update/${patchNotes.id}/`;

    // Trích version từ tên bài viết (vd: "v.268 - ...")
    const versionMatch = patchNotes.name.match(/v\.\d+/);
    const version = versionMatch ? versionMatch[0] : "";

    // Dòng countdown đến event tiếp theo
    let headerLines = [];
    if (future.length > 0) {
      const nextDate = new Date(future[0].date);
      if (!isNaN(nextDate)) {
        const nextUnix = Math.floor(nextDate.getTime() / 1000);
        headerLines.push(`Sunny sunday tiếp theo sẽ bắt đầu vào <t:${nextUnix}:R>.`);
      }
    }

    // Build danh sách event
    const eventLines = [];
    for (const row of future) {
      eventLines.push(`**${row.date}**`);
      eventLines.push(...row.perks);
      eventLines.push("");
    }

    const description = [...headerLines, "", ...eventLines].join("\n").trim();

    const embed = new EmbedBuilder()
      .setTitle(`☀️ Sunny Sundays ${version} (${future.length})`)
      .setURL(articleUrl)
      .setColor(0xff8c00)
      .setDescription(description);

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("[sunny]", err);
    await interaction.editReply({ content: `❌ ${err.message}` });
  }
}

module.exports = { data, execute };
