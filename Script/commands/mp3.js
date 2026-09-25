const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { spawn } = require("child_process");

const CACHE_DIR = path.join(__dirname, "cache");

module.exports.config = {
    name: "mp3",
    aliases: ["tomp3"],
    version: "2.0.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Convert replied video to MP3 audio",
    commandCategory: "media",
    usages: "mp3",
    cooldowns: 10,
    usePrefix: true,
    dependencies: {
        axios: "",
        "fs-extra": ""
    }
};

function runFFmpeg(input, output) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
            "-y",
            "-i", input,
            "-vn",
            "-acodec", "libmp3lame",
            "-q:a", "2",
            output
        ], {
            windowsHide: true
        });

        let errorOutput = "";

        ffmpeg.stderr.on("data", data => {
            errorOutput += data.toString();
        });

        ffmpeg.on("error", error => {
            reject(error);
        });

        ffmpeg.on("close", code => {
            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(
                        errorOutput || `FFmpeg exited with code ${code}`
                    )
                );
            }
        });
    });
}

async function downloadVideo(url, filePath) {
    const response = await axios.get(url, {
        responseType: "stream",
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });

    await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}

module.exports.run = async function ({
    api,
    event
}) {
    let videoPath = null;
    let audioPath = null;

    try {
        const reply = event.messageReply;

        if (
            !reply ||
            !reply.attachments ||
            !reply.attachments.length
        ) {
            return api.sendMessage(
                "⚠️ একটি ভিডিওতে reply করে /mp3 লিখুন।",
                event.threadID,
                event.messageID
            );
        }

        const video = reply.attachments.find(
            attachment =>
                attachment.type === "video" &&
                attachment.url
        );

        if (!video) {
            return api.sendMessage(
                "⚠️ Reply করা message-এ কোনো video পাওয়া যায়নি!",
                event.threadID,
                event.messageID
            );
        }

        await fs.ensureDir(CACHE_DIR);

        const id = `${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;

        videoPath = path.join(
            CACHE_DIR,
            `video_${id}.mp4`
        );

        audioPath = path.join(
            CACHE_DIR,
            `audio_${id}.mp3`
        );

        api.setMessageReaction(
            "⏳",
            event.messageID,
            () => {},
            true
        );

        await downloadVideo(
            video.url,
            videoPath
        );

        await runFFmpeg(
            videoPath,
            audioPath
        );

        if (
            !(await fs.pathExists(audioPath)) ||
            (await fs.stat(audioPath)).size === 0
        ) {
            throw new Error(
                "MP3 file was not created"
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
                    "🎵 𝗩𝗶𝗱𝗲𝗼 𝗖𝗼𝗻𝘃𝗲𝗿𝘁𝗲𝗱 𝗧𝗼 𝗠𝗣𝟯\n\n" +
                    "🎧 Your audio is ready!",
                attachment:
                    fs.createReadStream(audioPath)
            },
            event.threadID,
            async () => {
                await fs.remove(videoPath).catch(() => {});
                await fs.remove(audioPath).catch(() => {});
            },
            event.messageID
        );

    } catch (error) {
        console.error(
            "[MP3 ERROR]",
            error.message
        );

        if (videoPath) {
            await fs.remove(videoPath).catch(() => {});
        }

        if (audioPath) {
            await fs.remove(audioPath).catch(() => {});
        }

        api.setMessageReaction(
            "⚠️",
            event.messageID,
            () => {},
            true
        );

        return api.sendMessage(
            "❌ ভিডিও থেকে MP3 তৈরি করা যায়নি।",
            event.threadID,
            event.messageID
        );
    }
};
