module.exports.config = {
  name: "console",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "SHAHADAT SAHU",
  description: "Toggle console logging",
  commandCategory: "Admin-bot system",
  usages: "console [on/off]",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, Threads }) {
  const { threadID, messageID } = event;

  const threadData = await Threads.getData(threadID);
  const data = (threadData && threadData.data) || {};
  const args = event.body.trim().split(/\s+/).slice(1);
  const option = args[0]?.toLowerCase();

  if (option === "on") {
    data.console = true;
  } else if (option === "off") {
    data.console = false;
  } else {
    return api.sendMessage(
      "Bebohar korben: console on / console off",
      threadID,
      messageID
    );
  }

  await Threads.setData(threadID, { data });
  global.data.threadData.set(String(threadID), data);

  return api.sendMessage(
    `🖥️ Console ${option.toUpperCase()} ✅`,
    threadID,
    messageID
  );
};
