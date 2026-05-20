const { AttachmentBuilder } = require("discord.js");
const path = require("path");

const data = {
  name: "xuancut",
  description: "Xuân cút!",
};

async function execute(interaction) {
  const imagePath = path.join(__dirname, "../../../assets/xuancut.gif");
  const attachment = new AttachmentBuilder(imagePath, { name: "xuancut.gif" });
  await interaction.reply({ files: [attachment] });
}

module.exports = { data, execute };
