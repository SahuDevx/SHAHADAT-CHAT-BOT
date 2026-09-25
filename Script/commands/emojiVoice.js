module.exports.config = {
 name: "voice",
 version: "2.0.0",
 hasPermssion: 0,
 credits: "SHAHADAT SAHU",
 description: "Emoji দিলে কিউট মেয়ের ভয়েস পাঠাবে 😍",
 commandCategory: "noprefix",
 usages: "😘🥰😍",
 cooldowns: 0
};

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const emojiAudioMap = {
  "☺️": "https://files.catbox.moe/p2mi4u.mp3",
  "😊": "https://files.catbox.moe/p2mi4u.mp3",
  "🌚": "https://files.catbox.moe/ze3wu1.mp3",
  "🌝": "https://files.catbox.moe/ze3wu1.mp3",
  "🐸": "https://files.catbox.moe/9u1857.mp3",
  "👀": "https://files.catbox.moe/372kl0.mp3",
  "🖕": "https://files.catbox.moe/372kl0.mp3",
  "😁": "https://files.catbox.moe/ef6me4.mp3",
  "🤣": "https://files.catbox.moe/ipihl6.mp3",
  "😆": "https://files.catbox.moe/r4unub.mp3",
  "😑": "https://files.catbox.moe/z1evci.mp3",
  "😅": "https://files.catbox.moe/7hvdo6.mp3",
  "😍": "https://files.catbox.moe/r13v24.mp3",
  "😒": "https://files.catbox.moe/ww8yts.mp3",
  "💋": "https://files.catbox.moe/hd0zfr.mp3",
  "😘": "https://files.catbox.moe/hd0zfr.mp3",
  "😡": "https://files.catbox.moe/b5y405.mp3",
  "🤬": "https://files.catbox.moe/b5y405.mp3",
  "😩": "https://files.catbox.moe/vb01zl.mp3",
  "😭": "https://files.catbox.moe/d9w35v.mp3",
  "🙂": "https://files.catbox.moe/flp9ed.mp3",
  "🙏": "https://files.catbox.moe/2aw07b.mp3",
  "😂": "https://files.catbox.moe/vknlt2.mp3",
  "🤭": "https://files.catbox.moe/5s606f.mp3",
  "🥰": "https://files.catbox.moe/1ojauw.mp3",
  "🥱": "https://files.catbox.moe/088yxs.mp3",
  "🥵": "https://files.catbox.moe/c0odmp.mp3",
  "🥺": "https://files.catbox.moe/458umf.mp3",
  "🥹": "https://files.catbox.moe/cj6ny7.mp3",
  "🫶": "https://files.catbox.moe/hyo82t.mp3",
  "🫣": "https://files.catbox.moe/2qjfwl.mp3",
  "🍼": "https://files.catbox.moe/gvrvkh.mp3",
  "👍": "https://files.catbox.moe/t24ebx.mp3"
};

module.exports.handleEvent = async ({ api, event }) => {
 const { threadID, messageID, body } = event;
 if (!body || body.length > 2) return;

 const emoji = body.trim();
 const audioUrl = emojiAudioMap[emoji];
 if (!audioUrl) return;

 const cacheDir = path.join(__dirname, 'cache');
 if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

 const filePath = path.join(cacheDir, `${encodeURIComponent(emoji)}.mp3`);

 try {
 const response = await axios({
 method: 'GET',
 url: audioUrl,
 responseType: 'stream'
 });

 const writer = fs.createWriteStream(filePath);
 response.data.pipe(writer);

 writer.on('finish', () => {
 api.sendMessage({
 attachment: fs.createReadStream(filePath)
 }, threadID, () => {
 fs.unlink(filePath, (err) => {
 if (err) console.error("Error deleting file:", err);
 });
 }, messageID);
 });

 writer.on('error', (err) => {
 console.error("Error writing file:", err);
 api.sendMessage("ইমুজি দিয়ে লাভ নাই\nযাও মুড়ি খাও জান😘", threadID, messageID);
 });

 } catch (error) {
 console.error("Error downloading audio:", error);
 api.sendMessage("ইমুজি দিয়ে লাভ নাই\nযাও মুড়ি খাও জান😘", threadID, messageID);
 }
};

module.exports.run = () => {};
