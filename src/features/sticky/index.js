/**
 * Sticky Guideline Feature
 *
 * Mỗi khi có tin nhắn mới trong BOT_CHANNEL_ID:
 *  - Xóa guideline cũ
 *  - Repost guideline mới xuống cuối channel
 * => Guideline luôn hiện ở dưới cùng / dễ thấy nhất
 *
 * Env vars cần thiết:
 *   BOT_CHANNEL_ID — ID của channel bot-commands
 */

const GUIDE_TEXT = `
📌 **HƯỚNG DẪN SỬ DỤNG BOT**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**⚔️ Frenzy** \`/frz [name]\` — Xin tap Frenzy (Bạn cần được cấp quyền để dùng lệnh này)
> Counter reset mỗi thứ 5 lúc 0:00 UTC

**👹 Boss** \`/boss\` — Xem thông tin boss (kèm guide)

**🗺️ Roadmap** \`/roadmap\` — Xem roadmap game

**💸 Share Cash** \`/sharecash\` — Xem các clash nào được dùng chung cashop

**🔧 Maintenance** \`/maint\` — Kiểm tra lịch bảo trì

**🔗 Links** \`/links\` — Danh sách link hữu ích

**☀️ Sunny Sunday** \`/sunny\` — Xem lịch Sunny Sunday từ patch notes mới nhất
`.trim();

let lastGuideMessageId = null;

async function repostGuide(channel) {
  try {
    if (lastGuideMessageId) {
      const oldMsg = await channel.messages
        .fetch(lastGuideMessageId)
        .catch(() => null);
      if (oldMsg) await oldMsg.delete().catch(() => {});
    }
    const newMsg = await channel.send(GUIDE_TEXT);
    lastGuideMessageId = newMsg.id;
  } catch (err) {
    console.error("[sticky] Error updating guideline:", err);
  }
}

async function handleStickyMessage(message) {
  if (message.author.bot) return;
  const channelId = process.env.BOT_CHANNEL_ID;
  if (!channelId || message.channel.id !== channelId) return;
  await repostGuide(message.channel);
}

async function handleStickyInteraction(interaction) {
  const channelId = process.env.BOT_CHANNEL_ID;
  if (!channelId || interaction.channelId !== channelId) return;
  await repostGuide(interaction.channel);
}

/**
 * Gửi guideline lần đầu khi bot khởi động.
 * Gọi sau khi client ready.
 */
async function postInitialGuide(client) {
  const channelId = process.env.BOT_CHANNEL_ID;
  if (!channelId) return;

  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    const newMsg = await channel.send(GUIDE_TEXT);
    lastGuideMessageId = newMsg.id;
    console.log("[sticky] Guideline posted on startup.");
  } catch (err) {
    console.error("[sticky] Failed to post initial guideline:", err);
  }
}

module.exports = { handleStickyMessage, handleStickyInteraction, postInitialGuide };