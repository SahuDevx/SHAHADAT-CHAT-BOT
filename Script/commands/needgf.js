const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");

const encodedUrl = "aHR0cHM6Ly9yYXNpbi1hcGlzLm9ucmVuZGVyLmNvbQ==";
const encodedKey = "cnNfaGVpNTJjbTgtbzRvai11Y2ZjLTR2N2MtZzE=";

function decode(b64) {
 return Buffer.from(b64, "base64").toString("utf-8");
}

function downloadImage(url, filePath) {
 return new Promise((resolve, reject) => {
 const file = fs.createWriteStream(filePath);
 https.get(url, res => {
 if (res.statusCode !== 200) return reject(new Error(`Image fetch failed with status: ${res.statusCode}`));
 res.pipe(file);
 file.on("finish", () => file.close(resolve));
 }).on("error", err => {
 fs.unlinkSync(filePath);
 reject(err);
 });
 });
}

module.exports.config = {
 name: "needgf",
 version: "1.0.4",
 hasPermssion: 0,
 credits: "Ullash api rasin",
 description: "সিঙ্গেলদের শেষ ভরসার ফাইল",
 usePrefix: false,
 commandCategory: "fun",
 usages: "/need gf",
 cooldowns: 20,
};

module.exports.run = async function ({ api, event }) {
 try {
 const apiUrl = decode(encodedUrl);
 const apiKey = decode(encodedKey);
 const fullUrl = `${apiUrl}/api/rasin/gf?apikey=${apiKey}`;

 const res = await axios.get(fullUrl);
 const title = res.data.data.title;
 const imgUrl = res.data.data.url;

 const imgPath = path.join(__dirname, "cache", `${event.senderID}_gf.jpg`);
 await downloadImage(imgUrl, imgPath);

 api.sendMessage({
 body: title,
 attachment: fs.createReadStream(imgPath)
 }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);

 } catch (err) {
 console.error("❌ Image fetch error:", err.message);
 api.sendMessage("⚠️ ", event.threadID, event.messageID);
 }
};
