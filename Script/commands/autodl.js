module.exports = {
    config: {
        name: "autodl",
        version: "1.0.0",
        hasPermssion: 0,
        credits: "SHAON",
        description: "Auto video downloader",
        commandCategory: "user",
        usages: "",
        cooldowns: 5,
        usePrefix: true
    },

    run: async function({ api, event }) {},

    handleEvent: async function({ api, event }) {
        const axios = require("axios");
        const fs = require("fs-extra");
        const { alldown } = require("shaon-videos-downloader");

        const content = event.body || "";

        if (!content.toLowerCase().startsWith("https://")) return;

        const cacheDir = __dirname + "/cache";
        const videoPath = cacheDir + `/auto_${event.senderID}.mp4`;

        try {
            fs.ensureDirSync(cacheDir);

            api.setMessageReaction(
                "⚠️",
                event.messageID,
                () => {},
                true
            );

            const data = await alldown(content);

            if (!data || !data.url) {
                return api.sendMessage(
                    "Video download link paowa jayni.",
                    event.threadID,
                    event.messageID
                );
            }

            api.setMessageReaction(
                "✅",
                event.messageID,
                () => {},
                true
            );

            const response = await axios.get(data.url, {
                responseType: "arraybuffer",
                timeout: 60000,
                maxContentLength: 50 * 1024 * 1024
            });

            fs.writeFileSync(
                videoPath,
                Buffer.from(response.data)
            );

            return api.sendMessage(
                {
                    body: `✦ ${global.config.BOTNAME}
↳ 𝗔𝘂𝘁𝗼 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲
↳ 𝗩𝗶𝗱𝗲𝗼 𝗶𝘀 𝗿𝗲𝗮𝗱𝘆

♡ 𝗘𝗻𝗷𝗼𝘆 𝘁𝗵𝗲 𝘃𝗶𝗱𝗲𝗼!`,
                    attachment: fs.createReadStream(videoPath)
                },
                event.threadID,
                () => {
                    if (fs.existsSync(videoPath)) {
                        fs.unlinkSync(videoPath);
                    }
                },
                event.messageID
            );

        } catch (error) {
            console.error("[AUTODL ERROR]", error);

            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }

            return api.sendMessage(
                "Video download korte problem hoyeche.",
                event.threadID,
                event.messageID
            );
        }
    }
};
