module.exports.config = {
  name: "inbox",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Sends a message directly to the user's inbox from a group",
  commandCategory: "Utility",
  usages: "[message (optional)]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Users }) {
  const { threadID, messageID, senderID, isGroup } = event;

  try {
    if (!isGroup) {
      return api.sendMessage(
        "আরে বোকা! তুমি তো অলরেডি আমার ইনবক্সেই আছো! 😹",
        threadID,
        messageID
      );
    }

    const userName = await Users.getNameUser(senderID);
    const customMessage = args.join(" ");

    let inboxText = "";
    if (customMessage) {
      inboxText = `আসসালামু আলাইকুম ${userName}!\n\nতুমি গ্রুপ থেকে আমাকে এই মেসেজটি পাঠাতে বলেছিলে:\n📩 "${customMessage}"\n\nযেকোনো প্রয়োজনে আমাকে ইনবক্সে সরাসরি মেসেজ দিতে পারো! 🥰`;
    } else {
      inboxText = `আসসালামু আলাইকুম ${userName}! ❤️\n\nতুমি গ্রুপ থেকে আমাকে ডেকেছো, তাই তোমার ইনবক্সে চলে আসলাম। 🙈\n\nবলো জানু, তোমার জন্য কি করতে পারি? যেকোনো কথা বা আড্ডা দিতে চাইলে আমাকে সরাসরি মেসেজ দাও! 🤖✨`;
    }

    api.sendMessage(inboxText, senderID, (err) => {
      if (err) {
        return api.sendMessage(
          {
            body: `⚠️ দুঃখিত @${userName}, তোমার ইনবক্সে মেসেজ পাঠানো সম্ভব হয়নি!\n\nকারণ: তোমার আইডির Message Request বন্ধ থাকতে পারে অথবা আমাকে মেসেজ দেওয়ার অপশন লক করা। দয়া করে আগে আমার ইনবক্সে একটি 'Hi' পাঠাও।`,
            mentions: [{ tag: `@${userName}`, id: senderID }]
          },
          threadID,
          messageID
        );
      }

      return api.sendMessage(
        {
          body: `✅ এই যে @${userName}, তোমার ইনবক্সে একটি মেসেজ পাঠানো হয়েছে! 💌\n\n👉 ইনবক্সে মেসেজ না পেলে মেসেঞ্জারের 'Message Requests' বা 'Spam' ফোল্ডার চেক করো।`,
          mentions: [{ tag: `@${userName}`, id: senderID }]
        },
        threadID,
        messageID
      );
    });
  } catch (error) {
    console.error("Inbox Command Error:", error);
    return api.sendMessage(
      `❌ একটি সমস্যা হয়েছে!\n\n${error.message}`,
      threadID,
      messageID
    );
  }
};
