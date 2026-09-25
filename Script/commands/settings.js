module.exports.config = {
    name: "settings",
    aliases: ["setting", "botsettings"],
    version: "2.0.0",
    hasPermssion: 2,
    credits: "SHAHADAT SAHU",
    description: "Bot and group settings manager",
    commandCategory: "admin",
    usages: "[1-15]",
    cooldowns: 0,
    usePrefix: true
};

const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

const CACHE_DIR = path.join(__dirname, "cache");
const DATA_PATH = path.join(CACHE_DIR, "data.json");
const TOTAL_PATH = path.join(CACHE_DIR, "totalChat.json");

const _24hours = 86400000;

function ensureCache() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, {
            recursive: true
        });
    }

    if (!fs.existsSync(DATA_PATH)) {
        fs.writeFileSync(
            DATA_PATH,
            JSON.stringify({
                adminbox: {}
            }, null, 4)
        );
    }

    if (!fs.existsSync(TOTAL_PATH)) {
        fs.writeFileSync(
            TOTAL_PATH,
            JSON.stringify({}, null, 4)
        );
    }
}

function readJSON(file, fallback) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(
                file,
                JSON.stringify(fallback, null, 4)
            );

            return fallback;
        }

        const raw = fs.readFileSync(
            file,
            "utf8"
        ).trim();

        if (!raw) {
            return fallback;
        }

        return JSON.parse(raw);
    } catch (error) {
        console.error(
            "[SETTINGS] JSON Error:",
            error.message
        );

        return fallback;
    }
}

function writeJSON(file, data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 4)
    );
}

function getBotID(api) {
    try {
        return String(
            api.getCurrentUserID()
        );
    } catch (_) {
        return null;
    }
}

function isBotAdmin(threadInfo, api) {
    if (
        !threadInfo ||
        !Array.isArray(threadInfo.adminIDs)
    ) {
        return false;
    }

    const botID = getBotID(api);

    return threadInfo.adminIDs.some(
        item =>
            String(item.id) ===
            String(botID)
    );
}

function getUptime() {
    const uptime = process.uptime();

    const hours = Math.floor(
        uptime / 3600
    );

    const minutes = Math.floor(
        (uptime % 3600) / 60
    );

    const seconds = Math.floor(
        uptime % 60
    );

    return `${hours}h ${minutes}m ${seconds}s`;
}

function handleByte(byte) {
    const units = [
        "bytes",
        "KB",
        "MB",
        "GB",
        "TB",
        "PB",
        "EB",
        "ZB",
        "YB"
    ];

    let i = 0;
    let usage =
        parseInt(byte, 10) || 0;

    while (
        usage >= 1024 &&
        ++i
    ) {
        usage /= 1024;
    }

    return (
        usage.toFixed(
            usage < 10 && i > 0
                ? 1
                : 0
        ) +
        " " +
        units[i]
    );
}

function getSystemInfo(ping) {
    const os = require("os");

    const totalMemory =
        os.totalmem();

    const freeMemory =
        os.freemem();

    const usedMemory =
        totalMemory - freeMemory;

    return (
        `📌 𝗣𝗶𝗻𝗴: ${
            Date.now() - ping
        }ms\n` +
        `💾 𝗥𝗔𝗠: ${handleByte(
            usedMemory
        )} / ${handleByte(
            totalMemory
        )}`
    );
}

module.exports.onLoad = function () {
    ensureCache();

    const data = readJSON(
        DATA_PATH,
        {
            adminbox: {}
        }
    );

    if (
        !data.adminbox ||
        typeof data.adminbox !== "object"
    ) {
        data.adminbox = {};
    }

    writeJSON(
        DATA_PATH,
        data
    );
};

module.exports.run = async function ({
    api,
    event
}) {
    const {
        threadID,
        messageID,
        senderID
    } = event;

    ensureCache();

    return api.sendMessage(
        `⚙️ 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦

𝗦𝗬𝗦𝗧𝗘𝗠
➊ 𝗥𝗲𝗯𝗼𝗼𝘁 𝗕𝗼𝘁
➋ 𝗥𝗲𝗹𝗼𝗮𝗱 𝗖𝗼𝗻𝗳𝗶𝗴
➌ 𝗨𝗽𝗱𝗮𝘁𝗲 𝗕𝗼𝘅 𝗗𝗮𝘁𝗮
➍ 𝗨𝗽𝗱𝗮𝘁𝗲 𝗨𝘀𝗲𝗿 𝗗𝗮𝘁𝗮
➎ 𝗟𝗼𝗴𝗼𝘂𝘁 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸

𝗚𝗥𝗢𝗨𝗣 𝗖𝗢𝗡𝗧𝗥𝗢𝗟
➏ 𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗠𝗼𝗱𝗲
➐ 𝗡𝗲𝘄 𝗠𝗲𝗺𝗯𝗲𝗿 𝗠𝗼𝗱𝗲
➑ 𝗔𝗻𝘁𝗶-𝗥𝗼𝗯𝗯𝗲𝗿𝘆
➒ 𝗔𝗻𝘁𝗶𝗼𝘂𝘁
➓ 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 𝗨𝘀𝗲𝗿 𝗙𝗶𝗹𝘁𝗲𝗿

𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡
⓫ 𝗕𝗼𝘁 𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻
⓬ 𝗕𝗼𝘅 𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻
⓭ 𝗚𝗿𝗼𝘂𝗽 𝗔𝗱𝗺𝗶𝗻𝘀
⓮ 𝗕𝗼𝘁 𝗔𝗱𝗺𝗶𝗻𝘀
⓯ 𝗚𝗿𝗼𝘂𝗽 𝗟𝗶𝘀𝘁

💬 𝗥𝗲𝗽𝗹𝘆 𝘄𝗶𝘁𝗵 𝗮 𝗻𝘂𝗺𝗯𝗲𝗿 ➊–⓯`,
        threadID,
        (error, info) => {
            if (error || !info) {
                return;
            }

            global.client.handleReply.push({
                name: module.exports.config.name,
                messageID: info.messageID,
                author: senderID,
                type: "choosee"
            });
        },
        messageID
    );
};

module.exports.handleReply = async function ({
    event,
    api,
    handleReply,
    Users,
    Threads
}) {
    if (
        !handleReply ||
        handleReply.type !== "choosee"
    ) {
        return;
    }

    if (
        String(handleReply.author) !==
        String(event.senderID)
    ) {
        return;
    }

    const {
        threadID,
        messageID
    } = event;

    const choice =
        String(event.body || "")
            .trim();

    switch (choice) {

        case "1": {
            return api.sendMessage(
                "🔄 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴 𝗕𝗼𝘁...",
                threadID,
                () => process.exit(1)
            );
        }

        case "2": {
            try {
                delete require.cache[
                    require.resolve(
                        global.client.configPath
                    )
                ];

                global.config =
                    require(
                        global.client.configPath
                    );

                return api.sendMessage(
                    "✅ 𝗰𝗼𝗻𝗳𝗶𝗴.𝗷𝘀𝗼𝗻 𝗿𝗲𝗹𝗼𝗮𝗱𝗲𝗱 𝘀𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆.",
                    threadID,
                    messageID
                );
            } catch (error) {
                return api.sendMessage(
                    "⚠️ 𝗖𝗼𝗻𝗳𝗶𝗴 𝗿𝗲𝗹𝗼𝗮𝗱 𝗳𝗮𝗶𝗹𝗲𝗱.\n\n" +
                    error.message,
                    threadID,
                    messageID
                );
            }
        }

        case "3": {
            try {
                const inbox =
                    await api.getThreadList(
                        100,
                        null,
                        ["INBOX"]
                    );

                const groups =
                    [...inbox].filter(
                        group =>
                            group.isSubscribed &&
                            group.isGroup
                    );

                let updated = 0;

                for (
                    const group
                    of groups
                ) {
                    try {
                        const info =
                            await api.getThreadInfo(
                                group.threadID
                            );

                        await Threads.setData(
                            group.threadID,
                            {
                                threadInfo: info
                            }
                        );

                        updated++;
                    } catch (error) {
                        console.error(
                            "[SETTINGS] Box update:",
                            error.message
                        );
                    }
                }

                return api.sendMessage(
                    `✅ 𝗕𝗼𝘅 𝗱𝗮𝘁𝗮 𝘂𝗽𝗱𝗮𝘁𝗲𝗱.\n\n📦 𝗨𝗽𝗱𝗮𝘁𝗲𝗱: ${updated}`,
                    threadID,
                    messageID
                );
            } catch (error) {
                return api.sendMessage(
                    "⚠️ 𝗕𝗼𝘅 𝗱𝗮𝘁𝗮 𝘂𝗽𝗱𝗮𝘁𝗲 𝗳𝗮𝗶𝗹𝗲𝗱.",
                    threadID,
                    messageID
                );
            }
        }

        case "4": {
            try {
                const inbox =
                    await api.getThreadList(
                        100,
                        null,
                        ["INBOX"]
                    );

                const groups =
                    [...inbox].filter(
                        group =>
                            group.isSubscribed &&
                            group.isGroup
                    );

                const updatedUsers =
                    new Set();

                for (
                    const group
                    of groups
                ) {
                    let participantIDs = [];

                    try {
                        const info =
                            await api.getThreadInfo(
                                group.threadID
                            );

                        participantIDs =
                            info.participantIDs ||
                            [];
                    } catch (_) {}

                    for (
                        const id
                        of participantIDs
                    ) {
                        try {
                            const userInfo =
                                await api.getUserInfo(
                                    id
                                );

                            if (
                                userInfo &&
                                userInfo[id]
                            ) {
                                await Users.setData(
                                    id,
                                    {
                                        name:
                                            userInfo[id]
                                                .name,
                                        data: {}
                                    }
                                );

                                updatedUsers.add(
                                    String(id)
                                );
                            }
                        } catch (error) {
                            console.error(
                                "[SETTINGS] User update:",
                                error.message
                            );
                        }
                    }
                }

                return api.sendMessage(
                    `✅ 𝗨𝘀𝗲𝗿 𝗱𝗮𝘁𝗮 𝘂𝗽𝗱𝗮𝘁𝗲𝗱.\n\n👥 𝗨𝘀𝗲𝗿𝘀: ${updatedUsers.size}`,
                    threadID,
                    messageID
                );
            } catch (error) {
                return api.sendMessage(
                    "⚠️ 𝗨𝘀𝗲𝗿 𝗱𝗮𝘁𝗮 𝘂𝗽𝗱𝗮𝘁𝗲 𝗳𝗮𝗶𝗹𝗲𝗱.",
                    threadID,
                    messageID
                );
            }
        }

        case "5": {
            await api.sendMessage(
                "⚠️ 𝗟𝗼𝗴𝗴𝗶𝗻𝗴 𝗼𝘂𝘁 𝗼𝗳 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸...",
                threadID,
                messageID
            );

            try {
                return api.logout();
            } catch (error) {
                return api.sendMessage(
                    "⚠️ 𝗟𝗼𝗴𝗼𝘂𝘁 𝗳𝗮𝗶𝗹𝗲𝗱.\n\n" +
                    error.message,
                    threadID,
                    messageID
                );
            }
        }

        case "6": {
            const database =
                readJSON(
                    DATA_PATH,
                    {
                        adminbox: {}
                    }
                );

            if (
                !database.adminbox ||
                typeof database.adminbox !== "object"
            ) {
                database.adminbox = {};
            }

            const enabled =
                database.adminbox[
                    threadID
                ] === true;

            database.adminbox[
                threadID
            ] = !enabled;

            writeJSON(
                DATA_PATH,
                database
            );

            return api.sendMessage(
                enabled
                    ? "🔓 𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗠𝗼𝗱𝗲: 𝗢𝗙𝗙\n\n𝗘𝘃𝗲𝗿𝘆𝗼𝗻𝗲 𝗰𝗮𝗻 𝘂𝘀𝗲 𝘁𝗵𝗲 𝗯𝗼𝘁."
                    : "🔒 𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗠𝗼𝗱𝗲: 𝗢𝗡\n\n𝗢𝗻𝗹𝘆 𝗴𝗿𝗼𝘂𝗽 𝗮𝗱𝗺𝗶𝗻𝘀 𝗰𝗮𝗻 𝘂𝘀𝗲 𝘁𝗵𝗲 𝗯𝗼𝘁.",
                threadID,
                messageID
            );
        }

        case "7": {
            try {
                const info =
                    await api.getThreadInfo(
                        threadID
                    );

                if (
                    !isBotAdmin(
                        info,
                        api
                    )
                ) {
                    return api.sendMessage(
                        "⚠️ 𝗕𝗼𝘁 𝗻𝗲𝗲𝗱𝘀 𝗴𝗿𝗼𝘂𝗽 𝗮𝗱𝗺𝗶𝗻 𝗽𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻.",
                        threadID,
                        messageID
                    );
                }

                const data =
                    (
                        await Threads.getData(
                            threadID
                        )
                    ).data || {};

                data.newMember =
                    data.newMember === true
                        ? false
                        : true;

                await Threads.setData(
                    threadID,
                    {
                        data
                    }
                );

                if (
                    global.data &&
                    global.data.threadData
                ) {
                    global.data.threadData.set(
                        parseInt(threadID),
                        data
                    );
                }

                return api.sendMessage(
                    data.newMember
                        ? "🔒 𝗡𝗲𝘄 𝗠𝗲𝗺𝗯𝗲𝗿 𝗠𝗼𝗱𝗲: 𝗢𝗡"
                        : "🔓 𝗡𝗲𝘄 𝗠𝗲𝗺𝗯𝗲𝗿 𝗠𝗼𝗱𝗲: 𝗢𝗙𝗙",
                    threadID,
                    messageID
                );
            } catch (error) {
                return api.sendMessage(
                    "⚠️ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝘂𝗽𝗱𝗮𝘁𝗲 𝗻𝗲𝘄 𝗺𝗲𝗺𝗯𝗲𝗿 𝗺𝗼𝗱𝗲.",
                    threadID,
                    messageID
                );
            }
        }

        case "8": {
            try {
                const info =
                    await api.getThreadInfo(
                        threadID
                    );

                if (
                    !isBotAdmin(
                        info,
                        api
                    )
                ) {
                    return api.sendMessage(
                        "⚠️ 𝗕𝗼𝘁 𝗻𝗲𝗲𝗱𝘀 𝗴𝗿𝗼𝘂𝗽 𝗮𝗱𝗺𝗶𝗻 𝗽𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻.",
                        threadID,
                        messageID
                    );
                }

                const data =
                    (
                        await Threads.getData(
                            threadID
                        )
                    ).data || {};

                data.guard =
                    data.guard === true
                        ? false
                        : true;

                await Threads.setData(
                    threadID,
                    {
                        data
                    }
                );

                if (
                    global.data &&
                    global.data.threadData
                ) {
                    global.data.threadData.set(
                        parseInt(threadID),
                        data
                    );
                }

                return api.sendMessage(
                    data.guard
                        ? "🛡️ 𝗔𝗻𝘁𝗶-𝗥𝗼𝗯𝗯𝗲𝗿𝘆: 𝗢𝗡"
                        : "🔓 𝗔𝗻𝘁𝗶-𝗥𝗼𝗯𝗯𝗲𝗿𝘆: 𝗢𝗙𝗙",
                    threadID,
                    messageID
                );
            } catch (error) {
                return api.sendMessage(
                    "⚠️ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝘂𝗽𝗱𝗮𝘁𝗲 𝗮𝗻𝘁𝗶-𝗿𝗼𝗯𝗯𝗲𝗿𝘆.",
                    threadID,
                    messageID
                );
            }
        }

        case "9": {
            try {
                const data =
                    (
                        await Threads.getData(
                            threadID
                        )
                    ).data || {};

                data.antiout =
                    data.antiout === true
                        ? false
                        : true;

                await Threads.setData(
                    threadID,
                    {
                        data
                    }
                );

                if (
                    global.data &&
                    global.data.threadData
                ) {
                    global.data.threadData.set(
                        parseInt(threadID),
                        data
                    );
                }

                return api.sendMessage(
                    data.antiout
                        ? "🛡️ 𝗔𝗻𝘁𝗶𝗼𝘂𝘁: 𝗢𝗡"
                        : "🔓 𝗔𝗻𝘁𝗶𝗼𝘂𝘁: 𝗢𝗙𝗙",
                    threadID,
                    messageID
                );
            } catch (error) {
                return api.sendMessage(
                    "⚠️ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝘂𝗽𝗱𝗮𝘁𝗲 𝗮𝗻𝘁𝗶𝗼𝘂𝘁.",
                    threadID,
                    messageID
                );
            }
        }

        case "10": {
            try {
                const info =
                    await api.getThreadInfo(
                        threadID
                    );

                const users =
                    Array.isArray(
                        info.userInfo
                    )
                        ? info.userInfo
                        : [];

                const botID =
                    getBotID(api);

                const adminIDs =
                    Array.isArray(
                        info.adminIDs
                    )
                        ? info.adminIDs.map(
                            item =>
                                String(item.id)
                        )
                        : [];

                const filtered =
                    users.filter(
                        user =>
                            user &&
                            user.gender === undefined &&
                            String(user.id) !==
                                String(botID) &&
                            !adminIDs.includes(
                                String(user.id)
                            )
                    );

                if (!filtered.length) {
                    return api.sendMessage(
                        "⚠️ 𝗡𝗼 𝘂𝗻𝗶𝗱𝗲𝗻𝘁𝗶𝗳𝗶𝗲𝗱 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 𝘂𝘀𝗲𝗿 𝗳𝗼𝘂𝗻𝗱.",
                        threadID,
                        messageID
                    );
                }

                const preview =
                    filtered
                        .slice(0, 20)
                        .map(
                            (user, index) =>
                                `${index + 1}. ${user.name || "Unknown"}\n   𝗨𝗜𝗗: ${user.id}`
                        )
                        .join("\n\n");

                return api.sendMessage(
`⚠️ 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞 𝗨𝗦𝗘𝗥 𝗙𝗜𝗟𝗧𝗘𝗥

👥 𝗙𝗼𝘂𝗻𝗱: ${filtered.length}

${preview}

𝗡𝗼 𝘂𝘀𝗲𝗿𝘀 𝘄𝗶𝗹𝗹 𝗯𝗲 𝗿𝗲𝗺𝗼𝘃𝗲𝗱 𝗮𝘂𝘁𝗼𝗺𝗮𝘁𝗶𝗰𝗮𝗹𝗹𝘆.`,
                    threadID,
                    messageID
                );
            } catch (error) {
                return api.sendMessage(
                    "⚠️ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝗳𝗶𝗹𝘁𝗲𝗿 𝘂𝘀𝗲𝗿𝘀.",
                    threadID,
                    messageID
                );
            }
        }

        case "11": {
            const ping =
                Date.now();

            const botName =
                global.config.BOTNAME ||
                "Bot";

            const prefix =
                global.config.PREFIX ||
                "/";

            const admin =
                global.config.ADMINBOT ||
                [];

            const commands =
                global.client.commands;

            const now =
                moment
                    .tz("Asia/Dhaka")
                    .format("HH:mm:ss");

            let threadSetting = {};

            try {
                threadSetting =
                    (
                        await Threads.getData(
                            String(threadID)
                        )
                    ).data || {};
            } catch (_) {}

            const boxPrefix =
                Object.prototype.hasOwnProperty.call(
                    threadSetting,
                    "PREFIX"
                )
                    ? threadSetting.PREFIX
                    : prefix;

            const totalGroups =
                global.data &&
                Array.isArray(
                    global.data.allThreadID
                )
                    ? global.data.allThreadID.length
                    : 0;

            const totalUsers =
                global.data &&
                Array.isArray(
                    global.data.allUserID
                )
                    ? global.data.allUserID.length
                    : 0;

            return api.sendMessage(
`🤖 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡

𝗡𝗮𝗺𝗲: ${botName}
𝗧𝗶𝗺𝗲: ${now}
𝗨𝗽𝘁𝗶𝗺𝗲: ${getUptime()}

👥 𝗚𝗿𝗼𝘂𝗽𝘀: ${totalGroups}
👤 𝗨𝘀𝗲𝗿𝘀: ${totalUsers}
🛡️ 𝗔𝗱𝗺𝗶𝗻𝘀: ${admin.length}
📝 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${
    commands
        ? commands.size
        : 0
}

🌟 𝗦𝘆𝘀𝘁𝗲𝗺 𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}
📌 𝗚𝗿𝗼𝘂𝗽 𝗣𝗿𝗲𝗳𝗶𝘅: ${boxPrefix}

${getSystemInfo(ping)}`,
                threadID,
                messageID
            );
        }

        case "12": {
            try {
                const info =
                    await api.getThreadInfo(
                        threadID
                    );

                const users =
                    Array.isArray(
                        info.userInfo
                    )
                        ? info.userInfo
                        : [];

                let male = 0;
                let female = 0;

                for (
                    const user
                    of users
                ) {
                    if (
                        user.gender ===
                        "MALE"
                    ) {
                        male++;
                    }

                    if (
                        user.gender ===
                        "FEMALE"
                    ) {
                        female++;
                    }
                }

                const members =
                    Array.isArray(
                        info.participantIDs
                    )
                        ? info.participantIDs.length
                        : 0;

                const admins =
                    Array.isArray(
                        info.adminIDs
                    )
                        ? info.adminIDs.length
                        : 0;

                const messages =
                    info.messageCount ||
                    0;

                const approval =
                    info.approvalMode === true
                        ? "𝗢𝗡"
                        : "𝗢𝗙𝗙";

                const emoji =
                    info.emoji ||
                    "None";

                const totalChat =
                    readJSON(
                        TOTAL_PATH,
                        {}
                    );

                if (
                    !totalChat[threadID]
                ) {
                    totalChat[threadID] = {
                        time: Date.now(),
                        count: messages,
                        ytd: 0
                    };

                    writeJSON(
                        TOTAL_PATH,
                        totalChat
                    );
                }

                const record =
                    totalChat[threadID];

                const today =
                    Math.max(
                        0,
                        messages -
                            (record.count || 0)
                    );

                const yesterday =
                    record.ytd || 0;

                const timeNow =
                    moment
                        .tz("Asia/Dhaka")
                        .format("HH:mm:ss");

                return api.sendMessage(
`👥 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡

𝗡𝗮𝗺𝗲: ${
    info.threadName ||
    "Unknown"
}
𝗜𝗗: ${info.threadID}

👥 𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${members}
👨 𝗠𝗮𝗹𝗲: ${male}
👩 𝗙𝗲𝗺𝗮𝗹𝗲: ${female}
🛡️ 𝗔𝗱𝗺𝗶𝗻𝘀: ${admins}

💬 𝗠𝗲𝘀𝘀𝗮𝗴𝗲𝘀: ${messages}
📈 𝗧𝗼𝗱𝗮𝘆: ${today}
📊 𝗬𝗲𝘀𝘁𝗲𝗿𝗱𝗮𝘆: ${yesterday}

🔐 𝗔𝗽𝗽𝗿𝗼𝘃𝗮𝗹: ${approval}
😀 𝗘𝗺𝗼𝗷𝗶: ${emoji}

🕐 𝗧𝗶𝗺𝗲: ${timeNow}`,
                    threadID,
                    messageID
                );
            } catch (error) {
                return api.sendMessage(
                    "⚠️ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝗹𝗼𝗮𝗱 𝗴𝗿𝗼𝘂𝗽 𝗶𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻.",
                    threadID,
                    messageID
                );
            }
        }

        case "13": {
            try {
                const info =
                    await api.getThreadInfo(
                        threadID
                    );

                const adminIDs =
                    Array.isArray(
                        info.adminIDs
                    )
                        ? info.adminIDs
                        : [];

                if (!adminIDs.length) {
                    return api.sendMessage(
                        "⚠️ 𝗡𝗼 𝗴𝗿𝗼𝘂𝗽 𝗮𝗱𝗺𝗶𝗻 𝗳𝗼𝘂𝗻𝗱.",
                        threadID,
                        messageID
                    );
                }

                const list = [];

                for (
                    let i = 0;
                    i < adminIDs.length;
                    i++
                ) {
                    try {
                        const user =
                            await api.getUserInfo(
                                adminIDs[i].id
                            );

                        const name =
                            user &&
                            user[
                                adminIDs[i].id
                            ]
                                ? user[
                                    adminIDs[i].id
                                ].name
                                : "Unknown";

                        list.push(
                            `${i + 1}. 𝗡𝗮𝗺𝗲: ${name}\n   𝗨𝗜𝗗: ${adminIDs[i].id}`
                        );
                    } catch (_) {
                        list.push(
                            `${i + 1}. 𝗨𝗜𝗗: ${adminIDs[i].id}`
                        );
                    }
                }

                return api.sendMessage(
`👑 𝗚𝗥𝗢𝗨𝗣 𝗔𝗗𝗠𝗜𝗡𝗦

${list.join("\n\n")}`,
                    threadID,
                    messageID
                );
            } catch (error) {
                return api.sendMessage(
                    "⚠️ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝗹𝗼𝗮𝗱 𝗴𝗿𝗼𝘂𝗽 𝗮𝗱𝗺𝗶𝗻𝘀.",
                    threadID,
                    messageID
                );
            }
        }

        case "14": {
            const adminList =
                global.config.ADMINBOT ||
                [];

            if (!adminList.length) {
                return api.sendMessage(
                    "⚠️ 𝗡𝗼 𝗯𝗼𝘁 𝗮𝗱𝗺𝗶𝗻 𝗳𝗼𝘂𝗻𝗱.",
                    threadID,
                    messageID
                );
            }

            const list = [];

            for (
                let i = 0;
                i < adminList.length;
                i++
            ) {
                const id =
                    String(
                        adminList[i]
                    );

                try {
                    const data =
                        await Users.getData(
                            id
                        );

                    list.push(
                        `${i + 1}. 𝗡𝗮𝗺𝗲: ${
                            data.name ||
                            "Unknown"
                        }\n   𝗨𝗜𝗗: ${id}\n   𝗟𝗶𝗻𝗸: fb.me/${id}`
                    );
                } catch (_) {
                    list.push(
                        `${i + 1}. 𝗨𝗜𝗗: ${id}\n   𝗟𝗶𝗻𝗸: fb.me/${id}`
                    );
                }
            }

            return api.sendMessage(
`👑 𝗕𝗢𝗧 𝗔𝗗𝗠𝗜𝗡𝗦

${list.join("\n\n")}`,
                threadID,
                messageID
            );
        }

        case "15": {
            try {
                const inbox =
                    await api.getThreadList(
                        300,
                        null,
                        ["INBOX"]
                    );

                const groups =
                    [...inbox].filter(
                        group =>
                            group.isSubscribed &&
                            group.isGroup
                    );

                if (!groups.length) {
                    return api.sendMessage(
                        "⚠️ 𝗡𝗼 𝗴𝗿𝗼𝘂𝗽 𝗳𝗼𝘂𝗻𝗱.",
                        threadID,
                        messageID
                    );
                }

                const list =
                    groups.map(
                        (group, index) =>
                            `${index + 1}. ${
                                group.name ||
                                "Unknown"
                            }\n   𝗜𝗗: ${group.threadID}`
                    );

                return api.sendMessage(
`💬 𝗕𝗢𝗧 𝗚𝗥𝗢𝗨𝗣 𝗟𝗜𝗦𝗧

${list.join("\n\n")}

📊 𝗧𝗼𝘁𝗮𝗹: ${groups.length}`,
                    threadID,
                    messageID
                );
            } catch (error) {
                return api.sendMessage(
                    "⚠️ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝗹𝗼𝗮𝗱 𝗴𝗿𝗼𝘂𝗽 𝗹𝗶𝘀𝘁.",
                    threadID,
                    messageID
                );
            }
        }

        default:
            return api.sendMessage(
                "⚠️ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗼𝗽𝘁𝗶𝗼𝗻.\n\n𝗣𝗹𝗲𝗮𝘀𝗲 𝗰𝗵𝗼𝗼𝘀𝗲 𝗮 𝗻𝘂𝗺𝗯𝗲𝗿 𝗳𝗿𝗼𝗺 ➊–⓯.",
                threadID,
                messageID
            );
    }
};

module.exports.handleEvent = async function ({
    api,
    event
}) {
    try {
        ensureCache();

        const totalChat =
            readJSON(
                TOTAL_PATH,
                {}
            );

        if (
            !totalChat[
                event.threadID
            ]
        ) {
            return;
        }

        if (
            Date.now() -
                totalChat[
                    event.threadID
                ].time >
            _24hours * 2
        ) {
            const info =
                await api.getThreadInfo(
                    event.threadID
                );

            const messageCount =
                info.messageCount ||
                0;

            const previous =
                totalChat[
                    event.threadID
                ].count || 0;

            totalChat[
                event.threadID
            ] = {
                time:
                    Date.now() -
                    _24hours,
                count:
                    messageCount,
                ytd:
                    messageCount -
                    previous
            };

            writeJSON(
                TOTAL_PATH,
                totalChat
            );
        }
    } catch (error) {
        console.error(
            "[SETTINGS] Statistics error:",
            error.message
        );
    }
};
