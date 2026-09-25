const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "wife",
  aliases: ["bow"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Generate a couple banner image using sender and target Facebook UID via Avatar Canvas API",
  commandCategory: "banner",
  usePrefix: false,
  usages: "[@mention | reply]",
  cooldowns: 5
};

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  let targetID = null;

  if (mentions && Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else if (messageReply && messageReply.senderID) {
    targetID = messageReply.senderID;
  }

  if (!targetID) {
    return api.sendMessage("Please reply or mention someone......", threadID, messageID);
  }

  try {
    const apiList = await axios.get(
      "https://gitlab.com/shahadat-sahu/sahu-api/-/raw/main/API.json"
    );

    const AVATAR_CANVAS_API = apiList.data.AvatarCanvas;

    const res = await axios.post(
      `${AVATAR_CANVAS_API}/api`,
      {
        cmd: "love3",
        senderID,
        targetID
      },
      { responseType: "arraybuffer", timeout: 20000 }
    );

    const imgPath = path.join(__dirname, "cache", `love3_${senderID}_${targetID}.png`);
    fs.writeFileSync(imgPath, res.data);

    const successBody = "❤️ Your cute sweet wife ❤️";

    return api.sendMessage(
      {
        body: successBody,
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );

  } catch (e) {
    return api.sendMessage("API Error Call Boss SAHU", threadID, messageID);
  }
};
