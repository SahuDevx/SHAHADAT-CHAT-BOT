const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "text",
  version: "1.1.0",
  hasPermssion: 2,
  credits: "SHAHADAT SAHU",
  description: "Send repeated text messages",
  commandCategory: "utility",
  usages: "[count] [text]",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
  const count = parseInt(args[0]);
  const text = args.slice(1).join(" ");

  if (isNaN(count) || count < 1) {
    return api.sendMessage("Example:\n/text 5 Hello", event.threadID, event.messageID);
  }

  if (!text) {
    return api.sendMessage("No text provided to send!", event.threadID, event.messageID);
  }

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      api.sendMessage(text, event.threadID);
    }, i * 5000);
  }

  api.sendMessage(`Sending message ${count} times...`, event.threadID);
};
