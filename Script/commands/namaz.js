const axios = require("axios");

module.exports.config = {
    name: "namaz",
    aliases: ["namz", "namaj"],
    version: "1.1.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Show prayer times by city",
    commandCategory: "Islamic",
    usages: "namaz [city name]",
    cooldowns: 10,
    usePrefix: true,
    dependencies: {
        axios: ""
    }
};

const PRAYER_NAMES = [
    ["Fajr", "ফজর"],
    ["Sunrise", "সূর্যোদয়"],
    ["Dhuhr", "যোহর"],
    ["Asr", "আসর"],
    ["Maghrib", "মাগরিব"],
    ["Isha", "ইশা"]
];

function cleanTime(value) {
    return String(value || "N/A")
        .replace(/\s*\(.+?\)\s*/g, "")
        .trim();
}

module.exports.run = async function ({ api, event, args }) {
    const city = args.join(" ").trim();

    if (!city) {
        return api.sendMessage(
            "⚠️ Please enter a city name.\n\nExample:\n/namaz Khagrachari\n/namaz Dhaka\n/namaz Chattogram",
            event.threadID,
            event.messageID
        );
    }

    const country = "Bangladesh";

    try {
        const response = await axios.get(
            "https://api.aladhan.com/v1/timingsByCity",
            {
                timeout: 15000,
                params: {
                    city,
                    country,
                    method: 1
                }
            }
        );

        const payload = response.data?.data;
        const timings = payload?.timings;

        if (!timings) {
            throw new Error("Prayer data not found");
        }

        const date = payload.date || {};

        const lines = PRAYER_NAMES.map(
            ([key, label]) =>
                `🕌 ${label}: ${cleanTime(timings[key])}`
        );

        const body =
`🕌 𝗡𝗮𝗺𝗮𝘇 𝗧𝗶𝗺𝗲

📍 𝗖𝗶𝘁𝘆: ${city}, ${country}
📅 𝗗𝗮𝘁𝗲: ${date.readable || "Today"}
🌙 𝗛𝗶𝗷𝗿𝗶: ${date.hijri?.date || "N/A"}

${lines.join("\n")}

🆓 Source: Aladhan free API`;

        return api.sendMessage(
            body,
            event.threadID,
            event.messageID
        );

    } catch (error) {
        return api.sendMessage(
            `⚠️ ${city}-এর নামাজের সময় পাওয়া যায়নি!`,
            event.threadID,
            event.messageID
        );
    }
};
