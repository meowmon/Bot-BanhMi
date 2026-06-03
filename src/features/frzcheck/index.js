const { getCount } = require("../../utils/frzStore");

const ROLE_LIMITS = [
  { envKey: "FRZ_ROLE_30_ID", max: 50 },
  { envKey: "FRZ_ROLE_20_ID", max: 36 },
  { envKey: "FRZ_ROLE_10_ID", max: 21 },
];

const data = {
  name: "frzcheck",
  description: "Xem số lần Frenzy còn lại trong tuần của bạn",
};

async function execute(interaction) {
  const userRoleLimit = ROLE_LIMITS.find((r) => {
    const roleId = process.env[r.envKey];
    return roleId && interaction.member.roles.cache.has(roleId);
  });

  if (!userRoleLimit) {
    return interaction.reply({ content: "❌ Bạn không có quyền sử dụng Frenzy.", flags: 64 });
  }

  const used = getCount(interaction.user.id);
  const remaining = Math.max(0, userRoleLimit.max - used);

  return interaction.reply({
    content: `📊 Frenzy tuần này của bạn: **${used}/${userRoleLimit.max}** lần đã dùng — còn lại **${remaining}** lần.`,
    flags: 64,
  });
}

module.exports = { data, execute };
