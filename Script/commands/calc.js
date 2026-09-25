module.exports.config = {
  name: "calc",
  aliases: ["calculate", "math"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Safe calculator for basic math",
  commandCategory: "Utility",
  usages: "calc 10+20*3",
  cooldowns: 0
};

function normalizeExpression(input) {
  return input
    .replace(/[×x]/gi, "*")
    .replace(/[÷]/g, "/")
    .replace(/,/g, ".")
    .trim();
}

function isSafeExpression(expression) {
  if (!expression || expression.length > 120) return false;
  if (!/^[0-9+\-*/%().\s]+$/.test(expression)) return false;
  if (/\.\s*\./.test(expression)) return false;
  return true;
}

module.exports.run = async function ({ api, event, args }) {
  const rawExpression = args.join(" ");
  const expression = normalizeExpression(rawExpression);

  if (!isSafeExpression(expression)) {
    return api.sendMessage(
      "🧮 𝗨𝘀𝗮𝗴𝗲: /calc 10+20*3\n\n✅ Supported: +  -  *  /  %  ( )  decimal numbers",
      event.threadID,
      event.messageID
    );
  }

  try {
    const result = Function(`"use strict"; return (${expression});`)();

    if (typeof result !== "number" || !Number.isFinite(result)) {
      throw new Error("Invalid calculation result");
    }

    const formatted = Number.isInteger(result)
      ? String(result)
      : String(Number(result.toFixed(10)));

    return api.sendMessage(
      `🧮 𝗖𝗮𝗹𝗰𝘂𝗹𝗮𝘁𝗼𝗿\n\n📌 ${expression}\n✅ 𝗥𝗲𝘀𝘂𝗹𝘁: ${formatted}`,
      event.threadID,
      event.messageID
    );
  } catch (error) {
    return api.sendMessage(
      "⚠️ Doya kore Sithik babe lekhun Example: /calc (10+5)*2",
      event.threadID,
      event.messageID
    );
  }
};
