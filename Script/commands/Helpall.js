const fs = require("fs-extra");
const request = require("request");

module.exports.config = {
  name: "helpall",
  aliases: ["allcmd", "allcommands"],
  version: "1.0.1",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Displays all available commands in one page",
  commandCategory: "system",
  usages: "[No args]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { commands } = global.client;
  const { threadID, messageID } = event;

  const allCommands = [];

  for (const [name] of commands) {
    if (name && name.trim() !== "") {
      allCommands.push(name.trim());
    }
  }

  allCommands.sort();

  const botName =
    global.config?.BOTNAME ||
    global.config?.botName ||
    "MESSENGER CHAT BOT";

  const finalText = `╔═❖ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐈𝐒𝐓 ❖═╗
${allCommands.map(cmd => `║ ➔ ${cmd}`).join("\n")}
╠══🔰 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎 🔰══╣
║ 🤖 𝐁𝐨𝐭: ${botName}
║ 👑 𝐎𝐰𝐧𝐞𝐫:
║ 𝐒𝐇𝐀𝐇𝐀𝐃𝐀𝐓 𝐒𝐀𝐇𝐔
║ 📦 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬: ${allCommands.length}
╚═══════════════╝`;

  const backgrounds = [
    "https://i.imgur.com/cwd64Av.jpeg",
    "https://i.imgur.com/hPtliXo.jpeg",
    "https://i.imgur.com/L7txp4M.jpeg",
    "https://i.imgur.com/5dG8PS5.jpeg"
  ];

  const selectedBg =
    backgrounds[Math.floor(Math.random() * backgrounds.length)];

  const imgPath = __dirname + "/cache/helpallbg.jpg";

  const callback = () => {
    api.sendMessage(
      {
        body: finalText,
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => {
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      },
      messageID
    );
  };

  request(encodeURI(selectedBg))
    .pipe(fs.createWriteStream(imgPath))
    .on("close", callback);
};
