module.exports.config = {
    name: "mention",
    aliases: ["men", "m"],
    version: "2.1.0",
    hasPermssion: 2,
    credits: "SHAHADAT SAHU",
    description: "Mention users by reply or mention",
    commandCategory: "group",
    usages: "/mention @user1 @user2 [count] or reply",
    cooldowns: 5,
    usePrefix: true
};

module.exports.run = async ({ api, event, args }) => {
    const {
        mentions,
        threadID,
        messageID,
        messageReply
    } = event;

    const users = new Map();

    if (messageReply?.senderID) {
        const id = String(messageReply.senderID);

        users.set(id, {
            id,
            name:
                messageReply.senderName ||
                "User"
        });
    }

    for (const id of Object.keys(mentions || {})) {
        const userID = String(id);

        if (!users.has(userID)) {
            users.set(userID, {
                id: userID,
                name: mentions[id]
            });
        }
    }

    if (!users.size) {
        return api.sendMessage(
            "⚠️ Reply করুন অথবা user-কে mention করুন!",
            threadID,
            messageID
        );
    }

    let count = parseInt(
        args[args.length - 1],
        10
    );

    if (isNaN(count)) {
        count = 1;
    }

    const repeatCount = Math.max(
        1,
        Math.min(count, 20)
    );

    const userList = [...users.values()];

    for (let i = 0; i < repeatCount; i++) {
        try {
            const messageMentions = [];

            let body = "📢 ";

            userList.forEach((user, index) => {
                const tag = `@${user.name}`;

                body += tag;

                if (index < userList.length - 1) {
                    body += " ";
                }

                messageMentions.push({
                    tag,
                    id: user.id
                });
            });

            body +=
                "\n\n🐸 চিপা থেকে বের হও! 😄";

            await api.sendMessage(
                {
                    body,
                    mentions: messageMentions
                },
                threadID
            );

            if (i < repeatCount - 1) {
                await new Promise(resolve =>
                    setTimeout(resolve, 1000)
                );
            }

        } catch (error) {
            console.error(
                "[MENTION ERROR]",
                error
            );

            return api.sendMessage(
                "❌ Mention পাঠাতে সমস্যা হয়েছে।",
                threadID,
                messageID
            );
        }
    }
};
