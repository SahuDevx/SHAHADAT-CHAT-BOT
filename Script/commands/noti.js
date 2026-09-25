const fs = require("fs");
const request = require("request");

module.exports.config = {
    name: "noti",
    aliases: ["notide"],
    version: "2.0.0",
    hasPermssion: 2,
    credits: "MAHBUB SHAON",
    description: "Send notification to all groups",
    commandCategory: "sandnoto",
    usages: "[msg]",
    cooldowns: 0,
    usePrefix: true
};

const downloadAttachments = async (attachments) => {
    const files = [];

    for (const attachment of attachments || []) {
        try {
            const response = await new Promise((resolve, reject) => {
                request.get(attachment.url, (error, response) => {
                    if (error) return reject(error);
                    resolve(response);
                });
            });

            const pathname =
                response.uri?.pathname || "";

            const extension =
                pathname.includes(".")
                    ? pathname.substring(
                        pathname.lastIndexOf(".") + 1
                    )
                    : "bin";

            const fileName =
                attachment.filename ||
                `noti_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2)}`;

            const filePath =
                __dirname +
                "/cache/" +
                fileName +
                "." +
                extension;

            await new Promise((resolve, reject) => {
                const stream =
                    response.pipe(
                        fs.createWriteStream(filePath)
                    );

                stream.on("finish", resolve);
                stream.on("error", reject);
            });

            files.push(filePath);

        } catch (error) {
            console.error(
                "[NOTI ATTACHMENT]",
                error.message
            );
        }
    }

    return files;
};

const createMessage = (body, files) => {
    const message = {
        body
    };

    if (files && files.length) {
        message.attachment = files.map(file =>
            fs.createReadStream(file)
        );
    }

    return message;
};

const removeFiles = (files) => {
    for (const file of files || []) {
        try {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch (_) {}
    }
};

module.exports.handleReply = async function ({
    api,
    event,
    handleReply,
    Users,
    Threads
}) {
    const {
        threadID,
        messageID,
        senderID,
        body
    } = event;

    const userName =
        await Users.getNameUser(senderID);

    if (handleReply.type === "sendnoti") {

        const threadInfo =
            await Threads.getInfo(threadID);

        const groupName =
            threadInfo?.threadName ||
            "Unknown";

        let text =
            "== User Reply ==\n\n" +
            "『Reply』 : " +
            (body || "") +
            "\n\n" +
            "User Name: " +
            userName +
            "\n" +
            "From Group: " +
            groupName;

        let files = [];

        if (
            event.attachments &&
            event.attachments.length > 0
        ) {
            files =
                await downloadAttachments(
                    event.attachments
                );
        }

        const message =
            createMessage(text, files);

        const adminThreadID =
            handleReply.adminThreadID;

        if (!adminThreadID) {
            removeFiles(files);

            return api.sendMessage(
                "⚠️ Admin thread পাওয়া যায়নি.",
                threadID,
                messageID
            );
        }

        return api.sendMessage(
            message,
            adminThreadID,
            (err, info) => {

                removeFiles(files);

                if (err || !info) return;

                global.client.handleReply.push({
                    name:
                        module.exports.config.name,

                    type:
                        "reply",

                    messageID:
                        info.messageID,

                    messID:
                        messageID,

                    userThreadID:
                        threadID,

                    adminThreadID:
                        adminThreadID
                });
            }
        );
    }

    if (handleReply.type === "reply") {

        let text =
            "𝐀𝐃𝐌𝐈𝐍 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍\n" +
            "•┄┅═════❁🌺❁═════┅┄•\n\n" +
            "｢𝐌𝐄𝐒𝐒𝐀𝐆𝐄｣ : " +
            (body || "") +
            "\n\n" +
            "｢𝗔𝗗𝗠𝗜𝗡｣ " +
            userName +
            "\n\n" +
            "•┄┅═════❁🌺❁═════┅┄•\n" +
            "আপনি যদি এডমিনের সঙ্গে কথা বলতে চান, " +
            "মেসেজের রিপ্লাই দিয়ে মেসেজ করুন।";

        let files = [];

        if (
            event.attachments &&
            event.attachments.length > 0
        ) {
            files =
                await downloadAttachments(
                    event.attachments
                );
        }

        const message =
            createMessage(text, files);

        const userThreadID =
            handleReply.userThreadID;

        if (!userThreadID) {
            removeFiles(files);

            return api.sendMessage(
                "⚠️ User thread পাওয়া যায়নি.",
                threadID,
                messageID
            );
        }

        return api.sendMessage(
            message,
            userThreadID,
            (err, info) => {

                removeFiles(files);

                if (err || !info) return;

                global.client.handleReply.push({
                    name:
                        module.exports.config.name,

                    type:
                        "sendnoti",

                    messageID:
                        info.messageID,

                    messID:
                        messageID,

                    userThreadID:
                        userThreadID,

                    adminThreadID:
                        handleReply.adminThreadID
                });
            },

            handleReply.messID
        );
    }
};

module.exports.run = async function ({
    api,
    event,
    args,
    Users
}) {
    const {
        threadID,
        messageID,
        senderID,
        messageReply
    } = event;

    if (!args[0]) {
        return api.sendMessage(
            "⚠️ Please input message.",
            threadID,
            messageID
        );
    }

    const allThreadID =
        global.data.allThreadID || [];

    const targetThreads = [
        ...new Set(
            allThreadID
                .map(id => String(id))
                .filter(Boolean)
        )
    ];

    if (!targetThreads.length) {
        return api.sendMessage(
            "⚠️ No group threads found.",
            threadID,
            messageID
        );
    }

    const adminName =
        await Users.getNameUser(senderID);

    let text =
        "𝐀𝐃𝐌𝐈𝐍 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍\n" +
        "•┄┅═════❁🌺❁═════┅┄•\n\n" +
        "𝐌𝐀𝐒𝐒𝐀𝐆𝐄: " +
        args.join(" ") +
        "\n\n" +
        "𝗔𝗗𝗠𝗜𝗡 𝗡𝗔𝗠𝗘: " +
        adminName;

    let files = [];

    if (
        event.type === "message_reply" &&
        messageReply &&
        messageReply.attachments &&
        messageReply.attachments.length > 0
    ) {
        files =
            await downloadAttachments(
                messageReply.attachments
            );
    }

    const adminThreadID =
        String(threadID);

    let success = 0;
    let failed = 0;

    for (const targetThread of targetThreads) {

        try {

            const message =
                createMessage(
                    text,
                    files
                );

            await new Promise(resolve => {

                api.sendMessage(
                    message,
                    targetThread,
                    (err, info) => {

                        if (err || !info) {
                            failed++;
                            return resolve();
                        }

                        success++;

                        global.client.handleReply.push({
                            name:
                                module.exports.config.name,

                            type:
                                "sendnoti",

                            messageID:
                                info.messageID,

                            userThreadID:
                                targetThread,

                            adminThreadID:
                                adminThreadID
                        });

                        resolve();
                    }
                );

            });

        } catch (error) {

            failed++;

            console.error(
                "[NOTI SEND]",
                targetThread,
                error.message
            );
        }
    }

    removeFiles(files);

    return api.sendMessage(
        "✅ Notification Sent\n\n" +
        "📤 Sent: " +
        success +
        " groups\n" +
        "❌ Failed: " +
        failed +
        " groups",
        threadID,
        messageID
    );
};
