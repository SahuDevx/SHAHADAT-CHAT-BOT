const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");

module.exports.config = {
 name: "girl pp",
 version: "1.0.2",
 hasPermssion: 0,
 credits: "SHAHADAT SAHU",
 description: "Random Facebook Islamic Girl Profile Picture",
 commandCategory: "Random-IMG",
 usages: "girl pp",
 cooldowns: 2,
 dependencies: {
 "request": "",
 "fs-extra": "",
 "axios": ""
 }
};

module.exports.run = async ({ api, event }) => {
 const links = [
 "https://i.imgur.com/WSCOFG8.jpeg",
 "https://i.imgur.com/TBB9lQF.jpeg",
 "https://i.imgur.com/xAKK0v1.jpeg",
 "https://i.imgur.com/hVZc6pD.jpeg",
 "https://i.imgur.com/UC5sawy.jpeg",
 "https://i.imgur.com/4oLnK83.jpeg",
 "https://i.imgur.com/MJXW6QU.jpeg",
 "https://i.imgur.com/xJqkUyS.jpeg",
 "https://i.imgur.com/KtocUvd.jpeg",
 "https://i.imgur.com/uxadtYj.jpeg",
 "https://i.imgur.com/9pA0nl7.jpeg",
 "https://i.imgur.com/FM3mvcF.jpeg",
 "https://i.imgur.com/d2Naj7J.jpeg",
 "https://i.imgur.com/ik2Ukg5.jpeg",
 "https://i.imgur.com/ca6IgSt.jpeg",
 "https://i.imgur.com/CyGbNKj.jpeg",
 "https://i.imgur.com/dwH7Zet.jpeg",
 "https://i.imgur.com/AUXifFn.jpeg",
 "https://i.imgur.com/VJxMevG.jpeg",
 "https://i.imgur.com/eU2TFdy.jpeg"
 ];

 const imgURL = links[Math.floor(Math.random() * links.length)];
 const imgPath = __dirname + "/cache/girl_pp.jpg";

 const callback = () => {
 api.sendMessage({
 body: "🌸 𝙁𝘼𝘾𝙀𝘽𝙊𝙊𝙆 𝙂𝙄𝙍𝙇'𝙎 𝙋𝙍𝙊𝙁𝙄𝙇𝙀 𝙋𝙄𝘾 🧕",
 attachment: fs.createReadStream(imgPath)
 }, event.threadID, () => fs.unlinkSync(imgPath));
 };

 request(encodeURI(imgURL)).pipe(fs.createWriteStream(imgPath)).on("close", callback);
};