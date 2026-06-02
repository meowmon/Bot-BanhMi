const { EmbedBuilder } = require("discord.js");
const cheerio = require("cheerio");
const cron = require("node-cron");
const fs = require("fs");
const client = require("../../client");

const NEWS_API_BASE = "https://g.nexonstatic.com/maplestory/cms/v1/news";
const FETCH_HEADERS = {
  accept: "application/json, text/plain, */*",
  origin: "https://www.nexon.com",
  referer: "https://www.nexon.com/",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
};

const REMINDED_FILE = "event-reminded.json";

// Date range pattern: "June 2" / "June 2, 2026" with – or -
const DATE_RANGE_RE =
  /([A-Za-z]+ \d{1,2}(?:,?\s*\d{4})?)\s*[-–]\s*([A-Za-z]+ \d{1,2}(?:,?\s*\d{4})?)/;

// ── State ─────────────────────────────────────────────────────────────────────

function loadReminded() {
  try {
    return new Set(JSON.parse(fs.readFileSync(REMINDED_FILE, "utf8")));
  } catch {
    return new Set();
  }
}

function saveReminded(set) {
  fs.writeFileSync(REMINDED_FILE, JSON.stringify([...set]));
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function parseEventDate(text, refYear) {
  // Try as-is (has explicit year already)
  let d = new Date(`${text} UTC`);
  if (!isNaN(d)) return d;
  // Append reference year
  d = new Date(`${text}, ${refYear} UTC`);
  if (!isNaN(d)) return d;
  // Append next year (for events spanning Dec → Jan)
  d = new Date(`${text}, ${refYear + 1} UTC`);
  if (!isNaN(d)) return d;
  return null;
}

// ── Fetch & parse events from latest patch notes ──────────────────────────────

async function fetchPatchNoteEvents() {
  const listRes = await fetch(NEWS_API_BASE, { headers: FETCH_HEADERS });
  if (!listRes.ok) throw new Error("Cannot fetch news list");
  const articles = await listRes.json();

  const patchNotes = articles.find(
    (a) => a.name.toLowerCase().includes("patch notes") && a.category === "update"
  );
  if (!patchNotes) throw new Error("No patch notes found");

  const detailRes = await fetch(`${NEWS_API_BASE}/${patchNotes.id}`, {
    headers: FETCH_HEADERS,
  });
  if (!detailRes.ok) throw new Error("Cannot fetch patch note detail");
  const detail = await detailRes.json();

  const body = detail.body;
  const refYear = new Date().getUTCFullYear();

  // Find Events section by anchor id
  const anchorIdx = body.indexOf('id="Events"');
  if (anchorIdx === -1) throw new Error("No Events section in patch notes");

  const sectionStart = body.lastIndexOf("<h2", anchorIdx);
  const nextH2 = body.indexOf("<h2", sectionStart + 4);
  const sectionHtml =
    nextH2 !== -1 ? body.slice(sectionStart, nextH2) : body.slice(sectionStart);

  const $ = cheerio.load(sectionHtml);
  const events = [];

  function pushEvent(name, match) {
    if (!name || name.length > 120) return;
    if (events.some((e) => e.name === name)) return; // dedup

    const startDate = parseEventDate(match[1].trim(), refYear);
    const endDate = parseEventDate(match[2].trim(), refYear);
    if (!startDate || !endDate) return;

    // Handle year wrap (e.g. "Dec 1 – Jan 15")
    if (endDate < startDate) endDate.setUTCFullYear(endDate.getUTCFullYear() + 1);

    events.push({
      name,
      startDate,
      endDate,
      startText: match[1].trim(),
      endText: match[2].trim(),
    });
  }

  // Strategy 1: Table – event name in first cell, date in last cell
  $("tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;
    const name = $(cells[0]).text().trim();
    const dateText = $(cells[cells.length - 1]).text().trim();
    const match = dateText.match(DATE_RANGE_RE);
    if (match) pushEvent(name, match);
  });

  // Strategy 2: Paragraph / list pairs – date alone in element, name in prev sibling
  if (events.length === 0) {
    $("p, li, span").each((_, el) => {
      const text = $(el).text().trim();
      const match = text.match(DATE_RANGE_RE);
      if (!match) return;

      const remaining = text.replace(match[0], "").replace(/[:\-–\s]+$/, "").trim();
      let name = "";

      if (remaining.length > 0) {
        // Name and date in same element
        name = remaining;
      } else {
        // Date alone – look at preceding sibling
        name = $(el).prev().text().trim();
        if (!name) name = $(el).parent().prev().text().trim();
      }

      pushEvent(name, match);
    });
  }

  return { patchNotes, events };
}

// ── Check & notify ────────────────────────────────────────────────────────────

async function checkEventEnding() {
  const reminded = loadReminded();
  try {
    const { patchNotes, events } = await fetchPatchNoteEvents();

    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    const endingSoon = events.filter(({ name, endDate }) => {
      const key = `${patchNotes.id}:${name}`;
      if (reminded.has(key)) return false;
      const endUtc = Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate()
      );
      const diff = endUtc - todayUtc;
      return diff >= 0 && diff <= threeDaysMs;
    });

    if (endingSoon.length === 0) return;

    const channel = await client.channels.fetch(process.env.NOTIFICATION_CHANNEL_ID);

    const lines = endingSoon
      .map(({ name, startText, endText }) => `**${name}**\n${startText} - ${endText}`)
      .join("\n\n");

    const embed = new EmbedBuilder()
      .setTitle("Sự kiện sắp kết thúc")
      .setDescription(
        `Các event sắp kết thúc trong vòng 3 ngày tới:\n\n${lines}`
      )
      .setColor(0x5865f2);

    await channel.send({ embeds: [embed] });

    for (const { name } of endingSoon) {
      reminded.add(`${patchNotes.id}:${name}`);
    }
    saveReminded(reminded);

    console.log(`[eventreminder] Đã thông báo ${endingSoon.length} sự kiện sắp kết thúc`);
  } catch (err) {
    console.error("[eventreminder]", err.message);
  }
}

// ── Schedule at 0h UTC daily ──────────────────────────────────────────────────

function scheduleEventReminder() {
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("[eventreminder] Checking event endings...");
      await checkEventEnding();
    },
    { timezone: "UTC" }
  );
}

module.exports = { checkEventEnding, scheduleEventReminder };
