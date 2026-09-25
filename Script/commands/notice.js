const fs = require("fs-extra");
const request = require("request");
const path = require("path");

module.exports.config = {
    name: "notice",
    aliases: ["notification"],
    version: "1.1.0",
    hasPermssion: 2,
    credits: "SHAHADAT SAHU",
    description: "Send notice to all groups",
    commandCategory: "Admin",
    usages: "[message]",
    cooldowns: 0,
    usePrefix: true
};

const getAttachmentFiles = async (attachments) => {
    const files = [];

    for (const attachment of attachments || []) {
        try {
            const cacheDir = path.join(
                __dirname,
                "cache"
            );

            await fs.ensureDir(cacheDir);

            const fileName =
                attachment.filename ||
                `notice_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2)}`;

            const filePath = path.join(
                cacheDir,
                fileName
            );

            await new Promise((resolve, reject) => {
                request
                    .get(attachment.url)
                    .pipe(fs.createWriteStream(filePath))
                    .on("finish", resolve)
                    .on("error", reject);
            });

            files.push(filePath);

        } catch (error) {
            console.error(
                "[NOTICE ATTACHMENT]",
                error.message
            );
        }
    }

    return files;
};

const createMessage = (
    body,
    files = []
) => {
    const message = {
        body
    };

    if (files.length > 0) {
        message.attachment = files.map(file =>
            fs.createReadStream(file)
        );
    }

    return message;
};

const removeFiles = async (files) => {
    for (const file of files) {
        try {
            await fs.remove(file);
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

    if (handleReply.type === "userReply") {

        let text =
            "📩 NOTICE REPLY\n\n" +
            "User: " +
            userName +
            "\n" +
            "Group: " +
            (
                (await Threads.getInfo(threadID))
                    .threadName ||
                "Unknown"
            ) +
            "\n\n" +
            "Reply:\n" +
            (body || "");

        let files = [];

        if (
            event.attachments &&
            event.attachments.length > 0
        ) {
            files = await getAttachmentFiles(
                event.attachments
            );
        }

        const message =
            createMessage(text, files);

        return api.sendMessage(
            message,
            handleReply.adminThreadID,
            async (err, info) => {

                await removeFiles(files);

                if (err || !info) return;

                global.client.handleReply.push({
                    name: module.exports.config.name,
                    type: "adminReply",
                    messageID: info.messageID,
                    userThreadID: threadID,
                    originalUserMessageID: messageID
                });
            }
        );
    }

    if (handleReply.type === "adminReply") {

        let text =
            "📢 ADMIN REPLY\n\n" +
            (body || "");

        let files = [];

        if (
            event.attachments &&
            event.attachments.length > 0
        ) {
            files = await getAttachmentFiles(
                event.attachments
            );
        }

        const message =
            createMessage(text, files);

        return api.sendMessage(
            message,
            handleReply.userThreadID,
            async (err) => {

                await removeFiles(files);
            },
            handleReply.originalUserMessageID
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

    if (!args.length) {
        return api.sendMessage(
            "⚠️ Please input a notice message.",
            threadID,
            messageID
        );
    }

    let allThreadID =
        global.data.allThreadID || [];

    allThreadID = [
        ...new Set(
            allThreadID
                .map(id => String(id))
                .filter(Boolean)
        )
    ];

    if (!allThreadID.length) {
        return api.sendMessage(
            "⚠️ No group threads found.",
            threadID,
            messageID
        );
    }

    const adminName =
        await Users.getNameUser(senderID);

    const text =
        "📢 NOTICE From Admin " +
        adminName +
        "\n\n" +
        args.join(" ");

    let attachmentFiles = [];

    if (
        event.type === "message_reply" &&
        messageReply &&
        messageReply.attachments &&
        messageReply.attachments.length > 0
    ) {
        attachmentFiles =
            await getAttachmentFiles(
                messageReply.attachments
            );
    }

    let success = 0;
    let failed = 0;

    for (const targetThread of allThreadID) {

        try {
            const message =
                createMessage(
                    text,
                    attachmentFiles
                );

            await new Promise((resolve) => {

                api.sendMessage(
                    message,
                    targetThread,
                    (err, info) => {

                        if (err || !info) {
                            failed++;
                        } else {
                            success++;

                            global.client.handleReply.push({
                                name:
                                    module.exports.config.name,
                                type: "userReply",
                                messageID:
                                    info.messageID,
                                adminThreadID:
                                    threadID,
                                userThreadID:
                                    targetThread
                            });
                        }

                        resolve();
                    }
                );

            });

        } catch (error) {
            failed++;

            console.error(
                "[NOTICE SEND]",
                targetThread,
                error.message
            );
        }
    }

    await removeFiles(
        attachmentFiles
    );

    return api.sendMessage(
        "✅ Notice Sent\n\n" +
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
