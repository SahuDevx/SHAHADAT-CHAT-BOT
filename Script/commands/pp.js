module.exports.config = {
  name: "pp",
  aliases: ["dp", "fp"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Get profile picture",
  commandCategory: "Users",
  cooldowns: 0,
  usePrefix: true
};

module.exports.run = async function ({ event, api, args, Users }) {
  const fs = global.nodemodule["fs-extra"];
  const request = global.nodemodule["request"];

  if (event.type === "message_reply") {
    let uid = event.messageReply.senderID;
    let path = __dirname + "/cache/pp.png";

    let callback = () => api.sendMessage({
      body: `== PROFILE ==`,
      attachment: fs.createReadStream(path)
    }, event.threadID, () => fs.unlinkSync(path), event.messageID);

    return request(encodeURI(
      `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
    ))
      .pipe(fs.createWriteStream(path))
      .on("close", () => callback());
  }

  if (!args[0]) {
    let uid = event.senderID;
    let path = __dirname + "/cache/1.png";

    let callback = () => api.sendMessage({
      body: `== PROFILE ==`,
      attachment: fs.createReadStream(path)
    }, event.threadID, () => fs.unlinkSync(path), event.messageID);

    return request(encodeURI(
      `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
    ))
      .pipe(fs.createWriteStream(path))
      .on("close", () => callback());
  }

  if (args[0].includes(".com/")) {
    const res_ID = await api.getUID(args[0]);
    let path = __dirname + "/cache/pp.png";

    let callback = () => api.sendMessage({
      body: `== PROFILE ==`,
      attachment: fs.createReadStream(path)
    }, event.threadID, () => fs.unlinkSync(path), event.messageID);

    return request(encodeURI(
      `https://graph.facebook.com/${res_ID}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
    ))
      .pipe(fs.createWriteStream(path))
      .on("close", () => callback());
  }

  if (args.join().includes('@')) {
    let uid = Object.keys(event.mentions);
    let path = __dirname + "/cache/pp.png";

    let callback = () => api.sendMessage({
      body: `== PROFILE PICTURE==`,
      attachment: fs.createReadStream(path)
    }, event.threadID, () => fs.unlinkSync(path), event.messageID);

    return request(encodeURI(
      `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
    ))
      .pipe(fs.createWriteStream(path))
      .on("close", () => callback());
  }
};
