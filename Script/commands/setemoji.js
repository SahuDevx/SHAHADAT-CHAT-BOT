module.exports.config = {
    name: "setemoji",
    aliases: ["emoji"],
    version: "1.0.1",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Change emoji in group",
    commandCategory: "Group",
    usages: "[emoji]",
    cooldowns: 3
};

module.exports.run = async function({
    api,
    event,
    args
}) {
    const emoji = args.join(" ").trim();

    if (!emoji) {
        return api.sendMessage(
            "⚠️ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗽𝗿𝗼𝘃𝗶𝗱𝗲 𝗮𝗻 𝗲𝗺𝗼𝗷𝗶.",
            event.threadID,
            event.messageID
        );
    }

    return api.changeThreadEmoji(
        emoji,
        event.threadID,
        event.messageID
    );
};
