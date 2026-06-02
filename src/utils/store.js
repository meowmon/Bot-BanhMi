const fs = require("fs");
const path = require("path");

const POSTED_FILE = process.env.POSTED_DATA_PATH
  ? path.resolve(process.env.POSTED_DATA_PATH)
  : path.join(__dirname, "../../posted.json");

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
