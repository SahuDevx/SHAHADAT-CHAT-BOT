const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "islamick",
    aliases: ["islam", "islamicvideo"],
    version: "2.0.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Send a random Islamic video",
    commandCategory: "Random video",
    usages: "islamick",
    cooldowns: 5,
    usePrefix: true,
    dependencies: {
        axios: "",
        "fs-extra": ""
    }
};

const videos = [
    "https://i.imgur.com/FbnZI40.mp4",
    "https://i.imgur.com/8k6OOZg.mp4",
    "https://i.imgur.com/lgQghHX.mp4",
    "https://i.imgur.com/D7HZFSg.mp4",
    "https://i.imgur.com/vUe9Zlv.mp4",
    "https://i.imgur.com/oxFuJYw.mp4",
    "https://i.imgur.com/OKKlDBN.mp4",
    "https://i.imgur.com/6wWebFc.mp4",
    "https://i.imgur.com/K2LTmaA.mp4",
    "https://i.imgur.com/i9vKvTd.mp4",
    "https://i.imgur.com/Y6uBzxx.mp4",
    "https://i.imgur.com/ULtFVPQ.mp4",
    "https://i.imgur.com/wX8WJh3.mp4",
    "https://i.imgur.com/6A42EIx.mp4",
    "https://i.imgur.com/ozRevxt.mp4",
    "https://i.imgur.com/Gd49ZSo.mp4",
    "https://i.imgur.com/xu6lBXk.mp4",
    "https://i.imgur.com/sDNohv4.mp4",
    "https://i.imgur.com/JBu2Ie3.mp4",
    "https://i.imgur.com/UaY42rq.mp4",
    "https://i.imgur.com/NFxf731.mp4",
    "https://i.imgur.com/vv1HsMC.mp4",
    "https://i.imgur.com/Y8MPzLv.mp4",
    "https://i.imgur.com/9M1v1qK.mp4",
    "https://i.imgur.com/EgUy7v0.mp4",
    "https://i.imgur.com/IjDqg2G.mp4",
    "https://i.imgur.com/51NYqmO.mp4",
    "https://i.imgur.com/XjfJHh9.mp4",
    "https://i.imgur.com/XHrkPt4.mp4",
    "https://i.imgur.com/mqEYRdy.mp4",
    "https://i.imgur.com/NaVsFmQ.mp4",
    "https://i.imgur.com/31XSmVj.mp4",
    "https://i.imgur.com/PPamCPI.mp4",
    "https://i.imgur.com/i6Iy7iN.mp4"
];

module.exports.run = async function ({ api, event }) {
    const fileName =
        `islamic_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}.mp4`;

    const cacheDir =
        path.join(__dirname, "cache");

    const filePath =
        path.join(cacheDir, fileName);

    try {
        await fs.ensureDir(cacheDir);

        const videoUrl =
            videos[
                Math.floor(
                    Math.random() * videos.length
                )
            ];

        api.setMessageReaction(
            "⏳",
            event.messageID,
            () => {},
            true
        );

        const response = await axios.get(
            videoUrl,
            {
                responseType: "stream",
                timeout: 60000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        await new Promise((resolve, reject) => {
            const writer =
                fs.createWriteStream(filePath);

            response.data.pipe(writer);

            writer.on("finish", resolve);
            writer.on("error", reject);

            response.data.on(
                "error",
                reject
            );
        });

        const stat =
            await fs.stat(filePath);

        if (!stat.size) {
            throw new Error(
                "Downloaded video is empty"
            );
        }

        api.setMessageReaction(
            "✅",
            event.messageID,
            () => {},
            true
        );

        return api.sendMessage(
            {
                body:
                    "🌻 মানুষ হারাম ছাড়ে না, " +
                    "অথচ সুখ শান্তি খুঁজে বেড়ায় আরাম।\n" +
                    "মানুষ কেন বুঝতে চায় না,\n" +
                    "সে যে খোদার গোলাম। 🥺\n\n" +
                    "আল্লাহ আমাদের সবাইকে হারাম থেকে " +
                    "দূরে থাকার তৌফিক দান করুন। 🤲❤️‍🩹",

                attachment:
                    fs.createReadStream(filePath)
            },
            event.threadID,
            async () => {
                await fs.remove(filePath)
                    .catch(() => {});
            },
            event.messageID
        );

    } catch (error) {
        await fs.remove(filePath)
            .catch(() => {});

        console.error(
            "[ISLAMICK ERROR]",
            error?.response?.status ||
            error?.message ||
            error
        );

        api.setMessageReaction(
            "❌",
            event.messageID,
            () => {},
            true
        );

        return api.sendMessage(
            "❌ Islamic video পাঠানো যায়নি।\n\n" +
            "⚠️ Video source অথবা download connection-এ সমস্যা হয়েছে।",
            event.threadID,
            event.messageID
        );
    }
};
