const { getAllCounts, setCount, resetCount } = require("../../utils/frzStore");

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
  name: "frzadmin",
  description: "Quản lý dữ liệu Frenzy (admin only)",
  subcommands: [
    { name: "view", description: "Xem tap count của tất cả người dùng" },
    {
      name: "set",
      description: "Chỉnh sửa tap count của một người dùng",
      options: [
        { type: "user", name: "user", description: "Người dùng cần chỉnh", required: true },
        { type: "integer", name: "count", description: "Số tap mới", required: true },
      ],
    },
    { name: "reset", description: "Reset toàn bộ tap count về 0" },
  ],
};

async function execute(interaction) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({ content: "❌ Bạn không có quyền dùng lệnh này.", ephemeral: true });
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "view") {
    const counts = getAllCounts();
    const entries = Object.entries(counts);
    if (entries.length === 0) {
      return interaction.reply({ content: "📊 Chưa có ai dùng /frz tuần này.", ephemeral: true });
    }
    const lines = entries
      .sort((a, b) => b[1] - a[1])
      .map(([userId, count]) => `<@${userId}>: **${count}** tap`);
    return interaction.reply({
      content: `📊 **Tap count tuần này:**\n${lines.join("\n")}`,
      ephemeral: true,
    });
  }

  if (sub === "set") {
    const user = interaction.options.getUser("user");
    const count = interaction.options.getInteger("count");
    if (count < 0) {
      return interaction.reply({ content: "❌ Count không thể âm.", ephemeral: true });
    }
    setCount(user.id, count);
    return interaction.reply({
      content: `✅ Đã set tap count của <@${user.id}> thành **${count}**.`,
      ephemeral: true,
    });
  }

  if (sub === "reset") {
    resetCount();
    return interaction.reply({ content: "🔄 Đã reset toàn bộ tap count về 0.", ephemeral: true });
  }
}

module.exports = { data, execute };
