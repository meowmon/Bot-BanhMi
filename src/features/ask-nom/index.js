const axios = require("axios");

const MAX_HISTORY_MESSAGES = 8;
const DISCORD_MESSAGE_LIMIT = 1900;
const conversations = new Map();
const pendingRequests = new Map();

const data = {
  name: "ask-nom",
  description: "Hỏi Nom, trợ lý AI tiếng Việt",
  options: [
    {
      type: "string",
      name: "question",
      description: "Câu hỏi dành cho Nom",
      required: true,
    },
  ],
};

function conversationKey(channelId, userId) {
  return `${channelId}:${userId}`;
}

function getBotChannelIds() {
  return process.env.BOT_CHANNEL_IDS
    ? process.env.BOT_CHANNEL_IDS.split(",").map((id) => id.trim()).filter(Boolean)
    : [];
}

async function askNom(key, question, rememberConversation = true) {
  const previousRequest = rememberConversation
    ? pendingRequests.get(key) || Promise.resolve()
    : Promise.resolve();
  const request = previousRequest.catch(() => {}).then(async () => {
    const history = rememberConversation ? conversations.get(key) || [] : [];
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Tên của bạn là Nom. Bạn là một trợ lý thân thiện và luôn trả lời bằng tiếng Việt, rõ ràng, hữu ích. Khi được hỏi tên hoặc giới thiệu bản thân, hãy nói bạn là Nom.",
          },
          ...history,
          { role: "user", content: question },
        ],
        max_completion_tokens: 700,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        timeout: 45000,
      }
    );

    const answer = response.data.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      throw new Error("OpenAI returned an empty response");
    }

    if (rememberConversation) {
      conversations.set(
        key,
        [...history, { role: "user", content: question }, { role: "assistant", content: answer }]
          .slice(-MAX_HISTORY_MESSAGES)
      );
    }
    return answer;
  });

  if (rememberConversation) pendingRequests.set(key, request);
  try {
    return await request;
  } finally {
    if (rememberConversation && pendingRequests.get(key) === request) {
      pendingRequests.delete(key);
    }
  }
}

function splitMessage(content) {
  const characters = Array.from(content);
  const chunks = [];
  for (let index = 0; index < characters.length; index += DISCORD_MESSAGE_LIMIT) {
    chunks.push(characters.slice(index, index + DISCORD_MESSAGE_LIMIT).join(""));
  }
  return chunks;
}

async function execute(interaction) {
  if (!process.env.OPENAI_API_KEY) {
    return interaction.reply({
      content: "❌ Chức năng chưa được cấu hình `OPENAI_API_KEY`.",
      ephemeral: true,
    });
  }

  await interaction.deferReply();
  const question = interaction.options.getString("question", true);
  const key = conversationKey(interaction.channelId, interaction.user.id);
  const rememberConversation = getBotChannelIds().includes(interaction.channelId);

  try {
    const answer = await askNom(key, question, rememberConversation);
    const response = `**Câu hỏi của bạn:**\n${question}\n\n**Nom:**\n${answer}`;
    const chunks = splitMessage(response);
    await interaction.editReply({
      content: chunks[0],
      allowedMentions: { parse: [] },
    });
    for (const chunk of chunks.slice(1)) {
      await interaction.followUp({
        content: chunk,
        allowedMentions: { parse: [] },
      });
    }
  } catch (error) {
    console.error("[ask-nom] OpenAI request failed:", error.response?.status, error.response?.data?.error?.message || error.message);
    await interaction.editReply("❌ Nom chưa thể trả lời lúc này. Vui lòng thử lại sau.");
  }
}

async function handleMessage(message) {
  if (
    process.env.ASK_NOM_MESSAGE_CHAT !== "true" ||
    message.author.bot ||
    !message.inGuild() ||
    !getBotChannelIds().includes(message.channelId)
  ) {
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    await message.reply({
      content: "❌ Chức năng chưa được cấu hình `OPENAI_API_KEY`.",
      allowedMentions: { parse: [] },
    });
    return;
  }

  const question = message.content.trim();
  if (!question) return;

  try {
    const key = conversationKey(message.channelId, message.author.id);
    const answer = await askNom(key, question);
    const chunks = splitMessage(answer);
    await message.reply({ content: chunks[0], allowedMentions: { parse: [] } });
    for (const chunk of chunks.slice(1)) {
      await message.channel.send({ content: chunk, allowedMentions: { parse: [] } });
    }
  } catch (error) {
    console.error("[ask-nom] OpenAI request failed:", error.response?.status, error.response?.data?.error?.message || error.message);
    await message.reply({
      content: "❌ Nom chưa thể trả lời lúc này. Vui lòng thử lại sau.",
      allowedMentions: { parse: [] },
    });
  }
}

module.exports = { data, execute, handleMessage };
