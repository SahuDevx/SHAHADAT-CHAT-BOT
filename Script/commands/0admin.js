const { writeFileSync } = require("fs-extra");

module.exports.config = {
  name: "0admin",
  aliases: ["adminmanage", "adminsystem", "adminaccess", "admincontrol", "adm", "aadmin", "setadmin"],
  version: "2.0.0",
  hasPermssion: 2,
  credits: "SHAHADAT SAHU",
  description: "Admin Management System",
  commandCategory: "Admin",
  usages: "[list | add | remove] [uid | @mention | reply]",
  cooldowns: 0,
  usePrefix: true,
  dependencies: {
    "fs-extra": ""
  }
};

module.exports.languages = {
  en: {
    usage: "⚠️ 𝗨𝘀𝗮𝗴𝗲: /0admin add | remove | list",
    listAdmin: "» 𝗔𝗱𝗺𝗶𝗻 𝗟𝗶𝘀𝘁\n\n%1",
    addedAdmin: "» 𝗔𝗱𝗺𝗶𝗻 𝗔𝗱𝗱𝗲𝗱\n\n● 𝗔𝗱𝗱𝗲𝗱: %1 𝗮𝗱𝗺𝗶𝗻\n\n%2",
    removedAdmin: "» 𝗔𝗱𝗺𝗶𝗻 𝗥𝗲𝗺𝗼𝘃𝗲𝗱\n\n● 𝗥𝗲𝗺𝗼𝘃𝗲𝗱: %1 𝗮𝗱𝗺𝗶𝗻\n\n%2"
  }
};

module.exports.run = async function ({
  api,
  event,
  args,
  Users,
  permssion,
  getText
}) {
  const {
    threadID,
    messageID,
    mentions
  } = event;

  if (permssion < 2) return;

  const content = args.slice(1);
  const mentionIDs = Object.keys(mentions || {});
  const { configPath } = global.client;

  delete require.cache[require.resolve(configPath)];

  const config = require(configPath);

  if (!Array.isArray(config.ADMINBOT)) {
    config.ADMINBOT = [];
  }

  const ADMINBOT = config.ADMINBOT;

  const getUIDs = () => {
    if (
      event.type === "message_reply" &&
      event.messageReply &&
      event.messageReply.senderID
    ) {
      return [event.messageReply.senderID];
    }

    if (mentionIDs.length) {
      return mentionIDs.filter(id => id);
    }

    if (
      content[0] &&
      /^\d+$/.test(content[0])
    ) {
      return [content[0]];
    }

    return [];
  };

  if (!args[0]) {
    return api.sendMessage(
      getText("usage"),
      threadID,
      messageID
    );
  }

  switch ((args[0] || "").toLowerCase()) {
    case "add":
    case "a":
    case "ad": {
      const ids = getUIDs();
      const added = [];

      for (const id of ids) {
        if (!id || !/^\d+$/.test(id)) continue;
        if (ADMINBOT.includes(id)) continue;

        try {
          const data = await Users.getData(id);

          if (!data || !data.name) continue;

          ADMINBOT.push(id);

          added.push(
            `• 𝗔𝗱𝗺𝗶𝗻: ${data.name} (${id})`
          );
        } catch (_) {}
      }

      if (!added.length) return;

      writeFileSync(
        configPath,
        JSON.stringify(config, null, 4)
      );

      return api.sendMessage(
        getText(
          "addedAdmin",
          added.length,
          added.join("\n")
        ),
        threadID,
        messageID
      );
    }

    case "remove":
    case "r":
    case "rmv": {
      const ids = getUIDs();
      const removed = [];

      for (const id of ids) {
        const index = ADMINBOT.indexOf(id);

        if (index === -1) continue;

        try {
          const data = await Users.getData(id);

          ADMINBOT.splice(index, 1);

          if (data && data.name) {
            removed.push(
              `• 𝗔𝗱𝗺𝗶𝗻: ${data.name} (${id})`
            );
          }
        } catch (_) {
          ADMINBOT.splice(index, 1);
        }
      }

      if (!removed.length) return;

      writeFileSync(
        configPath,
        JSON.stringify(config, null, 4)
      );

      return api.sendMessage(
        getText(
          "removedAdmin",
          removed.length,
          removed.join("\n")
        ),
        threadID,
        messageID
      );
    }

    case "list":
    case "l":
    case "lis": {
      const list = [];

      for (const id of ADMINBOT) {
        if (!id || !/^\d+$/.test(id)) continue;

        try {
          const data = await Users.getData(id);

          if (
            !data ||
            !data.name ||
            data.name === "undefined"
          ) {
            continue;
          }

          list.push(
            `• 𝗔𝗱𝗺𝗶𝗻: ${data.name}\nhttps://facebook.com/${id}`
          );
        } catch (_) {}
      }

      return api.sendMessage(
        list.length
          ? getText("listAdmin", list.join("\n\n"))
          : "» 𝗔𝗱𝗺𝗶𝗻 𝗟𝗶𝘀𝘁\n\n● 𝗡𝗼 𝗮𝗱𝗺𝗶𝗻 𝗳𝗼𝘂𝗻𝗱.",
        threadID,
        messageID
      );
    }

    default:
      return api.sendMessage(
        getText("usage"),
        threadID,
        messageID
      );
  }
};
