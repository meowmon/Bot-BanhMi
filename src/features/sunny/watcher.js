const cron = require("node-cron");
const client = require("../../client");
const { fetchSunnyData, buildSunnyMessage, splitRows } = require("./service");
const { savePostedNews } = require("../../utils/store");

// Key lưu trong posted.json để không post trùng một patch notes
const postedKey = (id) => `sunny_${id}`;

// Set posted.json đang chạy (do index.js truyền vào), để /sunnytest dùng chung
let activePosted = null;

function getActivePosted() {
  return activePosted;
}

// Post Sunny Sunday khi có patch notes mới. Trả về lý do bỏ qua (nếu có).
async function checkSunnySunday(postedNews = activePosted) {
  if (postedNews) activePosted = postedNews;

  const channelId = process.env.SUNNY_SUNDAY_CHANNEL;
  if (!channelId) return "Chưa cấu hình SUNNY_SUNDAY_CHANNEL.";
  if (!postedNews) return "Chưa có dữ liệu posted.json.";

  try {
    const { patchNotes, rows } = await fetchSunnyData();
    const key = postedKey(patchNotes.id);

    if (postedNews.has(key)) {
      return `Patch \`${patchNotes.id}\` đã được post trước đó.`;
    }

    // Chưa parse được bảng, hoặc mọi mốc đều đã qua -> chờ lần check sau
    if (rows.length === 0 || splitRows(rows).future.length === 0) {
      const msg = `Patch ${patchNotes.id} chưa có mốc Sunny Sunday sắp tới, chờ lần check sau.`;
      console.log(`[sunny] ${msg}`);
      return msg;
    }

    const channel = await client.channels.fetch(channelId);
    await channel.send(buildSunnyMessage({ patchNotes, rows }));

    postedNews.add(key);
    savePostedNews(postedNews);
    console.log(`Posted Sunny Sunday: ${patchNotes.name}`);
    return null;
  } catch (err) {
    console.error("[sunny watcher]", err.message);
    return err.message;
  }
}

function scheduleSunnySunday(postedNews) {
  activePosted = postedNews;
  cron.schedule("15 * * * *", async () => {
    console.log("Checking Sunny Sunday patch notes...");
    await checkSunnySunday(postedNews);
  });
}

module.exports = { checkSunnySunday, scheduleSunnySunday, getActivePosted, postedKey };
