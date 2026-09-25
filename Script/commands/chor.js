const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "chor",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Scooby-doo meme using Avatar Canvas API",
  commandCategory: "fun",
  usePrefix: true,
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
    return api.sendMessage("Please reply or mention someone.", threadID, messageID);
  }

  try {
    const apiList = await axios.get(
      "https://gitlab.com/shahadat-sahu/sahu-api/-/raw/main/API.json"
    );

    const AVATAR_CANVAS_API = apiList.data.AvatarCanvas;

    const res = await axios.post(
      `${AVATAR_CANVAS_API}/api`,
      {
        cmd: "chor",

        
        senderID: targetID,
        targetID: senderID
      },
      {
        responseType: "arraybuffer",
        timeout: 30000
      }
    );

    const imgPath = path.join(__dirname, "cache", `chor_${senderID}_${targetID}.png`);
    fs.writeFileSync(imgPath, res.data);

    return api.sendMessage(
      {
        body: "~বলদ মেয়েদের চিপায় ধরা খাইছে😹🤣",
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );

  } catch (error) {
    return api.sendMessage("API Error Call Boss SAHU.", threadID, messageID);
  }
};
