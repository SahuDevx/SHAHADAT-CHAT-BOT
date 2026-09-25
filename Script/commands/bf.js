module.exports.config = {
  name: "bf",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "couple banner",
  commandCategory: "banner",
  usages: "[@mention | reply]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

module.exports.run = async function ({ event, api }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");

  const { threadID, messageID, senderID, mentions, messageReply } = event;

  let targetID =
    messageReply?.senderID ||
    (mentions && Object.keys(mentions)[0]);

  if (!targetID)
    return api.sendMessage(
      "Please reply or mention someone......",
      threadID,
      messageID
    );

  try {
    const apiList = await axios.get(
      "https://gitlab.com/shahadat-sahu/sahu-api/-/raw/main/API.json"
    );

    const AVATAR_CANVAS_API = apiList.data.AvatarCanvas;
    if (!AVATAR_CANVAS_API) throw true;

    const res = await axios.post(
      `${AVATAR_CANVAS_API}/api`,
      { cmd: "gf", senderID, targetID },
      { responseType: "arraybuffer", timeout: 30000 }
    );

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imgPath = path.join(
      cacheDir,
      `gf_${senderID}_${targetID}.png`
    );

    fs.writeFileSync(imgPath, res.data);

    return api.sendMessage(
      {
        body: "~এই নে তোর বয়ফ্রেন্ড অন্য মেয়ের দিকে নজর দিস না 😍😸",
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );

  } catch (e) {
    return api.sendMessage(
      "GF API Error | SAHU-API unreachable",
      threadID,
      messageID
    );
  }
};
