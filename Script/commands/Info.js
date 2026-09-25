module.exports.config = {
  name: "info",
  aliases: ["information", "about", "botinfo"],
  usePrefix: false,
  version: "1.0.1",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Bot information command",
  commandCategory: "For users",
  hide: true,
  usages: "info",
  cooldowns: 5
};

module.exports.run = async function ({
  api,
  event,
  args,
  Users,
  Threads
}) {
  const { threadID } = event;

  const request = global.nodemodule["request"];
  const fs = global.nodemodule["fs-extra"];
  const moment = require("moment-timezone");

  const { configPath } = global.client;

  delete require.cache[require.resolve(configPath)];

  const config = require(configPath);

  const botName =
    config.BOTNAME ||
    config.botName ||
    "Messenger Chat Bot";

  const { commands } = global.client;

  const threadSetting =
    (await Threads.getData(String(threadID))).data || {};

  const prefix =
    threadSetting.hasOwnProperty("PREFIX")
      ? threadSetting.PREFIX
      : config.PREFIX;

  const uptime = process.uptime();

  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const totalUsers =
    global.data.allUserID.length;

  const totalThreads =
    global.data.allThreadID.length;

  const msg = `╭⭓ ⪩ 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎 ⪨
│
├─ 🤖 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲 : ${botName}
├─ ☢️ 𝗣𝗿𝗲𝗳𝗶𝘅 : ${config.PREFIX}
├─ ♻️ 𝗣𝗿𝗲𝗳𝗶𝘅 𝗕𝗼𝘅 : ${prefix}
├─ 🔶 𝗠𝗼𝗱𝘂𝗹𝗲𝘀 : ${commands.size}
├─ 🔰 𝗣𝗶𝗻𝗴 : ${Date.now() - event.timestamp}ms
╰───────⭓

╭⭓ ⪩ 𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢 ⪨
│
├─ 👑 𝗡𝗮𝗺𝗲 : 𝐒𝐇𝐀𝐇𝐀𝐃𝐀𝐓 𝐒𝐀𝐇𝐔
├─ 📲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 :
│ facebook.com/100044713412032
├─ 💌 𝗠𝗲𝘀𝘀𝗲𝗻𝗴𝗲𝗿 :
│ m.me/100044713412032
├─ 📞 𝗪𝗵𝗮𝘁𝘀𝗀𝗩𝗵𝗔𝗽𝗽 :
│ wa.me/+8801882333052
╰───────⭓

╭⭓ ⪩ 𝗔𝗖𝗧𝗜𝗩𝗜𝗧𝗜𝗘𝗦 ⪨
│
├─ ⏳ 𝗔𝗰𝘁𝗶𝘃𝗲 𝗧𝗶𝗺𝗲 : ${hours}h ${minutes}m ${seconds}s
├─ 📣 𝗚𝗿𝗼𝘂𝗽𝘀 : ${totalThreads}
├─ 🧿 𝗧𝗼𝘁𝗮𝗹 𝗨𝘀𝗲𝗿𝘀 : ${totalUsers}
╰───────⭓

❤️ 𝗧𝗵𝗮𝗻𝗸𝘀 𝗳𝗼𝗿 𝘂𝘀𝗶𝗻𝗴 🌺
 😍${botName}😘`;

  const imgLinks = [
    "https://i.imgur.com/cwd64Av.jpeg",
    "https://i.imgur.com/hPtliXo.jpeg",
    "https://i.imgur.com/L7txp4M.jpeg",
    "https://i.imgur.com/5dG8PS5.jpeg"
  ];

  const imgLink =
    imgLinks[
      Math.floor(Math.random() * imgLinks.length)
    ];

  const cacheDir = __dirname + "/cache";

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, {
      recursive: true
    });
  }

  const imagePath = cacheDir + "/info.jpg";

  const callback = () => {
    api.sendMessage(
      {
        body: msg,
        attachment: fs.createReadStream(imagePath)
      },
      threadID,
      () => {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    );
  };

  return request(encodeURI(imgLink))
    .pipe(fs.createWriteStream(imagePath))
    .on("close", callback);
};
