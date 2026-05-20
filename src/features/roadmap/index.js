const { AttachmentBuilder } = require("discord.js");
const path = require("path");

const data = {
  name: "roadmap",
  description: "Xem roadmap MapleStory sắp tới",
};

async function execute(interaction) {
  const imagePath = path.join(__dirname, "../../../assets/roadmap.png");
  const attachment = new AttachmentBuilder(imagePath, { name: "roadmap.png" });
  await interaction.reply({ files: [attachment] });
}

module.exports = { data, execute };
