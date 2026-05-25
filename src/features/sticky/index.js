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

**⚔️ Frenzy**
\`/frz [name]\` — Xin tap Frenzy
> Ví dụ: \`/frz Dante\`
> Counter reset mỗi thứ 5 lúc 0:00 UTC

**👹 Boss**
\`/boss\` — Xem thông tin boss (kèm guide)

**🗺️ Roadmap**
\`/roadmap\` — Xem roadmap game

**💸 Share Cash**
\`/sharecash\` — Xem các clash nào được dùng chung cashop

**🔧 Maintenance**
\`/maint\` — Kiểm tra lịch bảo trì

**🔗 Links**
\`/links\` — Danh sách link hữu ích

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Không spam command • Hãy dùng bot tại channel này
`.trim();

let lastGuideMessageId = null;

async function handleStickyMessage(message) {
  if (message.author.bot) return;

  const channelId = process.env.BOT_CHANNEL_ID;
  if (!channelId || message.channel.id !== channelId) return;

  try {
    if (lastGuideMessageId) {
      const oldMsg = await message.channel.messages
        .fetch(lastGuideMessageId)
        .catch(() => null);
      if (oldMsg) await oldMsg.delete().catch(() => {});
    }

    const newMsg = await message.channel.send(GUIDE_TEXT);
    lastGuideMessageId = newMsg.id;
  } catch (err) {
    console.error("[sticky] Error updating guideline:", err);
  }
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

module.exports = { handleStickyMessage, postInitialGuide };
