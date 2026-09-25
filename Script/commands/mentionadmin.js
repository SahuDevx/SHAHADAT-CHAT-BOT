module.exports.config = {
  name: "adminmention",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Reply when Admin or Developer is directly mentioned",
  commandCategory: "Other",
  usages: "@",
  cooldowns: 1
};

module.exports.handleEvent = function ({ api, event }) {
  const config = global.config || {};

  const adminIDs = Array.isArray(config.ADMINBOT)
    ? config.ADMINBOT.map(String)
    : [];

  const developerIDs = Array.isArray(config.DEVELOPER)
    ? config.DEVELOPER.map(String)
    : [];

  const targetIDs = [
    ...new Set([
      ...adminIDs,
      ...developerIDs
    ])
  ];

  if (
    event.type === "message_reply" ||
    event.messageReply
  ) {
    return;
  }

  if (
    !event.mentions ||
    Object.keys(event.mentions).length === 0
  ) {
    return;
  }

  const mentionedIDs =
    Object.keys(event.mentions).map(String);

  const mentionedAdminOrDeveloper =
    mentionedIDs.some(id =>
      targetIDs.includes(id)
    );

  if (!mentionedAdminOrDeveloper) {
    return;
  }

  const replies = [
    "ডাকাডাকি করিস না বস ব্যস্ত আছে 😒😌",
    "বস এক আবালে আপনাকে মেনশন দিছে 😑😃",
    "বস এক পাগল ছাগল, আপনাকে ডাকতেছে 🐸🫵",
    "বস এখন ব্যস্ত আছে, কিছু বলতে হলে ইনবক্স এ গিয়া বল",
    "বস এখন আমার সাথে মিটিং এ আছে, মেনশন দিস না 🙂",
    "বস এখন ব্যস্ত আছে, কি বলবি আমাকে বল",
    "কিরে তোর এতো সাহস আমার বসের নাম ধরিস 😾🫵",
    "এইভাবে মেনশন করতাস, না জানি তুই প্রেমে পড়ছোস কিনা 😼❤️"
  ];

  return api.sendMessage(
    replies[
      Math.floor(
        Math.random() * replies.length
      )
    ],
    event.threadID,
    event.messageID
  );
};

module.exports.run = async function () {};
