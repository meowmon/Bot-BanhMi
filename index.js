require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const client = require("./src/client");
const { loadPostedNews } = require("./src/utils/store");
const {
  checkMaintenance,
  scheduleMaintenance,
} = require("./src/features/maintenance");
const roadmapCommand = require("./src/features/roadmap");
const sharecashCommand = require("./src/features/sharecash");
const maintCommand = require("./src/features/maint");
const jobdiscCommand = require("./src/features/jobdisc");
const linksCommand = require("./src/features/links");
const bossCommand = require("./src/features/boss");
const defroomCommand = require("./src/features/defroom");
const frzCommand = require("./src/features/frz");
const { handleReaction: handleFrzReaction } = require("./src/features/frz");
const { resetCount: resetFrzCount } = require("./src/utils/frzStore");

const commands = [roadmapCommand, sharecashCommand, maintCommand, jobdiscCommand, linksCommand, bossCommand, defroomCommand, frzCommand];

const postedNews = loadPostedNews();

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Register slash commands
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const commandData = commands.map((cmd) => {
    const builder = new SlashCommandBuilder()
      .setName(cmd.data.name)
      .setDescription(cmd.data.description);

    if (cmd.data.options) {
      cmd.data.options.forEach((opt) => {
        if (opt.type === "string") {
          builder.addStringOption((o) =>
            o.setName(opt.name)
              .setDescription(opt.description)
              .setRequired(opt.required ?? false)
              .setAutocomplete(opt.autocomplete ?? false)
          );
        }
      });
    }

    return builder.toJSON();
  });

  try {
    // Xóa guild commands nếu có (dọn duplicate)
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
        { body: [] }
      );
    }
    // Register global commands
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commandData,
    });
    console.log("✅ Slash commands registered.");
  } catch (err) {
    console.error("Failed to register slash commands:", err);
  }

  const testChannel = await client.channels.fetch(process.env.TEST_CHANNEL_ID);
  await testChannel.send("✅ Con bot này tày đã trở lại");

  await checkMaintenance(postedNews);
  scheduleMaintenance(postedNews);

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

  const command = commands.find((cmd) => cmd.data.name === interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
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

client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }
  await handleFrzReaction(reaction, user);
});

client.login(process.env.DISCORD_TOKEN);