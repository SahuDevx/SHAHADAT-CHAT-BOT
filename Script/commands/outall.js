module.exports.config = {
  name: "outall",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "SHAHADAT SAHU",
  description: "Leave all groups with goodbye message",
  commandCategory: "Admin",
  usages: "outall",
  cooldowns: 0
};

module.exports.run = async function ({ api, event }) {
  try {
    const list = await api.getThreadList(
      100,
      null,
      ["INBOX"]
    );

    let count = 0;

    const botName =
      global.config.BOTNAME || "Messenger Chat Bot";

    for (const group of list) {
      if (
        group.isGroup &&
        group.threadID != event.threadID
      ) {
        try {
          await api.sendMessage(
            `Goodbye everyone! 👋❤️

${botName} ei group theke ber hoye jacche.
Shobai bhalo thakben. 🥺

Thanks for using ${botName}. 🤖❤️`,
            group.threadID
          );

          await new Promise(resolve =>
            setTimeout(resolve, 500)
          );

          await api.removeUserFromGroup(
            api.getCurrentUserID(),
            group.threadID
          );

          count++;
        } catch (e) {
          console.error(
            `Failed to leave ${group.threadID}:`,
            e.message
          );
        }
      }
    }

    return api.sendMessage(
      `✅ Successfully left ${count} groups.`,
      event.threadID
    );

  } catch (error) {
    console.error(error);

    return api.sendMessage(
      "📛 Failed to leave groups.",
      event.threadID
    );
  }
};
