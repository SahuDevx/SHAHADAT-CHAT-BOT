module.exports.config = {
    name: "kickall",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "SHAHADAT SAHU",
    description: "Group er shob member remove kore.",
    commandCategory: "box",
    usages: "",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, getText, args }) {
    const { participantIDs } = await api.getThreadInfo(event.threadID);

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const botID = api.getCurrentUserID();
    const listUserID = participantIDs.filter(ID => ID != botID);

    return api.getThreadInfo(event.threadID, async (err, info) => {
        if (err) {
            return api.sendMessage(
                "⚠️ Group information check korte giye error hoyeche.",
                event.threadID,
                event.messageID
            );
        }

        if (!info.adminIDs.some(item => item.id == botID)) {
            return api.sendMessage(
                "⚠️ Bot-ke age group admin korte hobe.\nTarpor abar try korun.",
                event.threadID,
                event.messageID
            );
        }

        if (!info.adminIDs.some(item => item.id == event.senderID)) {
            return api.sendMessage(
                "⚠️ Shudhu group admin-ra ei command use korte parbe.",
                event.threadID,
                event.messageID
            );
        }

        setTimeout(function () {
            api.removeUserFromGroup(botID, event.threadID);
        }, 300000);

        return api.sendMessage(
            "» Shob member-ke group theke remove kora shuru hoyeche.\nBye everyone 👋",
            event.threadID,
            async (error, info) => {
                for (let id in listUserID) {
                    await delay(1000);
                    api.removeUserFromGroup(
                        listUserID[id],
                        event.threadID
                    );
                }
            }
        );
    });
};
