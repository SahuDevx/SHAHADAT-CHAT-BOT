module.exports.config = {
	name: "groupname",
	version: "1.0.0", 
	hasPermssion: 1,
	credits: "SHAHADAT SAHU",
	description: "Rename your group",
	commandCategory: "Box", 
	usages: "groupname [name]", 
	cooldowns: 0,
	dependencies: [] 
};

module.exports.run = async function({ api, event, args }) {
	var name = args.join(" ")
	if (!name) api.sendMessage("❌ You have not entered the group name you want to change", event.threadID, event.messageID)
	else api.setTitle(name, event.threadID, () => api.sendMessage(`🔨 The bot changed the group name to: ${name}`, event.threadID, event.messageID));
}
