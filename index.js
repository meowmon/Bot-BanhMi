require("dotenv").config();

const { joinVoiceChannel } = require("@discordjs/voice");
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
const sunnyCommand = require("./src/features/sunny");
const { handleReaction: handleFrzReaction } = require("./src/features/frz");
const { resetCount: resetFrzCount } = require("./src/utils/frzStore");
const { handleStickyMessage, handleStickyInteraction, postInitialGuide } = require("./src/features/sticky");
const { checkEventEnding, scheduleEventReminder } = require("./src/features/eventreminder");

const commands = [roadmapCommand, sharecashCommand, maintCommand, linksCommand, bossCommand, defroomCommand, frzCommand, frzonCommand, frzoffCommand, sunnyCommand];

const postedNews = loadPostedNews();

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Auto join voice channel on ready
  try {
    const voiceChannel = await client.channels.fetch(process.env.DEFROOM_ID);
    if (voiceChannel?.isVoiceBased()) {
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true,
      });
      console.log(`✅ Đã join voice channel: ${voiceChannel.name}`);
    }
  } catch (err) {
    console.error("❌ Không thể join voice channel:", err.message);
  }

  const testChannel = await client.channels.fetch(process.env.TEST_CHANNEL_ID);
  await testChannel.send("✅ Con bot này tày đã trở lại");

  await checkMaintenance(postedNews);
  scheduleMaintenance(postedNews);

  await postInitialGuide(client);

  // await checkEventEnding();
  // scheduleEventReminder();

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
  const botChannelIds = process.env.BOT_CHANNEL_IDS
    ? process.env.BOT_CHANNEL_IDS.split(",").map((id) => id.trim()).filter(Boolean)
    : [];
  const frenzyChannelId = process.env.FRENZY_CHANNEL_ID;
  if (botChannelIds.length > 0 || frenzyChannelId) {
    const isBotChannel = botChannelIds.includes(interaction.channelId);
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
    } else if (isFrzCommand) {
      // /frz chỉ dùng trong frenzy channel và các bot channel
      if (!isFrenzyChannel && !isBotChannel) {
        const allowed = [frenzyChannelId, ...botChannelIds].filter(Boolean).map((id) => `<#${id}>`).join(", ");
        return interaction.reply({
          content: `❌ Lệnh /frz chỉ dùng được trong: ${allowed || "channel được phép"}.`,
          ephemeral: true,
        });
      }
    } else if (!isBotChannel) {
      const channelList = botChannelIds.map((id) => `<#${id}>`).join(", ");
      return interaction.reply({
        content: `❌ Bạn không thể dùng bot tại đây, hãy vào ${channelList || "channel bot"} và thử lại.`,
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