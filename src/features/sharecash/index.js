const { AttachmentBuilder } = require("discord.js");
const path = require("path");

const data = {
  name: "sharecash",
  description: "Xem danh sách các class dùng chung Cash Inventory",
};

async function execute(interaction) {
  const imagePath = path.join(__dirname, "../../../assets/sharecash.png");
  const attachment = new AttachmentBuilder(imagePath, { name: "sharecash.png" });
  await interaction.reply({ files: [attachment] });
}

module.exports = { data, execute };
