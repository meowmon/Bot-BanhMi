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

const commands = [roadmapCommand, sharecashCommand, maintCommand, jobdiscCommand];

const postedNews = loadPostedNews();

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Register slash commands
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const commandData = commands.map((cmd) =>
    new SlashCommandBuilder()
      .setName(cmd.data.name)
      .setDescription(cmd.data.description)
      .toJSON()
  );

  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
      { body: commandData }
    );
    console.log("✅ Slash commands registered.");
  } catch (err) {
    console.error("Failed to register slash commands:", err);
  }

  const testChannel = await client.channels.fetch(process.env.TEST_CHANNEL_ID);
  await testChannel.send("✅ Con bot này tày đã trở lại");

  await checkMaintenance(postedNews);
  scheduleMaintenance(postedNews);
});

client.on("interactionCreate", async (interaction) => {
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

client.login(process.env.DISCORD_TOKEN);