module.exports.config = {
  name: "getlink",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Get direct download link from replied media",
  commandCategory: "Media",
  usages: "reply to media",
  cooldowns: 0,
  usePrefix: true
};

module.exports.languages = {
  en: {
    invalidFormat: "You must reply to a message containing an image, video, or audio....."
  }
};

module.exports.run = async ({ api, event, getText }) => {
  if (event.type !== "message_reply") {
    return api.sendMessage(getText("invalidFormat"), event.threadID, event.messageID);
  }

  const attachments = event.messageReply.attachments;
  if (!attachments || attachments.length !== 1) {
    return api.sendMessage(getText("invalidFormat"), event.threadID, event.messageID);
  }

  const type = attachments[0].type;
  if (!["photo", "video", "audio"].includes(type)) {
    return api.sendMessage(getText("invalidFormat"), event.threadID, event.messageID);
  }

  return api.sendMessage(attachments[0].url, event.threadID, event.messageID);
};
