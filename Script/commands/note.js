module.exports.config = {
  name: "note",
  aliases: ["notes"],
  version: "1.0.0",
  hasPermssion: 2,
  credits: "SHAHADAT SAHU",
  description: "Set a note on the bot's Messenger profile",
  commandCategory: "Admin",
  usages: "[note text]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const text = args.join(" ");

  if (!text) {
    return api.sendMessage(
      "⚠️ Doya kore note e ki likhte chan ta likhun!",
      threadID,
      messageID
    );
  }

  if (text.length > 60) {
    return api.sendMessage(
      "⚠️ Messenger note maximum 60 characters hote hobe!",
      threadID,
      messageID
    );
  }

  try {
    if (!api.note || !api.note.create) {
      return api.sendMessage(
        "⚠️ Apnar FCA version-e note module active nei!",
        threadID,
        messageID
      );
    }

    api.note.create(text, {}, (err) => {
      if (err) {
        return api.sendMessage(
          `⚠️ Note set korte problem hoyeche: ${err.message}`,
          threadID,
          messageID
        );
      }

      return api.sendMessage(
        `✅ Bot-er Messenger note successfully set hoyeche!\n\n💭 "${text}"`,
        threadID,
        messageID
      );
    });
  } catch (error) {
    return api.sendMessage(
      `❌ Note set korte error hoyeche: ${error.message}`,
      threadID,
      messageID
    );
  }
};
