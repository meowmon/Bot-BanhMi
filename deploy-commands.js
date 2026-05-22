require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const roadmapCommand = require("./src/features/roadmap");
const sharecashCommand = require("./src/features/sharecash");
const maintCommand = require("./src/features/maint");
const jobdiscCommand = require("./src/features/jobdisc");
const linksCommand = require("./src/features/links");
const bossCommand = require("./src/features/boss");
const defroomCommand = require("./src/features/defroom");
const frzCommand = require("./src/features/frz");

const commands = [roadmapCommand, sharecashCommand, maintCommand, jobdiscCommand, linksCommand, bossCommand, defroomCommand, frzCommand];

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

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Đang xóa guild commands cũ...");
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: [] }
      );
    }

    console.log("Đang register commands...");
    if (process.env.GUILD_ID) {
      // Guild commands: hiển thị ngay lập tức
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commandData }
      );
      console.log("✅ Đăng ký guild commands thành công:", commands.map((c) => `/${c.data.name}`).join(", "));
    } else {
      // Global commands: mất ~1 giờ để propagate
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: commandData,
      });
      console.log("✅ Đăng ký global commands thành công:", commands.map((c) => `/${c.data.name}`).join(", "));
    }
  } catch (err) {
    console.error("❌ Lỗi:", err);
  }
})();
