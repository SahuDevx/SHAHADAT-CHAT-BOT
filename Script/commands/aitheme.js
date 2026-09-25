module.exports.config = {
    name: "aitheme",
    version: "1.0.0",
    hasPermssion: 1,
    credits: "SHAHADAT SAHU",
    description: "Generate an AI chat theme and apply it with confirmation",
    commandCategory: "Group",
    usages: "[prompt]",
    cooldowns: 10,
    usePrefix: true
};

module.exports.run = async function ({ api, event, args }) {
    try {
        const prompt = args.join(" ").trim();

        if (!prompt) {
            return api.sendMessage(
                "🎨 AI theme generate korar jonno prompt din!",
                event.threadID,
                event.messageID
            );
        }

        if (
            typeof api.metaTheme !== "function" ||
            typeof api.setThreadTheme !== "function"
        ) {
            return api.sendMessage(
                "❌ Tomar FCA version-e AI Theme support available nei!",
                event.threadID,
                event.messageID
            );
        }

        const waitMsg = await new Promise(resolve => {
            api.sendMessage(
                `⏳ AI diye "${prompt}" theme generate kora hocche...`,
                event.threadID,
                (err, info) => resolve(info || null)
            );
        });

        const themeResult = await new Promise((resolve, reject) => {
            api.metaTheme(
                prompt,
                { numThemes: 1 },
                (err, data) => {
                    if (err) return reject(err);
                    resolve(data);
                }
            );
        });

        if (
            waitMsg &&
            waitMsg.messageID &&
            typeof api.unsendMessage === "function"
        ) {
            api.unsendMessage(waitMsg.messageID, () => {});
        }

        if (!themeResult || !themeResult.themeId) {
            return api.sendMessage(
                "❌ AI theme generate kora jayni! Onno prompt diye try korun.",
                event.threadID,
                event.messageID
            );
        }

        const themeName = themeResult.name || prompt;

        const confirmMessage = await new Promise(resolve => {
            api.sendMessage(
                "🎨 AI Theme Generated\n\n" +
                `Theme: ${themeName}\n\n` +
                "👍 Ei message-e je kono reaction din apply korar jonno.",
                event.threadID,
                (err, info) => resolve(info || null)
            );
        });

        if (!confirmMessage || !confirmMessage.messageID) {
            return;
        }

        global.client.aiThemePending =
            global.client.aiThemePending || new Map();

        global.client.aiThemePending.set(
            confirmMessage.messageID,
            {
                author: event.senderID,
                threadID: event.threadID,
                themeId: themeResult.themeId,
                themeName: themeName,
                createdAt: Date.now()
            }
        );

        setTimeout(() => {
            if (global.client.aiThemePending) {
                global.client.aiThemePending.delete(
                    confirmMessage.messageID
                );
            }
        }, 120000);

    } catch (error) {
        console.error("[AITHEME ERROR]:", error);

        return api.sendMessage(
            `❌ AI Theme generate korte problem hoyeche: ${
                error.message || error
            }`,
            event.threadID,
            event.messageID
        );
    }
};
