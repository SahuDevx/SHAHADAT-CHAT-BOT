const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "code",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "SHAHADAT SAHU",
  description: "Read command source code",
  commandCategory: "System",
  usages: "[list/list all/command]",
  cooldowns: 0,
  usePrefix: true
};

function getAllFiles(dir) {
  let results = [];

  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);

    try {
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        results = results.concat(getAllFiles(filePath));
      } else if (file.endsWith(".js")) {
        results.push(filePath);
      }
    } catch {}
  }

  return results;
}

function findCommandFile(input) {
  const search = input
    .replace(/\.js$/i, "")
    .toLowerCase();

  const files = getAllFiles(__dirname);

  for (const filePath of files) {
    const fileName = path
      .basename(filePath, ".js")
      .toLowerCase();

    if (fileName === search) {
      return filePath;
    }
  }

  const commands = global.client?.commands;

  if (commands) {
    for (const [name, command] of commands) {
      const commandName =
        String(name).toLowerCase();

      const aliases = Array.isArray(
        command.config?.aliases
      )
        ? command.config.aliases.map(String)
        : [];

      if (
        commandName === search ||
        aliases.some(
          alias =>
            alias.toLowerCase() === search
        )
      ) {
        const loadedFile =
          Object.values(require.cache).find(
            item =>
              item &&
              item.exports === command
          );

        if (loadedFile?.filename) {
          return loadedFile.filename;
        }
      }
    }
  }

  return null;
}

function sendCode(api, event, filePath) {
  if (
    !filePath ||
    !fs.existsSync(filePath)
  ) {
    return api.sendMessage(
      "❌ Command file not found.",
      event.threadID,
      event.messageID
    );
  }

  const code =
    fs.readFileSync(
      filePath,
      "utf8"
    );

  if (code.length <= 12000) {
    return api.sendMessage(
      code,
      event.threadID,
      event.messageID
    );
  }

  const cacheDir =
    path.join(__dirname, "cache");

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, {
      recursive: true
    });
  }

  const fileName =
    path.basename(filePath);

  const temp =
    path.join(
      cacheDir,
      fileName.replace(
        /\.js$/i,
        ".txt"
      )
    );

  fs.writeFileSync(
    temp,
    code,
    "utf8"
  );

  return api.sendMessage(
    {
      attachment:
        fs.createReadStream(temp)
    },
    event.threadID,
    () => {
      if (fs.existsSync(temp)) {
        fs.unlinkSync(temp);
      }
    },
    event.messageID
  );
}

module.exports.run = async function ({
  api,
  event,
  args
}) {
  const {
    threadID,
    messageID,
    senderID
  } = event;

  if (!args[0]) {
    return api.sendMessage(
      "⚠️ Use /code list or /code commandName",
      threadID,
      messageID
    );
  }

  const input =
    args[0].toLowerCase();

  if (input !== "list") {
    const filePath =
      findCommandFile(args[0]);

    return sendCode(
      api,
      event,
      filePath
    );
  }

  const all =
    args[1]?.toLowerCase() === "all";

  const files = all
    ? getAllFiles(__dirname)
    : fs
        .readdirSync(__dirname)
        .filter(file =>
          file.endsWith(".js")
        )
        .map(file =>
          path.join(__dirname, file)
        );

  if (!files.length) {
    return api.sendMessage(
      "📂 No command files found.",
      threadID,
      messageID
    );
  }

  let msg =
`📂 ${all ? "Full " : ""}Command List

`;

  files.forEach((file, index) => {
    msg +=
      `${index + 1}. 📄 ${all
        ? path.relative(__dirname, file)
        : path.basename(file)}\n`;
  });

  msg +=
`\n━━━━━━━━━━━━━━━━━━
↩️ Reply with the number`;

  api.sendMessage(
    msg,
    threadID,
    (err, info) => {
      if (err || !info) return;

      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        type: "codeList",
        files
      });
    },
    messageID
  );
};

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {
  if (
    String(event.senderID) !==
    String(handleReply.author)
  ) {
    return;
  }

  const number =
    parseInt(
      (event.body || "").trim()
    );

  if (
    isNaN(number) ||
    number < 1 ||
    number > handleReply.files.length
  ) {
    return api.sendMessage(
      `❌ Invalid number.

Choose 1-${handleReply.files.length}.`,
      event.threadID,
      event.messageID
    );
  }

  const filePath =
    handleReply.files[number - 1];

  return sendCode(
    api,
    event,
    filePath
  );
};
