const { AttachmentBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const path = require("path");
const bosses = require("./data");

const data = {
  name: "boss",
  description: "Xem thông tin boss MapleStory",
  options: [
    {
      type: "string",
      name: "boss",
      description: "Tên boss",
      required: true,
      autocomplete: true,
    },
  ],
};

async function handleAutocomplete(interaction) {
  const focused = interaction.options.getFocused().toLowerCase();
  const filtered = bosses
    .filter((b) => b.name.toLowerCase().includes(focused))
    .slice(0, 25)
    .map((b) => ({ name: b.name, value: b.id }));
  await interaction.respond(filtered);
}

async function execute(interaction) {
  const bossId = interaction.options.getString("boss");
  const boss = bosses.find((b) => b.id === bossId);

  if (!boss) {
    return interaction.reply({ content: "❌ Không tìm thấy boss này.", ephemeral: true });
  }

  if (!boss.image && !boss.link && !boss.video) {
    return interaction.reply({ content: `**${boss.name}**: Chưa có thông tin.`, ephemeral: true });
  }

  const lines = [];
  if (boss.link) lines.push(`Click [LINK](${boss.link}) để xem guide vietsub`);
  if (boss.video) lines.push(`Click [VIDEO](${boss.video}) để xem video guide`);

  if (boss.image) {
    const imagePath = path.join(__dirname, "../../../assets/boss", boss.image);
    const attachment = new AttachmentBuilder(imagePath, { name: boss.image });
    const embed = new EmbedBuilder()
      .setTitle(boss.name)
      .setImage(`attachment://${boss.image}`);
    const content = lines.length ? lines.join("\n") : undefined;
    return interaction.reply({ content, embeds: [embed], files: [attachment] });
  }

  // Không có ảnh: chỉ link/video
  return interaction.reply({
    content: `**${boss.name}**\n${lines.join("\n")}`,
    flags: MessageFlags.SuppressEmbeds,
  });
}

module.exports = { data, execute, handleAutocomplete };
