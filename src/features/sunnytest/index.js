const { MessageFlags } = require("discord.js");
const client = require("../../client");
const { fetchSunnyData, buildSunnyMessage } = require("../sunny/service");
const {
  checkSunnySunday,
  getActivePosted,
  postedKey,
} = require("../sunny/watcher");
const { savePostedNews } = require("../../utils/store");

function isAdmin(member) {
  const adminRoleId = process.env.FRZ_ADMIN_ROLE_ID;
  const adminUserIds = process.env.FRZ_ADMIN_USER_IDS
    ? process.env.FRZ_ADMIN_USER_IDS.split(",").map((s) => s.trim())
    : [];
  if (adminUserIds.includes(member.id)) return true;
  if (adminRoleId && member.roles.cache.has(adminRoleId)) return true;
  return false;
}

const data = {
  name: "sunnytest",
  description: "Test bài post Sunny Sunday (admin only)",
  subcommands: [
    {
      name: "preview",
      description: "Xem thử bài post với patch notes hiện tại (chỉ mình bạn thấy)",
    },
    {
      name: "post",
      description: "Post thử vào channel Sunny Sunday, không ghi vào posted.json",
    },
    {
      name: "run",
      description: "Chạy đúng luồng tự động (tôn trọng posted.json, chỉ mốc sắp tới)",
    },
    {
      name: "reset",
      description: "Xóa dấu đã-post của patch notes hiện tại để bot post lại",
    },
  ],
};

async function execute(interaction) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({
      content: "❌ Bạn không có quyền dùng lệnh này.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const sub = interaction.options.getSubcommand();
  const channelId = process.env.SUNNY_SUNDAY_CHANNEL;

  if (sub === "preview") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { patchNotes, rows } = await fetchSunnyData();
    if (rows.length === 0) {
      return interaction.editReply({ content: "❌ Không tìm thấy dữ liệu Sunny Sunday." });
    }
    const message = buildSunnyMessage({ patchNotes, rows }, { includePast: true });
    // reply đã ephemeral từ deferReply, chỉ cần thêm cờ Components V2
    return interaction.editReply(message);
  }

  if (sub === "post") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!channelId) {
      return interaction.editReply({ content: "❌ Chưa cấu hình `SUNNY_SUNDAY_CHANNEL`." });
    }
    const { patchNotes, rows } = await fetchSunnyData();
    if (rows.length === 0) {
      return interaction.editReply({ content: "❌ Không tìm thấy dữ liệu Sunny Sunday." });
    }
    const channel = await client.channels.fetch(channelId);
    await channel.send(buildSunnyMessage({ patchNotes, rows }, { includePast: true }));
    return interaction.editReply({
      content: `✅ Đã post thử patch \`${patchNotes.id}\` vào <#${channelId}> (không ghi vào posted.json).`,
    });
  }

  if (sub === "run") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const skipReason = await checkSunnySunday();
    return interaction.editReply({
      content: skipReason
        ? `⏭️ Bot đã bỏ qua: ${skipReason}`
        : `✅ Đã post Sunny Sunday vào <#${channelId}>.`,
    });
  }

  if (sub === "reset") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const posted = getActivePosted();
    if (!posted) {
      return interaction.editReply({ content: "❌ Bot chưa khởi tạo dữ liệu posted.json." });
    }
    const { patchNotes } = await fetchSunnyData();
    const key = postedKey(patchNotes.id);
    if (!posted.has(key)) {
      return interaction.editReply({
        content: `ℹ️ Patch \`${patchNotes.id}\` vốn chưa được đánh dấu đã post.`,
      });
    }
    posted.delete(key);
    savePostedNews(posted);
    return interaction.editReply({
      content: `✅ Đã xóa dấu đã-post của patch \`${patchNotes.id}\`. Dùng \`/sunnytest run\` để post lại.`,
    });
  }
}

module.exports = { data, execute };
