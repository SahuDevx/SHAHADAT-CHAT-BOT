const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "pairing",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Pair sender with a random user from the group via Avatar Canvas API",
  commandCategory: "banner",
  usePrefix: true,
  usages: "pairing",
  cooldowns: 5
};

module.exports.run = async function ({ event, api, Users, Threads }) {
  const { threadID, messageID, senderID } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    const members = threadInfo.userInfo.filter(
      u => u.id !== senderID && u.id !== botID
    );

    if (members.length === 0) {
      return api.sendMessage("Pairing failed! No valid user found.", threadID, messageID);
    }

    const randomUser = members[Math.floor(Math.random() * members.length)];
    const targetID = randomUser.id;

    const apiList = await axios.get(
      "https://gitlab.com/shahadat-sahu/sahu-api/-/raw/main/API.json"
    );

    const AVATAR_CANVAS_API = apiList.data.AvatarCanvas;

    const res = await axios.post(
      `${AVATAR_CANVAS_API}/api`,
      {
        cmd: "pairing",
        senderID,
        targetID
      },
      { responseType: "arraybuffer", timeout: 20000 }
    );

    const imgPath = path.join(
      __dirname,
      "cache",
      `pairing_${senderID}_${targetID}.png`
    );

    fs.writeFileSync(imgPath, res.data);

    const senderName = await Users.getNameUser(senderID);
    const targetName = await Users.getNameUser(targetID);

    const percent = Math.floor(Math.random() * 100) + 1;

    const bodyText =
      `𝐂𝐎𝐍𝐆𝐑𝐀𝐓𝐔𝐋𝐀𝐓𝐈𝐎𝐍𝐒\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `${senderName}\n` +
      `❤️ LOVE WITH ❤️\n` +
      `${targetName}\n\n` +
      `Love Match: ${percent}% ❤️`;

    return api.sendMessage(
      {
        body: bodyText,
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );

  } catch (e) {
    return api.sendMessage("API Error Call Boss SAHU", event.threadID, event.messageID);
  }
};
