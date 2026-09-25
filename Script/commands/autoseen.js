const fs = require("fs-extra");
const path = __dirname + "/cache/autoseen.txt";

if (!fs.existsSync(path)) fs.writeFileSync(path, "true");

module.exports.config = {
  name: "autoseen",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "SHAHADAT SAHU",
  description: "Auto seen",
  commandCategory: "tools",
  usages: "on/off",
  cooldowns: 0
};

module.exports.handleEvent = async ({ api }) => {
  if (fs.readFileSync(path, "utf8") === "true")
    api.markAsReadAll(() => {});
};

module.exports.run = async ({ api, event, args }) => {
  if (!["on", "off"].includes(args[0]))
    return api.sendMessage(
      `Use ${global.config.PREFIX}autoseen on/off`,
      event.threadID,
      event.messageID
    );

  fs.writeFileSync(path, args[0] === "on" ? "true" : "false");

  api.sendMessage(
    `✅Autoseen ${args[0]} successfully.`,
    event.threadID,
    event.messageID
  );
};
