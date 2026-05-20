const data = {
  name: "jobdisc",
  description: "Tìm Discord server của từng class MapleStory",
};

async function execute(interaction) {
  await interaction.reply(
    "Hãy truy cập vào reddit [NÀY](https://www.reddit.com/r/Maplestory/comments/1b8zv9o/master_list_of_all_class_discords/) để tìm discord tương ứng"
  );
}

module.exports = { data, execute };
