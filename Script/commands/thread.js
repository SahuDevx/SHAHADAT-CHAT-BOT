module.exports.config = {
    name: "thread",
	aliases: ["groupban"],
    version: "3.0.0",
    hasPermssion: 2,
    credits: "SHAHADAT SAHU",
    description: "Thread Management System",
    commandCategory: "system",
    usages: "[ban/unban/bancommand/unbancommand/search/list/info]",
    cooldowns: 0
};

module.exports.languages = {
    en: {
        usage:
            "» Thread Manager\n\n" +
            "1. /thread ban <threadID> [reason]\n" +
            "2. /thread unban <threadID>\n" +
            "3. /thread bancommand <threadID> <command>\n" +
            "4. /thread unbancommand <threadID> <command>\n" +
            "5. /thread search <name>\n" +
            "6. /thread list\n" +
            "7. /thread info <threadID>",

        invalidID: "❌ Valid Thread ID দিন।",

        confirmBan:
            "⚠️ Thread Ban Confirmation\n\n" +
            "🆔 Thread ID: %1\n" +
            "📝 Reason: %2\n\n" +
            "Confirm করতে reply করুন:\n" +
            "confirm",

        confirmUnban:
            "⚠️ Thread Unban Confirmation\n\n" +
            "🆔 Thread ID: %1\n\n" +
            "Confirm করতে reply করুন:\n" +
            "confirm",

        confirmCommandBan:
            "⚠️ Command Ban Confirmation\n\n" +
            "🆔 Thread ID: %1\n" +
            "⚙️ Commands: %2\n\n" +
            "Confirm করতে reply করুন:\n" +
            "confirm",

        confirmCommandUnban:
            "⚠️ Command Unban Confirmation\n\n" +
            "🆔 Thread ID: %1\n" +
            "⚙️ Commands: %2\n\n" +
            "Confirm করতে reply করুন:\n" +
            "confirm"
    }
};

function ensureData() {
    if (!global.data.threadBanned) {
        global.data.threadBanned = new Map();
    }

    if (!global.data.commandBanned) {
        global.data.commandBanned = new Map();
    }

    if (!Array.isArray(global.data.allThreadID)) {
        global.data.allThreadID = [];
    }
}

function getThreadID(args, event) {
    if (args[1] && /^\d+$/.test(String(args[1]))) {
        return String(args[1]);
    }

    return String(event.threadID);
}

async function saveThreadData(Threads, threadID, data) {
    await Threads.setData(threadID, { data });
}

module.exports.handleReply = async function ({
    api,
    event,
    Threads,
    handleReply,
    getText
}) {
    if (!handleReply) return;

    if (String(event.senderID) !== String(handleReply.author)) {
        return;
    }

    const reply = String(event.body || "")
        .trim()
        .toLowerCase();

    if (reply !== "confirm") {
        return api.sendMessage(
            "❌ Cancelled.\nConfirm korte `confirm` reply korun.",
            event.threadID,
            event.messageID
        );
    }

    const {
        type,
        targetID,
        reason,
        commands
    } = handleReply;

    const index = global.client.handleReply.findIndex(
        item => item.messageID === handleReply.messageID
    );

    if (index !== -1) {
        global.client.handleReply.splice(index, 1);
    }

    try {
        const threadData = (await Threads.getData(targetID)).data || {};

        switch (type) {
            case "ban": {
                threadData.banned = true;
                threadData.reason = reason || null;
                threadData.dateAdded = new Date().toLocaleString();

                await saveThreadData(
                    Threads,
                    targetID,
                    threadData
                );

                global.data.threadBanned.set(targetID, {
                    reason: threadData.reason,
                    dateAdded: threadData.dateAdded
                });

                return api.sendMessage(
                    `✅ Thread banned successfully.\n\n` +
                    `🆔 Thread ID: ${targetID}\n` +
                    `📝 Reason: ${reason || "Not specified"}`,
                    event.threadID,
                    event.messageID
                );
            }

            case "unban": {
                threadData.banned = false;
                threadData.reason = null;
                threadData.dateAdded = null;

                await saveThreadData(
                    Threads,
                    targetID,
                    threadData
                );

                global.data.threadBanned.delete(targetID);

                return api.sendMessage(
                    `✅ Thread unbanned successfully.\n\n` +
                    `🆔 Thread ID: ${targetID}`,
                    event.threadID,
                    event.messageID
                );
            }

            case "banCommand": {
                let current = Array.isArray(threadData.commandBanned)
                    ? threadData.commandBanned
                    : [];

                const newCommands = commands.filter(
                    command => !current.includes(command)
                );

                current.push(...newCommands);

                threadData.commandBanned = [
                    ...new Set(current)
                ];

                await saveThreadData(
                    Threads,
                    targetID,
                    threadData
                );

                global.data.commandBanned.set(
                    targetID,
                    threadData.commandBanned
                );

                return api.sendMessage(
                    `✅ Command ban successfully.\n\n` +
                    `🆔 Thread ID: ${targetID}\n` +
                    `⚙️ Commands: ${commands.join(", ")}`,
                    event.threadID,
                    event.messageID
                );
            }

            case "unbanCommand": {
                let current = Array.isArray(threadData.commandBanned)
                    ? threadData.commandBanned
                    : [];

                current = current.filter(
                    command => !commands.includes(command)
                );

                threadData.commandBanned = current;

                await saveThreadData(
                    Threads,
                    targetID,
                    threadData
                );

                if (current.length) {
                    global.data.commandBanned.set(
                        targetID,
                        current
                    );
                } else {
                    global.data.commandBanned.delete(targetID);
                }

                return api.sendMessage(
                    `✅ Command unban successfully.\n\n` +
                    `🆔 Thread ID: ${targetID}\n` +
                    `⚙️ Commands: ${commands.join(", ")}`,
                    event.threadID,
                    event.messageID
                );
            }
        }
    } catch (error) {
        console.error("[THREAD]", error);

        return api.sendMessage(
            "❌ Thread data update korte giye error hoyeche.",
            event.threadID,
            event.messageID
        );
    }
};

module.exports.run = async function ({
    api,
    event,
    args,
    Threads,
    getText
}) {
    ensureData();

    const action = String(args[0] || "").toLowerCase();

    if (!action) {
        return api.sendMessage(
            getText("usage"),
            event.threadID,
            event.messageID
        );
    }

    switch (action) {
        case "ban":
        case "-b": {
            const targetID = getThreadID(args, event);

            if (!/^\d+$/.test(targetID)) {
                return api.sendMessage(
                    getText("invalidID"),
                    event.threadID,
                    event.messageID
                );
            }

            if (global.data.threadBanned.has(targetID)) {
                return api.sendMessage(
                    `⚠️ এই Thread আগে থেকেই banned.\n\n🆔 ${targetID}`,
                    event.threadID,
                    event.messageID
                );
            }

            const reason = args
                .slice(args[1] && /^\d+$/.test(args[1]) ? 2 : 1)
                .join(" ")
                .trim() || "Not specified";

            return api.sendMessage(
                getText(
                    "confirmBan",
                    targetID,
                    reason
                ),
                event.threadID,
                (error, info) => {
                    if (error || !info) return;

                    global.client.handleReply.push({
                        name: module.exports.config.name,
                        type: "ban",
                        targetID,
                        reason,
                        messageID: info.messageID,
                        author: event.senderID
                    });
                },
                event.messageID
            );
        }

        case "unban":
        case "-ub": {
            const targetID = getThreadID(args, event);

            if (!global.data.threadBanned.has(targetID)) {
                return api.sendMessage(
                    `⚠️ এই Thread banned অবস্থায় নেই.\n\n🆔 ${targetID}`,
                    event.threadID,
                    event.messageID
                );
            }

            return api.sendMessage(
                getText("confirmUnban", targetID),
                event.threadID,
                (error, info) => {
                    if (error || !info) return;

                    global.client.handleReply.push({
                        name: module.exports.config.name,
                        type: "unban",
                        targetID,
                        messageID: info.messageID,
                        author: event.senderID
                    });
                },
                event.messageID
            );
        }

        case "bancommand":
        case "bc":
        case "-bc": {
            const targetID = getThreadID(args, event);

            const commandStart =
                args[1] && /^\d+$/.test(args[1]) ? 2 : 1;

            const commands = args
                .slice(commandStart)
                .map(command =>
                    command.replace(/^\/+/, "").toLowerCase()
                )
                .filter(Boolean);

            if (!commands.length) {
                return api.sendMessage(
                    "⚠️ যে command ban করতে চান সেটি দিন।\n\nExample: /thread bancommand 123456 help",
                    event.threadID,
                    event.messageID
                );
            }

            return api.sendMessage(
                getText(
                    "confirmCommandBan",
                    targetID,
                    commands.join(", ")
                ),
                event.threadID,
                (error, info) => {
                    if (error || !info) return;

                    global.client.handleReply.push({
                        name: module.exports.config.name,
                        type: "banCommand",
                        targetID,
                        commands,
                        messageID: info.messageID,
                        author: event.senderID
                    });
                },
                event.messageID
            );
        }

        case "unbancommand":
        case "ubc":
        case "-ubc": {
            const targetID = getThreadID(args, event);

            const commandStart =
                args[1] && /^\d+$/.test(args[1]) ? 2 : 1;

            const commands = args
                .slice(commandStart)
                .map(command =>
                    command.replace(/^\/+/, "").toLowerCase()
                )
                .filter(Boolean);

            if (!commands.length) {
                return api.sendMessage(
                    "⚠️ যে command unban করতে চান সেটি দিন।",
                    event.threadID,
                    event.messageID
                );
            }

            return api.sendMessage(
                getText(
                    "confirmCommandUnban",
                    targetID,
                    commands.join(", ")
                ),
                event.threadID,
                (error, info) => {
                    if (error || !info) return;

                    global.client.handleReply.push({
                        name: module.exports.config.name,
                        type: "unbanCommand",
                        targetID,
                        commands,
                        messageID: info.messageID,
                        author: event.senderID
                    });
                },
                event.messageID
            );
        }

        case "search":
        case "-s": {
            const keyword = args
                .slice(1)
                .join(" ")
                .trim()
                .toLowerCase();

            if (!keyword) {
                return api.sendMessage(
                    "⚠️ Search করার জন্য group name দিন।",
                    event.threadID,
                    event.messageID
                );
            }

            const allThreads = await Threads.getAll([
                "threadID",
                "threadInfo"
            ]);

            const results = allThreads
                .filter(item => {
                    const name =
                        item.threadInfo?.threadName || "";

                    return name
                        .toLowerCase()
                        .includes(keyword);
                })
                .slice(0, 20);

            if (!results.length) {
                return api.sendMessage(
                    "❌ কোনো Thread পাওয়া যায়নি.",
                    event.threadID,
                    event.messageID
                );
            }

            const list = results
                .map(
                    (item, index) =>
                        `${index + 1}. ${item.threadInfo.threadName || "Unknown"}\n🆔 ${item.threadID}`
                )
                .join("\n\n");

            return api.sendMessage(
                `» Thread Search\n\n${list}`,
                event.threadID,
                event.messageID
            );
        }

        case "list":
        case "-l": {
            const banned = [];

            for (const [id, data] of global.data.threadBanned) {
                banned.push(
                    `• ${id}\n  📝 ${data?.reason || "No reason"}`
                );
            }

            return api.sendMessage(
                banned.length
                    ? `» Banned Thread List\n\n${banned.join("\n\n")}`
                    : "» Banned Thread List\n\n● No banned thread found.",
                event.threadID,
                event.messageID
            );
        }

        case "info":
        case "-i": {
            const targetID = getThreadID(args, event);

            const banned =
                global.data.threadBanned.get(targetID);

            const commandBanned =
                global.data.commandBanned.get(targetID) || [];

            return api.sendMessage(
                `» Thread Info\n\n` +
                `🆔 Thread ID: ${targetID}\n` +
                `🚫 Banned: ${banned ? "YES" : "NO"}\n` +
                `📝 Reason: ${banned?.reason || "None"}\n` +
                `⚙️ Command Banned: ${
                    commandBanned.length
                        ? commandBanned.join(", ")
                        : "None"
                }`,
                event.threadID,
                event.messageID
            );
        }

        default:
            return api.sendMessage(
                getText("usage"),
                event.threadID,
                event.messageID
            );
    }
};
