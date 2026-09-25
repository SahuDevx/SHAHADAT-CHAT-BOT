module.exports.config = {
 name: 'allbox',
 aliases: ["allgroups"],
 version: '1.0.0',
 credits: 'SHAHADAT SAHU ',
 hasPermssion: 2,
 description: '[Ban/Unban/Del/Remove] List[Data] thread The bot has joined in.',
 commandCategory: 'Admin',
 usages: '[page number/all]',
 cooldowns: 0
};

module.exports.handleReply = async function ({ api, event, args, Threads, handleReply }) {
 const { threadID, messageID } = event;
 if (parseInt(event.senderID) !== parseInt(handleReply.author)) return;
 const moment = require("moment-timezone");
 const time = moment.tz("Asia/Dhaka").format("HH:MM:ss L");
 var arg = event.body.split(" ");
 var idgr = handleReply.groupid[arg[1] - 1];
 var groupName = handleReply.groupName[arg[1] - 1];
 switch (handleReply.type) {
 case "reply":
 {
 if (arg[0] == "ban" || arg[0] == "Ban") {
 const data = (await Threads.getData(idgr)).data || {};
 data.banned = 1;
 data.dateAdded = time;
 await Threads.setData(idgr, { data });
 global.data.threadBanned.set(idgr, { dateAdded: data.dateAdded });
 return api.sendMessage(`»Notifications from Bot admin«\n\n Group of Friends Have been banned from using bots by Ban.`, idgr, () =>
 api.sendMessage(`${api.getCurrentUserID()}`, () =>
 api.sendMessage(`★★BanSuccess★★\n\n🔷${groupName} \n🔰TID:${idgr}`, threadID, () =>
 api.unsendMessage(handleReply.messageID))));
 }

 if (arg[0] == "unban" || arg[0] == "Unban" || arg[0] == "ub" || arg[0] == "Ub") {
 const data = (await Threads.getData(idgr)).data || {};
 data.banned = 0;
 data.dateAdded = null;
 await Threads.setData(idgr, { data });
 global.data.threadBanned.delete(idgr, 1);
 return api.sendMessage(`»Notifications from Bot Admin «\n\n Group Of Friends That Have Been Removed Board`, idgr, () =>
 api.sendMessage(`${api.getCurrentUserID()}`, () =>
 api.sendMessage(`★★𝐔𝐧𝐛𝐚𝐧𝐒𝐮𝐜𝐜𝐞𝐬𝐬★★\n\n🔷${groupName} \n🔰𝐓𝐈𝐃:${idgr} `, threadID, () =>
 api.unsendMessage(handleReply.messageID))));
 }

 if (arg[0] == "del" || arg[0] == "Del") {
 const data = (await Threads.getData(idgr)).data || {};
 await Threads.delData(idgr, { data });
 console.log(groupName)
 api.sendMessage(`★★𝐃𝐞𝐥𝐒𝐮𝐜𝐜𝐞𝐬𝐬★★\n\n🔷${groupName} \n🔰𝐓𝐈𝐃: ${idgr} \n Successfully deleted the data!`, event.threadID, event.messageID);
 break;
 }

 if (arg[0] == "out" || arg[0] == "Out") {
 api.sendMessage(`»Notifications from Bot Admin «\n\n ★★Deleted from chat★★ group`, idgr, () =>
 api.sendMessage(`${api.getCurrentUserID()}`, () =>
 api.sendMessage(`★★𝐎𝐮𝐭𝐒𝐮𝐜𝐜𝐞𝐬𝐬★★\n\n🔷${groupName} \n🔰𝐓𝐈𝐃:${idgr} `, threadID, () =>
 api.unsendMessage(handleReply.messageID, () =>
 api.removeUserFromGroup(`${api.getCurrentUserID()}`, idgr)))));
 break;
 }
 }
 }
};
module.exports.run = async function ({ api, event, args }) {
 switch (args[0]) {
 case "all":
 {
 let threadList = [];
 let data, msg = "";
 try {
 data = await api.getThreadList(100, null, ["INBOX"]);
 } catch (e) {
 console.log(e);
 return api.sendMessage("❌ Failed to get thread list.", event.threadID, event.messageID);
 }
 for (const thread of data || []) {
 if (thread.isGroup == true) threadList.push({ threadName: thread.name, threadID: thread.threadID, messageCount: thread.messageCount });
 }
 threadList.sort((a, b) => {
 if (a.messageCount > b.messageCount) return -1;
 if (a.messageCount < b.messageCount) return 1;
 })

 let groupid = [];
 let groupName = [];
 let page = parseInt(args[1]) || 1;
 if (page < 1) page = 1;
 let limit = 100;
 msg = "🔰 All GROUP Info 🔰\n\n";
 let numPage = Math.ceil(threadList.length / limit);

 for (let i = limit * (page - 1); i < limit * (page - 1) + limit; i++) {
 if (i >= threadList.length) break;
 let group = threadList[i];
 msg += `${i + 1}. ${group.threadName}\n🔰𝐓𝐈𝐃: ${group.threadID}\n💌𝐌𝐞𝐬𝐬𝐚𝐠𝐞𝐂𝐨𝐮𝐧𝐭: ${group.messageCount}\n\n`;
 groupid.push(group.threadID);
 groupName.push(group.threadName);
 }
 msg += `--Page ${page}/${numPage}--\nDy ${global.config.PREFIX}allbox page number/all\n\n`

 api.sendMessage(msg + '🎭Reply Out, Ban, Unban, Del[data] the order number to Out, Ban, Unban, Del[data] that thread!', event.threadID, (e, data) =>
 global.client.handleReply.push({
 name: this.config.name,
 author: event.senderID,
 messageID: data.messageID,
 groupid,
 groupName,
 type: 'reply'
 })
 )
 }
 break;

 default:
 {
 const { threadID, messageID } = event;
 const threadList = [];
 const data = Array.isArray(global.data.allThreadID) ? global.data.allThreadID : [];
 let i = 1;
 for (const thread of data) {
 const info = global.data.threadInfo.get(thread);
 const nameThread = (info && info.threadName) || "The name doesn't exist.";
 threadList.push(`${i++}. ${nameThread} \n🔰𝐓𝐈𝐃: ${thread}`);
 }

 return api.sendMessage(
 threadList.length != 0
 ? `🍄There is currently ${threadList.length} group\n\n${threadList.join("\n")}`
 : "There is currently no group!",
 threadID,
 messageID
 );
 }
 }
 };
