const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs-extra");
const path = require("path");
const { image } = require("image-downloader");

module.exports.config = {
    name: "removebg",
    aliases: ["rmbg", "rbg", "bgremove"],
    version: "1.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Remove image background",
    commandCategory: "media",
    usages: "Reply to an image",
    cooldowns: 5,
    usePrefix: true
};

module.exports.run = async function({ api, event }) {
    try {
        if (
            event.type !== "message_reply" ||
            !event.messageReply.attachments ||
            event.messageReply.attachments.length === 0
        ) {
            return api.sendMessage(
                "⚠️ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗿𝗲𝗽𝗹𝘆 𝘁𝗼 𝗮𝗻 𝗶𝗺𝗮𝗴𝗲.",
                event.threadID,
                event.messageID
            );
        }

        const attachment = event.messageReply.attachments[0];

        if (attachment.type !== "photo") {
            return api.sendMessage(
                "⚠️ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗿𝗲𝗽𝗹𝘆 𝘁𝗼 𝗮 𝗽𝗵𝗼𝘁𝗼.",
                event.threadID,
                event.messageID
            );
        }

        const loading = await api.sendMessage(
            "⏳ 𝗥𝗲𝗺𝗼𝘃𝗶𝗻𝗴 𝗯𝗮𝗰𝗸𝗴𝗿𝗼𝘂𝗻𝗱...",
            event.threadID
        );

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);

        const imgPath = path.join(
            cacheDir,
            `removebg_${Date.now()}.png`
        );

        try {
            await image({
                url: attachment.url,
                dest: imgPath
            });

            const apiKeys = [
                "y5K9ssQnhr8sB9Tp4hrMsLtU",
                "s6d6EanXm7pEsck9zKjgnJ5u",
                "GJkFyR3WdGAwn8xW5MDYAVWf",
                "xHSGza4zdY8KsHGpQs4phRx9",
                "ymutgb6hEYEDR6xUbfQUiPri",
                "m6AhtWhWJBAPqZzy5BrvMmUp",
                "ZLTgza4FPGii1AEUmZpkzYb7"
            ];

            const apiKey =
                apiKeys[
                    Math.floor(Math.random() * apiKeys.length)
                ];

            const form = new FormData();

            form.append("size", "auto");
            form.append(
                "image_file",
                fs.createReadStream(imgPath)
            );

            const res = await axios.post(
                "https://api.remove.bg/v1.0/removebg",
                form,
                {
                    responseType: "arraybuffer",
                    headers: {
                        ...form.getHeaders(),
                        "X-Api-Key": apiKey
                    }
                }
            );

            await fs.writeFile(imgPath, res.data);

            if (loading?.messageID) {
                await api.unsendMessage(
                    loading.messageID
                ).catch(() => {});
            }

            return api.sendMessage(
                {
                    attachment:
                        fs.createReadStream(imgPath)
                },
                event.threadID,
                event.messageID
            );

        } finally {
            setTimeout(async () => {
                try {
                    if (await fs.pathExists(imgPath)) {
                        await fs.remove(imgPath);
                    }
                } catch {}
            }, 5000);
        }

    } catch (error) {
        console.error(
            "[REMOVEBG]",
            error.response?.data || error.message
        );

        return api.sendMessage(
            "⚠️ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝗿𝗲𝗺𝗼𝘃𝗲 𝗯𝗮𝗰𝗸𝗴𝗿𝗼𝘂𝗻𝗱.",
            event.threadID,
            event.messageID
        );
    }
};
