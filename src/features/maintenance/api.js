const axios = require("axios");

const API_URL = "https://g.nexonstatic.com/maplestory/cms/v1/news";

async function fetchLatestMaintenance() {
  const response = await axios.get(API_URL);
  const news = response.data;

  return (
    news.find((post) => {
      const title = post.name;
      return (
        post.category === "maintenance" &&
        (title.includes("Minor Patch") ||
          title.includes("Game Update") ||
          title.includes("Server Maintenance") ||
          title.includes("Scheduled Maintenance"))
      );
    }) ?? null
  );
}

async function fetchPostDetail(id) {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
}

module.exports = { fetchLatestMaintenance, fetchPostDetail };
