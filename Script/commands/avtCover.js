const axios = require("axios");

module.exports.config = {
    name: "avtcover",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "SHAHADAT SAHU",
    description: "Change the bot's Facebook profile cover photo",
    commandCategory: "Admin",
    usages: "Reply to a photo with /botcover or use /botcover <image URL>",
    cooldowns: 0,
    usePrefix: true
};

module.exports.run = async function ({ api, event, args }) {
    let waitMsg = null;

    try {
        let imageUrl = null;

        if (
            event.type === "message_reply" &&
            event.messageReply.attachments &&
            event.messageReply.attachments.length > 0
        ) {
            const att = event.messageReply.attachments[0];

            if (att.type === "photo" && att.url) {
                imageUrl = att.url;
            }
        } else if (
            args[0] &&
            args[0].startsWith("http")
        ) {
            imageUrl = args[0];
        }

        if (!imageUrl) {
            return api.sendMessage(
                "🖼️ Bot-er cover photo change korte kono photo-te reply korun othoba image URL din!",
                event.threadID,
                event.messageID
            );
        }

        if (typeof api.changeCover !== "function") {
            return api.sendMessage(
                "❌ Tomar FCA version-e `changeCover` function available nei!",
                event.threadID,
                event.messageID
            );
        }

        waitMsg = await new Promise(resolve => {
            api.sendMessage(
                "⏳ Bot-er cover photo update kora hocche...",
                event.threadID,
                (err, info) => resolve(info)
            );
        });

        const imgRes = await axios.get(imageUrl, {
            responseType: "stream"
        });

        const coverUrl = await new Promise((resolve, reject) => {
            api.changeCover(imgRes.data, (err, url) => {
                if (err) return reject(err);
                resolve(url);
            });
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

        return api.sendMessage(
            "✅ Bot-er Facebook cover photo successfully updated!",
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error("[BOTCOVER ERROR]:", error);

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

        return api.sendMessage(
            `❌ Cover photo change korte problem hoyeche: ${error.message || error}`,
            event.threadID,
            event.messageID
        );
    }
};
