module.exports.config = {
    name: "setname",
    aliases: ["nick", "nickname"],
    version: "1.0.1",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Change the nickname in your group or the person you tag",
    commandCategory: "Box Chat",
    usages: "[name]",
    cooldowns: 3
};

module.exports.run = async function({
    api,
    event,
    args
}) {
    const name = args.join(" ").trim();

    if (!name) {
        return api.sendMessage(
            "⚠️ 𝗡𝗶𝗰𝗸𝗻𝗮𝗺𝗲 𝗰𝗮𝗻𝗻𝗼𝘁 𝗯𝗲 𝗲𝗺𝗽𝘁𝘆.",
            event.threadID,
            event.messageID
        );
    }

    const mention =
        Object.keys(
            event.mentions || {}
        )[0];

    if (!mention) {
        return api.changeNickname(
            name,
            event.threadID,
            event.senderID
        );
    }

    const mentionText =
        event.mentions[mention] || "";

    const nickname =
        name
            .replace(mentionText, "")
            .trim();

    if (!nickname) {
        return api.sendMessage(
            "⚠️ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗽𝗿𝗼𝘃𝗶𝗱𝗲 𝗮 𝗻𝗶𝗰𝗸𝗻𝗮𝗺𝗲.",
            event.threadID,
            event.messageID
        );
    }

    return api.changeNickname(
        nickname,
        event.threadID,
        mention
    );
};
