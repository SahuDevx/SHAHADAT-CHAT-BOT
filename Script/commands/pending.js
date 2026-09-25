module.exports.config = {
  name: "pending",
  aliases: ["pen", "aproved", "aprval", "apv"],
  version: "2.0.0",
  credits: "SHAHADAT SAHU",
  hasPermssion: 2,
  description: "Manage bot pending group requests",
  commandCategory: "system",
  cooldowns: 0
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (String(event.senderID) !== String(handleReply.author)) return;

  const body = String(event.body || "").trim().toLowerCase();
  if (!body) return;

  const pending = handleReply.pending;

  const notify = `🌸 আপনাদের গ্রুপে চলে এসেছি — ${global.config.BOTNAME}!

♡ এখন থেকে আপনাদের সাথে আড্ডা, বিনোদন এবং বিভিন্ন কাজে পাশে থাকব।

› সাহায্য পেতে ব্যবহার করুন:
${global.config.PREFIX}help

✦ ${global.config.BOTNAME} ব্যবহার করার জন্য ধন্যবাদ।
♡ আশা করি আমাদের সাথে সুন্দর সময় কাটাবেন!`;

  
  if (body === "call") {
    let count = 0;

    for (const group of pending) {
      try {
        await api.removeUserFromGroup(
          api.getCurrentUserID(),
          group.threadID
        );
        count++;
      } catch (e) {}
    }

    return api.sendMessage(
      `⚠️ Successfully rejected ${count} group(s)!`,
      event.threadID,
      event.messageID
    );
  }

  
  if (body === "all") {
    let count = 0;

    for (const group of pending) {
      try {
        await api.sendMessage(notify, group.threadID);
        count++;
      } catch (e) {}
    }

    return api.sendMessage(
      `✅ Successfully approved ${count} group(s)!`,
      event.threadID,
      event.messageID
    );
  }

  const rejectMode =
    body.startsWith("c") ||
    body.startsWith("cancel");

  const numbers = body.match(/\d+/g) || [];
  if (!numbers.length) return;

  let count = 0;

  for (const num of numbers) {
    const index = parseInt(num);

    if (index <= 0 || index > pending.length) {
      return api.sendMessage(
        `⚠️ ${num} is not a valid number.`,
        event.threadID,
        event.messageID
      );
    }

    const group = pending[index - 1];

    try {
      if (rejectMode) {
        await api.removeUserFromGroup(
          api.getCurrentUserID(),
          group.threadID
        );
      } else {
        await api.sendMessage(notify, group.threadID);
      }

      count++;
    } catch (e) {
      console.error(e);
    }
  }

  return api.sendMessage(
    rejectMode
      ? `📛 Successfully rejected ${count} group(s)!`
      : `✅ Successfully approved ${count} group(s)!`,
    event.threadID,
    event.messageID
  );
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  try {
    const [spam, pending] = await Promise.all([
      api.getThreadList(100, null, ["OTHER"]),
      api.getThreadList(100, null, ["PENDING"])
    ]);

    const list = [
      ...(spam || []),
      ...(pending || [])
    ].filter(
      group =>
        group.isSubscribed &&
        group.isGroup
    );

    if (!list.length) {
      return api.sendMessage(
        "✅ No pending groups found.",
        threadID,
        messageID
      );
    }

    const text = list
      .map(
        (group, i) =>
          `${i + 1}. ${group.name || "Unnamed Group"}`
      )
      .join("\n");

    return api.sendMessage(
      `📋 Pending Groups: ${list.length}

${text}

Reply with:
• 1 2 3 — Approve selected
• all — Approve all
• c1 c2 — Reject selected
• call — Reject all`,
      threadID,
      (err, info) => {
        if (err) return;

        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          pending: list
        });
      },
      messageID
    );

  } catch (e) {
    console.error(e);

    return api.sendMessage(
      "❌ Failed to get pending groups.",
      threadID,
      messageID
    );
  }
};
