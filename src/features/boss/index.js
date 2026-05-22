const { AttachmentBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const path = require("path");
const bosses = require("./data");

const data = {
  name: "boss",
  description: "Xem thông tin một boss MapleStory",
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

  if (!boss.image && !boss.link) {
    return interaction.reply({ content: `**${boss.name}**: Chưa có thông tin.`, ephemeral: true });
  }

  if (boss.image) {
    const imagePath = path.join(__dirname, "../../../assets/boss", boss.image);
    const attachment = new AttachmentBuilder(imagePath, { name: boss.image });
    const embed = new EmbedBuilder()
      .setTitle(boss.name)
      .setImage(`attachment://${boss.image}`);
    const content = boss.link ? `Click [LINK](${boss.link}) để xem guide vietsub` : undefined;
    return interaction.reply({ content, embeds: [embed], files: [attachment] });
  }

  // Chỉ có link
  return interaction.reply({
    content: `**${boss.name}**: [Link guide vietsub](${boss.link})`,
    flags: MessageFlags.SuppressEmbeds,
  });
}

module.exports = { data, execute, handleAutocomplete };
