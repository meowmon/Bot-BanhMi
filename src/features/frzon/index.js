const { setFrzEnabled } = require("../../utils/frzStore");

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
  name: "frzon",
  description: "Bật lệnh /frz (chỉ admin)",
};

async function execute(interaction) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({ content: "❌ Bạn không có quyền sử dụng lệnh này.", ephemeral: true });
  }
  setFrzEnabled(true);
  await interaction.reply({ content: "✅ Lệnh `/frz` đã được **bật**.", ephemeral: true });
}

module.exports = { data, execute };
