/**
 * Sticky Guideline Feature
 *
 * Mỗi khi có tin nhắn mới trong các BOT_CHANNEL_IDS:
 *  - Xóa guideline cũ
 *  - Repost guideline mới xuống cuối channel
 * => Guideline luôn hiện ở dưới cùng / dễ thấy nhất
 *
 * Env vars cần thiết:
 *   BOT_CHANNEL_IDS — Danh sách ID các channel bot-commands, cách nhau bằng dấu phẩy
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

**Lưu ý** — Message hướng dẫn này sẽ luôn ở dưới cùng của channel, do đó phản hồi lệnh của bạn sẽ được gửi phía trên nó. Nếu bạn không thấy phản hồi, hãy cuộn lên trên một chút nhé!
`.trim();

let lastGuideMessageId = null;

function getBotCommandChannelId() {
  // Chỉ dùng channel đầu tiên trong BOT_CHANNEL_IDS làm bot-command channel
  const ids = process.env.BOT_CHANNEL_IDS
    ? process.env.BOT_CHANNEL_IDS.split(",").map((id) => id.trim()).filter(Boolean)
    : [];
  return ids[0] ?? null;
}

async function repostGuide(channel) {
  try {
    if (lastGuideMessageId) {
      const oldMsg = await channel.messages.fetch(lastGuideMessageId).catch(() => null);
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
  const channelId = getBotCommandChannelId();
  if (!channelId || message.channel.id !== channelId) return;
  await repostGuide(message.channel);
}

async function handleStickyInteraction(interaction) {
  const channelId = getBotCommandChannelId();
  if (!channelId || interaction.channelId !== channelId) return;
  await repostGuide(interaction.channel);
}

/**
 * Gửi guideline lần đầu khi bot khởi động.
 * Gọi sau khi client ready.
 */
async function postInitialGuide(client) {
  const channelId = getBotCommandChannelId();
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