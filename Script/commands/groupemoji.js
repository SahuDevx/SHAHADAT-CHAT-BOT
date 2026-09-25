module.exports.config = {
	name: "groupemoji",
	aliases: ["gemoji"],
	version: "1.0.0", 
	hasPermssion: 0,
	credits: "SHAHADAT SAHU",
	description: "Change your group Emoji",
	commandCategory: "Box", 
	usages: "groupemoji [emoji]", 
	cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
	const emoji = args.join(" ");
	
	if (!emoji) {
		return api.sendMessage("You have not entered an Emoji 🐸", event.threadID, event.messageID);
	}

	api.changeThreadEmoji(emoji, event.threadID, () => {
		api.sendMessage(`✅ Emoji successfully changed to: ${emoji}`, event.threadID, event.messageID);
	});
};
