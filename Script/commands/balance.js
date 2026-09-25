module.exports.config = {
  name: "bal",
  aliases: ["balance", "money"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Check your balance or someone else's balance",
  commandCategory: "Economy",
  usages: "[tag or reply or none]",
  cooldowns: 0,
  usePrefix: true
};

module.exports.languages = {
  "en": {
    "selfBalance": "💰 Your current balance: %1$",
    "otherBalance": "💰 %1's current balance: %2$",
    "zeroBalance": "😅 %1 has no money at all!"
  }
};

module.exports.run = async function ({ api, event, args, Currencies, getText }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  if (!args[0] && !messageReply) {
    const data = await Currencies.getData(senderID);
    const money = data.money || 0;
    const msg = money === 0 ? getText("zeroBalance", "You") : getText("selfBalance", money);
    return api.sendMessage(msg, threadID, messageID);
  }

  if (Object.keys(mentions).length === 1) {
    const mentionID = Object.keys(mentions)[0];
    const name = mentions[mentionID].replace(/@/g, "");
    const data = await Currencies.getData(mentionID);
    const money = data.money || 0;
    const msg = money === 0 ? getText("zeroBalance", name) : getText("otherBalance", name, money);
    return api.sendMessage({
      body: msg,
      mentions: [{ tag: name, id: mentionID }]
    }, threadID, messageID);
  }

  if (messageReply) {
    const replyID = messageReply.senderID;
    const name = messageReply.senderName || "User";
    const data = await Currencies.getData(replyID);
    const money = data.money || 0;
    const msg = money === 0 ? getText("zeroBalance", name) : getText("otherBalance", name, money);
    return api.sendMessage({
      body: msg,
      mentions: [{ tag: name, id: replyID }]
    }, threadID, messageID);
  }

  return global.utils.throwError(this.config.name, threadID, messageID);
};
