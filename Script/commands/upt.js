const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { createCanvas } = require("canvas");

module.exports.config = {
  name: "upt",
  aliases: ["up", "rtm"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Show bot uptime with Banner.",
  commandCategory: "System",
  usages: "upt",
  cooldowns: 5
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawRobot(ctx, x, y) {
  ctx.save();

  ctx.shadowColor = "rgba(0,210,255,0.8)";
  ctx.shadowBlur = 30;

  ctx.fillStyle = "#dcecff";
  roundRect(ctx, x, y, 245, 180, 48);
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#061321";
  roundRect(ctx, x + 25, y + 28, 195, 105, 30);
  ctx.fill();

  ctx.strokeStyle = "#18d9ff";
  ctx.lineWidth = 3;
  roundRect(ctx, x + 25, y + 28, 195, 105, 30);
  ctx.stroke();

  ctx.fillStyle = "#1be0ff";

  ctx.beginPath();
  ctx.arc(x + 82, y + 77, 12, 0, Math.PI * 2);
  ctx.arc(x + 163, y + 77, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1be0ff";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.arc(x + 122, y + 80, 45, 0.25, Math.PI - 0.25);
  ctx.stroke();

  ctx.fillStyle = "#dcecff";
  roundRect(ctx, x + 70, y + 165, 105, 42, 15);
  ctx.fill();

  ctx.strokeStyle = "#18d9ff";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(x + 122, y);
  ctx.lineTo(x + 122, y - 25);
  ctx.stroke();

  ctx.fillStyle = "#18d9ff";
  ctx.beginPath();
  ctx.arc(x + 122, y - 32, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#bdd3e5";
  roundRect(ctx, x - 13, y + 62, 18, 55, 8);
  ctx.fill();

  roundRect(ctx, x + 240, y + 62, 18, 55, 8);
  ctx.fill();

  ctx.restore();
}

function drawCircuit(ctx, width, height) {
  ctx.save();

  ctx.strokeStyle = "rgba(20,150,230,0.20)";
  ctx.lineWidth = 2;

  for (let i = 0; i < 14; i++) {
    const y = 55 + i * 52;

    ctx.beginPath();
    ctx.moveTo(45, y);
    ctx.lineTo(130, y);

    if (i % 2 === 0) {
      ctx.lineTo(160, y + 30);
      ctx.lineTo(245, y + 30);
    }

    ctx.stroke();
  }

  for (let i = 0; i < 10; i++) {
    const x = 950 + i * 45;

    ctx.beginPath();
    ctx.moveTo(x, 50);
    ctx.lineTo(x + 30, 80);
    ctx.lineTo(x + 110, 80);
    ctx.stroke();
  }

  ctx.fillStyle = "#12cfff";

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    ctx.globalAlpha = 0.3;

    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawTimeCard(ctx, x, y, label, value) {
  ctx.fillStyle = "rgba(3,14,27,0.95)";
  roundRect(ctx, x, y, 350, 205, 28);
  ctx.fill();

  ctx.save();

  ctx.shadowColor = "rgba(0,200,255,0.65)";
  ctx.shadowBlur = 22;

  ctx.strokeStyle = "#12cfff";
  ctx.lineWidth = 3;

  roundRect(ctx, x, y, 350, 205, 28);
  ctx.stroke();

  ctx.restore();

  ctx.fillStyle = "#18d9ff";
  ctx.font = "bold 72px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = "#00cfff";
  ctx.shadowBlur = 18;

  ctx.fillText(
    String(value).padStart(2, "0"),
    x + 175,
    y + 105
  );

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Arial";

  ctx.fillText(
    label,
    x + 175,
    y + 165
  );
}

function getSystemData() {
  const uptime = process.uptime();

  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();

  const usedMemory = (
    (totalMemory - freeMemory) /
    1024 /
    1024 /
    1024
  ).toFixed(2);

  const totalMemoryGB = (
    totalMemory /
    1024 /
    1024 /
    1024
  ).toFixed(2);

  const cpus = os.cpus();

  let idle = 0;
  let total = 0;

  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }

    idle += cpu.times.idle;
  });

  const cpuLoad = total
    ? ((1 - idle / total) * 100).toFixed(1)
    : "0.0";

  return {
    days,
    hours,
    minutes,
    seconds,
    usedMemory,
    totalMemoryGB,
    cpuLoad,
    cpuCount: cpus.length,
    node: process.version
  };
}

async function createUptimeImage(data) {
  const cacheDir = path.join(__dirname, "cache");

  await fs.ensureDir(cacheDir);

  const filePath = path.join(
    cacheDir,
    `upt_${Date.now()}.png`
  );

  const width = 1400;
  const height = 800;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(
    0,
    0,
    width,
    height
  );

  bg.addColorStop(0, "#010713");
  bg.addColorStop(0.45, "#06182c");
  bg.addColorStop(1, "#01050c");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  drawCircuit(ctx, width, height);

  ctx.save();

  ctx.shadowColor = "rgba(0,190,255,0.7)";
  ctx.shadowBlur = 30;

  ctx.strokeStyle = "#19cfff";
  ctx.lineWidth = 4;

  roundRect(
    ctx,
    28,
    28,
    width - 56,
    height - 56,
    45
  );

  ctx.stroke();

  ctx.restore();

  drawRobot(ctx, 125, 95);

  ctx.textAlign = "left";

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 66px Arial";

  ctx.fillText("BOT", 500, 140);

  ctx.fillStyle = "#19d9ff";
  ctx.font = "bold 86px Arial";

  ctx.shadowColor = "rgba(0,210,255,0.75)";
  ctx.shadowBlur = 25;

  ctx.fillText("UPTIME", 500, 225);

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#dffaff";
  ctx.font = "bold 28px Arial";

  ctx.fillText(
    "SYSTEM STATUS:",
    505,
    278
  );

  ctx.fillStyle = "#2bea62";

  ctx.fillText(
    "ONLINE",
    755,
    278
  );

  ctx.beginPath();
  ctx.arc(890, 268, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(2,13,26,0.96)";

  roundRect(
    ctx,
    70,
    315,
    1260,
    405,
    34
  );

  ctx.fill();

  ctx.strokeStyle = "rgba(18,207,255,0.55)";
  ctx.lineWidth = 2;

  roundRect(
    ctx,
    70,
    315,
    1260,
    405,
    34
  );

  ctx.stroke();

  ctx.textAlign = "center";

  ctx.fillStyle = "#e9fbff";
  ctx.font = "bold 29px Arial";

  ctx.fillText(
    "SYSTEM RUNNING TIME",
    700,
    360
  );

  drawTimeCard(
    ctx,
    105,
    395,
    "DAYS",
    data.days
  );

  drawTimeCard(
    ctx,
    525,
    395,
    "HOURS",
    data.hours
  );

  drawTimeCard(
    ctx,
    945,
    395,
    "MINUTES",
    data.minutes
  );

  ctx.fillStyle = "#18d9ff";
  ctx.font = "bold 25px Arial";

  ctx.fillText(
    `SECONDS  ${String(data.seconds).padStart(2, "0")}`,
    700,
    635
  );

  ctx.fillStyle = "#bdefff";
  ctx.font = "20px Arial";

  ctx.fillText(
    `RAM ${data.usedMemory} GB / ${data.totalMemoryGB} GB  •  CPU ${data.cpuLoad}%  •  Node ${data.node}`,
    700,
    670
  );

  ctx.fillStyle = "#18d9ff";
  ctx.font = "bold 22px Arial";

  ctx.fillText(
    "YOUR MESSENGER ROBOT IS RUNNING 24/7",
    700,
    705
  );

  await new Promise((resolve, reject) => {
    const stream = canvas.createPNGStream();
    const output = fs.createWriteStream(filePath);

    stream.pipe(output);

    output.on("finish", resolve);
    output.on("error", reject);
  });

  return filePath;
}

module.exports.run = async function ({
  api,
  event
}) {
  const {
    threadID,
    messageID
  } = event;

  let filePath;

  try {
    api.setMessageReaction(
      "⏳",
      messageID,
      () => {},
      true
    );

    const data = getSystemData();

    filePath = await createUptimeImage(data);

    const uptimeText =
      `${data.days}d ${data.hours}h ${data.minutes}m ${data.seconds}s`;

    const text = `🤖 BOT UPTIME

⏱️ Uptime: ${uptimeText}
🟢 Status: Online

💻 Node: ${data.node}
⚙️ CPU: ${data.cpuLoad}% (${data.cpuCount} cores)
💾 RAM: ${data.usedMemory} GB / ${data.totalMemoryGB} GB

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
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      },
      messageID
    );

  } catch (error) {
    console.error(
      "UPT ERROR:",
      error
    );

    if (
      filePath &&
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);
    }

    api.setMessageReaction(
      "❌",
      messageID,
      () => {},
      true
    );

    return api.sendMessage(
      "❌ Failed to generate uptime.",
      threadID,
      messageID
    );
  }
};
