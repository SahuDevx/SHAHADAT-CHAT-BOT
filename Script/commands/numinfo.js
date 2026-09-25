const axios = require("axios");

const dipto = "https://www.noobs-api.rf.gd/dipto";

module.exports.config = {
    name: "numinfo",
    aliases: ["numberinfo", "numberi"],
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Dipto",
    description: "Get basic information about a phone number",
    commandCategory: "Information",
    usages: "numinfo <number>",
    cooldowns: 5
};

module.exports.run = async function ({
    api,
    event,
    args
}) {
    const {
        threadID,
        messageID
    } = event;

    if (!args[0]) {
        return api.sendMessage(
            "⚠️ দয়া করে একটি নম্বর দিন!\n\n𝗨𝘀𝗮𝗴𝗲: /numinfo <number>",
            threadID,
            messageID
        );
    }

    let number = String(args[0]).trim();

    if (number.startsWith("+88")) {
        number = number.substring(1);
    }

    if (number.startsWith("01")) {
        number = "88" + number;
    }

    if (!/^8801\d{9}$/.test(number)) {
        return api.sendMessage(
            "⚠️ সঠিক বাংলাদেশের মোবাইল নম্বর দিন।",
            threadID,
            messageID
        );
    }

    try {
        if (typeof api.setMessageReaction === "function") {
            api.setMessageReaction(
                "⌛",
                messageID,
                () => {},
                true
            );
        }

        const response = await axios.get(
            `${dipto}/numinfo?number=${encodeURIComponent(number)}`,
            {
                timeout: 15000
            }
        );

        const data = response.data;

        if (!data || !data.info || !data.info.length) {
            return api.sendMessage(
                "⚠️ কোনো public information পাওয়া যায়নি।",
                threadID,
                messageID
            );
        }

        const types = [
            ...new Set(
                data.info
                    .map(item => item.type)
                    .filter(Boolean)
            )
        ];

        const body = [
            "📱 Number Information",
            "",
            `📞 Number: ${number}`,
            `📡 Type: ${types.length ? types.join(", ") : "Not found"}`,
            "",
            "ℹ️ ব্যক্তিগত নাম বা ব্যক্তিগত তথ্য দেখানো হচ্ছে না।"
        ].join("\n");

        return api.sendMessage(
            body,
            threadID,
            messageID
        );

    } catch (error) {
        console.error(
            "[NUMINFO]",
            error.response?.data || error.message
        );

        return api.sendMessage(
            "⚠️ তথ্য সংগ্রহ করা সম্ভব হয়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
            threadID,
            messageID
        );
    }
};
