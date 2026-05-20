const cron = require("node-cron");
const client = require("../../client");
const { fetchLatestMaintenance, fetchPostDetail } = require("./api");
const { buildMessage } = require("./message");
const { savePostedNews } = require("../../utils/store");

async function checkMaintenance(postedNews) {
  try {
    const latestPost = await fetchLatestMaintenance();

    if (!latestPost || postedNews.has(latestPost.id)) return;

    postedNews.add(latestPost.id);
    savePostedNews(postedNews);

    const channel = await client.channels.fetch(process.env.NOTIFICATION_CHANNEL_ID);

    const newsUrl = `https://www.nexon.com/maplestory/news/maintenance/${latestPost.id}`;
    const detail = await fetchPostDetail(latestPost.id);
    const message = buildMessage(detail, newsUrl);

    await channel.send(message);
    console.log(`Posted maintenance: ${latestPost.name}`);
  } catch (err) {
    console.error(err);
  }
}

function scheduleMaintenance(postedNews) {
  cron.schedule("*/5 * * * *", async () => {
    console.log("Checking maintenance...");
    await checkMaintenance(postedNews);
  });
}

module.exports = { checkMaintenance, scheduleMaintenance };
