module.exports.config = {
  name: 'say',
  aliases: ["echo"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Make the bot return google's audio file via text",
  commandCategory: "Media",
  usages: "[bn] [Text]",
  cooldowns: 5,
  usePrefix: true,
  dependencies: {
    "path": "",
    "fs-extra": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const { createReadStream, unlinkSync } = global.nodemodule["fs-extra"];
    const { resolve } = global.nodemodule.path;

    const text = event.type === "message_reply"
      ? event.messageReply.body
      : args.join(" ");

    const lang = text.startsWith("bn")
      ? text.slice(0, text.indexOf(" "))
      : global.config.language;

    const query = lang !== global.config.language
      ? text.slice(3)
      : text;

    const filePath = resolve(__dirname, "cache", `${event.threadID}_${event.senderID}.mp3`);

    await global.utils.downloadFile(
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(query)}&tl=bn&client=tw-ob`,
      filePath
    );

    return api.sendMessage(
      { attachment: createReadStream(filePath) },
      event.threadID,
      () => unlinkSync(filePath)
    );

  } catch (err) {
    console.log("Error....", err);
  }
};
