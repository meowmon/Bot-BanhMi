const { incrementCount, getCount, getFrzEnabled } = require("../../utils/frzStore");

function isApprover(member) {
  const adminRoleId = process.env.FRZ_ADMIN_ROLE_ID;
  const adminUserIds = process.env.FRZ_ADMIN_USER_IDS
    ? process.env.FRZ_ADMIN_USER_IDS.split(",").map((s) => s.trim())
    : [];

  if (adminUserIds.includes(member.id)) return true;
  if (adminRoleId && member.roles.cache.has(adminRoleId)) return true;
  return false;
}

const ROLE_LIMITS = [
  { envKey: "FRZ_ROLE_30_ID", max: 50 },
  { envKey: "FRZ_ROLE_20_ID", max: 36 },
  { envKey: "FRZ_ROLE_10_ID", max: 21 },
];

// pending: messageId -> { userId, max }
const pendingMap = new Map();
// cooldown: userId -> timestamp lần gửi gần nhất
const cooldownMap = new Map();

const PENDING_TIMEOUT_MS = 5 * 60 * 1000; // 5 phút
const COOLDOWN_MS = 30 * 1000; // 30 giây

const data = {
  name: "frz",
  description: "Xin tap Frenzy",
  options: [
    {
      type: "string",
      name: "name",
      description: "Tên nhân vật",
      required: true,
    },
  ],
};

async function execute(interaction) {
  if (!getFrzEnabled()) {
    return interaction.reply({ content: "⛔ Hiện không thể xin frenzy, hãy thử lại vào khung giờ 9h - 18h.", ephemeral: true });
  }

  const userRoleLimit = ROLE_LIMITS.find((r) => {
    const roleId = process.env[r.envKey];
    return roleId && interaction.member.roles.cache.has(roleId);
  });

  if (!userRoleLimit) {
    return interaction.reply({ content: "❌ Bạn không có quyền sử dụng lệnh này.", ephemeral: true });
  }

  const userId = interaction.user.id;

  const now = Date.now();
  const lastSent = cooldownMap.get(userId);
  if (lastSent && now - lastSent < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (now - lastSent)) / 1000);
    return interaction.reply({ content: `⏳ Bạn cần chờ thêm **${remaining} giây** trước khi gửi lại.`, ephemeral: true });
  }

  const currentCount = getCount(userId);
  if (currentCount >= userRoleLimit.max) {
    return interaction.reply({ content: `❌ Bạn đã hết tap trong tuần này (${userRoleLimit.max}/${userRoleLimit.max}).`, ephemeral: true });
  }

  const name = interaction.options.getString("name");
  const provisionalRemaining = userRoleLimit.max - (currentCount + 1);

  const frenzyChannelId = process.env.FRENZY_CHANNEL_ID;
  const frenzyRoleId = process.env.FRENZY_ROLE_ID;
  const msgContent = `<@&${frenzyRoleId}> <@${userId}> char: ${name} - số tap còn lại: ${provisionalRemaining} ⏳`;

  const allowedMentions = { roles: [frenzyRoleId], users: [userId] };

  let sentMessage;
  if (frenzyChannelId && interaction.channelId !== frenzyChannelId) {
    const frenzyChannel = await interaction.client.channels.fetch(frenzyChannelId);
    sentMessage = await frenzyChannel.send({ content: msgContent, allowedMentions });
    await interaction.reply({ content: `✅ Đã gửi đến <#${frenzyChannelId}>, react ✅ vào tin nhắn đó để xác nhận.`, ephemeral: true });
  } else {
    sentMessage = await interaction.reply({ content: msgContent, allowedMentions, fetchReply: true });
  }

  await sentMessage.react("✅");

  cooldownMap.set(userId, Date.now());
  pendingMap.set(sentMessage.id, { userId, max: userRoleLimit.max });

  // Tự huỷ sau PENDING_TIMEOUT_MS nếu không react
  setTimeout(() => {
    if (!pendingMap.has(sentMessage.id)) return;
    pendingMap.delete(sentMessage.id);
    sentMessage.delete().catch(() => {});
  }, PENDING_TIMEOUT_MS);
}

async function handleReaction(reaction, user) {
  if (user.bot) return;
  if (reaction.emoji.name !== "✅") return;

  const pending = pendingMap.get(reaction.message.id);
  if (!pending) return;

  // Chỉ quản trị viên mới được xác nhận
  const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
  if (!member || !isApprover(member)) return;

  pendingMap.delete(reaction.message.id);

  incrementCount(pending.userId);

  const confirmed = reaction.message.content.replace(" ⏳", " ✅");
  await reaction.message.edit(confirmed).catch(() => {});
}

module.exports = { data, execute, handleReaction };
