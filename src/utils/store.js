const fs = require("fs");

const POSTED_FILE = "posted.json";

function loadPostedNews() {
  try {
    const data = fs.readFileSync(POSTED_FILE, "utf8");
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

function savePostedNews(set) {
  fs.writeFileSync(POSTED_FILE, JSON.stringify([...set]));
}

module.exports = { loadPostedNews, savePostedNews };
