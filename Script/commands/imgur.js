const axios = require("axios");

module.exports.config = {
    name: "imgur",
    aliases: ["img", "imgr", "imgbb"],
    version: "1.1.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Upload image, video or GIF to Imgur and get direct links",
    commandCategory: "Other",
    usages: "[reply with media]",
    cooldowns: 0,
    usePrefix: true,
    dependencies: {
        axios: ""
    }
};

module.exports.run = async function ({ api, event }) {
    try {
        const reply = event.messageReply;

        if (
            !reply ||
            !reply.attachments ||
            reply.attachments.length === 0
        ) {
            return api.sendMessage(
                "⚠️ Please reply to an image, video or GIF with /imgur",
                event.threadID,
                event.messageID
            );
        }

        const response = await axios.get(
            "https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json",
            {
                timeout: 15000
            }
        );

        const apiUrl = response.data?.imgur;

        if (!apiUrl) {
            throw new Error("Imgur API URL not found");
        }

        const links = [];

        for (const attachment of reply.attachments) {
            if (!attachment.url) {
                links.push("❌ Media URL not found");
                continue;
            }

            try {
                const upload = await axios.get(
                    `${apiUrl}/imgur`,
                    {
                        params: {
                            link: attachment.url
                        },
                        timeout: 60000
                    }
                );

                const directLink =
                    upload.data?.uploaded?.image;

                links.push(
                    directLink ||
                    "❌ Upload failed"
                );

            } catch (error) {
                links.push(
                    "❌ Failed to upload"
                );
            }
        }

        if (!links.length) {
            return api.sendMessage(
                "❌ No media was uploaded.",
                event.threadID,
                event.messageID
            );
        }

        const message =
            links.length === 1
                ? links[0]
                : `${links.join("\n")}`;

        return api.sendMessage(
            message,
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error(
            "[IMGUR ERROR]",
            error.message
        );

        return api.sendMessage(
            "❌ Imgur upload failed.",
            event.threadID,
            event.messageID
        );
    }
};
