module.exports.config = {
  name: "ban",
  aliases: ["unban"],
  version: "2.2.0",
  hasPermssion: 2,
  credits: "SHAHADAT SAHU",
  description: "Ban or unban a user",
  commandCategory: "Group",
  usages: `${global.config.PREFIX}ban <UID/@tag>\n${global.config.PREFIX}unban <UID/@tag>`,
  cooldowns: 5
};

module.exports.run = async function ({
  api,
  event,
  args,
  Users
}) {
  const {
    threadID,
    messageID,
    messageReply
  } = event;

  const prefix = global.config.PREFIX || "/";

  const command = (
    event.body ||
    ""
  )
    .trim()
    .split(/\s+/)[0]
    .replace(prefix, "")
    .toLowerCase();

  const canonicalName =
    typeof global.client.resolveCommandName === "function"
      ? global.client.resolveCommandName(command)
      : null;

  const isUnban =
    command === "unban" ||
    (canonicalName === "ban" && /^un/.test(command));

  const isBan =
    command === "ban" ||
    canonicalName === "ban";

  if (
    !isBan &&
    !isUnban
  ) {
    return api.sendMessage(
      `⚠️ Invalid command!\n\nUse:\n${prefix}ban <UID/@tag>\n${prefix}unban <UID/@tag>`,
      threadID,
      messageID
    );
  }

  if (!args[0] && !messageReply) {
    return api.sendMessage(
      `⚠️ Usage:\n\n${prefix}ban <UID/@tag>\n${prefix}unban <UID/@tag>`,
      threadID,
      messageID
    );
  }

  let targetID;

  if (messageReply) {
    targetID = messageReply.senderID;
  } else if (
    event.mentions &&
    Object.keys(event.mentions).length
  ) {
    targetID =
      Object.keys(event.mentions)[0];
  } else {
    targetID = args[0];
  }

  if (!targetID) {
    return api.sendMessage(
      "⚠️ Please mention, reply or provide a UID.",
      threadID,
      messageID
    );
  }

  targetID = String(targetID);

  if (!/^\d+$/.test(targetID)) {
    return api.sendMessage(
      "❌ Invalid UID.",
      threadID,
      messageID
    );
  }

  if (
    !global.data.allUserID.includes(targetID)
  ) {
    return api.sendMessage(
      `❌ User not found.\n\nUID: ${targetID}`,
      threadID,
      messageID
    );
  }

  let nameTarget;

  try {
    nameTarget =
      global.data.userName.get(targetID) ||
      await Users.getNameUser(targetID);
  } catch {
    nameTarget = "Unknown User";
  }

  if (!isUnban) {
    try {
      const result =
        await Users.getData(targetID);

      const data =
        result.data || {};

      data.banned = true;

      await Users.setData(
        targetID,
        { data }
      );

      if (
        global.data.userBanned &&
        typeof global.data.userBanned.set === "function"
      ) {
        global.data.userBanned.set(
          targetID,
          {
            reason: null,
            dateAdded:
              new Date().toLocaleString(
                "en-GB",
                {
                  timeZone: "Asia/Dhaka"
                }
              )
          }
        );
      }

      return api.sendMessage(
        `⚠️ User Banned

Name: ${nameTarget}
UID: ${targetID}

Status: Banned`,
        threadID,
        messageID
      );

    } catch (error) {
      return api.sendMessage(
        `❌ Failed to ban user.

Name: ${nameTarget}
UID: ${targetID}`,
        threadID,
        messageID
      );
    }
  }

  if (isUnban) {
    try {
      const result =
        await Users.getData(targetID);

      const data =
        result.data || {};

      if (!data.banned) {
        return api.sendMessage(
          `ℹ️ User is not banned.

Name: ${nameTarget}
UID: ${targetID}`,
          threadID,
          messageID
        );
      }

      data.banned = false;

      await Users.setData(
        targetID,
        { data }
      );

      if (
        global.data.userBanned &&
        typeof global.data.userBanned.delete === "function"
      ) {
        global.data.userBanned.delete(
          targetID
        );
      }

      return api.sendMessage(
        `✅ User Unbanned

Name: ${nameTarget}
UID: ${targetID}

Status: Active`,
        threadID,
        messageID
      );

    } catch (error) {
      return api.sendMessage(
        `❌ Failed to unban user.

Name: ${nameTarget}
UID: ${targetID}`,
        threadID,
        messageID
      );
    }
  }
};
