const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "bestfriend",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Generate a best friend banner image using sender and target Facebook UID via Avatar Canvas API",
  commandCategory: "banner",
  usePrefix: true,
  usages: "[@mention | reply]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
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
        cmd: "bestFriend",
        senderID,
        targetID
      },
      { responseType: "arraybuffer", timeout: 30000 }
    );

    const imgPath = path.join(
      __dirname,
      "cache",
      `bestFriend_${senderID}_${targetID}.png`
    );

    fs.writeFileSync(imgPath, res.data);

    const BEST_FRIEND_CAPTIONS = [
      "🌼 বন্ধুত্ব মানে শুধু পাশে থাকা না,\nবন্ধুত্ব মানে মন খারাপের দিনেও হাসি এনে দেওয়া 💛\nসব সময় এমনই থাকিস আমার Best Friend 🫶",
      "একটা মানুষই যথেষ্ট,\nযার সাথে সব কথা বলা যায়,\nহাসি–কান্না সব শেয়ার করা যায় 💛🌻\nBest Friend Forever 🫶",
      "তুই আছিস বলেই,\nজীবনটা এত সুন্দর লাগে 🫶🌸\nMy Best Friend 💛",
      "রক্তের সম্পর্ক না হয়েও,\nযে মানুষটা নিজের চেয়েও কাছের 💛\nসেই তো আসল Best Friend 🌻🫶",
      "কথা কম,\nবোঝাপড়া বেশি 😌💛\nএইটাই আমাদের বন্ধুত্ব 🫶",
      "বন্ধুত্ব কোনো নাম নয়,\nএটা এক ধরনের অনুভূতি 💛\nযেটা ভাগ্যবানরাই পায় 🌻🫶"
    ];

    const caption =
      BEST_FRIEND_CAPTIONS[
        Math.floor(Math.random() * BEST_FRIEND_CAPTIONS.length)
      ];

    return api.sendMessage(
      {
        body: caption,
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );

  } catch {
    return api.sendMessage(
      "API Error Call Boss SAHU",
      threadID,
      messageID
    );
  }
};
