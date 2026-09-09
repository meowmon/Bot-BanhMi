const TZ_OFFSETS = {
  PDT: -7, PST: -8,
  EDT: -4, EST: -5,
  GMT: 0, UTC: 0,
  BST: 1, CET: 1, CEST: 2,
  AEST: 10, AEDT: 11,
};

// Nexon th\u1EC9nh tho\u1EA3ng \u0111\u1EC3 double space, nbsp ho\u1EB7c space tr\u01B0\u1EDBc d\u1EA5u ph\u1EA9y
// (nh\u1EA5t l\u00E0 sau khi strip HTML), n\u00EAn chu\u1EA9n ho\u00E1 whitespace tr\u01B0\u1EDBc khi match.
function normalizeText(text) {
  return String(text ?? "")
    // strip tag ch\u1EC9 b\u1ECF th\u1EBB, entity v\u1EABn c\u00F2n nguy\u00EAn d\u1EA1ng ch\u1EEF (&nbsp;)
    .replace(/&nbsp;|&#160;|&#xa0;/gi, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

const START_RE =
  /(?:starting|beginning)\s+(?:on\s+)?(?:[A-Za-z]+,\s*)?([A-Za-z]+ \d{1,2}, \d{4}) at (\d{1,2}:\d{2} [AP]M) ([A-Za-z]{2,4})/i;

// Bài unscheduled hay viết "maintenance today, July 23, 2026 at 1:00 PM PDT"
// (không có "starting on") nên cần fallback bám vào chính cụm ngày + giờ.
const DATE_TIME_RE =
  /([A-Za-z]+ \d{1,2}, \d{4}) at (\d{1,2}:\d{2} [AP]M) ([A-Za-z]{2,4})/i;

function parseMaintenanceTimes(summary, bodyText) {
  const normalizedSummary = normalizeText(summary);
  const normalizedBody = normalizeText(bodyText);
  const startMatch =
    normalizedSummary.match(START_RE) ??
    normalizedBody.match(START_RE) ??
    normalizedSummary.match(DATE_TIME_RE) ??
    normalizedBody.match(DATE_TIME_RE);
  const pdtMatches = [
    ...normalizedBody.matchAll(/(\d{1,2}:\d{2} [AP]M) (PDT|PST)/gi),
  ];
  const concludeMatch = normalizedBody.match(
    /conclud(?:e|ing)\s+(?:at|around)\s+(\d{1,2}:\d{2} [AP]M) (PDT|PST)/i
  );
  const endMatch =
    concludeMatch ??
    (pdtMatches.length >= 2 ? pdtMatches[pdtMatches.length - 1] : null);
  // duration có thể là số thập phân: "last approximately 1.5 hours"
  const durationMatch = normalizedBody.match(
    /last approximately (\d+(?:\.\d+)?) hours?/i
  );

  if (!startMatch) return null;

  const startOffset = TZ_OFFSETS[startMatch[3].toUpperCase()] ?? 0;
  const startUtcMs =
    Date.parse(`${startMatch[1]} ${startMatch[2]} UTC`) -
    startOffset * 3600 * 1000;

  // Khi Nexon ghi rõ số tiếng thì tin theo nó: giờ kết thúc trong body có thể
  // nằm ở bản update/timezone khác, dễ lệch cả ngày khi phải cộng bù 24h.
  if (durationMatch) {
    const duration = parseFloat(durationMatch[1]);
    const endUtcMs = startUtcMs + duration * 3600 * 1000;
    return {
      startUnix: Math.floor(startUtcMs / 1000),
      endUnix: Math.floor(endUtcMs / 1000),
      duration,
    };
  }

  if (endMatch) {
    const endOffset = TZ_OFFSETS[endMatch[2].toUpperCase()] ?? 0;
    let endUtcMs =
      Date.parse(`${startMatch[1]} ${endMatch[1]} UTC`) -
      endOffset * 3600 * 1000;
    if (endUtcMs <= startUtcMs) endUtcMs += 24 * 3600 * 1000;

    return {
      startUnix: Math.floor(startUtcMs / 1000),
      endUnix: Math.floor(endUtcMs / 1000),
      duration: Math.round(((endUtcMs - startUtcMs) / 3600000) * 10) / 10,
    };
  }

  return {
    startUnix: Math.floor(startUtcMs / 1000),
    endUnix: null,
    duration: null,
  };
}

function buildMessage(detail, newsUrl) {
  const rolePing = process.env.SCANIA_ROLE_ID
    ? `<@&${process.env.SCANIA_ROLE_ID}>`
    : "@everyone";

  const bodyText = detail.body
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const times = parseMaintenanceTimes(detail.summary, bodyText);

  if (times) {
    const { startUnix, endUnix, duration } = times;
    if (endUnix && duration) {
      return `${rolePing} Hế lô mọi người! Maplestory GMS sẽ bảo trì ${duration} tiếng từ <t:${startUnix}:f> đến <t:${endUnix}:f>\nThông tin chi tiết có thể đọc tại [ĐÂY](${newsUrl})`;
    }
    return `${rolePing} Hế lô mọi người! Maplestory GMS sẽ bảo trì từ <t:${startUnix}:f>\nThông tin chi tiết có thể đọc tại [ĐÂY](${newsUrl})`;
  }

  return `${rolePing} bảo trì!\nThông tin chi tiết có thể đọc tại [ĐÂY](${newsUrl})`;
}

module.exports = { buildMessage, parseMaintenanceTimes };
