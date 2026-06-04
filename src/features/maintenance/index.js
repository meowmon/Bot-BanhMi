const cron = require("node-cron");
const client = require("../../client");
const { fetchLatestMaintenance, fetchPostDetail } = require("./api");
const { buildMessage, parseMaintenanceTimes } = require("./message");
const { savePostedNews } = require("../../utils/store");

const scheduledReminders = new Set();

async function checkMaintenance(postedNews) {
  try {
    const latestPost = await fetchLatestMaintenance();
    if (!latestPost) return;

    const newsUrl = `https://www.nexon.com/maplestory/news/maintenance/${latestPost.id}`;
    const reminderId = `reminder_${latestPost.id}`;

    const needsMainPost = !postedNews.has(latestPost.id);
    const needsReminder =
      !postedNews.has(reminderId) && !scheduledReminders.has(latestPost.id);

    if (!needsMainPost && !needsReminder) return;

    const detail = await fetchPostDetail(latestPost.id);

    if (needsMainPost) {
      postedNews.add(latestPost.id);
      savePostedNews(postedNews);

      const channel = await client.channels.fetch(
        process.env.NOTIFICATION_CHANNEL_ID
      );
      const message = buildMessage(detail, newsUrl);
      await channel.send(message);
      console.log(`Posted maintenance: ${latestPost.name}`);
    }

    if (needsReminder) {
      const bodyText = detail.body
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const times = parseMaintenanceTimes(detail.summary, bodyText);

      if (times && times.startUnix) {
        const delay = (times.startUnix - 3600) * 1000 - Date.now();

        if (delay > 0) {
          scheduledReminders.add(latestPost.id);
          setTimeout(async () => {
            try {
              const ch = await client.channels.fetch(
                process.env.NOTIFICATION_CHANNEL_ID
              );
              const rolePing = process.env.SCANIA_ROLE_ID
                ? `<@&${process.env.SCANIA_ROLE_ID}>`
                : "@everyone";
              await ch.send(
                `${rolePing} Còn 1 giờ nữa game sẽ bắt đầu bảo trì, tranh thủ hoàn thành những việc cần làm nhé`
              );
              postedNews.add(reminderId);
              savePostedNews(postedNews);
              console.log(`Sent 1h reminder for: ${latestPost.name}`);
            } catch (err) {
              console.error("Reminder send error:", err);
            }
          }, delay);
          console.log(
            `Scheduled 1h reminder for ${latestPost.name} in ${Math.round(delay / 60000)} min`
          );
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function scheduleMaintenance(postedNews) {
  cron.schedule("*/30 * * * *", async () => {
    console.log("Checking maintenance...");
    await checkMaintenance(postedNews);
  });
}

module.exports = { checkMaintenance, scheduleMaintenance };
