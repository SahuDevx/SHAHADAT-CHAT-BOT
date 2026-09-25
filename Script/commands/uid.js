module.exports.config = {
    name: "uid",
    aliases: ["id", "userid"],
    version: "2.1.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Get UID (self, mention, or reply)",
    commandCategory: "user",
    usages: "uid [tag/reply/none]",
    cooldowns: 0,
    usePrefix: true
};

function getUID(api, event) {
    let targetID;

    if (
        event.type === "message_reply" &&
        event.messageReply &&
        event.messageReply.senderID
    ) {
        targetID = event.messageReply.senderID;
    } else if (
        event.mentions &&
        Object.keys(event.mentions).length > 0
    ) {
        targetID = Object.keys(event.mentions)[0];
    } else {
        targetID = event.senderID;
    }

    if (!targetID) return;

    return api.sendMessage(
        String(targetID),
        event.threadID,
        event.messageID
    );
}

module.exports.handleEvent = async function ({ api, event, prefix }) {
    if (!event.body) return;

    const body = event.body.trim();
    const invokedCommand = body.split(/\s+/)[0];

    const fileName = require("path")
        .basename(__filename, ".js")
        .toLowerCase();

    const commandName = prefix && invokedCommand.startsWith(prefix)
        ? invokedCommand.slice(prefix.length)
        : invokedCommand;

    const aliases = Array.isArray(module.exports.config.aliases)
        ? module.exports.config.aliases
        : [];

    const validNames = [
        fileName,
        ...aliases
    ].map(name => String(name).toLowerCase());

    if (!validNames.includes(commandName.toLowerCase())) {
        return;
    }

    return getUID(api, event);
};

module.exports.run = async function ({ api, event }) {
    return getUID(api, event);
};
