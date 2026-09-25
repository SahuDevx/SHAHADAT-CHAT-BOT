const axios = require("axios");

const apiList = "https://gitlab.com/shahadat-sahu/sahu-api/-/raw/main/API.json";
const getMainAPI = async () => (await axios.get(apiList)).data.simsimi;

module.exports.config = {
 name: "baby",
 version: "1.0.4",
 hasPermssion: 0,
 credits: "ULLASH",
 description: "Cute AI Baby Chatbot | Talk, Teach & Chat with Emotion ☢️",
 commandCategory: "Chat",
 usages: "[message/query]",
 cooldowns: 0,
 prefix: true
};

const babyLoopGuard = {
 settings: {
  rapidGapMs: 3000,
  maxRapidChain: 5,
  windowMs: 30 * 1000,
  maxTriggersInWindow: 9,
  suspectAfter: 4,
  muteMs: 10 * 60 * 1000
 },
 threads: new Map(),

 getThread(threadID) {
  let st = this.threads.get(threadID);
  if (!st) {
   st = {
    lastTriggerAt: 0,
    rapidChain: 0,
    triggerTimes: [],
    pausedUntil: 0,
    lastNoticeAt: 0,
    senderFastStreak: new Map(),
    suspectedBots: new Map()
   };
   this.threads.set(threadID, st);
  }
  return st;
 },

 isTrigger(text) {
  return /^(baby|bot|bby|jan|xan|জান|বট|বেবি)(\s|$)/i.test(text);
 },

 check(api, event, isBabyTrigger) {
  const now = Date.now();
  const threadID = event.threadID;
  const senderID = String(event.senderID || "");
  const st = this.getThread(threadID);

  try {
   if (senderID && senderID === String(api.getCurrentUserID())) return false;
  } catch {}

  if (st.pausedUntil) {
   if (now < st.pausedUntil) return false;
   st.pausedUntil = 0;
   st.rapidChain = 0;
   st.triggerTimes = [];
  }

  const prevSuspect = st.suspectedBots.get(senderID);
  if (prevSuspect && now - prevSuspect >= this.settings.muteMs) {
   st.suspectedBots.delete(senderID);
   st.senderFastStreak.set(senderID, 0);
  }

  if (isBabyTrigger) {
   const gap = st.lastTriggerAt ? now - st.lastTriggerAt : Infinity;
   st.lastTriggerAt = now;

   if (gap < this.settings.rapidGapMs) {
    st.rapidChain++;
    const streak = (st.senderFastStreak.get(senderID) || 0) + 1;
    st.senderFastStreak.set(senderID, streak);
    if (streak >= this.settings.suspectAfter) st.suspectedBots.set(senderID, now);
   } else {
    st.rapidChain = 0;
    st.senderFastStreak.set(senderID, 0);
   }

   st.triggerTimes.push(now);
   while (st.triggerTimes.length && now - st.triggerTimes[0] > this.settings.windowMs) {
    st.triggerTimes.shift();
   }

   const loopDetected =
    st.rapidChain >= this.settings.maxRapidChain ||
    st.triggerTimes.length > this.settings.maxTriggersInWindow;

   if (loopDetected) {
    st.pausedUntil = now + this.settings.muteMs;
    st.rapidChain = 0;
    st.triggerTimes = [];
    if (now - st.lastNoticeAt > this.settings.muteMs) {
     st.lastNoticeAt = now;
     const mins = Math.max(1, Math.round(this.settings.muteMs / 60000));
     api.sendMessage(
      `🤖 Bot-to-Bot loop detected!\n` +
      `এই গ্রুপে দুইটি bot-এর মধ্যে automated reply chain শনাক্ত হয়েছে। Spam রোধে baby-র automated reply ${mins} মিনিটের জন্য বন্ধ রাখা হলো।\n` +
      `(কাউকে ban/kick করা হয়নি — manual command ও অন্যান্য feature স্বাভাবিক কাজ করবে।)`,
      threadID
     );
    }
    return false;
   }
  }

  if (st.suspectedBots.has(senderID)) return false;

  return true;
 }
};

module.exports.run = async function ({ api, event, args, Users }) {
 try {
 const uid = event.senderID;
 const senderName = await Users.getNameUser(uid);
 const rawQuery = args.join(" ");
 const query = rawQuery.toLowerCase();
 const simsim = await getMainAPI();

 if (!query) {
 const ran = ["Bolo baby", "hum"];
 const r = ran[Math.floor(Math.random() * ran.length)];
 return api.sendMessage(r, event.threadID, (err, info) => {
 if (!err) {
 global.client.handleReply.push({
 name: module.exports.config.name,
 messageID: info.messageID,
 author: event.senderID,
 type: "simsimi"
 });
 }
 });
 }

 const command = args[0].toLowerCase();

 if (["remove", "rm"].includes(command)) {
 const parts = rawQuery.replace(/^(remove|rm)\s*/i, "").split(" - ");
 if (parts.length < 2) return api.sendMessage("Use: remove [Question] - [Reply]", event.threadID, event.messageID);
 const [ask, ans] = parts.map(p => p.trim());
 const res = await axios.get(`${simsim}/delete?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}`);
 return api.sendMessage(res.data.message, event.threadID, event.messageID);
 }

 if (command === "list") {
 const res = await axios.get(`${simsim}/list`);
 if (res.data.code === 200) {
 return api.sendMessage(
 `♾ Total Questions Learned: ${res.data.totalQuestions}\n★ Total Replies Stored: ${res.data.totalReplies}\nDeveloper: ${res.data.author}`,
 event.threadID, event.messageID
 );
 } else return api.sendMessage(`Error: ${res.data.message}`, event.threadID, event.messageID);
 }

 if (command === "edit") {
 const parts = rawQuery.replace(/^edit\s*/i, "").split(" - ");
 if (parts.length < 3) return api.sendMessage("Use: edit [Q] - [Old] - [New]", event.threadID, event.messageID);
 const [ask, oldReply, newReply] = parts.map(p => p.trim());
 const res = await axios.get(`${simsim}/edit?ask=${encodeURIComponent(ask)}&old=${encodeURIComponent(oldReply)}&new=${encodeURIComponent(newReply)}`);
 return api.sendMessage(res.data.message, event.threadID, event.messageID);
 }

 if (command === "teach") {
 const parts = rawQuery.replace(/^teach\s*/i, "").split(" - ");
 if (parts.length < 2) return api.sendMessage("Use: teach [Q] - [Reply]", event.threadID, event.messageID);
 const [ask, ans] = parts.map(p => p.trim());
 const groupID = event.threadID;
 let groupName = event.threadName ? event.threadName : "";
 try {
 if (!groupName && groupID != uid) {
 const threadInfo = await api.getThreadInfo(groupID);
 if (threadInfo?.threadName) groupName = threadInfo.threadName;
 }
 } catch {}

 let teachUrl = `${simsim}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderID=${uid}&senderName=${encodeURIComponent(senderName)}&groupID=${encodeURIComponent(groupID)}`;
 if (groupName) teachUrl += `&groupName=${encodeURIComponent(groupName)}`;
 const res = await axios.get(teachUrl);
 return api.sendMessage(res.data.message, event.threadID, event.messageID);
 }

 const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(query)}&senderName=${encodeURIComponent(senderName)}`);
 const replies = Array.isArray(res.data.response) ? res.data.response : [res.data.response];

 for (const rep of replies) {
 await new Promise(resolve => {
 api.sendMessage(rep, event.threadID, (err, info) => {
 if (!err) {
 global.client.handleReply.push({
 name: module.exports.config.name,
 messageID: info.messageID,
 author: event.senderID,
 type: "simsimi"
 });
 }
 resolve();
 }, event.messageID);
 });
 }

 } catch (err) {
 return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
 }
};

module.exports.handleReply = async function ({ api, event, Users, handleReply }) {
 try {
 const senderName = await Users.getNameUser(event.senderID);
 const replyText = event.body ? event.body.toLowerCase() : "";
 if (!replyText) return;

 if (!babyLoopGuard.check(api, event, true)) return;

 const simsim = await getMainAPI();
 const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(replyText)}&senderName=${encodeURIComponent(senderName)}`);
 const replies = Array.isArray(res.data.response) ? res.data.response : [res.data.response];

 for (const rep of replies) {
 await new Promise(resolve => {
 api.sendMessage(rep, event.threadID, (err, info) => {
 if (!err) {
 global.client.handleReply.push({
 name: module.exports.config.name,
 messageID: info.messageID,
 author: event.senderID,
 type: "simsimi"
 });
 }
 resolve();
 }, event.messageID);
 });
 }

 } catch (err) {
 return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
 }
};

module.exports.handleEvent = async function ({ api, event, Users }) {
 try {
 const raw = event.body ? event.body.toLowerCase().trim() : "";
 if (!raw) return;

 if (!babyLoopGuard.check(api, event, babyLoopGuard.isTrigger(raw))) return;

 const senderName = await Users.getNameUser(event.senderID);
 const senderID = event.senderID;

 const simsim = await getMainAPI();

const greetings = [
        "বেশি bot Bot করলে leave নিবো কিন্তু😒😒",
        "শুনবো না😼 তুমি আমার বস সাহু কে প্রেম করাই দাও নাই🥺পচা তুমি🥺",
        "আমি আবাল দের সাথে কথা বলি না,ok😒",
        "এতো ডেকো না,প্রেম এ পরে যাবো তো🙈",
        "Bolo Babu, তুমি কি আমার বস সাহু কে ভালোবাসো? 🙈💋",
        "বার বার ডাকলে মাথা গরম হয়ে যায় কিন্তু😑",
        "হ্যা বলো😒, তোমার জন্য কি করতে পারি😐😑?",
        "এতো ডাকছিস কেন?গালি শুনবি নাকি? 🤬",
        "I love you janu🥰",
        "আরে Bolo আমার জান ,কেমন আছো?😚",
        "আজ বট বলে অসম্মান করছি,😰😿",
        "Hop beda😾,Boss বল boss😼",
        "চুপ থাক ,নাই তো তোর দাত ভেগে দিবো কিন্তু",
        "আমাকে না ডেকে মেয়ে হলে বস সাহুর ইনবক্সে চলে যা 🌚😂 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/100044713412032",
        "আমাকে বট না বলে , বস সাহু কে জানু বল জানু 😘",
        "বার বার Disturb করছিস কোনো😾,আমার জানুর সাথে ব্যাস্ত আছি😋",
        "আরে বলদ এতো ডাকিস কেন🤬",
        "আমাকে ডাকলে ,আমি কিন্তু কিস করে দিবো😘",
        "আমারে এতো ডাকিস না আমি মজা করার mood এ নাই এখন😒",
        "হ্যাঁ জানু , এইদিক এ আসো কিস দেই🤭 😘",
        "দূরে যা, তোর কোনো কাজ নাই, শুধু bot bot করিস 😉😋🤣",
        "তোর কথা তোর বাড়ি কেউ শুনে না ,তো আমি কোনো শুনবো ?🤔😂",
        "আমাকে ডেকো না,আমি বস সাহুর সাথে ব্যাস্ত আছি",
        "কি হলো , মিস্টেক করচ্ছিস নাকি🤣",
        "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏",
        "জান মেয়ে হলে বস সাহুর ইনবক্সে চলে যাও 😍🫣💕 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/100044713412032",
        "কালকে দেখা করিস তো একটু 😈",
        "হা বলো, শুনছি আমি 😏",
        "আর কত বার ডাকবি ,শুনছি তো",
        "হুম বলো কি বলবে😒",
        "বলো কি করতে পারি তোমার জন্য",
        "আমি তো অন্ধ কিছু দেখি না🐸 😎",
        "আরে বোকা বট না জানু বল জানু😌",
        "বলো জানু 🌚",
        "তোর কি চোখে পড়ে না আমি ব্যাস্ত আছি😒",
        "হুম জান তোমার ওই খানে উম্মহ😑😘",
        "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ😇😘",
        "jang hanga korba😒😬",
        "হুম জান তোমার অইখানে উম্মমাহ😷😘",
        "আসসালামু আলাইকুম বলেন আপনার জন্য কি করতে পারি..!🥰",
        "ভালোবাসার নামক আবলামি করতে চাইলে বস সাহুর ইনবক্সে গুতা দিন ~🙊😘🤣 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/100044713412032",
        "আমাকে এতো না ডেকে বস সাহু এর কে একটা গফ দে 🙄",
        "আমাকে এতো না ডেকছ কেন ভলো টালো বাসো নাকি🤭🙈",
        "🌻🌺💚-আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ-💚🌺🌻",
        "আমি এখন বস সাহু এর সাথে বিজি আছি আমাকে ডাকবেন না-😕😏 ধন্যবাদ-🤝🌻",
        "আমাকে না ডেকে আমার বস সাহু কে একটা জি এফ দাও-😽🫶🌺",
        "ঝাং থুমালে আইলাপিউ পেপি-💝😽",
        "উফফ বুঝলাম না এতো ডাকছেন কেনো-😤😡😈",
        "জান তোমার বান্ধবী রে আমার বস সাহুর হাতে তুলে দিবা-🙊🙆‍♂",
        "আজকে আমার মন ভালো নেই তাই আমারে ডাকবেন না-😪🤧",
        "ঝাং 🫵থুমালে য়ামি রাইতে পালুপাসি উম্মম্মাহ-🌺🤤💦",
        "চুনা ও চুনা আমার বস সাহু এর হবু বউ রে কেও দেকছো খুজে পাচ্ছি না😪🤧😭",
        "স্বপ্ন তোমারে নিয়ে দেখতে চাই তুমি যদি আমার হয়ে থেকে যাও-💝🌺🌻",
        "জান হাঙ্গা করবা-🙊😝🌻",
        "জান মেয়ে হলে চিপায় আসো বস সাহুর থেকে অনেক ভালোবাসা শিখছি তোমার জন্য-🙊🙈😽",
        "ইসস এতো ডাকো কেনো লজ্জা লাগে তো-🙈🖤🌼",
        "আমার বস সাহুর পক্ষ থেকে তোমারে এতো এতো ভালোবাসা-🥰😽🫶 আমার বস সাহু ইসলামে'র জন্য দোয়া করবেন-💝💚🌺🌻",
        "- ভালোবাসা নামক আব্লামি করতে মন চাইলে আমার বস সাহু এর ইনবক্স চলে যাও-🙊🥱👅 🌻𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊 𝐈𝐃 𝐋𝐈𝐍𝐊 🌻:- https://www.facebook.com/100044713412032",
        "আমার জান তুমি শুধু আমার আমি তোমারে ৩৬৫ দিন ভালোবাসি-💝🌺😽",
        "কিরে প্রেম করবি তাহলে বস সাহুর ইনবক্সে গুতা দে 😘🤌 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/100044713412032",
        "জান আমার বস সাহু কে বিয়ে করবা-🙊😘🥳",
        "-আন্টি-🙆-আপনার মেয়ে-👰‍♀️-রাতে আমারে ভিদু কল দিতে বলে🫣-🥵🤤💦",
        "oii-🥺🥹-এক🥄 চামচ ভালোবাসা দিবা-🤏🏻🙂",
        "-আপনার সুন্দরী বান্ধুবীকে ফিতরা হিসেবে আমার বস সাহু কে দান করেন-🥱🐰🍒",
        "-ও মিম ও মিম-😇-তুমি কেন চুরি করলা সাদিয়ার ফর্সা হওয়ার ক্রীম-🌚🤧",
        "-অনুমতি দিলাম-𝙋𝙧𝙤𝙥𝙤𝙨𝙚 কর বস সাহু কে-🐸😾🔪",
        "-𝙂𝙖𝙮𝙚𝙨-🤗-যৌবনের কসম দিয়ে আমারে 𝐁𝐥𝐚𝐜𝐤𝐦𝐚𝐢𝐥 করা হচ্ছে-🥲🤦‍♂️🤧",
        "-𝗢𝗶𝗶 আন্টি-🙆‍♂️-তোমার মেয়ে চোখ মারে-🥺🥴🐸",
        "তাকাই আছো কেন চুমু দিবা-🙄🐸😘",
        "আজকে প্রপোজ করে দেখো রাজি হইয়া যামু-😌🤗😇",
        "-আমার গল্পে তোমার নানি সেরা-🙊🙆‍♂️🤗",
        "কি বেপার আপনি শ্বশুর বাড়িতে যাচ্ছেন না কেন-🤔🥱🌻",
        "দিনশেষে পরের 𝐁𝐎𝐖 সুন্দর-☹️🤧",
        "-তাবিজ কইরা হইলেও ফ্রেম এক্কান করমুই তাতে যা হই হোক-🤧🥱🌻",
        "-ছোটবেলা ভাবতাম বিয়ে করলে অটোমেটিক বাচ্চা হয়-🥱-ওমা এখন দেখি কাহিনী অন্যরকম-😦🙂🌻",
        "প্রেম করতে চাইলে বস সাহুর ইনবক্সে চলে যা 😏🐸 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/100044713412032",
        "-আজ একটা বিন নেই বলে ফেসবুকের নাগিন-🤧-গুলোরে আমার বস সাহু ধরতে পারছে না-🐸🥲",
        "-চুমু থাকতে তোরা বিড়ি খাস কেন বুঝা আমারে-😑😒🐸⚒️",
        "—যে ছেড়ে গেছে-😔-তাকে ভুলে যাও-🙂-আমার বস সাহু এর সাথে প্রেম করে তাকে দেখিয়ে দাও-🙈🐸🤗",
        "—হাজারো লুচ্চা লুচ্চির ভিরে-🙊🥵আমার বস সাহু এক নিস্পাপ ভালো মানুষ-🥱🤗🙆‍♂️",
        "-রূপের অহংকার করো না-🙂❤️চকচকে সূর্যটাও দিনশেষে অন্ধকারে পরিণত হয়-🤗💜",
        "সুন্দর মাইয়া মানেই-🥱আমার বস সাহু'র বউ-😽🫶আর বাকি গুলো আমার বেয়াইন-🙈🐸🤗",
        "এত অহংকার করে লাভ নেই-🌸মৃত্যুটা নিশ্চিত শুধু সময়টা অ'নিশ্চিত-🖤🙂",
        "-দিন দিন কিছু মানুষের কাছে অপ্রিয় হয়ে যাইতেছি-🙂😿🌸",
        "ভালোবাসার নামক আবলামি করতে চাইলে বস সাহুর ইনবক্সে গুতা দিন🤣😼",
        "মেয়ে হলে বস সাহুর ইনবক্সে চলে যা 🤭🤣😼 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/100044713412032",
        "হুদাই আমারে শয়তানে লারে-😝😑☹️",
        "-𝗜 𝗟𝗢𝗩𝗘 𝗬𝗢𝗨-😽-আহারে ভাবছো তোমারে প্রোপজ করছি-🥴-থাপ্পর দিয়া কিডনী লক করে দিব-😒-ভুল পড়া বের করে দিবো-🤭🐸",
        "-আমি একটা দুধের শিশু-😇-🫵𝗬𝗢𝗨🐸💦",
        "-কতদিন হয়ে গেলো বিছনায় মুতি না-😿-মিস ইউ নেংটা কাল-🥺🤧",
        "-বালিকা━👸-𝐃𝐨 𝐲𝐨𝐮-🫵-বিয়া-𝐦𝐞-😽-আমি তোমাকে-😻-আম্মু হইতে সাহায্য করব-🙈🥱",
        "-এই আন্টির মেয়ে-🫢🙈-𝐔𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐡-😽🫶-আসলেই তো স্বাদ-🥵💦-এতো স্বাদ কেন-🤔-সেই স্বাদ-😋",
        "-ইস কেউ যদি বলতো-🙂-আমার শুধু তোমাকেই লাগবে-💜🌸",
        "-ওই বেডি তোমার বাসায় না আমার বস সাহু মেয়ে দেখতে গেছিলো-🙃-নাস্তা আনারস আর দুধ দিছো-🙄🤦‍♂️-বইন কইলেই তো হয় বয়ফ্রেন্ড আছে-🥺🤦‍♂-আমার বস সাহু কে জানে মারার কি দরকার-🙄🤧",
        "-একদিন সে ঠিকই ফিরে তাকাবে-😇-আর মুচকি হেসে বলবে ওর মতো আর কেউ ভালবাসেনি-🙂😅",
        "-হুদাই গ্রুপে আছি-🥺🐸-কেও ইনবক্সে নক দিয়ে বলে না জান তোমারে আমি অনেক ভালোবাসি-🥺🤧",
        "কি'রে গ্রুপে দেখি একটাও বেডি নাই-🤦‍🥱💦",
        "-দেশের সব কিছুই চুরি হচ্ছে-🙄-শুধু আমার বস সাহু এর মনটা ছাড়া-🥴😑😏",
        "-🫵তোমারে প্রচুর ভাল্লাগে-😽-সময় মতো প্রপোজ করমু বুঝছো-🔨😼-ছিট খালি রাইখো- 🥱🐸🥵",
        "-আজ থেকে আর কাউকে পাত্তা দিমু না -!😏-কারণ আমি ফর্সা হওয়ার ক্রিম কিনছি -!🙂🐸"
      ];


 if (
 raw === "babu" || raw === "bot" || raw === "bby" ||
 raw === "jan" || raw === "xan" || raw === "জান" ||
 raw === "বট" || raw === "বেবি"
 ) {
 const randomReply = greetings[Math.floor(Math.random() * greetings.length)];
 return api.sendMessage(randomReply, event.threadID, (err, info) => {
 if (!err) {
 global.client.handleReply.push({
 name: module.exports.config.name,
 messageID: info.messageID,
 author: senderID,
 type: "simsimi"
 });
 }
 }, event.messageID);
 }

 if (
 raw.startsWith("babu ") || raw.startsWith("bot ") || raw.startsWith("bby ") ||
 raw.startsWith("jan ") || raw.startsWith("xan ") ||
 raw.startsWith("জান ") || raw.startsWith("বট ") || raw.startsWith("বেবি ")
 ) {
 const query = raw.replace(/^baby\s+|^bot\s+|^bby\s+|^jan\s+|^xan\s+|^জান\s+|^বট\s+|^বেবি\s+/i, "").trim();
 if (!query) return;

 const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(query)}&senderName=${encodeURIComponent(senderName)}`);
 const replies = Array.isArray(res.data.response) ? res.data.response : [res.data.response];

 for (const rep of replies) {
 await new Promise(resolve => {
 api.sendMessage(rep, event.threadID, (err, info) => {
 if (!err) {
 global.client.handleReply.push({
 name: module.exports.config.name,
 messageID: info.messageID,
 author: senderID,
 type: "simsimi"
 });
 }
 resolve();
 }, event.messageID);
 });
 }
 }

 } catch {}
};
