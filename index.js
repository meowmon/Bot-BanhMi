require("dotenv").config();

const client = require("./src/client");
const { loadPostedNews } = require("./src/utils/store");
const {
  checkMaintenance,
  scheduleMaintenance,
} = require("./src/features/maintenance");

const postedNews = loadPostedNews();

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(process.env.NOTIFICATION_CHANNEL_ID);
//   await channel.send("✅ Con bot này tày đã trở lại");

  await checkMaintenance(postedNews);
  scheduleMaintenance(postedNews);
});

client.login(process.env.DISCORD_TOKEN);