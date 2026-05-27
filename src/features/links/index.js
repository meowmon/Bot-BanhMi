const { MessageFlags } = require("discord.js");

const data = {
  name: "links",
  description: "Danh sách các link hữu ích",
};

async function execute(interaction) {
  await interaction.reply({
    content:                  
      "Link mời bạn bè vào discord này: [LINK INVITE](https://discord.com/invite/banhmivietnam)\n" +
      "Reddit danh sách discord các class: [LINK](https://www.reddit.com/r/Maplestory/comments/1b8zv9o/master_list_of_all_class_discords/)\n" +
      "Cashop sale leak: [LINK](https://masonym.dev/cash-shop)\n" +
      "Rate các GACHA cashshop: [LINK](https://www.nexon.com/maplestory/general-post/5805)\n" +
      "Cách tăng CP mule: [LINK](https://www.youtube.com/watch?v=SzW5HVMxZPE)\n" +
      "Unicube Simulator: [LINK](https://maigod.net/maplestory/uniCube)\n" +
      "VioletCube Simulator: [LINK](https://maigod.net/maplestory/violetCube)\n" +
      "Item Simulator: [LINK](https://misaomaki.github.io/starforce2.html)\n" +
      "Inner Ability Simulator: [LINK](https://brendonmay.github.io/innerAbilityCalculator/)\n" +
      "Flame Simulator: [LINK](https://www.whackybeanz.com/calc/equips/flames)\n" +
      "Check Boss Crystals: [LINK](https://zydico.github.io/Website/#/maplestory-helper/boss-crystals)\n" +
      "Check sức mạnh tổng thể acc: [LINK](https://maplescouter.com/input)\n" +
      "Check map farm / train: [LINK](https://maplemaps.net/)\n",
    flags: MessageFlags.SuppressEmbeds,
  });
}

module.exports = { data, execute };
