const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

module.exports.config = {
  name: "bank",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Stable Virtual Banking System",
  commandCategory: "Games",
  cooldowns: 2,
  usePrefix: true
};

const BANK_PATH = path.join(__dirname, "cache", "bankData.json");
const TIME_ZONE = "Asia/Dhaka";
const DAILY_BONUS = 1000;
const INTEREST_RATE = 0.10;
const MAX_LOAN = 1000000;
const HISTORY_LIMIT = 50;
const HISTORY_DISPLAY_LIMIT = 10;
const REPLY_TTL = 10 * 60 * 1000;
const MAX_SAFE_MONEY = Number.MAX_SAFE_INTEGER;
const DATA_LOCK_KEY = "__virtualBankDataQueue";
const CONSUMED_REPLY_KEY = "__virtualBankConsumedReplies";

function createStore() {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    users: Object.create(null)
  };
}

function cleanText(value, maxLength) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength || 120);
}

function cleanName(value, id) {
  return cleanText(value, 80) || `User ${id}`;
}

function storedMoney(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0 || number > MAX_SAFE_MONEY) {
    return fallback == null ? 0 : fallback;
  }

  return Math.floor(number);
}

function formatMoney(value) {
  return storedMoney(value).toLocaleString("en-US");
}

function zonedParts(options) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    ...options
  }).formatToParts(new Date());

  return parts.reduce((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});
}

function dateKey() {
  const parts = zonedParts({
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isoNow() {
  return new Date().toISOString();
}

function now() {
  const parts = zonedParts({
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  return `${parts.month} ${parts.day}, ${parts.year}, ${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
}

function displayDate(value) {
  const text = cleanText(value, 80);

  if (!/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    return text || now();
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return text || now();
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).formatToParts(date).reduce((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});

  return `${parts.month} ${parts.day}, ${parts.year}, ${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
}

function normalizeDateKey(value) {
  const text = cleanText(value, 20);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  if (/^\d{8}$/.test(text)) {
    return `${text.slice(4)}-${text.slice(2, 4)}-${text.slice(0, 2)}`;
  }

  return null;
}

function normalizeHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) {
    return [];
  }

  return rawHistory.slice(-HISTORY_LIMIT).map((item) => ({
    id:
      cleanText(item && item.id, 80) ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: cleanText(item && item.type, 30) || "UNKNOWN",
    amount: storedMoney(item && item.amount),
    balanceAfter: storedMoney(item && item.balanceAfter),
    loanAfter: storedMoney(item && item.loanAfter),
    timestamp:
      cleanText(item && (item.timestamp || item.at), 80) || isoNow(),
    note: cleanText(item && (item.note || item.details), 120)
  }));
}

function normalizeUser(raw, fallbackId) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = cleanText(raw.id || fallbackId, 80);

  if (!/^\d+$/.test(id)) {
    return null;
  }

  const rawLoan =
    raw.loan && typeof raw.loan === "object"
      ? raw.loan.outstanding == null
        ? raw.loan.due
        : raw.loan.outstanding
      : raw.loan;

  const rawPrincipal =
    raw.loan && typeof raw.loan === "object"
      ? raw.loan.principal
      : raw.loanPrincipal;

  const rawInterest =
    raw.loan && typeof raw.loan === "object"
      ? raw.loan.interest
      : raw.loanInterest;

  const rawDaily =
    raw.dailyBonus && typeof raw.dailyBonus === "object"
      ? raw.dailyBonus.lastClaimed
      : raw.daily;

  const rawHistory =
    raw.history || raw.transactions || raw.transactionHistory;

  const loan = storedMoney(rawLoan);
  const principal = storedMoney(rawPrincipal);
  const interest = storedMoney(rawInterest);

  return {
    id,
    name: cleanName(raw.name, id),
    balance: storedMoney(raw.balance),
    loan,
    loanPrincipal: Math.min(principal, loan),
    loanInterest: Math.min(interest, loan),
    loanTakenAt: cleanText(raw.loanTakenAt, 80) || null,
    dailyBonus: {
      lastClaimed: normalizeDateKey(rawDaily)
    },
    createdAt:
      cleanText(raw.createdAt || raw.created, 80) || isoNow(),
    history: normalizeHistory(rawHistory)
  };
}

function normalizeStore(raw) {
  const store = createStore();
  const entries = [];

  if (Array.isArray(raw)) {
    raw.forEach((user) => {
      entries.push([user && user.id, user]);
    });
  } else if (
    raw &&
    typeof raw === "object" &&
    raw.users &&
    typeof raw.users === "object"
  ) {
    Object.entries(raw.users).forEach(([id, user]) => {
      entries.push([id, user]);
    });
  } else if (raw && typeof raw === "object") {
    Object.entries(raw).forEach(([id, user]) => {
      if (
        user &&
        typeof user === "object" &&
        ("balance" in user || "loan" in user)
      ) {
        entries.push([id, user]);
      }
    });
  }

  entries.forEach(([id, rawUser]) => {
    const user = normalizeUser(rawUser, id);

    if (user) {
      store.users[user.id] = user;
    }
  });

  return store;
}

async function atomicWrite(store) {
  const directory = path.dirname(BANK_PATH);

  await fsp.mkdir(directory, {
    recursive: true
  });

  const temporaryPath = `${BANK_PATH}.${process.pid}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2, 10)}.tmp`;

  let handle;

  try {
    handle = await fsp.open(temporaryPath, "w", 0o600);

    await handle.writeFile(
      `${JSON.stringify(store, null, 2)}\n`,
      "utf8"
    );

    await handle.sync();
    await handle.close();

    handle = null;

    await fsp.rename(temporaryPath, BANK_PATH);
  } finally {
    if (handle) {
      await handle.close().catch(() => {});
    }

    await fsp.unlink(temporaryPath).catch(() => {});
  }
}

async function ensureStorage() {
  await fsp.mkdir(path.dirname(BANK_PATH), {
    recursive: true
  });

  try {
    await fsp.access(BANK_PATH, fs.constants.F_OK);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    await atomicWrite(createStore());
  }
}

async function readStore() {
  await ensureStorage();

  let raw;

  try {
    raw = await fsp.readFile(BANK_PATH, "utf8");
  } catch (error) {
    console.error(
      "[bank] Could not read bankData.json:",
      error.message
    );

    throw error;
  }

  try {
    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    console.error(
      "[bank] bankData.json is corrupted:",
      error.message
    );

    const storageError = new Error("Bank data is corrupted");
    storageError.code = "BANK_DATA_CORRUPTED";

    throw storageError;
  }
}

async function writeStore(store) {
  store.schemaVersion = 1;
  store.updatedAt = new Date().toISOString();

  await atomicWrite(store);
}

function withDataLock(task) {
  const previous = global[DATA_LOCK_KEY] || Promise.resolve();

  let release;

  const current = new Promise((resolve) => {
    release = resolve;
  });

  global[DATA_LOCK_KEY] = current;

  return previous
    .then(task)
    .finally(() => release());
}

function consumeReply(handleReply, threadID, senderID) {
  if (!handleReply.messageID) {
    return true;
  }

  const key = `${threadID}:${senderID}:${handleReply.messageID}`;
  const consumed = global[CONSUMED_REPLY_KEY] || new Set();

  if (consumed.has(key)) {
    return false;
  }

  consumed.add(key);

  if (consumed.size > 10000) {
    const first = consumed.values().next().value;
    consumed.delete(first);
  }

  global[CONSUMED_REPLY_KEY] = consumed;

  return true;
}

function isValidUserID(id) {
  return /^\d+$/.test(String(id == null ? "" : id));
}

async function resolveName(Users, id) {
  try {
    if (Users && typeof Users.getNameUser === "function") {
      const name = await Users.getNameUser(id);

      if (name) {
        return cleanName(name, id);
      }
    }
  } catch (error) {
    console.error(
      `[bank] Could not get name for ${id}:`,
      error.message
    );
  }

  return `User ${id}`;
}

function createUser(id, name) {
  return {
    id: String(id),
    name: cleanName(name, id),
    balance: 0,
    loan: 0,
    loanPrincipal: 0,
    loanInterest: 0,
    loanTakenAt: null,
    dailyBonus: {
      lastClaimed: null
    },
    createdAt: isoNow(),
    history: []
  };
}

async function ensureUser(store, id, Users) {
  const key = String(id);

  if (store.users[key]) {
    return {
      user: store.users[key],
      created: false
    };
  }

  const user = createUser(
    key,
    await resolveName(Users, key)
  );

  store.users[key] = user;

  return {
    user,
    created: true
  };
}

function transactionID() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function addHistory(user, type, amount, options) {
  const extra = options || {};

  const item = {
    id: extra.id || transactionID(),
    type,
    amount: storedMoney(amount),
    balanceAfter: storedMoney(user.balance),
    loanAfter: storedMoney(user.loan),
    timestamp: isoNow(),
    note: cleanText(extra.note, 120)
  };

  if (
    extra.counterpartyId &&
    isValidUserID(extra.counterpartyId)
  ) {
    item.counterpartyId = String(extra.counterpartyId);
  }

  user.history.push(item);

  if (user.history.length > HISTORY_LIMIT) {
    user.history.splice(
      0,
      user.history.length - HISTORY_LIMIT
    );
  }
}

function parseAmount(value, maximum) {
  const text = String(value == null ? "" : value).trim();

  if (!/^\d+$/.test(text)) {
    return null;
  }

  const amount = Number(text);
  const max =
    maximum == null ? MAX_SAFE_MONEY : maximum;

  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    amount > max
  ) {
    return null;
  }

  return amount;
}

function canAdd(balance, amount) {
  return (
    Number.isSafeInteger(balance) &&
    Number.isSafeInteger(amount) &&
    balance <= MAX_SAFE_MONEY - amount
  );
}

function level(balance) {
  if (balance >= 1000000000000) {
    return "👑 Trillionaire";
  }

  if (balance >= 1000000000) {
    return "💎 Billionaire";
  }

  if (balance >= 100000000) {
    return "🏆 Multi Millionaire";
  }

  if (balance >= 10000000) {
    return "🥇 Millionaire";
  }

  if (balance >= 1000000) {
    return "🥈 Elite";
  }

  if (balance >= 100000) {
    return "🥉 Pro";
  }

  return "🌱 Beginner";
}

async function getWallet(Currencies, id) {
  if (
    !Currencies ||
    typeof Currencies.getData !== "function"
  ) {
    throw new Error("Currencies.getData is unavailable");
  }

  const data = await Currencies.getData(id);
  const rawMoney =
    data && data.money != null ? data.money : 0;

  const wallet = Number(rawMoney);

  if (
    !Number.isSafeInteger(wallet) ||
    wallet < 0
  ) {
    throw new Error("Wallet contains an invalid amount");
  }

  return wallet;
}

async function changeWallet(Currencies, id, delta) {
  if (!Currencies) {
    throw new Error("Currencies API is unavailable");
  }

  let result;

  if (
    delta > 0 &&
    typeof Currencies.increaseMoney === "function"
  ) {
    result = await Currencies.increaseMoney(id, delta);
  } else if (
    delta < 0 &&
    typeof Currencies.decreaseMoney === "function"
  ) {
    result = await Currencies.decreaseMoney(
      id,
      Math.abs(delta)
    );
  } else {
    throw new Error("Currencies API method is unavailable");
  }

  if (result === false) {
    throw new Error(
      "Currencies API rejected the wallet update"
    );
  }
}

async function commitWithWalletChange(
  Currencies,
  id,
  delta,
  commit
) {
  await changeWallet(Currencies, id, delta);

  try {
    await commit();
  } catch (error) {
    try {
      await changeWallet(Currencies, id, -delta);
    } catch (rollbackError) {
      error.rollbackFailed = true;

      console.error(
        "[bank] Wallet rollback failed:",
        rollbackError
      );
    }

    throw error;
  }
}

function registerReply(payload, error, info) {
  if (error || !info || !info.messageID) {
    console.error(
      "[bank] Could not register reply handler:",
      error || "Missing messageID"
    );

    return;
  }

  global.client = global.client || {};

  if (!Array.isArray(global.client.handleReply)) {
    global.client.handleReply = [];
  }

  global.client.handleReply.push({
    name: "bank",
    messageID: info.messageID,
    author: String(payload.author),
    threadID: String(payload.threadID),
    type: payload.type,
    target: payload.target || null,
    createdAt: Date.now()
  });
}

function sendPrompt(api, threadID, text, payload) {
  return api.sendMessage(
    text,
    threadID,
    (error, info) => {
      registerReply(payload, error, info);
    }
  );
}

function ask(ctx, text, type, extra) {
  return sendPrompt(ctx.api, ctx.threadID, text, {
    author: ctx.senderID,
    threadID: ctx.threadID,
    type,
    ...(extra || {})
  });
}

function menu(name) {
  return `🏦 Virtual Banking System

Hello, ${cleanName(name, "User")} 👋

1️⃣ Balance
2️⃣ Deposit
3️⃣ Withdraw
4️⃣ Transfer
5️⃣ Take Loan
6️⃣ Repay Loan
7️⃣ Daily Bonus
8️⃣ Top Rich Users
9️⃣ Wallet Check
🔟 Account Info
1️⃣1️⃣ Transaction History
1️⃣2️⃣ Bank Info
1️⃣3️⃣ Account Reset

Reply with a number.`;
}

function historyMessage(user) {
  const rows = user.history
    .slice(-HISTORY_DISPLAY_LIMIT)
    .reverse();

  if (!rows.length) {
    return "📜 Transaction History\n\nNo transactions yet.";
  }

  const labels = {
    DEPOSIT: ["Deposit", "+"],
    WITHDRAW: ["Withdraw", "-"],
    TRANSFER_OUT: ["Transfer out", "-"],
    TRANSFER_IN: ["Transfer in", "+"],
    LOAN: ["Loan received", "+"],
    REPAY: ["Loan repayment", "-"],
    DAILY_BONUS: ["Daily bonus", "+"],
    RESET: ["Account reset", "-"]
  };

  let message = "📜 Transaction History\n\n";

  rows.forEach((item, index) => {
    const label = labels[item.type] || [
      item.type,
      ""
    ];

    const amount = item.amount
      ? ` ${label[1]}$${formatMoney(item.amount)}`
      : "";

    const note = item.note
      ? ` — ${item.note}`
      : "";

    message += `${index + 1}. ${label[0]}${amount}${note}\n`;
    message += `   ${displayDate(item.timestamp)}\n`;
  });

  return message.trim();
}

function sendOperationError(api, threadID, error) {
  console.error("[bank] Operation failed:", error);

  if (
    error &&
    error.code === "BANK_DATA_CORRUPTED"
  ) {
    return api.sendMessage(
      "⚠️ Bank data could not be read. No changes were made. Please contact the bot owner.",
      threadID
    );
  }

  const message =
    error && error.rollbackFailed
      ? "⚠️ Transaction failed and wallet rollback also needs attention. Please do not retry immediately."
      : "⚠️ Operation failed. No bank change was saved. Please try again.";

  return api.sendMessage(message, threadID);
}

async function handleMenuAction(ctx) {
  const {
    api,
    threadID,
    store,
    user,
    body,
    Currencies
  } = ctx;

  if (body === "1") {
    return api.sendMessage(
      `👤 ${user.name}

💰 Bank Balance: $${formatMoney(user.balance)}
💸 Outstanding Loan: $${formatMoney(user.loan)}
🏆 Level: ${level(user.balance)}
🕒 ${now()}`,
      threadID
    );
  }

  if (body === "2") {
    return ask(
      ctx,
      "Enter a whole deposit amount:",
      "deposit"
    );
  }

  if (body === "3") {
    return ask(
      ctx,
      "Enter a whole withdraw amount:",
      "withdraw"
    );
  }

  if (body === "4") {
    return ask(
      ctx,
      "Mention exactly one user to transfer to:",
      "transferUser"
    );
  }

  if (body === "5") {
    return ask(
      ctx,
      `Enter a loan amount. Maximum: $${formatMoney(
        MAX_LOAN
      )}. Interest: 10%:`,
      "loan"
    );
  }

  if (body === "6") {
    return ask(
      ctx,
      "Enter the whole amount to repay:",
      "repay"
    );
  }

  if (body === "7") {
    const today = dateKey();

    if (user.dailyBonus.lastClaimed === today) {
      return api.sendMessage(
        "🎁 Daily bonus already claimed today.",
        threadID
      );
    }

    if (!canAdd(user.balance, DAILY_BONUS)) {
      return api.sendMessage(
        "⚠️ Your bank balance is too large to receive this bonus.",
        threadID
      );
    }

    user.balance += DAILY_BONUS;
    user.dailyBonus.lastClaimed = today;

    addHistory(
      user,
      "DAILY_BONUS",
      DAILY_BONUS,
      {
        note: "Daily bonus"
      }
    );

    await writeStore(store);

    return api.sendMessage(
      `🎁 Daily bonus: +$${formatMoney(
        DAILY_BONUS
      )}\nBank Balance: $${formatMoney(user.balance)}`,
      threadID
    );
  }

  if (body === "8") {
    const users = Object.values(store.users)
      .sort(
        (first, second) =>
          second.balance - first.balance ||
          first.name.localeCompare(second.name)
      )
      .slice(0, 10);

    let message = "🏆 Top Rich Users\n\n";

    users.forEach((item, index) => {
      message += `${index + 1}. ${item.name} — $${formatMoney(
        item.balance
      )}\n`;
    });

    return api.sendMessage(message.trim(), threadID);
  }

  if (body === "9") {
    const wallet = await getWallet(
      Currencies,
      ctx.senderID
    );

    return api.sendMessage(
      `👛 Wallet Money: $${formatMoney(wallet)}`,
      threadID
    );
  }

  if (body === "10") {
    return api.sendMessage(
      `👤 Account Info

Name: ${user.name}
ID: ${user.id}
Level: ${level(user.balance)}
Created: ${displayDate(user.createdAt)}
🕒 ${now()}`,
      threadID
    );
  }

  if (body === "11") {
    return api.sendMessage(
      historyMessage(user),
      threadID
    );
  }

  if (body === "12") {
    return api.sendMessage(
      `🏦 Bank Information

Interest: 10% manual loan interest
Maximum loan: $${formatMoney(MAX_LOAN)}
Daily bonus: $${formatMoney(DAILY_BONUS)}
History limit: ${HISTORY_LIMIT} records
Timezone: ${TIME_ZONE}
🕒 ${now()}`,
      threadID
    );
  }

  if (body === "13") {
    if (user.loan > 0) {
      return api.sendMessage(
        "⚠️ Account reset is blocked while an unpaid loan exists. Repay the loan first.",
        threadID
      );
    }

    return ask(
      ctx,
      "⚠️ Reset will permanently clear your bank balance. Daily bonus eligibility and transaction history will be kept for security.\n\nReply RESET to confirm or anything else to cancel.",
      "resetConfirm"
    );
  }

  return api.sendMessage(
    "Please reply with a valid menu number from 1 to 13.",
    threadID
  );
}

async function handleTransferUser(ctx) {
  const mentionIDs = Object.keys(
    ctx.event.mentions || {}
  ).filter(isValidUserID);

  if (mentionIDs.length !== 1) {
    return ctx.api.sendMessage(
      "⚠️ Mention exactly one valid user.",
      ctx.threadID
    );
  }

  const targetID = String(mentionIDs[0]);

  if (targetID === ctx.senderID) {
    return ctx.api.sendMessage(
      "⚠️ Self-transfer is not allowed.",
      ctx.threadID
    );
  }

  return ask(
    ctx,
    "Enter the whole transfer amount:",
    "transferAmount",
    {
      target: targetID
    }
  );
}

async function handleAmountReply(ctx, handleReply) {
  const {
    api,
    threadID,
    store,
    user,
    body,
    senderID,
    Currencies,
    Users
  } = ctx;

  if (handleReply.type === "deposit") {
    const amount = parseAmount(body);

    if (!amount) {
      return api.sendMessage(
        "⚠️ Enter a positive whole number only.",
        threadID
      );
    }

    if (!canAdd(user.balance, amount)) {
      return api.sendMessage(
        "⚠️ This amount exceeds the supported balance limit.",
        threadID
      );
    }

    const wallet = await getWallet(
      Currencies,
      senderID
    );

    if (wallet < amount) {
      return api.sendMessage(
        "⚠️ Not enough wallet money.",
        threadID
      );
    }

    await commitWithWalletChange(
      Currencies,
      senderID,
      -amount,
      async () => {
        user.balance += amount;

        addHistory(
          user,
          "DEPOSIT",
          amount,
          {
            note: "Wallet to bank"
          }
        );

        await writeStore(store);
      }
    );

    return api.sendMessage(
      `✅ Deposit successful: +$${formatMoney(
        amount
      )}\nBank Balance: $${formatMoney(user.balance)}`,
      threadID
    );
  }

  if (handleReply.type === "withdraw") {
    const amount = parseAmount(body);

    if (!amount) {
      return api.sendMessage(
        "⚠️ Enter a positive whole number only.",
        threadID
      );
    }

    if (user.balance < amount) {
      return api.sendMessage(
        "⚠️ Not enough bank balance.",
        threadID
      );
    }

    await commitWithWalletChange(
      Currencies,
      senderID,
      amount,
      async () => {
        user.balance -= amount;

        addHistory(
          user,
          "WITHDRAW",
          amount,
          {
            note: "Bank to wallet"
          }
        );

        await writeStore(store);
      }
    );

    return api.sendMessage(
      `✅ Withdraw successful: -$${formatMoney(
        amount
      )}\nBank Balance: $${formatMoney(user.balance)}`,
      threadID
    );
  }

  if (handleReply.type === "transferAmount") {
    const targetID = String(handleReply.target || "");
    const amount = parseAmount(body);

    if (
      !isValidUserID(targetID) ||
      targetID === senderID
    ) {
      return api.sendMessage(
        "⚠️ Invalid recipient. Self-transfer is not allowed.",
        threadID
      );
    }

    if (!amount) {
      return api.sendMessage(
        "⚠️ Enter a positive whole number only.",
        threadID
      );
    }

    if (user.balance < amount) {
      return api.sendMessage(
        "⚠️ Not enough bank balance.",
        threadID
      );
    }

    const targetResult = await ensureUser(
      store,
      targetID,
      Users
    );

    const target = targetResult.user;

    if (!canAdd(target.balance, amount)) {
      return api.sendMessage(
        "⚠️ Recipient balance cannot hold this amount.",
        threadID
      );
    }

    const transferID = transactionID();

    user.balance -= amount;
    target.balance += amount;

    addHistory(
      user,
      "TRANSFER_OUT",
      amount,
      {
        id: transferID,
        note: `To ${target.name}`,
        counterpartyId: targetID
      }
    );

    addHistory(
      target,
      "TRANSFER_IN",
      amount,
      {
        id: transferID,
        note: `From ${user.name}`,
        counterpartyId: senderID
      }
    );

    await writeStore(store);

    return api.sendMessage(
      `✅ Transfer complete

From: ${user.name}
To: ${target.name}
Amount: $${formatMoney(amount)}
Bank Balance: $${formatMoney(user.balance)}`,
      threadID
    );
  }

  if (handleReply.type === "loan") {
    const amount = parseAmount(body, MAX_LOAN);

    if (!amount) {
      return api.sendMessage(
        `⚠️ Enter a positive whole number up to $${formatMoney(
          MAX_LOAN
        )}.`,
        threadID
      );
    }

    if (user.loan > 0) {
      return api.sendMessage(
        `⚠️ Repay your existing loan of $${formatMoney(
          user.loan
        )} before taking another loan.`,
        threadID
      );
    }

    const interest = Math.ceil(
      amount * INTEREST_RATE
    );

    const total = amount + interest;

    if (!canAdd(0, total)) {
      return api.sendMessage(
        "⚠️ This loan amount is too large.",
        threadID
      );
    }

    await commitWithWalletChange(
      Currencies,
      senderID,
      amount,
      async () => {
        user.loan = total;
        user.loanPrincipal = amount;
        user.loanInterest = interest;
        user.loanTakenAt = isoNow();

        addHistory(
          user,
          "LOAN",
          amount,
          {
            note: `Repayment due $${formatMoney(total)}`
          }
        );

        await writeStore(store);
      }
    );

    return api.sendMessage(
      `✅ Loan approved

Received: $${formatMoney(amount)}
Interest: $${formatMoney(interest)}
Repayment due: $${formatMoney(total)}`,
      threadID
    );
  }

  if (handleReply.type === "repay") {
    const amount = parseAmount(body);

    if (!amount) {
      return api.sendMessage(
        "⚠️ Enter a positive whole number only.",
        threadID
      );
    }

    if (user.loan <= 0) {
      return api.sendMessage(
        "✅ You have no outstanding loan.",
        threadID
      );
    }

    if (amount > user.loan) {
      return api.sendMessage(
        `⚠️ Repayment cannot exceed $${formatMoney(
          user.loan
        )}.`,
        threadID
      );
    }

    const wallet = await getWallet(
      Currencies,
      senderID
    );

    if (wallet < amount) {
      return api.sendMessage(
        "⚠️ Not enough wallet money.",
        threadID
      );
    }

    await commitWithWalletChange(
      Currencies,
      senderID,
      -amount,
      async () => {
        user.loan -= amount;

        if (user.loan === 0) {
          user.loanPrincipal = 0;
          user.loanInterest = 0;
          user.loanTakenAt = null;
        }

        addHistory(
          user,
          "REPAY",
          amount,
          {
            note: "Wallet loan repayment"
          }
        );

        await writeStore(store);
      }
    );

    return api.sendMessage(
      `✅ Loan repayment successful: -$${formatMoney(
        amount
      )}\nRemaining loan: $${formatMoney(user.loan)}`,
      threadID
    );
  }

  if (handleReply.type === "resetConfirm") {
    if (
      cleanText(body, 20).toUpperCase() !== "RESET"
    ) {
      return api.sendMessage(
        "Account reset cancelled. Your data is unchanged.",
        threadID
      );
    }

    if (user.loan > 0) {
      return api.sendMessage(
        "⚠️ Reset blocked because an unpaid loan exists.",
        threadID
      );
    }

    const clearedBalance = user.balance;

    user.balance = 0;
    user.loan = 0;
    user.loanPrincipal = 0;
    user.loanInterest = 0;
    user.loanTakenAt = null;

    addHistory(
      user,
      "RESET",
      clearedBalance,
      {
        note: "Bank balance reset"
      }
    );

    await writeStore(store);

    return api.sendMessage(
      "✅ Account reset successful. Bank balance is now $0. Daily bonus status and history were preserved.",
      threadID
    );
  }

  return api.sendMessage(
    "⚠️ This banking session is no longer valid. Please use /bank again.",
    threadID
  );
}

module.exports.run = async function ({
  api,
  event,
  Users
}) {
  const threadID = event.threadID;
  const senderID = String(
    event.senderID == null ? "" : event.senderID
  );

  if (!isValidUserID(senderID)) {
    return api.sendMessage(
      "⚠️ Invalid user account ID.",
      threadID
    );
  }

  try {
    return await withDataLock(async () => {
      const store = await readStore();

      const result = await ensureUser(
        store,
        senderID,
        Users
      );

      if (result.created) {
        await writeStore(store);
      }

      return api.sendMessage(
        menu(result.user.name),
        threadID,
        (error, info) => {
          registerReply(
            {
              author: senderID,
              threadID,
              type: "menu"
            },
            error,
            info
          );
        }
      );
    });
  } catch (error) {
    console.error(
      "[bank] Could not open account:",
      error
    );

    const message =
      error &&
      error.code === "BANK_DATA_CORRUPTED"
        ? "⚠️ Bank data could not be read. No changes were made. Please contact the bot owner."
        : "⚠️ Banking service is temporarily unavailable. Please try again later.";

    return api.sendMessage(message, threadID);
  }
};

module.exports.handleReply = async function ({
  api,
  event,
  handleReply,
  Currencies,
  Users
}) {
  const threadID = event.threadID;
  const senderID = String(
    event.senderID == null ? "" : event.senderID
  );

  if (
    !handleReply ||
    (handleReply.name &&
      handleReply.name !== "bank")
  ) {
    return;
  }

  if (
    String(handleReply.author) !== senderID
  ) {
    return;
  }

  if (
    handleReply.threadID &&
    String(handleReply.threadID) !==
      String(threadID)
  ) {
    return;
  }

  if (!isValidUserID(senderID)) {
    return;
  }

  if (
    handleReply.createdAt &&
    Date.now() - Number(handleReply.createdAt) >
      REPLY_TTL
  ) {
    return api.sendMessage(
      "⌛ This banking session expired. Please use /bank again.",
      threadID
    );
  }

  if (
    !consumeReply(
      handleReply,
      threadID,
      senderID
    )
  ) {
    return;
  }

  try {
    return await withDataLock(async () => {
      const store = await readStore();

      const result = await ensureUser(
        store,
        senderID,
        Users
      );

      if (result.created) {
        await writeStore(store);
      }

      const ctx = {
        api,
        event,
        threadID,
        senderID,
        body: String(
          event.body == null ? "" : event.body
        ).trim(),
        store,
        user: result.user,
        Currencies,
        Users
      };

      if (handleReply.type === "menu") {
        return handleMenuAction(ctx);
      }

      if (
        handleReply.type === "transferUser"
      ) {
        return handleTransferUser(ctx);
      }

      return handleAmountReply(
        ctx,
        handleReply
      );
    });
  } catch (error) {
    return sendOperationError(
      api,
      threadID,
      error
    );
  }
};
