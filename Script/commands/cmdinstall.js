const axios = require("axios");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

module.exports.config = {
  name: "install",
  aliases: ["ins", "cmdinstall"],
  version: "3.1.0",
  hasPermssion: 2,
  credits: "SHAHADAT SAHU",
  description: "Create/Update/Load modules",
  commandCategory: "System",
  usages: "[file.js code/link] / [reply to code/link] / [+ code]",
  cooldowns: 0
};

const loadModule = name => {
  try {
    const file = path.join(__dirname, name + ".js");

    delete require.cache[require.resolve(file)];

    const data = require(file);

    if (
      !data ||
      !data.config ||
      !data.config.name ||
      typeof data.run !== "function"
    ) {
      throw new Error("Invalid module");
    }

    if (typeof global.client.registerCommand === "function") {
      global.client.unregisterCommand(data.config.name);
      const registered = global.client.registerCommand(data, name);
      if (!registered.ok) throw new Error(registered.reason);
      for (const skipped of registered.skipped) {
        console.warn(
          `[INSTALL] ${registered.name}: alias "${skipped.alias}" skipped (${skipped.reason})`
        );
      }
      return true;
    }

    global.client.commands.delete(data.config.name);

    if (Array.isArray(global.client.eventRegistered)) {
      global.client.eventRegistered =
        global.client.eventRegistered.filter(
          e => e !== data.config.name
        );
    }

    global.client.commands.set(
      data.config.name,
      data
    );

    return true;
  } catch (error) {
    console.error(
      `[INSTALL] ${name}: ${error.message}`
    );
    return false;
  }
};

const unloadModule = name => {
  try {
    if (typeof global.client.unregisterCommand === "function") {
      global.client.unregisterCommand(name);
    } else {
      global.client.commands.delete(name);

      if (Array.isArray(global.client.eventRegistered)) {
        global.client.eventRegistered =
          global.client.eventRegistered.filter(
            e => e !== name
          );
      }
    }

    const file = path.join(
      __dirname,
      name + ".js"
    );

    try {
      delete require.cache[
        require.resolve(file)
      ];
    } catch {}

    return true;
  } catch {
    return false;
  }
};

const getCommandName = code => {
  const match = code.match(
    /module\.exports\.config\s*=\s*\{[\s\S]*?\bname\s*:\s*["'`]([^"'`]+)["'`]/m
  );

  return match && match[1]
    ? match[1].trim()
    : null;
};

const getCodeFromURL = async url => {
  try {
    const response = await axios.get(url, {
      responseType: "text",
      timeout: 15000
    });

    return response.data;
  } catch {
    return null;
  }
};

module.exports.run = async ({
  api,
  event,
  args
}) => {
  const {
    threadID,
    messageID,
    messageReply
  } = event;

  let code = "";
  let fileName = "";
  let replyInstall = false;

  const input =
    args.join(" ").trim();

  if (!input) {
    if (
      !messageReply ||
      !messageReply.body ||
      !messageReply.body.trim()
    ) {
      return api.sendMessage(
        "⚠️ Usage: install\n\nReply to a command code or link.",
        threadID,
        messageID
      );
    }

    const reply =
      messageReply.body.trim();

    if (
      /^(https?|ftp):\/\//i.test(reply)
    ) {
      code = await getCodeFromURL(reply);

      if (!code) {
        return api.sendMessage(
          "❌ Failed to download code!",
          threadID,
          messageID
        );
      }
    } else {
      code = reply;
    }

    replyInstall = true;

  } else {
    let direct = input;

    if (direct.startsWith("+")) {
      code = direct.slice(1).trim();

      if (!code) {
        return api.sendMessage(
          "⚠️ Please provide JavaScript code!",
          threadID,
          messageID
        );
      }

    } else {
      const space =
        direct.indexOf(" ");

      if (space === -1) {
        return api.sendMessage(
          "⚠️ Usage: install file.js code/link",
          threadID,
          messageID
        );
      }

      const first =
        direct.slice(0, space).trim();

      let content =
        direct.slice(space + 1).trim();

      if (!first.endsWith(".js")) {
        return api.sendMessage(
          "⚠️ Only .js files are allowed!",
          threadID,
          messageID
        );
      }

      fileName =
        path.basename(first);

      if (content.startsWith("+")) {
        content =
          content.slice(1).trim();
      }

      if (!content) {
        return api.sendMessage(
          "⚠️ Please provide JavaScript code or link!",
          threadID,
          messageID
        );
      }

      if (
        /^(https?|ftp):\/\//i.test(content)
      ) {
        code =
          await getCodeFromURL(content);

        if (!code) {
          return api.sendMessage(
            "❌ Failed to download code!",
            threadID,
            messageID
          );
        }
      } else {
        code = content;
      }
    }
  }

  if (
    typeof code !== "string" ||
    !code.trim()
  ) {
    return api.sendMessage(
      "❌ Invalid JavaScript code!",
      threadID,
      messageID
    );
  }

  code = code.trim();

  try {
    new vm.Script(code);
  } catch (error) {
    return api.sendMessage(
      "❌ Syntax Error:\n" +
      error.message,
      threadID,
      messageID
    );
  }

  const commandName =
    getCommandName(code);

  if (!commandName) {
    return api.sendMessage(
      "❌ Invalid command!\n\n" +
      "module.exports.config.name not found.",
      threadID,
      messageID
    );
  }

  if (
    replyInstall ||
    !fileName
  ) {
    fileName =
      commandName + ".js";
  }

  fileName =
    path.basename(fileName);

  if (!fileName.endsWith(".js")) {
    fileName += ".js";
  }

  const filePath =
    path.join(
      __dirname,
      fileName
    );

  const isUpdate =
    fs.existsSync(filePath);

  if (isUpdate) {
    unloadModule(commandName);

    try {
      delete require.cache[
        require.resolve(filePath)
      ];
    } catch {}
  }

  try {
    fs.writeFileSync(
      filePath,
      code,
      "utf8"
    );
  } catch (error) {
    return api.sendMessage(
      "❌ Failed to save command!\n" +
      error.message,
      threadID,
      messageID
    );
  }

  const loaded =
    loadModule(commandName);

  if (!loaded) {
    return api.sendMessage(
      "⚠️ File created but failed to load!",
      threadID,
      messageID
    );
  }

  if (isUpdate) {
    return api.sendMessage(
      "✅ Successfully Updated + Loaded\n\n" +
      "📁 File: " +
      fileName +
      "\n" +
      "🚀 Status: Loaded",
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    "✅ Successfully Created + Loaded\n\n" +
    "📁 File: " +
    fileName +
    "\n" +
    "🚀 Status: OK",
    threadID,
    messageID
  );
};
