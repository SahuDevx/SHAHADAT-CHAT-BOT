const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "rip",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Generate a RIP banner image using target Facebook UID via Avatar Canvas API",
  commandCategory: "banner",
  usePrefix: true,
  usages: "[@mention | reply]",
  cooldowns: 0,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, mentions, messageReply } = event;

  let targetID = null;

  if (mentions && Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else if (messageReply && messageReply.senderID) {
    targetID = messageReply.senderID;
  }

  if (!targetID) {
    return api.sendMessage(
      "Please reply or mention someone......",
      threadID,
      messageID
    );
  }

  try {
    const apiList = await axios.get(
      "https://gitlab.com/shahadat-sahu/sahu-api/-/raw/main/API.json"
    );

    const AVATAR_CANVAS_API = apiList.data.AvatarCanvas;

    const res = await axios.post(
      `${AVATAR_CANVAS_API}/api`,
      {
        cmd: "rip",
        senderID: targetID
      },
      { responseType: "arraybuffer", timeout: 30000 }
    );

    const imgPath = path.join(
      __dirname,
      "cache",
      `rip_${targetID}.png`
    );

    fs.writeFileSync(imgPath, res.data);

    return api.sendMessage(
      {
        body: "",
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );

  } catch (e) {
    return api.sendMessage(
      "API Error Call Boss SAHU",
      threadID,
      messageID
    );
  }
};
