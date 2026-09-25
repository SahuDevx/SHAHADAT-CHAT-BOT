const axios = require("axios");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const CONFIG_URL = "https://gitlab.com/shahadat-sahu/sahu-api/-/raw/main/API.json";

module.exports.config = {
  name: "quiz",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Quiz with 30s timer",
  commandCategory: "Game",
  usages: "quiz",
  cooldowns: 0,
  usePrefix: true
};

const TIME_LIMIT = 30000;
let QUIZ_API = null;

async function loadQuizAPI() {
  try {
    if (QUIZ_API) return QUIZ_API;
    const res = await axios.get(CONFIG_URL);
    QUIZ_API = res.data.quize.replace(/\/$/, "");
    return QUIZ_API;
  } catch {
    return null;
  }
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  if (!global.client.handleReply) global.client.handleReply = [];

  try {
    const quizAPI = await loadQuizAPI();
    if (!quizAPI) return api.sendMessage("Quiz API error call boss SAHU✔️", threadID, messageID);

    const res = await axios.get(quizAPI + "/quiz");
    const data = res.data;

    if (!data || !data.question) {
      return api.sendMessage("❌ No quiz available", threadID, messageID);
    }

    const msg =
      `🎮 𝗚𝗮𝗺𝗲 𝗤𝘂𝗶𝘇 𝗦𝘁𝗮𝗿𝘁𝗲𝗱\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🔻 ${data.question}\n\n` +
      `A › ${data.A}\n` +
      `B › ${data.B}\n` +
      `C › ${data.C}\n` +
      `D › ${data.D}\n\n` +
      `⏰ 30s • Reply: A/B/C/D`;

    api.sendMessage(msg, threadID, (err, info) => {
      if (err) return;

      const timeout = setTimeout(async () => {
        const i = global.client.handleReply.findIndex(e => e.messageID === info.messageID);
        if (i === -1) return;

        const hr = global.client.handleReply[i];

        if (!hr.answered) {
          const result = await axios.post(quizAPI + "/quiz/answer", {
            sessionID: hr.sessionID,
            answer: ""
          });

          api.sendMessage(`⏰ Time Up!\nCorrect Answer: ${result.data.answer}`, threadID);
        }

        await api.unsendMessage(info.messageID);
        global.client.handleReply.splice(i, 1);
      }, TIME_LIMIT);

      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        sessionID: data.sessionID,
        timeout,
        answered: false
      });
    }, messageID);

  } catch {
    api.sendMessage("Quiz API error call boss SAHU✔", threadID, messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, body, messageID } = event;

  const ans = body.trim().toUpperCase();
  if (!["A", "B", "C", "D"].includes(ans)) return;

  handleReply.answered = true;
  clearTimeout(handleReply.timeout);

  try {
    const quizAPI = await loadQuizAPI();

    const res = await axios.post(quizAPI + "/quiz/answer", {
      sessionID: handleReply.sessionID,
      answer: ans
    });

    if (res.data.correct === true) {
      api.sendMessage(`✅ Correct! (${res.data.answer})`, threadID, messageID);
    } else {
      api.sendMessage(`❌ Wrong!\nCorrect: ${res.data.answer}`, threadID, messageID);
    }

    await api.unsendMessage(handleReply.messageID);

  } catch {
    api.sendMessage("❌ Failed to check answer", threadID, messageID);
  }

  const i = global.client.handleReply.findIndex(e => e.messageID === handleReply.messageID);
  if (i !== -1) global.client.handleReply.splice(i, 1);
};
