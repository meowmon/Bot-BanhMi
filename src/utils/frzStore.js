const fs = require("fs");
const path = require("path");

const FRZ_FILE = path.join(__dirname, "../../frz.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(FRZ_FILE, "utf8"));
  } catch {
    return { users: {} };
  }
}

function save(data) {
  fs.writeFileSync(FRZ_FILE, JSON.stringify(data));
}

function incrementCount(userId) {
  const data = load();
  data.users[userId] = (data.users[userId] ?? 0) + 1;
  save(data);
  return data.users[userId];
}

function getCount(userId) {
  const data = load();
  return data.users[userId] ?? 0;
}

function resetCount() {
  const data = load();
  data.users = {};
  save(data);
}

function getFrzEnabled() {
  const data = load();
  return data.enabled !== false; // mặc định true nếu chưa có
}

function setFrzEnabled(value) {
  const data = load();
  data.enabled = value;
  save(data);
}

module.exports = { incrementCount, getCount, resetCount, getFrzEnabled, setFrzEnabled };
