const { MessageFlags } = require("discord.js");

const data = {
  name: "chat",
  description: "Gửi tin nhắn từ bot vào channel hiện tại",
  options: [
    {
      type: "string",
      name: "message",
      description: "Nội dung cần gửi",
      required: true,
    },
  ],
};

async function execute(interaction) {
  if (!process.env.ADMIN_ID || interaction.user.id !== process.env.ADMIN_ID.trim()) {
    return interaction.reply({
      content: "❌ Bạn không có quyền dùng lệnh này.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const message = interaction.options.getString("message", true);
  await interaction.channel.send({
    content: message,
    allowedMentions: { parse: [] },
  });

  return interaction.reply({
    content: "✅ Đã gửi tin nhắn vào channel này.",
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = { data, execute };