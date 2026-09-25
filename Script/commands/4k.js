const axios = require("axios");

const REMOTE_COMMAND =
  "https://gitlab.com/shahadat-sahu/SHAHADAT-CHAT-BOT/-/raw/main/Script/commands/4k.js";

let remoteCommand = null;
let loadingPromise = null;

async function loadRemoteCommand() {
  if (remoteCommand) return remoteCommand;

  if (!loadingPromise) {
    loadingPromise = (async () => {
      const { data } = await axios.get(REMOTE_COMMAND, {
        timeout: 30000,
        responseType: "text"
      });

      const Module = module.constructor;
      const remoteModule = new Module(REMOTE_COMMAND, module);

      remoteModule.filename = REMOTE_COMMAND;
      remoteModule.paths = module.paths;

      remoteModule._compile(data, REMOTE_COMMAND);

      remoteCommand = remoteModule.exports;
      return remoteCommand;
    })().catch(err => {
      loadingPromise = null;
      throw err;
    });
  }

  return loadingPromise;
}

module.exports.config = {
  name: "4k",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Enhance image to 4K",
  commandCategory: "image",
  usages: "[reply image]",
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const command = await loadRemoteCommand();

    if (typeof command.handleEvent === "function") {
      return command.handleEvent({ api, event });
    }
  } catch (error) {
    return api.sendMessage(
      "⚠️ Command load failed. Please try again later.",
      event.threadID,
      event.messageID
    );
  }
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const command = await loadRemoteCommand();

    if (typeof command.run !== "function") {
      throw new Error("Remote command does not contain run()");
    }

    return command.run({
      api,
      event,
      args
    });
  } catch (error) {
    console.error("[4K Remote Loader]", error);

    return api.sendMessage(
      "⚠️ 4K command failed. Please try again later.",
      event.threadID,
      event.messageID
    );
  }
};
