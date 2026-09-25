module.exports.config = {
 name: "mix",
 version: "1.0.1",
 hasPermssion: 0,
 credits: "Shaon Ahmed",
 description: "Mix emoji",
 commandCategory: "image",
 usages: "[emoji1] [emoji2]",
 cooldowns: 0,
 dependencies: {
 "fs-extra": "",
 "request": ""
 }
};

module.exports.run = async ({ api, event, args }) => {
 const fs = require("fs-extra");
 const request = require("request");
 const { threadID, messageID } = event;

 if (args.length < 2) {
 return api.sendMessage(
 `Wrong format!\nUse: ${global.config.PREFIX}${this.config.name} ${this.config.usages}`,
 threadID,
 messageID
 );
 }

 let emoji1 = args[0];
 let emoji2 = args[1];

 const savePath = __dirname + "/cache/emojimix.png";

 try {
 const url = encodeURI(`https://web-api-delta.vercel.app/emojimix?emoji1=${emoji1}&emoji2=${emoji2}`);

 const callback = () => {
 api.sendMessage(
 {
 body: "",
 attachment: fs.createReadStream(savePath)
 },
 threadID,
 () => fs.unlinkSync(savePath),
 messageID
 );
 };

 request(url)
 .pipe(fs.createWriteStream(savePath))
 .on("close", callback);
 } catch (err) {
 return api.sendMessage(
 `Can't mix ${emoji1} and ${emoji2}`,
 threadID,
 messageID
 );
 }
};