const chalk = require('chalk');

module.exports.config = {
 name: "join",
 version: "2.0.0",
 hasPermssion: 2,
 credits: "SHAHADAT SAHU",
 description: "Join one or all bot groups using number or 'add all'",
 commandCategory: "system",
 usages: "",
 cooldowns: 5
};

module.exports.onLoad = () => {
 console.log(chalk.bold.hex("#00c300")(" JOIN COMMAND LOADED SUCCESSFULLY✅"));
};

module.exports.handleReply = async function({ api, event, handleReply, Threads }) {
 const { threadID, messageID, senderID, body } = event;
 const { ID } = handleReply;

 if (!body) return api.sendMessage('❗ Reply with numbers (e.g. 1 2 3) or "add all" to join all.', threadID, messageID);

 const input = body.trim().toLowerCase();

 let selectedIndexes = [];

 if (input === "add all") {
 selectedIndexes = ID.map((_, index) => index);
 } else {
 selectedIndexes = body.split(/\s+/).map(x => parseInt(x.trim()) - 1).filter(i => !isNaN(i) && i >= 0 && i < ID.length);
 if (selectedIndexes.length === 0) {
 return api.sendMessage("⭕ Invalid input. Use numbers (1 2 3) or 'add all'.", threadID, messageID);
 }
 }

 let added = 0, skipped = 0, failed = 0;

 for (const i of selectedIndexes) {
 try {
 const threadIDToJoin = ID[i];
 const threadInfo = await Threads.getInfo(threadIDToJoin);
 const { participantIDs, approvalMode, adminIDs } = threadInfo;

 if (participantIDs.includes(senderID)) {
 skipped++;
 continue;
 }

 await api.addUserToGroup(senderID, threadIDToJoin);

 if (approvalMode && !adminIDs.some(ad => ad.id == api.getCurrentUserID())) {
 api.sendMessage(`📨 Pending approval in "${threadInfo.threadName}".`, threadID);
 } else {
 api.sendMessage(`✅ Added to "${threadInfo.threadName}".`, threadID);
 }

 added++;
 } catch (err) {
 failed++;
 api.sendMessage(`❌ Failed to add to #${i + 1}: ${err.message}`, threadID);
 }
 }

 return api.sendMessage(`📊 Join Report:\n✅ Added: ${added}\n⏩ Already in group: ${skipped}\n❌ Failed: ${failed}`, threadID);
};

module.exports.run = async function({ api, event, Threads }) {
 const { threadID, messageID, senderID } = event;
 const allThreads = await Threads.getAll();
 let msg = `🔰 𝗝𝗢𝗜𝗡 𝗕𝗢𝗫 𝗟𝗜𝗦𝗧 🔰\n\n`;
 const ID = [];

 allThreads.forEach((t, i) => {
 msg += `${i + 1}. ${t.threadInfo.threadName}\n`;
 ID.push(t.threadID);
 });

 msg += `\n✏️ Reply with multiple numbers (e.g. 1 3 5) or type 'add all' to join all groups.`;

 return api.sendMessage(msg, threadID, (err, info) => {
 if (!err) {
 global.client.handleReply.push({
 name: module.exports.config.name,
 author: senderID,
 messageID: info.messageID,
 ID
 });
 }
 }, messageID);
};