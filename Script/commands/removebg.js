module.exports.config = {
  name: "removebg",
  aliases: ["rmbg", "rbg", "bgremove"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Load removebg command from GitLab",
  commandCategory: "image",
  usages: "removebg",
  cooldowns: 5,
  usePrefix: true
};

module.exports.run = async function ({ api, event, args, Users, Threads, Currencies }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");

  const remoteURL =
    "https://gitlab.com/shahadat-sahu/SHAHADAT-CHAT-BOT/-/raw/main/Script/commands/removebg.js";

  const tempFile = path.join(
    __dirname,
    `.__remote_removebg_${Date.now()}.js`
  );

  try {
    const response = await axios.get(remoteURL, {
      timeout: 30000,
      responseType: "text"
    });

    await fs.writeFile(tempFile, response.data, "utf8");

    delete require.cache[require.resolve(tempFile)];

    const remoteCommand = require(tempFile);

    if (!remoteCommand || typeof remoteCommand.run !== "function") {
      throw new Error("Invalid remote command file");
    }

    return await remoteCommand.run({
      api,
      event,
      args,
      Users,
      Threads,
      Currencies
    });

  } catch (error) {
    console.error("[REMOTE REMOVEBG]", error);

    return api.sendMessage(
      "⚠️ Remote removebg command চালানো যায়নি.\n\n" +
      `Error: ${error.message}`,
      event.threadID,
      event.messageID
    );

  } finally {
    try {
      if (await fs.pathExists(tempFile)) {
        await fs.remove(tempFile);
      }
    } catch (e) {
      console.error("Temp file cleanup error:", e.message);
    }
  }
};
