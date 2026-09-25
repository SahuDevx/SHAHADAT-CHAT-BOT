const {
  createCanvas,
  registerFont
} = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "god",
  eventType: [
    "log:unsubscribe",
    "log:subscribe"
  ],
  version: "3.0.0",
  credits: "SHAHADAT SAHU",
  description: "Bot add/remove notification with text and Canvas banner",
  envConfig: {
    enable: true
  }
};

const NOTIFICATION_GROUP_TID =
  "1890739128318840";

const CACHE_DIR =
  path.join(
    __dirname,
    "Uhas"
  );

const FONT_PATH =
  path.join(
    CACHE_DIR,
    "NotoSansBengali-Bold.ttf"
  );

async function ensureCache() {
  await fs.ensureDir(
    CACHE_DIR
  );
}

function loadFont() {
  try {
    if (
      fs.existsSync(
        FONT_PATH
      )
    ) {
      try {
        registerFont(
          FONT_PATH,
          {
            family:
              "SahuBanner"
          }
        );
      } catch (error) {}
    }
  } catch (error) {}
}

function font(
  size,
  weight = "normal"
) {
  return `${weight} ${size}px SahuBanner, Arial, sans-serif`;
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

  while (
    size > 18
  ) {
    ctx.font =
      font(
        size,
        weight
      );

    if (
      ctx.measureText(
        String(text)
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

async function createBanner({
  botName,
  groupTID,
  actorID,
  action,
  time
}) {
  loadFont();

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

  const isAdded =
    action === "added";

  const accent =
    isAdded
      ? "#25b864"
      : "#e53935";

  const light =
    isAdded
      ? "#eaf8ef"
      : "#fdecec";

  const title =
    isAdded
      ? "BOT ADDED SUCCESSFULLY"
      : "BOT REMOVED FROM GROUP";

  const status =
    isAdded
      ? "ONLINE"
      : "REMOVED";

  const icon =
    isAdded
      ? "✓"
      : "×";

  ctx.fillStyle =
    "#f5f7fa";

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );

  ctx.fillStyle =
    "#ffffff";

  roundRect(
    ctx,
    45,
    45,
    WIDTH - 90,
    HEIGHT - 90,
    35
  );

  ctx.fill();

  ctx.strokeStyle =
    accent;

  ctx.lineWidth =
    4;

  roundRect(
    ctx,
    45,
    45,
    WIDTH - 90,
    HEIGHT - 90,
    35
  );

  ctx.stroke();

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  const safeBotName =
    String(
      botName ||
        "MESSENGER CHAT BOT"
    ).trim();

  fitText(
    ctx,
    safeBotName,
    WIDTH - 180,
    58
  );

  ctx.fillStyle =
    "#111111";

  ctx.fillText(
    safeBotName,
    WIDTH / 2,
    115
  );

  ctx.strokeStyle =
    accent;

  ctx.lineWidth =
    2;

  ctx.beginPath();

  ctx.moveTo(
    390,
    170
  );

  ctx.lineTo(
    610,
    170
  );

  ctx.stroke();

  ctx.beginPath();

  ctx.moveTo(
    790,
    170
  );

  ctx.lineTo(
    1010,
    170
  );

  ctx.stroke();

  ctx.fillStyle =
    accent;

  ctx.font =
    "32px Arial";

  ctx.fillText(
    "✦",
    WIDTH / 2,
    170
  );

  fitText(
    ctx,
    title,
    WIDTH - 180,
    42
  );

  ctx.fillStyle =
    accent;

  ctx.fillText(
    title,
    WIDTH / 2,
    235
  );

  ctx.fillStyle =
    light;

  roundRect(
    ctx,
    110,
    295,
    1180,
    355,
    28
  );

  ctx.fill();

  ctx.strokeStyle =
    accent;

  ctx.lineWidth =
    2;

  roundRect(
    ctx,
    110,
    295,
    1180,
    355,
    28
  );

  ctx.stroke();

  ctx.fillStyle =
    accent;

  ctx.beginPath();

  ctx.arc(
    WIDTH / 2,
    385,
    58,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    font(
      65,
      "bold"
    );

  ctx.fillText(
    icon,
    WIDTH / 2,
    390
  );

  ctx.fillStyle =
    "#111111";

  ctx.font =
    font(
      30,
      "bold"
    );

  ctx.fillText(
    isAdded
      ? "Bot is now active in this group"
      : "Bot has left this group",
    WIDTH / 2,
    485
  );

  ctx.textAlign =
    "left";

  ctx.fillStyle =
    "#555555";

  ctx.font =
    font(
      24,
      "bold"
    );

  ctx.fillText(
    "GROUP TID",
    190,
    555
  );

  ctx.fillStyle =
    "#111111";

  fitText(
    ctx,
    String(
      groupTID
    ),
    350,
    24
  );

  ctx.fillText(
    String(
      groupTID
    ),
    390,
    555
  );

  ctx.fillStyle =
    "#555555";

  ctx.fillText(
    isAdded
      ? "ADDED BY"
      : "REMOVED BY",
    190,
    605
  );

  ctx.fillStyle =
    "#111111";

  ctx.fillText(
    String(
      actorID ||
        "Unknown"
    ),
    390,
    605
  );

  ctx.fillStyle =
    "#555555";

  ctx.fillText(
    "TIME",
    820,
    555
  );

  ctx.fillStyle =
    "#111111";

  fitText(
    ctx,
    String(
      time
    ),
    330,
    22
  );

  ctx.fillText(
    String(
      time
    ),
    900,
    555
  );

  ctx.fillStyle =
    accent;

  ctx.fillText(
    "STATUS",
    820,
    605
  );

  ctx.fillStyle =
    accent;

  ctx.fillText(
    status,
    930,
    605
  );

  ctx.textAlign =
    "center";

  ctx.fillStyle =
    "#111111";

  ctx.font =
    font(
      30,
      "bold"
    );

  ctx.fillText(
    safeBotName,
    WIDTH / 2,
    710
  );

  ctx.fillStyle =
    accent;

  ctx.font =
    font(
      21,
      "bold"
    );

  ctx.fillText(
    isAdded
      ? "Thank you for adding my bot"
      : "Thank you for using my bot",
    WIDTH / 2,
    750
  );

  const imagePath =
    path.join(
      CACHE_DIR,
      `god_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.png`
    );

  await new Promise(
    (
      resolve,
      reject
    ) => {
      const stream =
        canvas.createPNGStream();

      const output =
        fs.createWriteStream(
          imagePath
        );

      stream.pipe(
        output
      );

      stream.on(
        "error",
        reject
      );

      output.on(
        "finish",
        resolve
      );

      output.on(
        "error",
        reject
      );
    }
  );

  return imagePath;
}

module.exports.run =
  async function({
    api,
    event
  }) {
    const logger =
      require("../../utils/log");

    let imagePath =
      null;

    try {
      const config =
        global.configModule &&
        global.configModule[
          this.config.name
        ];

      if (
        config &&
        config.enable === false
      ) {
        return;
      }

      if (
        !event.logMessageData
      ) {
        return;
      }

      await ensureCache();

      const botID =
        String(
          api.getCurrentUserID()
        );

      const botName =
        String(
          global.config.BOTNAME ||
            "MESSENGER CHAT BOT"
        ).trim();

      const eventGroupTID =
        String(
          event.threadID
        );

      let action =
        null;

      const actorID =
        String(
          event.author ||
            "Unknown"
        );

      if (
        event.logMessageType ===
        "log:subscribe"
      ) {
        const participants =
          Array.isArray(
            event.logMessageData
              .addedParticipants
          )
            ? event.logMessageData
                .addedParticipants
            : [];

        const isBotAdded =
          participants.some(
            user =>
              String(
                user.userFbId
              ) === botID
          );

        if (!isBotAdded) {
          return;
        }

        action =
          "added";
      }

      if (
        event.logMessageType ===
        "log:unsubscribe"
      ) {
        const leftID =
          event.logMessageData
            .leftParticipantFbId;

        if (
          String(
            leftID
          ) !== botID
        ) {
          return;
        }

        action =
          "removed";
      }

      if (
        !action
      ) {
        return;
      }

      const time =
        new Date().toLocaleString(
          "en-US",
          {
            timeZone:
              "Asia/Dhaka",
            year:
              "numeric",
            month:
              "2-digit",
            day:
              "2-digit",
            hour:
              "2-digit",
            minute:
              "2-digit",
            hour12:
              true
          }
        );

      const text =
        action === "added"
          ? `Bot Added Successfully! ✅

📌 Group TID: ${eventGroupTID}
👤 Added By: ${actorID}

🕒 Time: ${time}

◈━━꯭${botName}꯭━━◈`
          : `Bot Removed From Group! ❌

📌 Group TID: ${eventGroupTID}
👤 Removed By: ${actorID}

🕒 Time: ${time}

◈━━꯭${botName}꯭━━◈`;

      imagePath =
        await createBanner({
          botName,
          groupTID:
            eventGroupTID,
          actorID,
          action,
          time
        });

      await new Promise(
        (
          resolve,
          reject
        ) => {
          const attachment =
            fs.createReadStream(
              imagePath
            );

          api.sendMessage(
            {
              body:
                text,
              attachment
            },
            NOTIFICATION_GROUP_TID,
            (
              error,
              info
            ) => {
              attachment.destroy();

              if (
                error
              ) {
                return reject(
                  error
                );
              }

              resolve(
                info
              );
            }
          );
        }
      );

      try {
        if (
          imagePath &&
          fs.existsSync(
            imagePath
          )
        ) {
          await fs.remove(
            imagePath
          );
        }
      } catch (
        cleanupError
      ) {}

      imagePath =
        null;

    } catch (
      error
    ) {
      console.error(
        "[GOD EVENT ERROR]:",
        error
      );

      if (
        imagePath &&
        fs.existsSync(
          imagePath
        )
      ) {
        try {
          await fs.remove(
            imagePath
          );
        } catch {}
      }

      try {
        logger(
          `[GOD EVENT ERROR] ${error.message}`,
          "[ Logging Event ]"
        );
      } catch {}
    }
  };
