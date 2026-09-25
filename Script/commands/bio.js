module.exports.config = {
    name: "bio",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "SHAHADAT SAHU",
    description: "Change the bot's Facebook profile bio",
    commandCategory: "Admin",
    usages: "[new bio / clear]",
    cooldowns: 0,
    usePrefix: true
};

module.exports.run = async function ({ api, event, args }) {
    try {
        const newBio = args.join(" ").trim();

        if (typeof api.changeBio !== "function") {
            return api.sendMessage(
                "❌ Tomar FCA version-e `changeBio` function available nei!",
                event.threadID,
                event.messageID
            );
        }

        if (!newBio) {
            return api.sendMessage(
                "📝 Bot-er Facebook bio change korte notun bio text din!\n\n" +
                "💡 Bio remove korte:\n" +
                "/bio clear",
                event.threadID,
                event.messageID
            );
        }

        const bioToSet =
            newBio.toLowerCase() === "clear"
                ? ""
                : newBio;

        const waitMsg = await new Promise(resolve => {
            api.sendMessage(
                "⏳ Bot-er Facebook bio update kora hocche...",
                event.threadID,
                (err, info) => resolve(info || null)
            );
        });

        await new Promise((resolve, reject) => {
            api.changeBio(
                bioToSet,
                false,
                err => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });

        if (
            waitMsg &&
            waitMsg.messageID &&
            typeof api.unsendMessage === "function"
        ) {
            api.unsendMessage(
                waitMsg.messageID,
                () => {}
            );
        }

        if (bioToSet === "") {
            return api.sendMessage(
                "🗑️ Bot-er Facebook bio successfully clear kora hoyeche!",
                event.threadID,
                event.messageID
            );
        }

        return api.sendMessage(
            "✅ Bot-er Facebook bio successfully update kora hoyeche!\n\n" +
            `📝 New Bio:\n${bioToSet}`,
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error("[BIO ERROR]:", error);

        return api.sendMessage(
            `❌ Bio update korte problem hoyeche: ${
                error.message || error
            }`,
            event.threadID,
            event.messageID
        );
    }
};
