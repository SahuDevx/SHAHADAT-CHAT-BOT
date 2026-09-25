const axios = require("axios");

module.exports.config = {
    name: "imagine",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Generate AI images from text prompts",
    commandCategory: "AI",
    usages: "[prompt]",
    cooldowns: 15,
    usePrefix: true
};

module.exports.run = async function ({ api, event, args }) {
    let waitMsg = null;

    try {
        const prompt = args.join(" ").trim();

        if (!prompt) {
            return api.sendMessage(
                "🎨 AI Image Generator\n\n" +
                "📝 Image generate korar jonno ekta prompt din.",
                event.threadID,
                event.messageID
            );
        }

        waitMsg = await new Promise(resolve => {
            api.sendMessage(
                "⏳ AI image generate kora hocche, please wait...",
                event.threadID,
                (err, info) => resolve(info || null)
            );
        });

        const seed = Math.floor(
            Math.random() * 1000000
        );

        const imageUrl =
            `https://image.pollinations.ai/prompt/` +
            `${encodeURIComponent(prompt)}` +
            `?seed=${seed}` +
            `&width=1024` +
            `&height=1024` +
            `&nologo=true` +
            `&model=flux`;

        const imgStream = await axios.get(
            imageUrl,
            {
                responseType: "stream",
                timeout: 60000,
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
                }
            }
        );

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
            {
                body:
                    "🎨 ━━━ [ AI GENERATED IMAGE ] ━━━ 🎨\n\n" +
                    `📝 Prompt: ${prompt}\n` +
                    "✨ Model: Flux AI",
                attachment: imgStream.data
            },
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error(
            "[IMAGINE ERROR]:",
            error.response?.data ||
            error.message ||
            error
        );

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
            `❌ AI image generate korte problem hoyeche: ${
                error.message || error
            }`,
            event.threadID,
            event.messageID
        );
    }
};
