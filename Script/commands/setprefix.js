module.exports.config = {
    name: "setprefix",
    aliases: ["changeprefix", "resetprefix"],
    version: "1.0.2",
    hasPermssion: 1,
    credits: "SHAHADAT SAHU",
    description: "Change or reset the group prefix (box admin)",
    commandCategory: "Group",
    usages: "[prefix/reset]",
    cooldowns: 5,
    usePrefix: false
};

module.exports.handleReaction = async function({
    api,
    event,
    Threads,
    handleReaction
}) {
    try {
        if (
            String(event.userID) !==
            String(handleReaction.author)
        ) {
            return;
        }

        const {
            threadID,
            messageID
        } = event;

        const data =
            (await Threads.getData(
                String(threadID)
            )).data || {};

        data.PREFIX =
            handleReaction.PREFIX;

        await Threads.setData(
            threadID,
            { data }
        );

        if (
            global.data &&
            global.data.threadData
        ) {
            global.data.threadData.set(
                String(threadID),
                data
            );
        }

        try {
            await api.unsendMessage(
                handleReaction.messageID
            );
        } catch (_) {}

        return api.sendMessage(
            `» 𝗣𝗿𝗲𝗳𝗶𝘅 𝗰𝗵𝗮𝗻𝗴𝗲𝗱 𝘁𝗼: ${handleReaction.PREFIX}`,
            threadID,
            messageID
        );
    } catch (error) {
        console.error(
            "[SETPREFIX]",
            error
        );

        return api.sendMessage(
            "⚠️ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝗰𝗵𝗮𝗻𝗴𝗲 𝗴𝗿𝗼𝘂𝗽 𝗽𝗿𝗲𝗳𝗶𝘅.",
            event.threadID,
            event.messageID
        );
    }
};

module.exports.run = async function({
    api,
    event,
    args,
    Threads
}) {
    const {
        threadID,
        messageID,
        senderID
    } = event;

    if (
        typeof args[0] ===
        "undefined"
    ) {
        return api.sendMessage(
            "⚠️ 𝗣𝗿𝗲𝗳𝗶𝘅 𝗰𝗮𝗻𝗻𝗼𝘁 𝗯𝗲 𝗲𝗺𝗽𝘁𝘆.\n\n𝗨𝘀𝗮𝗴𝗲: /setprefix <prefix/reset>",
            threadID,
            messageID
        );
    }

    const prefix =
        String(args[0]).trim();

    if (!prefix) {
        return api.sendMessage(
            "⚠️ 𝗣𝗿𝗲𝗳𝗶𝘅 𝗰𝗮𝗻𝗻𝗼𝘁 𝗯𝗲 𝗲𝗺𝗽𝘁𝘆.",
            threadID,
            messageID
        );
    }

    if (
        prefix.toLowerCase() ===
        "reset"
    ) {
        const data =
            (await Threads.getData(
                threadID
            )).data || {};

        data.PREFIX =
            global.config.PREFIX;

        await Threads.setData(
            threadID,
            { data }
        );

        if (
            global.data &&
            global.data.threadData
        ) {
            global.data.threadData.set(
                String(threadID),
                data
            );
        }

        return api.sendMessage(
            `» 𝗣𝗿𝗲𝗳𝗶𝘅 𝗿𝗲𝘀𝗲𝘁 𝘁𝗼: ${global.config.PREFIX}`,
            threadID,
            messageID
        );
    }

    return api.sendMessage(
        `⚙️ 𝗖𝗵𝗮𝗻𝗴𝗲 𝗚𝗿𝗼𝘂𝗽 𝗣𝗿𝗲𝗳𝗶𝘅

𝗡𝗲𝘄 𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}

𝗥𝗲𝗮𝗰𝘁 𝘁𝗼 𝗰𝗼𝗻𝗳𝗶𝗿𝗺 𝘁𝗵𝗲 𝗰𝗵𝗮𝗻𝗴𝗲.`,
        threadID,
        (error, info) => {
            if (
                error ||
                !info
            ) {
                return;
            }

            global.client.handleReaction.push({
                name: module.exports.config.name,
                messageID: info.messageID,
                author: senderID,
                PREFIX: prefix
            });
        },
        messageID
    );
};
