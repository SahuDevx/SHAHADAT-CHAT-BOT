module.exports.config = {
  name: "leavenoti",
  eventType: ["log:unsubscribe"],
  version: "2.0.0",
  credits: "SHAHADAT SAHU", //Credit change koro na
  description: "Leave notification and antiout system",
  dependencies: {
    "fs-extra": "",
    "path": ""
  }
};

module.exports.run = async function({ api, event, Users, Threads }) {
  if (
    event.logMessageData.leftParticipantFbId ==
    api.getCurrentUserID()
  ) return;

  const {
    createReadStream,
    existsSync,
    mkdirSync,
    readdirSync
  } = global.nodemodule["fs-extra"];
//অসুবিধার জন্য দুঃখিত তবে এখানে আপনাদের ইডিট করতে হবে না😊
  //নতুন আপডেট এর পর এমন সিস্টেম করা হয়েছে,
  //বট না এটোমেটিক লোড হয়ে যায়✅

  const { join } = global.nodemodule["path"];

  const threadID = event.threadID;
  const leftID = event.logMessageData.leftParticipantFbId;

  const data =
    global.data.threadData.get(parseInt(threadID)) ||
    (await Threads.getData(threadID)).data;

  const name =
    global.data.userName.get(leftID) ||
    await Users.getNameUser(leftID);

  const botName =
    global.config.BOTNAME || "MESSENGER CHAT BOT";

  const isSelfLeave = event.author == leftID;

  const mediaExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".mp4",
    ".mov",
    ".mkv",
    ".webm"
  ];

  const getRandomMedia = (folderName) => {
    const folder = join(__dirname, "Uhas", folderName);

    if (!existsSync(folder)) {
      mkdirSync(folder, { recursive: true });
      return null;
    }

    let files = [];

    try {
      files = readdirSync(folder).filter(file =>
        mediaExtensions.includes(
          file.substring(file.lastIndexOf(".")).toLowerCase()
        )
      );
    } catch (error) {
      return null;
    }

    if (!files.length) return null;

    const randomFile =
      files[Math.floor(Math.random() * files.length)];

    return join(folder, randomFile);
  };

  if (isSelfLeave && data.antiout !== false) {
    return api.addUserToGroup(
      leftID,
      threadID,
      async (error) => {

        if (error) {
          const mediaPath = getRandomMedia("add");

          const message =
            `সরি বস, ${name} কে আবার এড করতে পারলাম না। 😔
সম্ভবত উনি বটকে ব্লক করেছে অথবা তার Privacy Settings-এর কারণে এড করা যাচ্ছে না।

◈━━꯭${botName}꯭━━◈`;

          if (mediaPath) {
            return api.sendMessage(
              {
                body: message,
                attachment: createReadStream(mediaPath)
              },
              threadID
            );
          }

          return api.sendMessage(
            message,
            threadID
          );
        }

        const mediaPath = getRandomMedia("leave");

        const message =
          `আরে ভাই! 😭

এডমিনের অনুমতি ছাড়া লিভ?
এত সাহস কই পেলি? 😂

যা, তোরে আবার গ্রুপে ঢুকায় দিলাম! 🤣

◈━━꯭${botName}꯭━━◈`;

        if (mediaPath) {
          return api.sendMessage(
            {
              body: message,
              attachment: createReadStream(mediaPath)
            },
            threadID
          );
        }

        return api.sendMessage(
          message,
          threadID
        );
      }
    );
  }

  const type = isSelfLeave
    ? `আরে ভাই! 😭
এডমিনের অনুমতি ছাড়া লিভ? এত সাহস কই পেলি? 😂
যা যা, আবার আসলে খবর আছে কিন্তু! 😤
◈━━꯭${botName}꯭━━◈`

    : `ওহো! 😳
এই গ্রুপের Admin-ও তোকে সয্য করতে পারলো না! 🤣
তাই তোমাকে লাথি মেরে গ্রুপ থেকে বের করে দেওয়া হলো! 👋😂
ভালো থাকিস, আর স্বপ্নে গ্রুপে আসিস! 🤧
◈━━꯭${botName}꯭━━◈`;

  const mediaPath = getRandomMedia(
    isSelfLeave ? "leave" : "remove"
  );

  let msg =
    typeof data.customLeave == "undefined"
      ? `👋 ${name}\n\n${type}`
      : data.customLeave;

  msg = msg
    .replace(/\{name}/g, name)
    .replace(/\{type}/g, type)
    .replace(/\{botName}/g, botName);

  if (mediaPath) {
    return api.sendMessage(
      {
        body: msg,
        attachment: createReadStream(mediaPath)
      },
      threadID
    );
  }

  return api.sendMessage(
    {
      body: msg
    },
    threadID
  );
};
