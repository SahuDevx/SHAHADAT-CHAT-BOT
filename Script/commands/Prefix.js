module.exports.config = {
    name: "prefix",
    aliases: ["pref", "myprefix"],
    version: "1.4.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Display bot prefix and basic information (no prefix needed)",
    commandCategory: "Information",
    usages: "prefix",
    cooldowns: 5,
    usePrefix: false
};

const noPrefixTriggers = ["prefix", "pref", "myprefix"];

module.exports.handleEvent = async function ({ api, event, Threads }) {
    try {
        const raw = event.body ? String(event.body).trim() : "";
        if (!raw) return;

        const firstWord = raw.split(/\s+/)[0].toLowerCase();
        if (!noPrefixTriggers.includes(firstWord)) return;

        return module.exports.run({ api, event, Threads });
    } catch (error) {}
};

module.exports.run = async function ({ api, event, Threads }) {
    try {
        const threadID = event.threadID;

        const threadData = await Threads.getData(threadID);

        const threadSetting =
            global.data.threadData.get(String(threadID)) || {};

        const prefix =
            threadSetting.PREFIX ||
            global.config.PREFIX ||
            "/";

        const botName =
            global.config.BOTNAME ||
            global.config.botName ||
            "Messenger Chat Bot";

        const groupName =
            threadData?.threadInfo?.threadName ||
            "Unnamed Group";

        const msg = `🤖 𝗛𝗲𝗹𝗹𝗼! 𝗜'𝗺 ${botName} 👋

𝗛𝗲𝗿𝗲'𝘀 𝗺𝘆 𝗯𝗮𝘀𝗶𝗰 𝗶𝗻𝗳𝗼:

⚙️ 𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}
🤖 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲: ${botName}
➤ 𝗕𝗼𝘅 𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}
➤ 𝗕𝗼𝘅 𝗡𝗮𝗺𝗲: ${groupName}
➤ 𝗔𝗱𝗺𝗶𝗻: 𝗦𝗛𝗔𝗛𝗔𝗗𝗔𝗧 𝗦𝗔𝗛𝗨

💫 𝗧𝗵𝗮𝗻𝗸𝘀 𝗳𝗼𝗿 𝘂𝘀𝗶𝗻𝗴 ${botName} ❤️`;

        return api.sendMessage(
            msg,
            threadID,
            event.messageID
        );

    } catch (error) {
        console.error("[PREFIX ERROR]", error);

        return api.sendMessage(
            "❌ Prefix information পাওয়া যায়নি।",
            event.threadID,
            event.messageID
        );
    }
};
