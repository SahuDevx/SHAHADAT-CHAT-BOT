module.exports.config = {
 name: "file",
 version: "1.0.0",
 hasPermssion: 2,
 credits: "SHAHADAT SAHU",
 description: "List & delete command files",
 commandCategory: "Admin",
 usages: "file | file all | file <name>",
 cooldowns: 0,
 usePrefix: true
};

const fs = require("fs-extra");
const path = require("path");

module.exports.handleReply = async ({ api, event, handleReply }) => {
 if (event.senderID !== handleReply.author) return;

 const nums = event.body
 .split(" ")
 .map(n => parseInt(n))
 .filter(n => !isNaN(n));

 if (!nums.length) return;

 let msg = "";

 for (const num of nums) {
 const target = handleReply.files[num - 1];
 if (!target) continue;

 const targetPath = path.join(__dirname, target);
 if (!fs.existsSync(targetPath)) continue;

 const stat = fs.statSync(targetPath);

 if (stat.isDirectory()) {
 fs.rmSync(targetPath, { recursive: true, force: true });
 msg += `[Folder🗂️] ${target}\n`;
 } else {
 fs.unlinkSync(targetPath);
 msg += `[File📄] ${target}\n`;
 }
 }

 if (!msg)
 return api.sendMessage("❌ Nothing deleted.", event.threadID, event.messageID);

 api.sendMessage(
 "✅ Deleted successfully:\n\n" + msg,
 event.threadID,
 event.messageID
 );
};

module.exports.run = async function ({ api, event, args }) {
 let files = fs.readdirSync(__dirname);
 let msg = "";
 let i = 1;

 if (args[0] && args[0] !== "all") {
 const word = args.join(" ");
 files = files.filter(f => f.includes(word));
 }

 if (!files.length)
 return api.sendMessage("❌ No files found.", event.threadID, event.messageID);

 for (const file of files) {
 const stat = fs.statSync(path.join(__dirname, file));
 msg += `${i++}. ${stat.isDirectory() ? "[Folder🗂️]" : "[File📄]"} ${file}\n`;
 }

 api.sendMessage(
 `⚠️ Reply with number(s) to delete (space separated)\n\n${msg}`,
 event.threadID,
 (err, info) => {
 if (err) return;
 global.client.handleReply.push({
 name: module.exports.config.name,
 messageID: info.messageID,
 author: event.senderID,
 files
 });
 }
 );
};
