const {
  createCanvas,
  loadImage,
  registerFont
} = require("canvas");

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const FACEBOOK_ACCESS_TOKEN =
  "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports.config = {
  name: "adminUpdate",
  eventType: [
    "log:thread-admins",
    "log:thread-name",
    "log:user-nickname",
    "log:thread-icon",
    "log:thread-call",
    "log:thread-color"
  ],
  version: "4.0.0",
  credits: "SHAHADAT SAHU",
  description: "group update notification",
  envConfig: {
    sendNoti: true,
    autoUnsend: true,
    timeToUnsend: 600
  }
};

const CACHE_DIR =
  path.join(__dirname, "Uhas");

const FONT_PATH =
  path.join(
    CACHE_DIR,
    "NotoSansBengali-Bold.ttf"
  );

async function ensureCache() {
  await fs.ensureDir(CACHE_DIR);
}

function loadBannerFont() {
  try {
    if (fs.existsSync(FONT_PATH)) {
      registerFont(
        FONT_PATH,
        {
          family: "SahuPremium"
        }
      );
    }
  } catch {}
}

function font(
  size,
  weight = "normal"
) {
  return `${weight} ${size}px SahuPremium, Arial, sans-serif`;
}

function roundRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {
  ctx.beginPath();

  ctx.moveTo(
    x + radius,
    y
  );

  ctx.lineTo(
    x + width - radius,
    y
  );

  ctx.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + radius
  );

  ctx.lineTo(
    x + width,
    y + height - radius
  );

  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );

  ctx.lineTo(
    x + radius,
    y + height
  );

  ctx.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - radius
  );

  ctx.lineTo(
    x,
    y + radius
  );

  ctx.quadraticCurveTo(
    x,
    y,
    x + radius,
    y
  );

  ctx.closePath();
}

function fitText(
  ctx,
  text,
  maxWidth,
  startSize,
  weight = "bold"
) {
  let size =
    startSize;

  text =
    String(
      text || ""
    );

  while (
    size > 14
  ) {
    ctx.font =
      font(
        size,
        weight
      );

    if (
      ctx.measureText(
        text
      ).width <=
      maxWidth
    ) {
      break;
    }

    size -= 2;
  }

  ctx.font =
    font(
      size,
      weight
    );

  return size;
}

async function getUserName(
  Users,
  api,
  userID
) {
  if (!userID) {
    return "Unknown User";
  }

  try {
    if (
      Users &&
      typeof Users.getNameUser ===
        "function"
    ) {
      const name =
        await Users.getNameUser(
          userID
        );

      if (name) {
        return String(name);
      }
    }
  } catch {}

  try {
    return await new Promise(
      resolve => {
        api.getUserInfo(
          userID,
          (
            error,
            data
          ) => {
            if (
              error ||
              !data ||
              !data[userID]
            ) {
              return resolve(
                "Unknown User"
              );
            }

            resolve(
              data[userID].name ||
              "Unknown User"
            );
          }
        );
      }
    );
  } catch {}

  return "Unknown User";
}

async function getProfileImage(
  api,
  userID
) {
  if (
    !userID ||
    !FACEBOOK_ACCESS_TOKEN ||
    FACEBOOK_ACCESS_TOKEN ===
      "YOUR_ACCESS_TOKEN"
  ) {
    return null;
  }

  const avatarURL =
    `https://graph.facebook.com/${userID}/picture?width=2048&height=2048&type=large&access_token=${encodeURIComponent(FACEBOOK_ACCESS_TOKEN)}`;

  try {
    const response =
      await axios.get(
        avatarURL,
        {
          responseType:
            "arraybuffer",
          timeout: 20000,
          maxRedirects: 5,
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        }
      );

    if (
      !response.data ||
      response.data.length <
        100
    ) {
      return null;
    }

    return await loadImage(
      Buffer.from(
        response.data
      )
    );
  } catch {
    return null;
  }
}

function drawProfilePhoto(
  ctx,
  image,
  x,
  y,
  radius,
  colors
) {
  ctx.save();

  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";

  ctx.shadowColor =
    colors.glow;

  ctx.shadowBlur =
    30;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius + 9,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    colors.accent;

  ctx.fill();

  ctx.shadowBlur =
    0;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius + 4,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "#ffffff";

  ctx.fill();

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius,
    0,
    Math.PI * 2
  );

  ctx.clip();

  if (image) {
    const iw =
      image.width;

    const ih =
      image.height;

    const diameter =
      radius * 2;

    const scale =
      Math.max(
        diameter / iw,
        diameter / ih
      );

    const width =
      iw * scale;

    const height =
      ih * scale;

    ctx.drawImage(
      image,
      x - width / 2,
      y - height / 2,
      width,
      height
    );
  } else {
    const gradient =
      ctx.createLinearGradient(
        x - radius,
        y - radius,
        x + radius,
        y + radius
      );

    gradient.addColorStop(
      0,
      colors.accent
    );

    gradient.addColorStop(
      1,
      colors.second
    );

    ctx.fillStyle =
      gradient;

    ctx.fill();

    ctx.fillStyle =
      "#ffffff";

    ctx.beginPath();

    ctx.arc(
      x,
      y - 18,
      25,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
      x,
      y + 42,
      48,
      Math.PI,
      0
    );

    ctx.fill();
  }

  ctx.restore();
}

function drawSmallIcon(
  ctx,
  x,
  y,
  icon,
  color
) {
  ctx.save();

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    24,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    color;

  ctx.shadowColor =
    color;

  ctx.shadowBlur =
    15;

  ctx.fill();

  ctx.shadowBlur =
    0;

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "bold 21px Arial";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillText(
    icon,
    x,
    y + 1
  );

  ctx.restore();
}

async function createBanner({
  api,
  botName,
  title,
  subtitle,
  userName,
  userID,
  details = [],
  colors,
  icon
}) {
  loadBannerFont();

  const WIDTH =
    1400;

  const HEIGHT =
    800;

  const canvas =
    createCanvas(
      WIDTH,
      HEIGHT
    );

  const ctx =
    canvas.getContext(
      "2d"
    );

  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";

  const background =
    ctx.createLinearGradient(
      0,
      0,
      WIDTH,
      HEIGHT
    );

  background.addColorStop(
    0,
    colors.bg1
  );

  background.addColorStop(
    0.5,
    colors.bg2
  );

  background.addColorStop(
    1,
    colors.bg3
  );

  ctx.fillStyle =
    background;

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );

  const glow1 =
    ctx.createRadialGradient(
      180,
      120,
      10,
      180,
      120,
      420
    );

  glow1.addColorStop(
    0,
    colors.glowStrong
  );

  glow1.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );

  ctx.fillStyle =
    glow1;

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );

  const glow2 =
    ctx.createRadialGradient(
      1220,
      650,
      10,
      1220,
      650,
      450
    );

  glow2.addColorStop(
    0,
    colors.glowStrong2
  );

  glow2.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );

  ctx.fillStyle =
    glow2;

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );

  ctx.strokeStyle =
    colors.accent;

  ctx.lineWidth =
    3;

  ctx.globalAlpha =
    0.55;

  ctx.beginPath();
  ctx.moveTo(0, 125);
  ctx.lineTo(230, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(
    WIDTH,
    125
  );
  ctx.lineTo(
    WIDTH - 230,
    0
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(
    0,
    HEIGHT - 110
  );
  ctx.lineTo(
    250,
    HEIGHT
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(
    WIDTH,
    HEIGHT - 110
  );
  ctx.lineTo(
    WIDTH - 250,
    HEIGHT
  );
  ctx.stroke();

  ctx.globalAlpha =
    1;

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.shadowColor =
    colors.glow;

  ctx.shadowBlur =
    22;

  fitText(
    ctx,
    title,
    WIDTH - 160,
    55
  );

  ctx.fillStyle =
    colors.titleGradient;

  ctx.fillText(
    title,
    WIDTH / 2,
    90
  );

  ctx.shadowBlur =
    0;

  ctx.strokeStyle =
    colors.accent;

  ctx.lineWidth =
    3;

  ctx.beginPath();

  ctx.moveTo(
    410,
    155
  );

  ctx.lineTo(
    620,
    155
  );

  ctx.stroke();

  ctx.beginPath();

  ctx.moveTo(
    780,
    155
  );

  ctx.lineTo(
    990,
    155
  );

  ctx.stroke();

  ctx.fillStyle =
    colors.accent;

  ctx.font =
    "bold 34px Arial";

  ctx.fillText(
    "✦",
    WIDTH / 2,
    155
  );

  fitText(
    ctx,
    subtitle,
    WIDTH - 180,
    43
  );

  ctx.fillStyle =
    colors.subtitle;

  ctx.shadowColor =
    colors.glow;

  ctx.shadowBlur =
    14;

  ctx.fillText(
    subtitle,
    WIDTH / 2,
    225
  );

  ctx.shadowBlur =
    0;

  const profile =
    userID
      ? await getProfileImage(
          api,
          userID
        )
      : null;

  drawProfilePhoto(
    ctx,
    profile,
    300,
    390,
    92,
    colors
  );

  drawSmallIcon(
    ctx,
    455,
    345,
    icon || "U",
    colors.accent
  );

  ctx.textAlign =
    "left";

  ctx.fillStyle =
    colors.label;

  ctx.font =
    font(
      20,
      "bold"
    );

  ctx.fillText(
    "USER",
    495,
    345
  );

  ctx.fillStyle =
    "#ffffff";

  fitText(
    ctx,
    userName ||
      "Unknown User",
    390,
    31
  );

  ctx.fillText(
    String(
      userName ||
      "Unknown User"
    ),
    495,
    390
  );

  drawSmallIcon(
    ctx,
    850,
    345,
    "ID",
    colors.second
  );

  ctx.fillStyle =
    colors.label2;

  ctx.font =
    font(
      20,
      "bold"
    );

  ctx.fillText(
    "UID",
    890,
    345
  );

  ctx.fillStyle =
    "#ffffff";

  fitText(
    ctx,
    userID ||
      "Unknown",
    390,
    27
  );

  ctx.fillText(
    String(
      userID ||
      "Unknown"
    ),
    890,
    390
  );

  const divider =
    ctx.createLinearGradient(
      430,
      450,
      1100,
      450
    );

  divider.addColorStop(
    0,
    "rgba(255,255,255,0)"
  );

  divider.addColorStop(
    0.5,
    colors.accent
  );

  divider.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );

  ctx.strokeStyle =
    divider;

  ctx.lineWidth =
    2;

  ctx.beginPath();

  ctx.moveTo(
    430,
    470
  );

  ctx.lineTo(
    1130,
    470
  );

  ctx.stroke();

  let detailY =
    520;

  for (
    const detail of details
  ) {
    if (!detail) {
      continue;
    }

    drawSmallIcon(
      ctx,
      470,
      detailY,
      "•",
      colors.accent
    );

    ctx.textAlign =
      "left";

    ctx.fillStyle =
      "#ffffff";

    fitText(
      ctx,
      String(detail),
      800,
      27
    );

    ctx.fillText(
      String(detail),
      510,
      detailY
    );

    detailY +=
      52;
  }

  ctx.textAlign =
    "center";

  ctx.fillStyle =
    "#ffffff";

  ctx.shadowColor =
    colors.glow;

  ctx.shadowBlur =
    20;

  fitText(
    ctx,
    botName,
    WIDTH - 200,
    35
  );

  ctx.fillText(
    String(
      botName ||
      "SHAHADAT CHAT BOT"
    ),
    WIDTH / 2,
    700
  );

  ctx.shadowBlur =
    0;

  ctx.strokeStyle =
    colors.accent;

  ctx.lineWidth =
    2;

  ctx.beginPath();

  ctx.moveTo(
    310,
    750
  );

  ctx.lineTo(
    610,
    750
  );

  ctx.stroke();

  ctx.beginPath();

  ctx.moveTo(
    790,
    750
  );

  ctx.lineTo(
    1090,
    750
  );

  ctx.stroke();

  ctx.fillStyle =
    colors.accent;

  ctx.font =
    "bold 28px Arial";

  ctx.fillText(
    "✦",
    650,
    750
  );

  ctx.fillText(
    "✦",
    750,
    750
  );

  return canvas.toBuffer(
    "image/png"
  );
}

async function saveBanner(
  buffer
) {
  await fs.ensureDir(
    CACHE_DIR
  );

  const filePath =
    path.join(
      CACHE_DIR,
      `adminUpdate_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.png`
    );

  await fs.writeFile(
    filePath,
    buffer
  );

  return filePath;
}

async function sendNotification({
  api,
  threadID,
  body,
  bannerPath,
  autoUnsend,
  timeToUnsend
}) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const attachment =
        fs.createReadStream(
          bannerPath
        );

      api.sendMessage(
        {
          body,
          attachment
        },
        threadID,
        async (
          error,
          info
        ) => {
          try {
            attachment.destroy();
          } catch {}

          if (error) {
            try {
              await fs.remove(
                bannerPath
              );
            } catch {}

            return reject(
              error
            );
          }

          if (
            autoUnsend &&
            info &&
            info.messageID
          ) {
            setTimeout(
              async () => {
                try {
                  await new Promise(
                    resolveUnsend => {
                      api.unsendMessage(
                        info.messageID,
                        () =>
                          resolveUnsend()
                      );
                    }
                  );
                } catch {}

                try {
                  await fs.remove(
                    bannerPath
                  );
                } catch {}
              },
              timeToUnsend *
                1000
            );
          } else {
            setTimeout(
              async () => {
                try {
                  await fs.remove(
                    bannerPath
                  );
                } catch {}
              },
              10000
            );
          }

          resolve(info);
        }
      );
    }
  );
}

module.exports.run =
  async function({
    event,
    api,
    Threads,
    Users
  }) {
    try {
      await ensureCache();

      const moduleConfig =
        global.configModule &&
        global.configModule[
          this.config.name
        ]
          ? global.configModule[
              this.config.name
            ]
          : this.config.envConfig;

      if (
        moduleConfig &&
        moduleConfig.sendNoti ===
          false
      ) {
        return;
      }

      const {
        threadID,
        logMessageType,
        logMessageData
      } = event;

      if (
        !threadID ||
        !logMessageType ||
        !logMessageData
      ) {
        return;
      }

      const thread =
        global.data.threadData.get(
          threadID
        ) || {};

      if (
        typeof thread.adminUpdate !==
          "undefined" &&
        thread.adminUpdate ===
          false
      ) {
        return;
      }

      const {
        setData,
        getData
      } = Threads;

      let dataThread =
        {};

      try {
        const result =
          await getData(
            threadID
          );

        dataThread =
          result &&
          result.threadInfo
            ? result.threadInfo
            : {};
      } catch {}

      if (
        !Array.isArray(
          dataThread.adminIDs
        )
      ) {
        dataThread.adminIDs =
          [];
      }

      if (
        !dataThread.nicknames
      ) {
        dataThread.nicknames =
          {};
      }

      const botName =
        String(
          global.config.BOTNAME ||
          "SHAHADAT CHAT BOT"
        ).trim();

      let body =
        "";

      let bannerData =
        null;

      if (
        logMessageType ===
        "log:thread-admins"
      ) {
        const targetID =
          String(
            logMessageData.TARGET_ID ||
            ""
          );

        if (!targetID) {
          return;
        }

        const userName =
          await getUserName(
            Users,
            api,
            targetID
          );

        if (
          logMessageData.ADMIN_EVENT ===
          "add_admin"
        ) {
          const exists =
            dataThread.adminIDs.some(
              item =>
                String(
                  item.id
                ) ===
                targetID
            );

          if (!exists) {
            dataThread.adminIDs.push({
              id:
                targetID
            });
          }

          body =
`👑 GROUP ADMIN UPDATE

👤 User: ${userName}
🆔 UID: ${targetID}

🟢 Admin Power Activated

◈━━꯭${botName}꯭━━◈`;

          bannerData = {
            title:
              "GROUP UPDATE",
            subtitle:
              "ADMIN POWER ACTIVATED",
            userName,
            userID:
              targetID,
            icon:
              "✓",
            colors: {
              bg1:
                "#08001f",
              bg2:
                "#21005d",
              bg3:
                "#001d3d",
              accent:
                "#00e5ff",
              second:
                "#ff2bd6",
              glow:
                "#00e5ff",
              glowStrong:
                "rgba(0,229,255,0.25)",
              glowStrong2:
                "rgba(255,43,214,0.20)",
              titleGradient:
                "#00e5ff",
              subtitle:
                "#ffffff",
              label:
                "#00e5ff",
              label2:
                "#ff2bd6"
            },
            details: [
              "Administrator permission activated"
            ]
          };
        }

        else if (
          logMessageData.ADMIN_EVENT ===
          "remove_admin"
        ) {
          dataThread.adminIDs =
            dataThread.adminIDs.filter(
              item =>
                String(
                  item.id
                ) !==
                targetID
            );

          body =
`⚠️ GROUP ADMIN UPDATE

👤 User: ${userName}
🆔 UID: ${targetID}

🔴 Admin Power Removed

◈━━꯭${botName}꯭━━◈`;

          bannerData = {
            title:
              "GROUP UPDATE",
            subtitle:
              "ADMIN POWER REMOVED",
            userName,
            userID:
              targetID,
            icon:
              "×",
            colors: {
              bg1:
                "#210008",
              bg2:
                "#4a0015",
              bg3:
                "#160020",
              accent:
                "#ff3d71",
              second:
                "#ff9f1c",
              glow:
                "#ff3d71",
              glowStrong:
                "rgba(255,61,113,0.25)",
              glowStrong2:
                "rgba(255,159,28,0.20)",
              titleGradient:
                "#ff6b9a",
              subtitle:
                "#ffffff",
              label:
                "#ff6b9a",
              label2:
                "#ffb347"
            },
            details: [
              "Administrator permission removed"
            ]
          };
        }
      }

      else if (
        logMessageType ===
        "log:user-nickname"
      ) {
        const targetID =
          String(
            logMessageData.participant_id ||
            ""
          );

        const nickname =
          String(
            logMessageData.nickname ||
            ""
          );

        if (!targetID) {
          return;
        }

        dataThread.nicknames[
          targetID
        ] =
          nickname;

        const nicknameConfig =
          global.configModule &&
          global.configModule.nickname;

        if (
          nicknameConfig &&
          Array.isArray(
            nicknameConfig.allowChange
          ) &&
          !nicknameConfig.allowChange.includes(
            threadID
          ) &&
          !dataThread.adminIDs.some(
            item =>
              String(
                item.id
              ) ===
              String(
                event.author
              )
          ) &&
          String(
            event.author
          ) !==
            String(
              api.getCurrentUserID()
            )
        ) {
          return;
        }

        const userName =
          await getUserName(
            Users,
            api,
            targetID
          );

        const shownNickname =
          nickname.length
            ? nickname
            : "Original Name";

        body =
`👤 NICKNAME UPDATE

User: ${userName}
UID: ${targetID}

New Nickname: ${shownNickname}

◈━━꯭${botName}꯭━━◈`;

        bannerData = {
          title:
            "GROUP UPDATE",
          subtitle:
            "USER NICKNAME CHANGED",
          userName,
          userID:
            targetID,
          icon:
            "N",
          colors: {
            bg1:
              "#16002e",
            bg2:
              "#42006e",
            bg3:
              "#001b4d",
            accent:
              "#ff39d4",
            second:
              "#7c4dff",
            glow:
              "#ff39d4",
            glowStrong:
              "rgba(255,57,212,0.25)",
            glowStrong2:
              "rgba(124,77,255,0.20)",
            titleGradient:
              "#ff61dc",
            subtitle:
              "#ffffff",
            label:
              "#ff61dc",
            label2:
              "#9d8cff"
          },
          details: [
            `New Nickname: ${shownNickname}`
          ]
        };
      }

      else if (
        logMessageType ===
        "log:thread-name"
      ) {
        const newName =
          String(
            logMessageData.name ||
            event.logMessageBody ||
            "No name"
          );

        dataThread.threadName =
          newName;

        const userID =
          String(
            event.author ||
            ""
          );

        const userName =
          await getUserName(
            Users,
            api,
            userID
          );

        body =
`⚠️ GROUP UPDATE

👤 User: ${userName}
🆔 UID: ${userID}

📝 Group Name Changed
➜ New Name: ${newName}

◈━━꯭${botName}꯭━━◈`;

        bannerData = {
          title:
            "GROUP UPDATE",
          subtitle:
            "GROUP NAME CHANGED",
          userName,
          userID,
          icon:
            "N",
          colors: {
            bg1:
              "#020b2d",
            bg2:
              "#003c72",
            bg3:
              "#16003f",
            accent:
              "#00d9ff",
            second:
              "#6c5ce7",
            glow:
              "#00d9ff",
            glowStrong:
              "rgba(0,217,255,0.25)",
            glowStrong2:
              "rgba(108,92,231,0.22)",
            titleGradient:
              "#37e8ff",
            subtitle:
              "#ffffff",
            label:
              "#37e8ff",
            label2:
              "#a99bff"
          },
          details: [
            `New Name: ${newName}`
          ]
        };
      }

      else if (
        logMessageType ===
        "log:thread-icon"
      ) {
        const oldIcon =
          dataThread.threadIcon ||
          "Unknown";

        const newIcon =
          logMessageData.thread_icon ||
          "👍";

        dataThread.threadIcon =
          newIcon;

        const userID =
          String(
            event.author ||
            ""
          );

        const userName =
          await getUserName(
            Users,
            api,
            userID
          );

        body =
`🖼️ GROUP UPDATE

👤 User: ${userName}
🆔 UID: ${userID}

New Group Icon: ${newIcon}
Original Icon: ${oldIcon}

◈━━꯭${botName}꯭━━◈`;

        bannerData = {
          title:
            "GROUP UPDATE",
          subtitle:
            "GROUP ICON CHANGED",
          userName,
          userID,
          icon:
            newIcon,
          colors: {
            bg1:
              "#281000",
            bg2:
              "#7a2800",
            bg3:
              "#25004d",
            accent:
              "#ffb300",
            second:
              "#ff4081",
            glow:
              "#ffb300",
            glowStrong:
              "rgba(255,179,0,0.25)",
            glowStrong2:
              "rgba(255,64,129,0.22)",
            titleGradient:
              "#ffd54f",
            subtitle:
              "#ffffff",
            label:
              "#ffd54f",
            label2:
              "#ff80ab"
          },
          details: [
            `New Icon: ${newIcon}`,
            `Original Icon: ${oldIcon}`
          ]
        };
      }

      else if (
        logMessageType ===
        "log:thread-color"
      ) {
        const newColor =
          logMessageData.thread_color ||
          "🌤";

        dataThread.threadColor =
          newColor;

        const userID =
          String(
            event.author ||
            ""
          );

        const userName =
          await getUserName(
            Users,
            api,
            userID
          );

        body =
`🎨 GROUP UPDATE

👤 User: ${userName}
🆔 UID: ${userID}

Group Theme Color Changed
➜ Color: ${newColor}

◈━━꯭${botName}꯭━━◈`;

        bannerData = {
          title:
            "GROUP UPDATE",
          subtitle:
            "GROUP THEME COLOR CHANGED",
          userName,
          userID,
          icon:
            "●",
          colors: {
            bg1:
              "#26001e",
            bg2:
              "#75003e",
            bg3:
              "#001f4d",
            accent:
              "#ff2d95",
            second:
              "#00d4ff",
            glow:
              "#ff2d95",
            glowStrong:
              "rgba(255,45,149,0.25)",
            glowStrong2:
              "rgba(0,212,255,0.22)",
            titleGradient:
              "#ff66b5",
            subtitle:
              "#ffffff",
            label:
              "#ff66b5",
            label2:
              "#58e6ff"
          },
          details: [
            `Theme Color: ${newColor}`
          ]
        };
      }

      else if (
        logMessageType ===
        "log:thread-call"
      ) {
        const callEvent =
          logMessageData.event;

        if (
          callEvent ===
          "group_call_started"
        ) {
          const callerID =
            String(
              logMessageData.caller_id ||
              ""
            );

          const callerName =
            await getUserName(
              Users,
              api,
              callerID
            );

          const callType =
            logMessageData.video
              ? "Video Call"
              : "Voice Call";

          body =
`📞 GROUP CALL UPDATE

👤 User: ${callerName}
🆔 UID: ${callerID}

📞 Started a ${callType}

◈━━꯭${botName}꯭━━◈`;

          bannerData = {
            title:
              "GROUP CALL",
            subtitle:
              "CALL STARTED",
            userName:
              callerName,
            userID:
              callerID,
            icon:
              "☎",
            colors: {
              bg1:
                "#001d2b",
              bg2:
                "#004d5c",
              bg3:
                "#18004d",
              accent:
                "#00f0ff",
              second:
                "#7c4dff",
              glow:
                "#00f0ff",
              glowStrong:
                "rgba(0,240,255,0.25)",
              glowStrong2:
                "rgba(124,77,255,0.22)",
              titleGradient:
                "#4df4ff",
              subtitle:
                "#ffffff",
              label:
                "#4df4ff",
              label2:
                "#a99bff"
            },
            details: [
              `Call Type: ${callType}`
            ]
          };
        }

        else if (
          callEvent ===
          "group_call_ended"
        ) {
          const duration =
            Number(
              logMessageData.call_duration ||
              0
            );

          const hours =
            Math.floor(
              duration /
              3600
            );

          const minutes =
            Math.floor(
              (duration %
                3600) /
              60
            );

          const seconds =
            duration %
            60;

          const timeFormat =
            `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

          const callType =
            logMessageData.video
              ? "Video Call"
              : "Voice Call";

          body =
`📞 GROUP CALL UPDATE

📌 Status: Call Ended
📹 Type: ${callType}
⏱️ Duration: ${timeFormat}

◈━━꯭${botName}꯭━━◈`;

          bannerData = {
            title:
              "GROUP CALL",
            subtitle:
              "CALL ENDED",
            icon:
              "☎",
            colors: {
              bg1:
                "#001827",
              bg2:
                "#003b52",
              bg3:
                "#1c0045",
              accent:
                "#00e5ff",
              second:
                "#ff4081",
              glow:
                "#00e5ff",
              glowStrong:
                "rgba(0,229,255,0.25)",
              glowStrong2:
                "rgba(255,64,129,0.20)",
              titleGradient:
                "#5cecff",
              subtitle:
                "#ffffff",
              label:
                "#5cecff",
              label2:
                "#ff80ab"
            },
            details: [
              `Call Type: ${callType}`,
              `Duration: ${timeFormat}`
            ]
          };
        }

        else if (
          logMessageData.joining_user
        ) {
          const userID =
            String(
              logMessageData.joining_user
            );

          const userName =
            await getUserName(
              Users,
              api,
              userID
            );

          const callType =
            logMessageData.group_call_type ==
            "1"
              ? "Video Call"
              : "Voice Call";

          body =
`📞 GROUP CALL UPDATE

👤 User: ${userName}
🆔 UID: ${userID}

Joined the ${callType}

◈━━꯭${botName}꯭━━◈`;

          bannerData = {
            title:
              "GROUP CALL",
            subtitle:
              "USER JOINED CALL",
            userName,
            userID,
            icon:
              "☎",
            colors: {
              bg1:
                "#001b2d",
              bg2:
                "#004e6b",
              bg3:
                "#27004d",
              accent:
                "#00eaff",
              second:
                "#c43cff",
              glow:
                "#00eaff",
              glowStrong:
                "rgba(0,234,255,0.25)",
              glowStrong2:
                "rgba(196,60,255,0.22)",
              titleGradient:
                "#5cefff",
              subtitle:
                "#ffffff",
              label:
                "#5cefff",
              label2:
                "#d080ff"
            },
            details: [
              `Call Type: ${callType}`
            ]
          };
        }
      }

      if (
        !body ||
        !bannerData
      ) {
        return;
      }

      await setData(
        threadID,
        {
          threadInfo:
            dataThread
        }
      );

      const bannerBuffer =
        await createBanner({
          api,
          botName,
          ...bannerData
        });

      const bannerPath =
        await saveBanner(
          bannerBuffer
        );

      const autoUnsend =
        moduleConfig &&
        moduleConfig.autoUnsend !==
          false;

      const timeToUnsend =
        Number(
          moduleConfig &&
          moduleConfig.timeToUnsend
            ? moduleConfig.timeToUnsend
            : 60
        );

      try {
        await sendNotification({
          api,
          threadID,
          body,
          bannerPath,
          autoUnsend,
          timeToUnsend
        });
      } catch (
        error
      ) {
        try {
          await fs.remove(
            bannerPath
          );
        } catch {}

        console.log(
          "[ADMIN UPDATE SEND ERROR]:",
          error.message
        );
      }
    } catch (
      error
    ) {
      console.log(
        "[ADMIN UPDATE ERROR]:",
        error
      );
    }
  };
