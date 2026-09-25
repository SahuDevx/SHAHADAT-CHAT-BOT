module.exports.config = {
  name: "callad",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Send report to fixed admin thread",
  commandCategory: "Group",
  usages: "[message]",
  cooldowns: 5,
  usePrefix: true
};

const TARGETTID = "1890739128318840";

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {
  try {
    if (String(event.threadID) !== String(TARGETTID)) return;

    await api.sendMessage(
      `📩 Admin replied:\n\n${event.body || "No content."}`,
      handleReply.id
    );
  } catch (err) {
    console.log("CALLAD REPLY ERROR:", err);
  }
};

module.exports.run = async function ({
  api,
  event,
  args,
  Users,
  Threads
}) {
  try {
    const moment = require("moment-timezone");

    if (!args.length) {
      return api.sendMessage(
        "⚠️ Please enter your report message.",
        event.threadID,
        event.messageID
      );
    }

    let name = "Unknown User";

    try {
      name =
        (await Users.getData(event.senderID)).name ||
        "Unknown User";
    } catch {}

    let groupName = "Unknown Group";

    try {
      const threadInfo =
        (await Threads.getData(event.threadID)).threadInfo;

      if (threadInfo?.threadName) {
        groupName = threadInfo.threadName;
      }
    } catch {}

    const time = moment
      .tz("Asia/Dhaka")
      .format("HH:mm:ss | DD/MM/YYYY");

    const message = args.join(" ");

    api.sendMessage(
      "✅ Report sent to Admin.",
      event.threadID,
      event.messageID
    );

    api.sendMessage(
`📢 CALL ADMIN

👤 From: ${name}
👥 Group: ${groupName}

💬 Message:
${message}

⏰ Time: ${time}`,
      TARGETTID,
      (err, info) => {
        if (err || !info) {
          console.log(
            "CALLAD SEND ERROR:",
            err
          );
          return;
        }

        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          id: event.threadID,
          type: "calladmin"
        });
      }
    );

  } catch (err) {
    console.log("CALLAD ERROR:", err);

    return api.sendMessage(
      "❌ Failed to send report.",
      event.threadID,
      event.messageID
    );
  }
};
