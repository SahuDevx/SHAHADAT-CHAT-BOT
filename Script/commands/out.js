module.exports.config = {
    name: "out",
    aliases: ["leave"],
    version: "1.1.0",
    hasPermssion: 2,
    credits: "SHAHADAT SAHU",
    description: "Leave group with goodbye message",
    commandCategory: "Admin",
    usages: "out [id]",
    cooldowns: 0,
    usePrefix: true
};

module.exports.run = async function({
    api,
    event,
    args
}) {
    const botID = api.getCurrentUserID();

    const threadID =
        args[0] && !isNaN(args[0])
            ? args.join(" ")
            : event.threadID;

    const message = `👋 Goodbye Everyone! 💚

💖 Shobai ke onek dhonnobad amar sathe thakar jonno.
🌸 Ei group-er sathe thakte pere onek bhalo legeche.
🥰 Shobai bhalo thakben, nijeder care korben!
💫 Abar dekha hobe! 🌺`;

    try {
        await api.sendMessage(
            message,
            threadID
        );

        setTimeout(() => {
            api.removeUserFromGroup(
                botID,
                threadID
            );
        }, 1500);

    } catch (error) {
        console.error("[OUT]", error);

        return api.sendMessage(
            "⚠️ Failed to leave the group.",
            event.threadID,
            event.messageID
        );
    }
};
