const { fetchLatestMaintenance, fetchPostDetail } = require("../maintenance/api");
const { parseMaintenanceTimes } = require("../maintenance/message");

const data = {
  name: "maint",
  description: "Xem thông tin bảo trì MapleStory GMS sắp tới",
};

async function execute(interaction) {
  await interaction.deferReply();

  const latestPost = await fetchLatestMaintenance();

  if (!latestPost) {
    return interaction.editReply("Không tìm thấy thông tin bảo trì nào.");
  }

  const newsUrl = `https://www.nexon.com/maplestory/news/maintenance/${latestPost.id}`;
  const detail = await fetchPostDetail(latestPost.id);

  const bodyText = detail.body
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const times = parseMaintenanceTimes(detail.summary, bodyText);

  if (!times) {
    return interaction.editReply(
      `Không thể lấy thời gian bảo trì. Xem chi tiết tại: ${newsUrl}`
    );
  }

  const { startUnix, endUnix, duration } = times;
  const nowUnix = Math.floor(Date.now() / 1000);

  // Check if maintenance has already ended
  const isOver = endUnix ? endUnix < nowUnix : startUnix < nowUnix - 3600;
  if (isOver) {
    return interaction.editReply("Hiện không có lịch bảo trì sắp tới.");
  }

  const lines = [
    "Đây là thông tin bảo trì sắp tới mà tao tìm được (thời gian hiển thị theo múi giờ của mày):",
    `**Bắt đầu:** <t:${startUnix}:F> (<t:${startUnix}:R>).`,
  ];

  if (endUnix) {
    lines.push(`**Dự kiến kết thúc:** <t:${endUnix}:F> (<t:${endUnix}:R>).`);
  }

  if (duration) {
    lines.push(`**Thời gian bảo trì:** ${duration} tiếng.`);
  }

  lines.push(`Xem thông tin chi tiết tại [ĐÂY](${newsUrl}).`);

  await interaction.editReply(lines.join("\n"));
}

module.exports = { data, execute };
