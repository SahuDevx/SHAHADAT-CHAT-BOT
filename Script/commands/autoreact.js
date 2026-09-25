module.exports.config = {
 name: "autoreact",
 version: "1.3.0",
 hasPermission: 0,
 credits: "SHAHADAT SAHU",
 description: "Bot React",
 commandCategory: "No Prefix",
 cooldowns: 0,
};

module.exports.handleEvent = async ({ api, event }) => {
 const threadData = global.data.threadData.get(event.threadID) || {};
 if (threadData["🥰"] !== true) return;

 const emojis = [
 "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇",
 "🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚",
 "😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🤩",
 "🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣",
 "😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬",
 "🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗",
 "🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑",
 "😶","🙄","😬","😮","😯","😲","😴","🤤","😪","😵",
 "🤐","🥴","🤢","🤮","🤧","😷","🤠","🥸","😈","👿",
 "👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖",

 "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","🩷",
 "🩵","🩶","💔","❤️‍🔥","❤️‍🩹","💕","💞","💓","💗","💖",
 "💘","💝","💟","❣️","💯","💫","✨","⭐","🌟","🔥",
 "💥","⚡","🌈","☀️","🌙","🌸","🌺","🌻","🌹","🌷",
 "🌼","💐","🍀","🌿","🍁","🍂","🍃","🌱","🌴","🌵",

 "👍","👎","👌","✌️","🤞","🤟","🤘","🤙","👋","👏",
 "🙌","👐","🤲","🙏","💪","🫶","🫰","🤌","✍️","🤳",
 "💅","👀","👄","🫦","👂","👃","🧠","❤️‍🔥","💋","💏",

 "🎉","🎊","🎈","🎁","🎂","🎀","🎵","🎶","🎸","🎹",
 "🥁","🎧","🎤","🎬","🎮","🏆","🥇","🥈","🥉","⚽",
 "🏀","🏈","⚾","🎾","🏐","🏏","🏓","🥊","🏋️","🚀",

 "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯",
 "🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧",
 "🐦","🦋","🐝","🐞","🦄","🐴","🐢","🐍","🦎","🐊",
 "🐳","🐬","🐟","🐠","🦈","🐙","🦀","🦐","🦑","🐚"
 ];

 const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

 api.setMessageReaction(randomEmoji, event.messageID, err => {
  if (err) console.error("Error sending reaction:", err);
 }, true);
};

module.exports.run = async ({ api, event, Threads }) => {
 const { threadID, messageID, body } = event;
 const threadData = await Threads.getData(threadID);

 if (typeof threadData.data["🥰"] === "undefined")
  threadData.data["🥰"] = false;

 const action = body.trim().split(/\s+/)[1]?.toLowerCase();

 if (action === "on")
  threadData.data["🥰"] = true;
 else if (action === "off")
  threadData.data["🥰"] = false;
 else
  threadData.data["🥰"] = !threadData.data["🥰"];

 await Threads.setData(threadID, { data: threadData.data });
 global.data.threadData.set(threadID, threadData.data);

 api.sendMessage(
  `Auto-react is now ${threadData.data["🥰"] ? "ON 🟢" : "OFF 🔴"}`,
  threadID,
  messageID
 );
};
