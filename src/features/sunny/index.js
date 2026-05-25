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

// Trích xuất danh sách perk từ ô bảng, giữ cấu trúc lồng nhau
function extractPerks($, td) {
  const lines = [];
  $(td).find("> ul > li").each((i, li) => {
    const $li = $(li);
    const directText = $li.clone().children("ul, ol").remove().end().text().trim();
    if (directText) lines.push(`• ${directText}`);
    $li.find("li").each((j, subli) => {
      lines.push(`  ↳ ${$(subli).text().trim()}`);
    });
  });
  return lines;
}

// Trả về index của hàng ứng với tuần hiện tại (Chủ nhật gần nhất <= hôm nay)
function getCurrentSundayIdx(rows) {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  let currentIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const d = new Date(rows[i].date);
    if (isNaN(d)) continue;
    const rowUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    if (rowUtc <= todayUtc) currentIdx = i;
    else break;
  }
  return currentIdx;
}

async function execute(interaction) {
  await interaction.deferReply();

  try {
    const { patchNotes, rows } = await fetchSunnyData();

    if (rows.length === 0) {
      return interaction.editReply({ content: "❌ Không tìm thấy dữ liệu Sunny Sunday." });
    }

    const currentIdx = getCurrentSundayIdx(rows);
    const articleUrl = `https://www.nexon.com/maplestory/news/update/${patchNotes.id}/`;

    const embed = new EmbedBuilder()
      .setTitle("☀️ Sunny Sunday")
      .setURL(articleUrl)
      .setColor(0xff8c00)
      .setFooter({ text: patchNotes.name });

    rows.forEach((row, i) => {
      const isCurrentWeek = i === currentIdx;
      const fieldName = isCurrentWeek ? `📅 ${row.date}  ← tuần này` : row.date;
      const fieldValue = row.perks.join("\n") || "—";
      embed.addFields({ name: fieldName, value: fieldValue });
    });

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("[sunny]", err);
    await interaction.editReply({ content: `❌ ${err.message}` });
  }
}

module.exports = { data, execute };
