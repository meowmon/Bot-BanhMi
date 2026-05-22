const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");

const data = {
  name: "defroom",
  description: "Bot join vào voice channel bạn đang ở",
};

async function execute(interaction) {
  const voiceChannel = interaction.member.voice.channel;

  if (!voiceChannel) {
    return interaction.reply({ content: "❌ Bạn cần vào một voice channel trước.", ephemeral: true });
  }

  const existingConnection = getVoiceConnection(interaction.guildId);
  if (existingConnection) {
    // Đã ở trong VC → rời ra
    existingConnection.destroy();
    return interaction.reply({ content: `✅ Bot đã rời khỏi voice channel.`, ephemeral: true });
  }

  joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: interaction.guildId,
    adapterCreator: interaction.guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: true,
  });

  return interaction.reply({ content: `✅ Bot đã vào **${voiceChannel.name}**.`, ephemeral: true });
}

module.exports = { data, execute };
