const { loadPostedNews, savePostedNews } = require("../../utils/store");

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
  name: "admin",
  description: "Quản lý dữ liệu bot (admin only)",
  subcommands: [
    { name: "posted-view", description: "Xem danh sách ID đã đăng trong posted.json" },
    {
      name: "posted-add",
      description: "Thêm một ID vào posted.json",
      options: [
        { type: "string", name: "id", description: "ID bài cần thêm", required: true },
      ],
    },
    {
      name: "posted-remove",
      description: "Xóa một ID khỏi posted.json (để bot đăng lại)",
      options: [
        { type: "string", name: "id", description: "ID bài cần xóa", required: true },
      ],
    },
    { name: "posted-clear", description: "Xóa toàn bộ dữ liệu trong posted.json" },
  ],
};

async function execute(interaction) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({ content: "❌ Bạn không có quyền dùng lệnh này.", ephemeral: true });
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "posted-view") {
    const posted = loadPostedNews();
    const ids = [...posted];
    if (ids.length === 0) {
      return interaction.reply({ content: "📋 `posted.json` đang trống.", ephemeral: true });
    }
    return interaction.reply({
      content: `📋 **posted.json (${ids.length} ID):**\n\`\`\`\n${ids.join(", ")}\n\`\`\``,
      ephemeral: true,
    });
  }

  if (sub === "posted-add") {
    const idStr = interaction.options.getString("id");
    const id = Number(idStr);
    if (isNaN(id)) {
      return interaction.reply({ content: "❌ ID không hợp lệ, phải là số.", ephemeral: true });
    }
    const posted = loadPostedNews();
    if (posted.has(id)) {
      return interaction.reply({ content: `⚠️ ID \`${id}\` đã có trong posted.json.`, ephemeral: true });
    }
    posted.add(id);
    savePostedNews(posted);
    return interaction.reply({
      content: `✅ Đã thêm ID \`${id}\` vào posted.json.`,
      ephemeral: true,
    });
  }

  if (sub === "posted-remove") {
    const idStr = interaction.options.getString("id");
    const id = Number(idStr);
    if (isNaN(id)) {
      return interaction.reply({ content: "❌ ID không hợp lệ, phải là số.", ephemeral: true });
    }
    const posted = loadPostedNews();
    if (!posted.has(id)) {
      return interaction.reply({ content: `❌ ID \`${id}\` không có trong posted.json.`, ephemeral: true });
    }
    posted.delete(id);
    savePostedNews(posted);
    return interaction.reply({
      content: `✅ Đã xóa ID \`${id}\` khỏi posted.json.`,
      ephemeral: true,
    });
  }

  if (sub === "posted-clear") {
    savePostedNews(new Set());
    return interaction.reply({
      content: "✅ Đã xóa toàn bộ posted.json.",
      ephemeral: true,
    });
  }
}

module.exports = { data, execute };
