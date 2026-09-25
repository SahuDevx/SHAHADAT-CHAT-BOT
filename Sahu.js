const { spawn } = require("child_process");
const path = require("path");

const packageInfo = require("./package.json");

const MAIN_FILE = path.join(__dirname, "Main.js");

console.log("Starting Main.js...");
console.log(`botName: ${packageInfo.name}`);
console.log(`version: ${packageInfo.version}`);

let bot = null;
let shuttingDown = false;

function startBot() {
  bot = spawn(process.execPath, ["--trace-warnings", "--async-stack-traces", MAIN_FILE], {
    cwd: __dirname,
    stdio: "inherit",
    env: {
      ...process.env
    }
  });

  bot.on("error", (error) => {
    console.error("Main.js Error:", error.message);
  });

  bot.on("close", (code) => {
    bot = null;

    if (shuttingDown) {
      process.exit(0);
      return;
    }

    console.log("Main.js stopped.");
    console.log("Exit Code:", code);
    console.log("Automatic restart is disabled.");
  });
}

function stopBot(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (bot && bot.exitCode === null && bot.signalCode === null) {
    try {
      bot.kill(signal);
    } catch (_) {}

    const forceTimer = setTimeout(() => {
      try {
        if (bot) bot.kill("SIGKILL");
      } catch (_) {}
    }, 10000);

    bot.once("close", () => {
      clearTimeout(forceTimer);
      process.exit(0);
    });

    return;
  }

  process.exit(0);
}

process.on("SIGINT", () => stopBot("SIGINT"));
process.on("SIGTERM", () => stopBot("SIGTERM"));

process.on("exit", () => {
  if (bot && bot.exitCode === null && bot.signalCode === null) {
    try {
      bot.kill("SIGKILL");
    } catch (_) {}
  }
});

startBot();
