require("dotenv").config();

const client = require("./src/client");
const { loadPostedNews } = require("./src/utils/store");
const {
  checkMaintenance,
  scheduleMaintenance,
} = require("./src/features/maintenance");
const roadmapCommand = require("./src/features/roadmap");
const sharecashCommand = require("./src/features/sharecash");
const maintCommand = require("./src/features/maint");
const linksCommand = require("./src/features/links");
const bossCommand = require("./src/features/boss");
const defroomCommand = require("./src/features/defroom");
const frzCommand = require("./src/features/frz");
const frzonCommand = require("./src/features/frzon");
const frzoffCommand = require("./src/features/frzoff");
const { handleReaction: handleFrzReaction } = require("./src/features/frz");
const { resetCount: resetFrzCount } = require("./src/utils/frzStore");
const { handleStickyMessage, handleStickyInteraction, postInitialGuide } = require("./src/features/sticky");

const commands = [roadmapCommand, sharecashCommand, maintCommand, linksCommand, bossCommand, defroomCommand, frzCommand, frzonCommand, frzoffCommand];

const postedNews = loadPostedNews();

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const testChannel = await client.channels.fetch(process.env.TEST_CHANNEL_ID);
  await testChannel.send("✅ Con bot này tày đã trở lại");

  await checkMaintenance(postedNews);
  scheduleMaintenance(postedNews);

  await postInitialGuide(client);

  // Reset frz count mỗi thứ 5 lúc 0h UTC
  const cron = require("node-cron");
  cron.schedule("0 0 * * 4", () => {
    resetFrzCount();
    console.log("🔄 Đã reset frz count (thứ 5 0h UTC)");
  }, { timezone: "UTC" });
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = commands.find((cmd) => cmd.data.name === interaction.commandName);
    if (command?.handleAutocomplete) {
      await command.handleAutocomplete(interaction).catch(console.error);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  // Channel guard
  const botChannelId = process.env.BOT_CHANNEL_ID;
  const frenzyChannelId = process.env.FRENZY_CHANNEL_ID;
  if (botChannelId) {
    const isBotChannel = interaction.channelId === botChannelId;
    const isFrenzyChannel = frenzyChannelId && interaction.channelId === frenzyChannelId;
    const isFrzCommand = interaction.commandName === "frz";
    const isFrzToggle = interaction.commandName === "frzon" || interaction.commandName === "frzoff";

    if (isFrzToggle) {
      if (!isFrenzyChannel) {
        return interaction.reply({
          content: `❌ Lệnh này chỉ dùng được trong <#${frenzyChannelId}>.`,
          ephemeral: true,
        });
      }
    } else if (!isBotChannel && !(isFrzCommand && isFrenzyChannel)) {
      const channel = botChannelId ? `<#${botChannelId}>` : "channel bot";
      return interaction.reply({
        content: `❌ Bạn không thể dùng bot tại đây, hãy vào ${channel} và thử lại.`,
        ephemeral: true,
      });
    }
  }

  const command = commands.find((cmd) => cmd.data.name === interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
    await handleStickyInteraction(interaction);
  } catch (err) {
    console.error(err);
    const msg = { content: "❌ Có lỗi xảy ra khi thực hiện lệnh.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

client.on("messageCreate", async (message) => {
  await handleStickyMessage(message);
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }
  await handleFrzReaction(reaction, user);
});

client.login(process.env.DISCORD_TOKEN);