const fs = require("fs-extra");
const request = require("request");
const path = require("path");

module.exports.config = {
  name: "help",
  aliases: ["commands", "menu"],
  usePrefix: true,
  version: "2.2.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Shows all commands with details",
  commandCategory: "system",
  usages: "[command name/page number]",
  cooldowns: 5,
  envConfig: {
    autoUnsend: true,
    delayUnsend: 20
  }
};

module.exports.languages = {
  en: {
    helpList:
      "[ There are %1 commands. Use: \"%2help commandName\" to view more. ]",
    user: "User",
    adminGroup: "Admin Group",
    adminBot: "Admin Bot"
  }
};

const helpImages = [
  "https://i.imgur.com/cwd64Av.jpeg",
  "https://i.imgur.com/hPtliXo.jpeg",
  "https://i.imgur.com/L7txp4M.jpeg",
  "https://i.imgur.com/5dG8PS5.jpeg"
];

function getPrefix(threadID) {
  const threadSetting =
    global.data.threadData.get(parseInt(threadID)) || {};

  return (
    threadSetting.PREFIX ||
    global.config.PREFIX ||
    "/"
  );
}

function getBotName() {
  return (
    global.config.BOTNAME ||
    global.config.botName ||
    "MESSENGER CHAT BOT"
  );
}

function downloadImage(callback) {
  const randomUrl =
    helpImages[Math.floor(Math.random() * helpImages.length)];

  const cacheDir = path.join(__dirname, "cache");

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const filePath = path.join(
    cacheDir,
    "help_random.jpg"
  );

  request(randomUrl)
    .pipe(fs.createWriteStream(filePath))
    .on("close", () => callback(filePath));
}

function sendMessage(api, event, text) {
  const filePath = path.join(
    __dirname,
    "cache",
    "help_random.jpg"
  );

  downloadImage(file => {
    api.sendMessage(
      {
        body: text,
        attachment: fs.createReadStream(file)
      },
      event.threadID,
      () => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      },
      event.messageID
    );
  });
}

function getAliasList(command) {
  const aliases =
    typeof global.client.getAliases === "function"
      ? global.client.getAliases(command.config.name)
      : Array.isArray(command.config.aliases)
        ? command.config.aliases.map(alias => String(alias).toLowerCase())
        : [];

  return aliases.length
    ? aliases.join(", ")
    : "None";
}

function getCommandInfo(command, prefix, botName) {
  return `🔰 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗜𝗻𝗳𝗼 🔰

🔖 𝗡𝗮𝗺𝗲: ${command.config.name}
🔁 𝗔𝗹𝗶𝗮𝘀: ${getAliasList(command)}
📄 𝗨𝘀𝗮𝗴𝗲: ${command.config.usages || "Not Provided"}
📜 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: ${command.config.description || "Not Provided"}
🔑 𝗣𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻: ${command.config.hasPermssion ?? 0}
👨‍💻 𝗖𝗿𝗲𝗱𝗶𝘁: ${command.config.credits || "Unknown"}
📂 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: ${command.config.commandCategory || "Unknown"}
⏳ 𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻: ${command.config.cooldowns || 0}s

⚙️ 𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}
🤖 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲: ${botName}
🌸 𝗢𝘄𝗻𝗲𝗿: SHAHADAT SAHU`;
}

module.exports.run = function ({
  api,
  event,
  args
}) {
  const { commands } = global.client;
  const {
    threadID,
    messageID
  } = event;

  const prefix = getPrefix(threadID);
  const botName = getBotName();

  const query = args[0] ? String(args[0]).trim() : "";

  const queryName = query
    ? typeof global.client.resolveCommandName === "function"
      ? global.client.resolveCommandName(query)
      : commands.has(query.toLowerCase())
        ? query.toLowerCase()
        : null
    : null;

  if (queryName && commands.has(queryName)) {
    const command = commands.get(queryName);

    const detailText = getCommandInfo(
      command,
      prefix,
      botName
    );

    sendMessage(
      api,
      {
        threadID,
        messageID
      },
      detailText
    );

    return;
  }

  const arrayInfo = Array.from(commands.keys())
    .filter(
      cmdName =>
        cmdName &&
        cmdName.trim() !== ""
    )
    .sort();

  const page = Math.max(
    parseInt(args[0]) || 1,
    1
  );

  const notFoundNote =
    query && !/^\d+$/.test(query)
      ? `❔ "${query}" — ei name e kono command nei.\n\n`
      : "";

  const numberOfOnePage = 20;

  const totalPages = Math.max(
    Math.ceil(
      arrayInfo.length /
      numberOfOnePage
    ),
    1
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const start =
    numberOfOnePage *
    (safePage - 1);

  const helpView = arrayInfo.slice(
    start,
    start + numberOfOnePage
  );

  const msg = helpView
    .map(cmdName => `┃ ✪ ${cmdName}`)
    .join("\n");

  const text = `${notFoundNote}╭━━━━━━━━━━━━━━━━╮
┃ 📜 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐈𝐒𝐓 📜
┣━━━━━━━━━━━━━━━━┫
┃ 📄 Page: ${safePage}/${totalPages}
┃ 🧮 Total: ${arrayInfo.length}
┣━━━━━━━━━━━━━━━━┫
${msg}
┣━━━━━━━━━━━━━━━━┫
┃ ⚙ Prefix: ${prefix}
┃ 🤖 Bot Name:
┃ ${botName}
┃ 🔰 Owner:
┃ 𝐒𝐇𝐀𝐇𝐀𝐃𝐀𝐓 𝐒𝐀𝐇𝐔
╰━━━━━━━━━━━━━━━━╯`;

  sendMessage(
    api,
    {
      threadID,
      messageID
    },
    text
  );
};
