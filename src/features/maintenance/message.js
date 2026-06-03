const TZ_OFFSETS = {
  PDT: -7, PST: -8,
  EDT: -4, EST: -5,
  GMT: 0, UTC: 0,
  BST: 1, CET: 1, CEST: 2,
  AEST: 10, AEDT: 11,
};

function parseMaintenanceTimes(summary, bodyText) {
  const startMatch = summary.match(
    /starting on \w+, (\w+ \d+, \d+) at (\d+:\d+ [AP]M) (\w+)/
  );
  const endMatch = bodyText.match(
    /concluding around (\d+:\d+ [AP]M) (\w+)/
  );
  const durationMatch = bodyText.match(/last approximately (\d+) hours?/);

  if (!startMatch) return null;

  const startOffset = TZ_OFFSETS[startMatch[3]] ?? 0;
  const startUtcMs =
    Date.parse(`${startMatch[1]} ${startMatch[2]} UTC`) -
    startOffset * 3600 * 1000;

  if (endMatch) {
    const endOffset = TZ_OFFSETS[endMatch[2]] ?? 0;
    let endUtcMs =
      Date.parse(`${startMatch[1]} ${endMatch[1]} UTC`) -
      endOffset * 3600 * 1000;
    if (endUtcMs <= startUtcMs) endUtcMs += 24 * 3600 * 1000;

    const duration = durationMatch
      ? parseInt(durationMatch[1])
      : Math.round((endUtcMs - startUtcMs) / 3600000);

    return {
      startUnix: Math.floor(startUtcMs / 1000),
      endUnix: Math.floor(endUtcMs / 1000),
      duration,
    };
  }

  if (durationMatch) {
    const duration = parseInt(durationMatch[1]);
    const endUtcMs = startUtcMs + duration * 3600 * 1000;
    return {
      startUnix: Math.floor(startUtcMs / 1000),
      endUnix: Math.floor(endUtcMs / 1000),
      duration,
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
