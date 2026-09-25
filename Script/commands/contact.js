module.exports.config = {
    name: "contact",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Share an official Messenger contact card",
    commandCategory: "Utility",
    usages: "[@mention / me / UID] [custom message]",
    cooldowns: 3,
    usePrefix: true
};

module.exports.run = async function ({ api, event, args }) {
    try {
        let targetID = null;
        let noteText = "";

        if (event.type === "message_reply" && event.messageReply) {
            targetID = event.messageReply.senderID;
            noteText = args.join(" ");
        } else if (event.mentions && Object.keys(event.mentions).length > 0) {
            targetID = Object.keys(event.mentions)[0];
            noteText = args.slice(1).join(" ");
        } else if (args[0] && args[0].toLowerCase() === "me") {
            targetID = event.senderID;
            noteText = args.slice(1).join(" ");
        } else if (args[0] && !isNaN(args[0])) {
            targetID = args[0];
            noteText = args.slice(1).join(" ");
        } else {
            targetID = event.senderID;
            noteText = "👤 Contact Card";
        }

        if (!targetID) {
            return api.sendMessage(
                "❌ Kono user identify kora jayni!\n\nPlease mention someone or provide a UID.",
                event.threadID,
                event.messageID
            );
        }

        if (typeof api.shareContact !== "function") {
            return api.sendMessage(
                "❌ Tomar FCA version-e `shareContact` support nei!",
                event.threadID,
                event.messageID
            );
        }

        const caption = noteText.trim() || "👤 Facebook Contact Card";

        await api.shareContact(
            caption,
            targetID,
            event.threadID
        );

    } catch (error) {
        console.error("[CONTACT ERROR]:", error);

        return api.sendMessage(
            `❌ Contact card pathate problem hoyeche: ${error.message || error}`,
            event.threadID,
            event.messageID
        );
    }
};
