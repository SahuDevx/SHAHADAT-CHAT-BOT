const fs = require("fs-extra");
const axios = require("axios");

module.exports.config = {
    name: "resend",
    aliases: ["resendmsg"],
    version: "1.2.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Auto resend removed messages",
    commandCategory: "general",
    usages: "[on/off]",
    cooldowns: 0,
    hide: true,
    usePrefix: true
};

module.exports.handleEvent = async function ({ event, api, Users }) {
    const {
        threadID,
        messageID,
        senderID,
        body,
        attachments,
        type
    } = event;

    if (!global.logMessage) {
        global.logMessage = new Map();
    }

    if (!global.data.botID) {
        global.data.botID = api.getCurrentUserID();
    }

    const data = global.data.threadData.get(threadID) || {};

    if (
        data.resend !== false &&
        senderID !== global.data.botID
    ) {
        if (type !== "message_unsend") {
            global.logMessage.set(messageID, {
                msgBody: body,
                attachment: attachments
            });
        }

        if (type === "message_unsend") {
            const msg = global.logMessage.get(messageID);

            if (!msg) return;

            const userName = await Users.getNameUser(senderID);

            if (
                !msg.attachment ||
                msg.attachment.length === 0
            ) {
                return api.sendMessage(
                    `সবাই দেখেন নাও\n${userName} রিমুভ করেছে:\n${msg.msgBody || ""}`,
                    threadID
                );
            }

            const attachmentsList = [];
            let count = 0;

            for (const file of msg.attachment) {
                count++;

                const ext =
                    file.url.split(".").pop().split("?")[0] || "bin";

                const filePath =
                    __dirname + `/cache/resend_${count}.${ext}`;

                const fileData = (
                    await axios.get(file.url, {
                        responseType: "arraybuffer"
                    })
                ).data;

                fs.writeFileSync(filePath, Buffer.from(fileData));

                attachmentsList.push(
                    fs.createReadStream(filePath)
                );
            }

            return api.sendMessage(
                {
                    body: `সবাই দেখেন নাও\n${userName} রিমুভ করেছে:\n${msg.msgBody || ""}`,
                    attachment: attachmentsList
                },
                threadID
            );
        }
    }
};

module.exports.run = async function ({
    api,
    event,
    Threads,
    args
}) {
    const { threadID, messageID } = event;

    const action = String(args[0] || "").toLowerCase();

    const data =
        (await Threads.getData(threadID)).data || {};

    if (action === "on") {
        data.resend = true;
    } else if (action === "off") {
        data.resend = false;
    } else {
        const currentStatus =
            data.resend === false ? "OFF" : "ON";

        return api.sendMessage(
            `🔄 𝗥𝗲𝘀𝗲𝗻𝗱 𝗺𝗼𝗱𝗲: ${currentStatus}\n\n𝗨𝘀𝗮𝗴𝗲: /resend on | off`,
            threadID,
            messageID
        );
    }

    await Threads.setData(threadID, { data });

    if (global.data && global.data.threadData) {
        global.data.threadData.set(
            String(threadID),
            data
        );
    }

    return api.sendMessage(
        `✅ 𝗥𝗲𝘀𝗲𝗻𝗱 𝗺𝗼𝗱𝗲: ${data.resend ? "ON" : "OFF"}`,
        threadID,
        messageID
    );
};
