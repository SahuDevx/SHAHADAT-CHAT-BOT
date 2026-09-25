module.exports.config = {
    name: "shortcut",
    aliases: ["short", "sc", "shortcuts"],
    version: "2.0.0",
    hasPermssion: 1,
    credits: "SHAHADAT SAHU",
    description: "Group Shortcut Management System",
    commandCategory: "system",
    usages: "[add/list/search/delete/clear/on/off]",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "path": ""
    }
};

function getFilePath() {
    const path = global.nodemodule["path"];

    return path.resolve(
        __dirname,
        "cache",
        "shortcutdata.json"
    );
}

function getFileData() {
    const fs = global.nodemodule["fs-extra"];
    const file = getFilePath();

    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(
                file,
                JSON.stringify([], null, 4),
                "utf8"
            );

            return [];
        }

        const raw = fs.readFileSync(file, "utf8").trim();

        if (!raw) return [];

        const data = JSON.parse(raw);

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(
            "[SHORTCUT] Read error:",
            error.message
        );

        return [];
    }
}

function saveFileData(data) {
    const fs = global.nodemodule["fs-extra"];

    fs.writeFileSync(
        getFilePath(),
        JSON.stringify(data, null, 4),
        "utf8"
    );
}

function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function getShortcuts(threadID) {
    if (!global.moduleData) {
        global.moduleData = {};
    }

    if (!global.moduleData.shortcut) {
        global.moduleData.shortcut = new Map();
    }

    return global.moduleData.shortcut.get(
        String(threadID)
    ) || [];
}

function setShortcuts(threadID, shortcuts) {
    if (!global.moduleData) {
        global.moduleData = {};
    }

    if (!global.moduleData.shortcut) {
        global.moduleData.shortcut = new Map();
    }

    global.moduleData.shortcut.set(
        String(threadID),
        shortcuts
    );
}

function generateID() {
    return Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();
}

function getThreadData(data, threadID) {
    let threadData = data.find(
        item =>
            String(item.threadID) ===
            String(threadID)
    );

    if (!threadData) {
        threadData = {
            threadID: String(threadID),
            enabled: true,
            shortcuts: []
        };

        data.push(threadData);
    }

    if (!Array.isArray(threadData.shortcuts)) {
        threadData.shortcuts = [];
    }

    if (typeof threadData.enabled !== "boolean") {
        threadData.enabled = true;
    }

    return threadData;
}

module.exports.onLoad = function () {
    try {
        const data = getFileData();

        if (!global.moduleData) {
            global.moduleData = {};
        }

        global.moduleData.shortcut =
            new Map();

        for (const item of data) {
            if (!item || !item.threadID) continue;

            if (!Array.isArray(item.shortcuts)) {
                item.shortcuts = [];
            }

            global.moduleData.shortcut.set(
                String(item.threadID),
                item.shortcuts
            );
        }
    } catch (error) {
        console.error(
            "[SHORTCUT] Load error:",
            error.message
        );
    }
};

module.exports.handleEvent = async function ({
    event,
    api
}) {
    if (!event.body) return;

    const {
        threadID,
        messageID,
        body
    } = event;

    const data = getFileData();

    const threadData = data.find(
        item =>
            String(item.threadID) ===
            String(threadID)
    );

    if (
        threadData &&
        threadData.enabled === false
    ) {
        return;
    }

    const shortcuts =
        getShortcuts(threadID);

    if (!shortcuts.length) return;

    const input = normalize(body);

    const found = shortcuts.find(
        item =>
            normalize(item.input) === input
    );

    if (!found) return;

    return api.sendMessage(
        found.output,
        threadID,
        messageID
    );
};

module.exports.handleReply = async function ({
    event,
    api,
    handleReply
}) {
    if (
        String(handleReply.author) !==
        String(event.senderID)
    ) {
        return;
    }

    const {
        threadID,
        messageID,
        body
    } = event;

    const input = String(body || "").trim();

    if (handleReply.type === "addInput") {
        if (!input) {
            return api.sendMessage(
                "⚠️ Shortcut keyword empty রাখা যাবে না।",
                threadID,
                messageID
            );
        }

        const shortcuts =
            getShortcuts(threadID);

        const exists = shortcuts.some(
            item =>
                normalize(item.input) ===
                normalize(input)
        );

        if (exists) {
            return api.sendMessage(
                "⚠️ এই keyword-এর shortcut আগে থেকেই আছে।",
                threadID,
                messageID
            );
        }

        try {
            api.unsendMessage(
                handleReply.messageID
            );
        } catch (_) {}

        return api.sendMessage(
            "» এখন shortcut-এর reply পাঠান।",
            threadID,
            (error, info) => {
                if (error || !info) return;

                global.client.handleReply.push({
                    type: "addOutput",
                    name: module.exports.config.name,
                    author: event.senderID,
                    messageID: info.messageID,
                    input
                });
            },
            messageID
        );
    }

    if (handleReply.type === "addOutput") {
        if (!input) {
            return api.sendMessage(
                "⚠️ Shortcut output empty রাখা যাবে না।",
                threadID,
                messageID
            );
        }

        const data = getFileData();

        const threadData =
            getThreadData(data, threadID);

        const exists =
            threadData.shortcuts.some(
                item =>
                    normalize(item.input) ===
                    normalize(handleReply.input)
            );

        if (exists) {
            return api.sendMessage(
                "⚠️ এই keyword-এর shortcut আগে থেকেই আছে।",
                threadID,
                messageID
            );
        }

        const shortcut = {
            id: generateID(),
            input: handleReply.input,
            output: input
        };

        threadData.shortcuts.push(
            shortcut
        );

        saveFileData(data);

        setShortcuts(
            threadID,
            threadData.shortcuts
        );

        try {
            api.unsendMessage(
                handleReply.messageID
            );
        } catch (_) {}

        return api.sendMessage(
            "» Shortcut Added\n\n" +
            `🆔 ID: ${shortcut.id}\n` +
            `⌨️ Input: ${shortcut.input}\n` +
            `💬 Output: ${shortcut.output}`,
            threadID,
            messageID
        );
    }

    if (handleReply.type === "clear") {
        if (normalize(input) !== "confirm") {
            return api.sendMessage(
                "⚠️ Cancelled.\n`confirm` reply করুন।",
                threadID,
                messageID
            );
        }

        const data = getFileData();

        const index = data.findIndex(
            item =>
                String(item.threadID) ===
                String(threadID)
        );

        if (index !== -1) {
            data.splice(index, 1);
        }

        saveFileData(data);

        setShortcuts(
            threadID,
            []
        );

        try {
            api.unsendMessage(
                handleReply.messageID
            );
        } catch (_) {}

        return api.sendMessage(
            "» এই group-এর সব shortcut delete করা হয়েছে।",
            threadID,
            messageID
        );
    }
};

module.exports.run = async function ({
    event,
    api,
    args
}) {
    const {
        threadID,
        messageID,
        senderID
    } = event;

    const action = normalize(
        args[0] || "add"
    );

    const shortcuts =
        getShortcuts(threadID);

    switch (action) {

        case "add":
        case "new":
        case "create": {
            return api.sendMessage(
                "» Shortcut Add\n\nReply করে shortcut keyword পাঠান।",
                threadID,
                (error, info) => {
                    if (error || !info) return;

                    global.client.handleReply.push({
                        type: "addInput",
                        name: module.exports.config.name,
                        author: senderID,
                        messageID: info.messageID
                    });
                },
                messageID
            );
        }

        case "list":
        case "all": {
            if (!shortcuts.length) {
                return api.sendMessage(
                    "» এই group-এ কোনো shortcut নেই।",
                    threadID,
                    messageID
                );
            }

            const list = shortcuts.map(
                (item, index) =>
                    `${index + 1}. ${item.input} → ${item.output}\n   🆔 ${item.id}`
            );

            return api.sendMessage(
                "» Shortcut List\n\n" +
                list.join("\n\n"),
                threadID,
                messageID
            );
        }

        case "search":
        case "find": {
            const keyword = normalize(
                args.slice(1).join(" ")
            );

            if (!keyword) {
                return api.sendMessage(
                    "⚠️ Search keyword দিন।",
                    threadID,
                    messageID
                );
            }

            const results = shortcuts.filter(
                item =>
                    normalize(item.input).includes(keyword) ||
                    normalize(item.output).includes(keyword)
            );

            if (!results.length) {
                return api.sendMessage(
                    "⚠️ Shortcut পাওয়া যায়নি।",
                    threadID,
                    messageID
                );
            }

            const list = results.map(
                (item, index) =>
                    `${index + 1}. ${item.input} → ${item.output}\n   🆔 ${item.id}`
            );

            return api.sendMessage(
                "» Shortcut Search\n\n" +
                list.join("\n\n"),
                threadID,
                messageID
            );
        }

        case "delete":
        case "remove":
        case "del":
        case "rm": {
            const target = normalize(
                args.slice(1).join(" ")
            );

            if (!target) {
                return api.sendMessage(
                    "⚠️ Shortcut ID অথবা keyword দিন।",
                    threadID,
                    messageID
                );
            }

            const index = shortcuts.findIndex(
                item =>
                    normalize(item.id) === target ||
                    normalize(item.input) === target
            );

            if (index === -1) {
                return api.sendMessage(
                    "⚠️ Shortcut পাওয়া যায়নি।",
                    threadID,
                    messageID
                );
            }

            const removed =
                shortcuts[index];

            const data = getFileData();

            const threadData =
                getThreadData(data, threadID);

            threadData.shortcuts =
                threadData.shortcuts.filter(
                    item =>
                        item.id !== removed.id
                );

            saveFileData(data);

            setShortcuts(
                threadID,
                threadData.shortcuts
            );

            return api.sendMessage(
                "» Shortcut Deleted\n\n" +
                `🆔 ID: ${removed.id}`,
                threadID,
                messageID
            );
        }

        case "clear":
        case "empty": {
            if (!shortcuts.length) {
                return api.sendMessage(
                    "» এই group-এ কোনো shortcut নেই।",
                    threadID,
                    messageID
                );
            }

            return api.sendMessage(
                "⚠️ এই group-এর সব shortcut delete হবে।\n\n" +
                "Confirm করতে `confirm` reply করুন।",
                threadID,
                (error, info) => {
                    if (error || !info) return;

                    global.client.handleReply.push({
                        type: "clear",
                        name: module.exports.config.name,
                        author: senderID,
                        messageID: info.messageID
                    });
                },
                messageID
            );
        }

        case "on":
        case "enable": {
            const data = getFileData();

            const threadData =
                getThreadData(data, threadID);

            threadData.enabled = true;

            saveFileData(data);

            return api.sendMessage(
                "» Shortcut system চালু হয়েছে।",
                threadID,
                messageID
            );
        }

        case "off":
        case "disable": {
            const data = getFileData();

            const threadData =
                getThreadData(data, threadID);

            threadData.enabled = false;

            saveFileData(data);

            return api.sendMessage(
                "» Shortcut system বন্ধ হয়েছে।",
                threadID,
                messageID
            );
        }

        default:
            return api.sendMessage(
                "⚠️ Invalid option.\n\n" +
                "/shortcut add\n" +
                "/shortcut list\n" +
                "/shortcut search <keyword>\n" +
                "/shortcut delete <ID | keyword>\n" +
                "/shortcut clear\n" +
                "/shortcut on\n" +
                "/shortcut off",
                threadID,
                messageID
            );
    }
};
