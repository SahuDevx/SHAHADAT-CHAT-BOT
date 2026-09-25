module.exports.config = {
  name: "remind",
  aliases: ["reminder"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Set a temporary reminder",
  commandCategory: "Utility",
  usages: "remind 10m পানি খাও | remind list | remind cancel 1",
  cooldowns: 3,
  usePrefix: true
};

const reminders = new Map();
let nextReminderId = 1;
const MAX_DELAY = 7 * 24 * 60 * 60 * 1000;

function parseDuration(input) {
  const match = String(input || "").trim().toLowerCase().match(/^(\d+)(s|sec|second|seconds|m|min|minute|minutes|h|hr|hour|hours|d|day|days)$/);
  if (!match) return null;

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    sec: 1000,
    second: 1000,
    seconds: 1000,
    m: 60 * 1000,
    min: 60 * 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    h: 60 * 60 * 1000,
    hr: 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000
  };

  const ms = amount * multipliers[unit];
  if (!amount || ms > MAX_DELAY) return null;

  return { amount, unit, ms };
}

function formatTime(ms) {
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    days ? `${days}d` : null,
    hours ? `${hours}h` : null,
    minutes ? `${minutes}m` : null,
    seconds ? `${seconds}s` : null
  ].filter(Boolean).join(" ");
}

function sendReminder(api, reminder) {
  reminders.delete(reminder.id);

  const tag = "আপনার";
  const body = `⏰ ${tag} Reminder!\n\n📝 ${reminder.text}\n🆔 Reminder ID: ${reminder.id}`;

  return api.sendMessage(
    {
      body,
      mentions: [
        {
          tag,
          id: reminder.senderID,
          fromIndex: body.indexOf(tag)
        }
      ]
    },
    reminder.threadID
  );
}

function listReminders(api, event) {
  const userReminders = [...reminders.values()]
    .filter(item => item.senderID === String(event.senderID) && item.threadID === String(event.threadID))
    .sort((a, b) => a.dueAt - b.dueAt);

  if (!userReminders.length) {
    return api.sendMessage("📭 এই chat-এ আপনার কোনো active reminder নেই।", event.threadID, event.messageID);
  }

  const lines = userReminders.map(item => {
    const left = Math.max(0, item.dueAt - Date.now());
    return `🆔 ${item.id} | ⏳ ${formatTime(left)} | ${item.text}`;
  });

  return api.sendMessage(
    `⏰ 𝗬𝗼𝘂𝗿 𝗥𝗲𝗺𝗶𝗻𝗱𝗲𝗿𝘀\n\n${lines.join("\n")}`,
    event.threadID,
    event.messageID
  );
}

function cancelReminder(api, event, id) {
  const reminder = reminders.get(id);

  if (!reminder || reminder.senderID !== String(event.senderID) || reminder.threadID !== String(event.threadID)) {
    return api.sendMessage("❌ এই ID দিয়ে আপনার কোনো reminder পাওয়া যায়নি।", event.threadID, event.messageID);
  }

  clearTimeout(reminder.timer);
  reminders.delete(id);

  return api.sendMessage(`✅ Reminder #${id} cancel করা হয়েছে।`, event.threadID, event.messageID);
}

module.exports.run = async function ({ api, event, args }) {
  const action = String(args[0] || "").toLowerCase();

  if (action === "list") {
    return listReminders(api, event);
  }

  if (["cancel", "remove", "delete"].includes(action)) {
    const id = Number.parseInt(args[1], 10);
    if (!id) {
      return api.sendMessage("⚠️ Usage: /remind cancel 1", event.threadID, event.messageID);
    }
    return cancelReminder(api, event, id);
  }

  const duration = parseDuration(args[0]);
  const text = args.slice(1).join(" ").trim();

  if (!duration || !text) {
    return api.sendMessage(
      "⏰ 𝗥𝗲𝗺𝗶𝗻𝗱𝗲𝗿\n\n✅ Usage:\n/remind 10m পানি খাও\n/remind 2h পড়তে বসো\n/remind list\n/remind cancel 1\n\n⏱️ Time: s, m, h, d | Max: 7d",
      event.threadID,
      event.messageID
    );
  }

  const id = nextReminderId++;
  const reminder = {
    id,
    text,
    senderID: String(event.senderID),
    threadID: String(event.threadID),
    dueAt: Date.now() + duration.ms,
    timer: null
  };

  reminder.timer = setTimeout(() => sendReminder(api, reminder), duration.ms);
  reminders.set(id, reminder);

  return api.sendMessage(
    `✅ Reminder set করা হয়েছে!\n\n🆔 ID: ${id}\n⏳ Time: ${formatTime(duration.ms)}\n📝 ${text}\n\n⚠️ Note: Bot restart হলে এই temporary reminder মুছে যাবে।`,
    event.threadID,
    event.messageID
  );
};
