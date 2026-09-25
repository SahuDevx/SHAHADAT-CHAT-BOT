const fs = require("fs-extra");

module.exports.config = {
  name: "onlyadmin",
  version: "3.0.0",
  hasPermssion: 2,
  credits: "SHADAHAT SAHU",
  description: "Admin only mode toggle",
  commandCategory: "Admin",
  usages: "onlyadmin [on/off]",
  cooldowns: 0
};

module.exports.run = async ({ api, event, args }) => {
  const { configPath } = global.client;

  try {
    delete require.cache[require.resolve(configPath)];
    const config = require(configPath);

    const action = (args[0] || "").toLowerCase();
    const currentStatus = !!config.adminOnly;

    if (!action) {
      return api.sendMessage(
        "⚠️ 𝗨𝘀𝗮𝗴𝗲: 𝗼𝗻𝗹𝘆𝗮𝗱𝗺𝗶𝗻 𝗼𝗻/𝗼𝗳𝗳",
        event.threadID,
        event.messageID
      );
    }

    if (action !== "on" && action !== "off") {
      return api.sendMessage(
        "⚠️ 𝗨𝘀𝗮𝗴𝗲: 𝗼𝗻𝗹𝘆𝗮𝗱𝗺𝗶𝗻 𝗼𝗻/𝗼𝗳𝗳",
        event.threadID,
        event.messageID
      );
    }

    const requestedStatus = action === "on";

    if (currentStatus === requestedStatus) {
      return api.sendMessage(
        requestedStatus
          ? "𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗠𝗼𝗱𝗲\n\n✓ 𝗔𝗹𝗿𝗲𝗮𝗱𝘆 𝗔𝗰𝘁𝗶𝘃𝗲\n𝗔𝗱𝗺𝗶𝗻 𝗺𝗼𝗱𝗲 𝗮𝗴𝗲𝗶 𝗢𝗡 𝗮𝗰𝗵𝗲."
          : "𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗠𝗼𝗱𝗲\n\n× 𝗔𝗹𝗿𝗲𝗮𝗱𝘆 𝗗𝗶𝘀𝗮𝗯𝗹𝗲𝗱\n𝗔𝗱𝗺𝗶𝗻 𝗺𝗼𝗱𝗲 𝗮𝗴𝗲𝗶 𝗢𝗙𝗙 𝗮𝗰𝗵𝗲.",
        event.threadID,
        event.messageID
      );
    }

    config.adminOnly = requestedStatus;

    fs.writeFileSync(
      configPath,
      JSON.stringify(config, null, 4)
    );

    delete require.cache[require.resolve(configPath)];

    return api.sendMessage(
      requestedStatus
        ? "🔰𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗠𝗼𝗱𝗲\n\n● 𝗦𝘁𝗮𝘁𝘂𝘀: 𝗔𝗖𝗧𝗜𝗩𝗘\n✓ 𝗔𝗰𝗰𝗲𝘀𝘀: 𝗦𝗵𝘂𝗱𝗵𝘂 𝗮𝗱𝗺𝗶𝗻 𝗱𝗲𝗿 𝗷𝗼𝗻𝗻𝗼✅"
        : "🔰𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗠𝗼𝗱𝗲\n\n● 𝗦𝘁𝗮𝘁𝘂𝘀: 𝗗𝗜𝗦𝗔𝗕𝗟𝗘𝗗\n✓ 𝗔𝗰𝗰𝗲𝘀𝘀: 𝗦𝗵𝗼𝗯𝗮𝗿 𝗷𝗼𝗻𝗻𝗼 𝗼𝗽𝗲𝗻✅",
      event.threadID,
      event.messageID
    );
  } catch (error) {
    console.error("onlyadmin error:", error);

    return api.sendMessage(
      "⚠️ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝘂𝗽𝗱𝗮𝘁𝗲 𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗠𝗼𝗱𝗲.",
      event.threadID,
      event.messageID
    );
  }
};
