module.exports.config = {
  name: "tid",
  aliases: ["threadid", "gid"],
  version: "2.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Show current thread ID",
  commandCategory: "group",
  usages: "tid",
  cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, threadID, messageID } = event;
  if (!body) return;
  if (body.trim().toLowerCase() === "tid") {
    return api.sendMessage(`${threadID}`, threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  if (args.length === 0) {
    return api.sendMessage(`${threadID}`, threadID, messageID);
  }
};
