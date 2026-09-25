module.exports.config = {
  name: "rankup",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "SHAHADAT SAHU",
  description: "Automatic rankup banner and notification",
  commandCategory: "system",
  dependencies: {
    "fs-extra": "",
    "axios": ""
  },
  cooldowns: 2
};

const FACEBOOK_ACCESS_TOKEN =
  "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports.handleEvent = async function ({
  api,
  event,
  Currencies,
  Users
}) {
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const {
    createCanvas,
    loadImage
  } = require("canvas");

  const threadID = String(event.threadID);
  const senderID = String(event.senderID);

  const thread =
    global.data.threadData.get(threadID) || {};

  if (thread.rankup === false) return;

  let data;

  try {
    data = await Currencies.getData(senderID);
  } catch (e) {
    return;
  }

  let exp = Number(data?.exp) || 0;
  const deltaNext = 3;

  const oldLevel = Math.floor(
    Math.sqrt(
      1 + (4 * exp / deltaNext) + 1
    ) / 2
  );

  exp++;

  const newLevel = Math.floor(
    Math.sqrt(
      1 + (4 * exp / deltaNext) + 1
    ) / 2
  );

  try {
    await Currencies.setData(
      senderID,
      { exp }
    );
  } catch (e) {
    return;
  }

  if (
    newLevel <= oldLevel ||
    newLevel === 1
  ) return;

  let name =
    global.data.userName.get(senderID);

  if (!name) {
    try {
      name =
        await Users.getNameUser(senderID);
    } catch (e) {
      name = "বন্ধু";
    }
  }

  const rankupMessages = [
    `🎉 আরে বাহ! কেল্লাফতে! 😂

👤 {name}
📈 তোমার Rank এখন Level {level}!

এত মেসেজ করছো কেন ভাই? 🐸
Messenger কি বাসা থেকে Wi-Fi ফ্রি দিছে নাকি? 🤣

যাই হোক, অভিনন্দন! 🥳
আরেকটু spam করো, সামনে আরও Level আছে! 🚀`,

    `🎉 অভিনন্দন {name}! 😂

তুমি Level {level}-এ উঠে গেছো!

এত মেসেজ করার পুরস্কার পেলেও,
বাস্তব জীবনে এখনো কোনো Achievement আনলক হয়নি! 🐸🤣

চালিয়ে যাও বস,
Bot-এর চোখে তুমি এখন VIP! 😎🔥`,

    `🚨 Breaking News! 🚨😂

👤 {name} আবার Level Up করেছে!
📈 নতুন Level: {level}

এত মেসেজ করছো দেখে
Messenger-ও ভাবতেছে,
"এই মানুষটা কি আর ঘুমায় না?" 🐸🤣

যাই হোক, অভিনন্দন! 🎉
আরেকটু চেষ্টা করো, পরের Level-ও তোমার! 🚀`
  ];

  let message =
    rankupMessages[
      Math.floor(
        Math.random() *
        rankupMessages.length
      )
    ]
      .replace(/\{name}/g, name)
      .replace(/\{level}/g, newLevel);

  const output =
    __dirname +
    `/cache/rankup_${senderID}_${Date.now()}.png`;

  try {
    let avatar = null;

    // Facebook Profile Picture
    try {
      const response = await axios.get(
        `https://graph.facebook.com/${senderID}/picture`,
        {
          params: {
            type: "large",
            access_token:
              FACEBOOK_ACCESS_TOKEN
          },
          responseType: "arraybuffer",
          timeout: 20000,
          maxRedirects: 5,
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        }
      );

      if (
        response.data &&
        Buffer.isBuffer(response.data)
      ) {
        avatar = await loadImage(
          Buffer.from(response.data)
        );
      }
    } catch (e) {
      console.log(
        "[RANKUP] Facebook PP failed:",
        e.message
      );
    }

    // FCA Profile Picture Fallback
    if (!avatar) {
      try {
        const info =
          await api.getUserInfo([
            senderID
          ]);

        const thumb =
          info?.[senderID]?.thumbSrc;

        if (thumb) {
          const response =
            await axios.get(
              thumb,
              {
                responseType:
                  "arraybuffer",
                timeout: 20000,
                headers: {
                  "User-Agent":
                    "Mozilla/5.0"
                }
              }
            );

          avatar =
            await loadImage(
              Buffer.from(
                response.data
              )
            );
        }
      } catch (e) {
        console.log(
          "[RANKUP] FCA PP failed:",
          e.message
        );
      }
    }

    const width = 1600;
    const height = 650;

    const canvas =
      createCanvas(
        width,
        height
      );

    const ctx =
      canvas.getContext("2d");

    // Background
    const bg =
      ctx.createLinearGradient(
        0,
        0,
        width,
        height
      );

    bg.addColorStop(
      0,
      "#F8FAFF"
    );

    bg.addColorStop(
      0.5,
      "#FFFFFF"
    );

    bg.addColorStop(
      1,
      "#F3E8FF"
    );

    ctx.fillStyle = bg;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    // Decorative circles
    ctx.fillStyle =
      "rgba(99,102,241,0.08)";

    ctx.beginPath();

    ctx.arc(
      70,
      60,
      230,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
      "rgba(124,58,237,0.08)";

    ctx.beginPath();

    ctx.arc(
      1530,
      590,
      280,
      0,
      Math.PI * 2
    );

    ctx.fill();

    // Border
    ctx.strokeStyle =
      "rgba(99,102,241,0.22)";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.roundRect(
      18,
      18,
      width - 36,
      height - 36,
      35
    );

    ctx.stroke();

    // Level Up badge
    ctx.fillStyle =
      "#312E81";

    ctx.beginPath();

    ctx.roundRect(
      575,
      55,
      350,
      62,
      31
    );

    ctx.fill();

    ctx.font =
      '700 27px "BeVietnamPro-Bold"';

    ctx.fillStyle =
      "#FFFFFF";

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";

    ctx.fillText(
      "♛  LEVEL UP",
      750,
      86
    );

    ctx.textAlign =
      "left";

    ctx.textBaseline =
      "alphabetic";

    // Avatar
    const avatarX = 75;
    const avatarY = 145;
    const avatarSize = 300;

    ctx.save();

    ctx.beginPath();

    ctx.arc(
      avatarX +
        avatarSize / 2,
      avatarY +
        avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );

    ctx.clip();

    if (avatar) {
      const scale =
        Math.max(
          avatarSize /
            avatar.width,
          avatarSize /
            avatar.height
        );

      const avatarWidth =
        avatar.width * scale;

      const avatarHeight =
        avatar.height * scale;

      ctx.drawImage(
        avatar,
        avatarX +
          (avatarSize -
            avatarWidth) / 2,
        avatarY +
          (avatarSize -
            avatarHeight) / 2,
        avatarWidth,
        avatarHeight
      );
    } else {
      const fallback =
        ctx.createLinearGradient(
          avatarX,
          avatarY,
          avatarX +
            avatarSize,
          avatarY +
            avatarSize
        );

      fallback.addColorStop(
        0,
        "#6366F1"
      );

      fallback.addColorStop(
        1,
        "#06B6D4"
      );

      ctx.fillStyle =
        fallback;

      ctx.fillRect(
        avatarX,
        avatarY,
        avatarSize,
        avatarSize
      );
    }

    ctx.restore();

    ctx.strokeStyle =
      "#FFFFFF";

    ctx.lineWidth = 10;

    ctx.beginPath();

    ctx.arc(
      avatarX +
        avatarSize / 2,
      avatarY +
        avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );

    ctx.stroke();

    // Name
    ctx.fillStyle =
      "#0F172A";

    ctx.font =
      '700 58px "BeVietnamPro-Bold"';

    ctx.fillText(
      name.length > 22
        ? name.substring(0, 22) +
          "..."
        : name,
      430,
      210
    );

    ctx.font =
      '600 25px "BeVietnamPro-SemiBold"';

    ctx.fillStyle =
      "#64748B";

    ctx.fillText(
      "CONGRATULATIONS! YOU HAVE LEVELED UP",
      435,
      255
    );

    // New Level
    ctx.fillStyle =
      "#7C3AED";

    ctx.font =
      '700 34px "BeVietnamPro-Bold"';

    ctx.fillText(
      "NEW LEVEL",
      435,
      330
    );

    ctx.fillStyle =
      "#0F172A";

    ctx.font =
      '700 88px "BeVietnamPro-Bold"';

    ctx.fillText(
      String(newLevel),
      435,
      420
    );

    // EXP
    const currentLevelExp =
      Math.floor(
        (
          (newLevel *
            newLevel) -
          newLevel
        ) *
        deltaNext / 2
      );

    const nextLevelExp =
      Math.floor(
        (
          (
            (newLevel + 1) *
            (newLevel + 1)
          ) -
          (newLevel + 1)
        ) *
        deltaNext / 2
      );

    const currentExp =
      Math.max(
        0,
        exp -
          currentLevelExp
      );

    const requiredExp =
      Math.max(
        1,
        nextLevelExp -
          currentLevelExp
      );

    const progress =
      Math.min(
        1,
        currentExp /
          requiredExp
      );

    ctx.fillStyle =
      "#E2E8F0";

    ctx.beginPath();

    ctx.roundRect(
      600,
      370,
      500,
      35,
      18
    );

    ctx.fill();

    if (progress > 0) {
      ctx.fillStyle =
        "#6366F1";

      ctx.beginPath();

      ctx.roundRect(
        600,
        370,
        Math.max(
          20,
          500 * progress
        ),
        35,
        18
      );

      ctx.fill();
    }

    ctx.font =
      '600 22px "BeVietnamPro-SemiBold"';

    ctx.fillStyle =
      "#64748B";

    ctx.fillText(
      `${currentExp} / ${requiredExp} EXP`,
      600,
      445
    );

    // Level card
    const boxX = 1200;
    const boxY = 145;
    const boxW = 320;
    const boxH = 300;

    const levelGradient =
      ctx.createLinearGradient(
        boxX,
        boxY,
        boxX,
        boxY + boxH
      );

    levelGradient.addColorStop(
      0,
      "#312E81"
    );

    levelGradient.addColorStop(
      1,
      "#5B21B6"
    );

    ctx.fillStyle =
      levelGradient;

    ctx.beginPath();

    ctx.roundRect(
      boxX,
      boxY,
      boxW,
      boxH,
      45
    );

    ctx.fill();

    ctx.textAlign =
      "center";

    ctx.fillStyle =
      "#C4B5FD";

    ctx.font =
      '700 25px "BeVietnamPro-SemiBold"';

    ctx.fillText(
      "CURRENT LEVEL",
      boxX +
        boxW / 2,
      boxY + 65
    );

    ctx.fillStyle =
      "#FFFFFF";

    ctx.font =
      '700 110px "BeVietnamPro-Bold"';

    ctx.fillText(
      String(newLevel),
      boxX +
        boxW / 2,
      boxY + 200
    );

    ctx.fillStyle =
      "#FDE68A";

    ctx.beginPath();

    ctx.roundRect(
      boxX + 60,
      boxY + 225,
      200,
      45,
      22
    );

    ctx.fill();

    ctx.fillStyle =
      "#312E81";

    ctx.font =
      '700 22px "BeVietnamPro-Bold"';

    ctx.fillText(
      "RANK UP!",
      boxX +
        boxW / 2,
      boxY + 254
    );

    // Footer
    ctx.textAlign =
      "left";

    ctx.font =
      '600 18px "BeVietnamPro-SemiBold"';

    ctx.fillStyle =
      "#94A3B8";

    ctx.fillText(
      "MESSENGER RANK SYSTEM",
      75,
      610
    );

    ctx.textAlign =
      "right";

    ctx.fillText(
      `NEXT LEVEL: ${nextLevelExp} EXP`,
      1525,
      610
    );

    ctx.textAlign =
      "left";

    fs.writeFileSync(
      output,
      canvas.toBuffer(
        "image/png"
      )
    );

    await api.sendMessage(
      {
        body: message,
        mentions: [
          {
            tag: name,
            id: senderID
          }
        ],
        attachment:
          fs.createReadStream(
            output
          )
      },
      threadID,
      () => {
        try {
          fs.unlinkSync(output);
        } catch (e) {}
      }
    );

  } catch (error) {
    console.error(
      "Rankup Banner Error:",
      error
    );

    try {
      await api.sendMessage(
        {
          body: message,
          mentions: [
            {
              tag: name,
              id: senderID
            }
          ]
        },
        threadID
      );
    } catch (e) {}
  }
};

module.exports.languages = {
  en: {
    on:
      "✅ Rankup notification is now ON.",
    off:
      "⚠️ Rankup notification is now OFF.",
    statusOn:
      "📊 Rankup notification is currently ON.",
    statusOff:
      "📊 Rankup notification is currently OFF."
  }
};

module.exports.run = async function ({
  api,
  event,
  Threads
}) {
  const {
    threadID,
    messageID
  } = event;

  const result =
    await Threads.getData(
      threadID
    );

  const data =
    result.data || {};

  const option =
    String(
      event.body || ""
    )
      .trim()
      .split(/\s+/)[1]
      ?.toLowerCase();

  if (option === "on") {
    data.rankup = true;

    await Threads.setData(
      threadID,
      { data }
    );

    global.data.threadData.set(
      threadID,
      data
    );

    return api.sendMessage(
      "✅ Rankup notification is now ON.",
      threadID,
      messageID
    );
  }

  if (option === "off") {
    data.rankup = false;

    await Threads.setData(
      threadID,
      { data }
    );

    global.data.threadData.set(
      threadID,
      data
    );

    return api.sendMessage(
      "⚠️ Rankup notification is now OFF.",
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    data.rankup === false
      ? "📊 Rankup notification is currently OFF.\n\nUse: rankup on"
      : "📊 Rankup notification is currently ON.\n\nUse: rankup off",
    threadID,
    messageID
  );
};
