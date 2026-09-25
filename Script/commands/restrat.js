const fs = global.nodemodule["fs-extra"];
const path = require("path");

module.exports.config = {
  name: "restart",
  aliases: ["refresh", "rest", "reboot", "botrestart", "restartbot"],
  version: "2.0.0",
  hasPermssion: 2,
  credits: "SHAHADAT SAHU",
  description: "Restart bot",
  commandCategory: "system",
  cooldowns: 0
};

const dir = path.join(__dirname, "cache");
const file = path.join(dir, "restart.json");

const uptime = s => {
  s = Math.floor(s);
  const d = Math.floor(s / 86400);
  const h = Math.floor(s % 86400 / 3600);
  const m = Math.floor(s % 3600 / 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`]
    .filter(Boolean)
    .join(" ") || "<1m";
};

module.exports.onLoad = async ({ api }) => {
  if (!fs.existsSync(file)) return;

  try {
    const data = JSON.parse(
      await fs.readFile(file, "utf8")
    );

    await fs.remove(file);

    await new Promise(r => setTimeout(r, 2000));

    if (data.msg) {
      try {
        api.unsendMessage(data.msg);
      } catch (e) {}
    }

    api.sendMessage(
      `🟢 𝗕𝗼𝘁 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗲𝗱 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆\n\n` +
      `⏱️ 𝗣𝗿𝗲𝘃𝗶𝗼𝘂𝘀 𝗨𝗽𝘁𝗶𝗺𝗲: ${uptime(data.uptime)}\n` +
      `🤖 𝗕𝗼𝘁 𝗢𝗻𝗹𝘆 𝗕𝗮𝗰𝗸! 💚`,
      data.thread
    );
  } catch (e) {}
};

module.exports.run = async ({
  api,
  event
}) => {
  await fs.ensureDir(dir);

  const frames = [
    "[█░░░░░░░░░] 10%",
    "[███░░░░░░░] 30%",
    "[█████░░░░░] 50%",
    "[███████░░░] 70%",
    "[█████████░] 90%",
    "[██████████] 100%"
  ];

  let msg;

  try {
    msg = await new Promise((resolve, reject) => {
      api.sendMessage(
        `🔄 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴 𝗕𝗼𝘁...\n\n${frames[0]}`,
        event.threadID,
        (e, i) => e ? reject(e) : resolve(i)
      );
    });

    for (let i = 1; i < frames.length; i++) {
      await new Promise(r => setTimeout(r, 500));

      try {
        await api.editMessage(
          `🔄 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴 𝗕𝗼𝘁...\n\n${frames[i]}`,
          msg.messageID
        );
      } catch (e) {}
    }

    await fs.writeFile(
      file,
      JSON.stringify({
        thread: event.threadID,
        msg: msg.messageID,
        uptime: process.uptime()
      })
    );

    setTimeout(() => process.exit(2), 700);

  } catch (e) {
    api.sendMessage(
      "❌ Restart failed.",
      event.threadID
    );
  }
};
