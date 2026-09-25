const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const { downloadFile } = require("../../utils/index");

module.exports.config = {
 name: "catbox",
 version: "1.0.0",
 hasPermssion: 0,
 credits: "ULLASH",
 description: "Upload media to Catbox",
 commandCategory: "media",
 usages: "[reply to image/video/audio]",
 cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
 const { threadID, type, messageReply, messageID } = event;

 if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0) {
 return api.sendMessage("❐ Please reply to a photo/video/audio file.", threadID, messageID);
 }

 const attachmentPaths = [];

 async function getAttachments(attachments) {
 let index = 0;
 for (const data of attachments) {
 const ext = data.type === "photo" ? "jpg" :
 data.type === "video" ? "mp4" :
 data.type === "audio" ? "mp3" :
 data.type === "animated_image" ? "gif" : "dat";
 const filePath = __dirname + `/cache/${index}.${ext}`;
 await downloadFile(data.url, filePath);
 attachmentPaths.push(filePath);
 index++;
 }
 }

 await getAttachments(messageReply.attachments);

 let msg = "";

 for (const filePath of attachmentPaths) {
 try {
 const form = new FormData();
 form.append("reqtype", "fileupload");
 form.append("fileToUpload", fs.createReadStream(filePath));

 const response = await axios.post("https://catbox.moe/user/api.php", form, {
 headers: form.getHeaders(),
 });

 msg += `${response.data.trim()}\n`;
 } catch (err) {
 console.error("Catbox upload failed:", err);
 msg += "❌ Upload failed for one file.\n";
 } finally {
 fs.unlinkSync(filePath);
 }
 }

 return api.sendMessage(msg.trim(), threadID, messageID);
};