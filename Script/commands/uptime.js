const os = require("os");
const path = require("path");
const fs = require("fs-extra");
const { createCanvas, registerFont } = require("canvas");

module.exports.config = {
  name: "uptime",
  aliases: ["runtime"],
  version: "3.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Show bot uptime and system status with canvas UI",
  commandCategory: "System",
  usages: "uptime",
  cooldowns: 5,
  usePrefix: true
};

const fontPaths = [
  "/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf",
  "/usr/share/fonts/opentype/noto/NotoSansBengali-Regular.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
];

for (const fontPath of fontPaths) {
  if (fs.existsSync(fontPath)) {
    try {
      registerFont(fontPath, {
        family: "SahuUnicode"
      });
      break;
    } catch {}
  }
}

function font(size, weight = "normal") {
  return `${weight} ${size}px SahuUnicode, sans-serif`;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - radius
  );
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function getSystemData(event) {
  const uptime = process.uptime();

  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const usedGB = (
    usedMem / 1024 / 1024 / 1024
  ).toFixed(2);

  const totalGB = (
    totalMem / 1024 / 1024 / 1024
  ).toFixed(2);

  const cpus = os.cpus();

  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }

    idle += cpu.times.idle;
  }

  const cpuLoad = total
    ? ((1 - idle / total) * 100).toFixed(2)
    : "0.00";

  const ping = event.timestamp
    ? Math.max(0, Date.now() - event.timestamp)
    : 0;

  return {
    days,
    hours,
    minutes,
    seconds,
    uptimeString:
      `${days}d ${hours}h ${minutes}m ${seconds}s`,
    usedGB,
    totalGB,
    cpuLoad,
    ping,
    platform:
      `${os.platform()} (${os.arch()})`,
    node:
      process.version
  };
}

function drawRobot(ctx, x, y) {
  ctx.save();

  ctx.shadowColor =
    "rgba(0, 210, 255, 0.7)";
  ctx.shadowBlur = 25;

  ctx.fillStyle = "#dcecff";

  roundRect(
    ctx,
    x,
    y,
    230,
    165,
    40
  );

  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#061321";

  roundRect(
    ctx,
    x + 22,
    y + 25,
    186,
    98,
    28
  );

  ctx.fill();

  ctx.strokeStyle = "#16d9ff";
  ctx.lineWidth = 3;

  roundRect(
    ctx,
    x + 22,
    y + 25,
    186,
    98,
    28
  );

  ctx.stroke();

  ctx.fillStyle = "#19dcff";

  ctx.beginPath();
  ctx.arc(
    x + 75,
    y + 73,
    11,
    0,
    Math.PI * 2
  );
  ctx.arc(
    x + 155,
    y + 73,
    11,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = "#19dcff";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.arc(
    x + 115,
    y + 75,
    40,
    0.2,
    Math.PI - 0.2
  );
  ctx.stroke();

  ctx.fillStyle = "#dcecff";

  roundRect(
    ctx,
    x + 65,
    y + 150,
    100,
    35,
    12
  );

  ctx.fill();

  ctx.strokeStyle = "#19dcff";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(x + 115, y);
  ctx.lineTo(x + 115, y - 25);
  ctx.stroke();

  ctx.fillStyle = "#19dcff";

  ctx.beginPath();
  ctx.arc(
    x + 115,
    y - 32,
    9,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

function drawTimeCard(
  ctx,
  x,
  y,
  label,
  value,
  accent
) {
  ctx.fillStyle =
    "rgba(5, 15, 30, 0.96)";

  roundRect(
    ctx,
    x,
    y,
    275,
    185,
    25
  );

  ctx.fill();

  ctx.save();

  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;

  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;

  roundRect(
    ctx,
    x,
    y,
    275,
    185,
    25
  );

  ctx.stroke();

  ctx.restore();

  ctx.textAlign = "center";

  ctx.fillStyle = accent;
  ctx.font = font(21, "bold");

  ctx.fillText(
    label,
    x + 137,
    y + 38
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = font(68, "bold");

  ctx.shadowColor = accent;
  ctx.shadowBlur = 15;

  ctx.fillText(
    String(value).padStart(2, "0"),
    x + 137,
    y + 115
  );

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#8fa9bd";
  ctx.font = font(18);

  ctx.fillText(
    "SYSTEM TIME",
    x + 137,
    y + 155
  );
}

function drawInfoRow(
  ctx,
  y,
  label,
  value,
  accent
) {
  ctx.textAlign = "left";

  ctx.fillStyle = "#dcecff";
  ctx.font = font(22, "bold");

  ctx.fillText(
    label,
    180,
    y
  );

  ctx.fillStyle = "#667b90";

  ctx.fillText(
    ":",
    505,
    y
  );

  ctx.fillStyle = accent;
  ctx.font = font(22, "bold");

  ctx.fillText(
    value,
    545,
    y
  );

  ctx.strokeStyle =
    "rgba(100,150,190,0.13)";

  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(180, y + 18);
  ctx.lineTo(1220, y + 18);
  ctx.stroke();
}

async function createUptimeImage(
  data,
  botName
) {
  const cacheDir =
    path.join(__dirname, "cache");

  await fs.ensureDir(cacheDir);

  const imagePath =
    path.join(
      cacheDir,
      `uptime_${Date.now()}.png`
    );

  const width = 1400;
  const height = 900;

  const canvas =
    createCanvas(width, height);

  const ctx =
    canvas.getContext("2d");

  const bg =
    ctx.createLinearGradient(
      0,
      0,
      width,
      height
    );

  bg.addColorStop(0, "#030712");
  bg.addColorStop(0.5, "#071a30");
  bg.addColorStop(1, "#02050c");

  ctx.fillStyle = bg;
  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  for (let i = 0; i < 45; i++) {
    const x =
      Math.random() * width;

    const y =
      Math.random() * height;

    ctx.fillStyle =
      "rgba(25,210,255,0.25)";

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      2,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.save();

  ctx.shadowColor =
    "rgba(0,200,255,0.65)";

  ctx.shadowBlur = 25;

  ctx.strokeStyle =
    "#18d7ff";

  ctx.lineWidth = 3;

  roundRect(
    ctx,
    28,
    28,
    width - 56,
    height - 56,
    42
  );

  ctx.stroke();

  ctx.restore();

  drawRobot(
    ctx,
    100,
    75
  );

  ctx.textAlign = "left";

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    font(52, "bold");

  ctx.fillText(
    botName,
    405,
    125
  );

  ctx.fillStyle =
    "#19d9ff";

  ctx.font =
    font(30, "bold");

  ctx.fillText(
    "BOT UPTIME",
    405,
    180
  );

  ctx.fillStyle =
    "#25ed68";

  roundRect(
    ctx,
    405,
    205,
    185,
    50,
    25
  );

  ctx.fill();

  ctx.fillStyle =
    "#05210f";

  ctx.font =
    font(20, "bold");

  ctx.textAlign =
    "center";

  ctx.fillText(
    "●  ONLINE",
    497,
    237
  );

  ctx.fillStyle =
    "rgba(4,15,28,0.97)";

  roundRect(
    ctx,
    65,
    295,
    1270,
    240,
    30
  );

  ctx.fill();

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    font(25, "bold");

  ctx.fillText(
    "SYSTEM RUNNING TIME",
    700,
    325
  );

  drawTimeCard(
    ctx,
    90,
    345,
    "DAYS",
    data.days,
    "#b56cff"
  );

  drawTimeCard(
    ctx,
    390,
    345,
    "HOURS",
    data.hours,
    "#22c9ff"
  );

  drawTimeCard(
    ctx,
    690,
    345,
    "MINUTES",
    data.minutes,
    "#21e4d2"
  );

  drawTimeCard(
    ctx,
    990,
    345,
    "SECONDS",
    data.seconds,
    "#ff68c7"
  );

  ctx.fillStyle =
    "rgba(4,15,28,0.97)";

  roundRect(
    ctx,
    65,
    565,
    1270,
    250,
    30
  );

  ctx.fill();

  ctx.strokeStyle =
    "rgba(25,210,255,0.35)";

  ctx.lineWidth = 2;

  roundRect(
    ctx,
    65,
    565,
    1270,
    250,
    30
  );

  ctx.stroke();

  drawInfoRow(
    ctx,
    615,
    "📶 Ping",
    `${data.ping} ms`,
    "#b56cff"
  );

  drawInfoRow(
    ctx,
    660,
    "🧠 RAM Usage",
    `${data.usedGB} GB / ${data.totalGB} GB`,
    "#21e4d2"
  );

  drawInfoRow(
    ctx,
    705,
    "⚙️ CPU Load",
    `${data.cpuLoad}%`,
    "#ffb52e"
  );

  drawInfoRow(
    ctx,
    750,
    "💻 Platform",
    data.platform,
    "#22c9ff"
  );

  drawInfoRow(
    ctx,
    795,
    "🟢 Node.js",
    data.node,
    "#25ed68"
  );

  ctx.textAlign =
    "center";

  ctx.fillStyle =
    "#25ed68";

  ctx.font =
    font(20, "bold");

  ctx.fillText(
    "SYSTEM IS RUNNING NORMALLY",
    700,
    850
  );

  await new Promise(
    (resolve, reject) => {
      const stream =
        canvas.createPNGStream();

      const output =
        fs.createWriteStream(
          imagePath
        );

      stream.pipe(output);

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
  async function ({
    api,
    event
  }) {
    const {
      threadID,
      messageID
    } = event;

    let imagePath;

    try {
      api.setMessageReaction(
        "⏳",
        messageID,
        () => {},
        true
      );

      const data =
        getSystemData(event);

      const botName =
        String(
          global.config.BOTNAME || "BOT"
        );

      imagePath =
        await createUptimeImage(
          data,
          botName
        );

      const text =
`🤖 ${botName}

🟢 Status: Online
⏱️ Uptime: ${data.uptimeString}

📶 Ping: ${data.ping} ms
🧠 RAM Usage: ${data.usedGB} GB / ${data.totalGB} GB
⚙️ CPU Load: ${data.cpuLoad}%
💻 Platform: ${data.platform}
🟢 Node.js: ${data.node}

🚀 System is running normally.`;

      api.setMessageReaction(
        "✅",
        messageID,
        () => {},
        true
      );

      return api.sendMessage(
        {
          body: text,
          attachment:
            fs.createReadStream(
              imagePath
            )
        },
        threadID,
        () => {
          if (
            imagePath &&
            fs.existsSync(imagePath)
          ) {
            fs.unlinkSync(
              imagePath
            );
          }
        },
        messageID
      );

    } catch (error) {
      console.error(
        "UPTIME ERROR:",
        error
      );

      if (
        imagePath &&
        fs.existsSync(imagePath)
      ) {
        fs.unlinkSync(
          imagePath
        );
      }

      api.setMessageReaction(
        "❌",
        messageID,
        () => {},
        true
      );

      return api.sendMessage(
        "❌ Failed to generate uptime status.",
        threadID,
        messageID
      );
    }
  };
