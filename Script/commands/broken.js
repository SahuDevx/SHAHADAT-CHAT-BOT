module.exports.config = {
 name: "broken",
 version: "1.0.0",
 hasPermssion: 2,
 credits: "SHAHADAT SAHU",
 description: "tag 1 person and unlimited msg.",
 commandCategory: "admin",
 usages: "please @mention",
 cooldowns: 0,
 dependencies: {
 "fs-extra": "",
 "axios": ""
 }
};

module.exports.run = async function({ api, args, Users, event }) {
 var mention = Object.keys(event.mentions)[0];
 if (!mention) return api.sendMessage("apni kake জ্ঞান dite chan take mention koren✅", event.threadID);
 
 let name = event.mentions[mention];
 var arraytag = [];
 arraytag.push({ id: mention, tag: name });
 
 var a = function(a) { api.sendMessage(a, event.threadID); }
 
 a("তোমাকে কিছু উপদেশ দেওয়া হবে। মেনে চললে জীবনে অনেক উন্নতি করতে পারবে এবং মরার পর ও ভালো থাকবে।😇");
 
 setTimeout(() => {
 a({ body: "বিপদ-আপদের সময়,, দুনিয়ার সকল দরজা বন্ধ হয়ে গেলেও আল্লাহ তায়ালার দরজার সবসময় খুলা থাকে। 🥰🥰।" + " " + name, mentions: arraytag });
 }, 3000);
 
 setTimeout(() => {
 a({ body: "দুনিয়াতে একটি মাত্র ঘর । যার নাম 'কাবা ঘর' । যার উপর দিয়ে আজ পর্যন্ত কোন পাখি বা বিমান উড়ে যেতে পারে নি। 😍.." + " " + name, mentions: arraytag });
 }, 5000);
 
 setTimeout(() => {
 a({ body: "তার জন্য কাঁদ যে তোমার চোখের জল দেখে সেও কেঁদে ফেলে, কিন্তু এমন কারো জন্য কেদোনা যে তোমার চোখের জল দেখে উপহাস করে। 🐰" + " " + name, mentions: arraytag });
 }, 7000);
 
 setTimeout(() => {
 a({ body: "সবচেয়ে কঠিন কাজ হচ্ছে নিজেকে চেনা এবং সবচেয়ে সহজ কাজ হচ্ছে অন্যদেরকে উপদেশ দেয়া। 💔!" + " " + name, mentions: arraytag });
 }, 9000);
 
 setTimeout(() => {
 a({ body: "প্রেমে ছ্যাকা খাইছেন তাকে ভুলতে পারছেন না? ৫ ওয়াক্ত সালাত আদায় করুন তার প্রতি যে ভালোবাসা ছিলো সেটা আল্লাহর প্রতি স্থাপন করুন।🥰" + " " + name, mentions: arraytag });
 }, 12000);
 
 setTimeout(() => {
 a({ body: "ডিপ্রেশনে আছেন কোনোভাবে ডিপ্রেশন কাটাতে পারছেন না। ইসলামিক ভিডিও দেখুন ওয়াজ শুনুন মন টাকে ইসলামিক কথার ভিতর নিয়ে যান তাহলে ডিপ্রেশন কেটে যাবে। " + " " + name, mentions: arraytag });
 }, 15000);
 
 setTimeout(() => {
 a({ body: "যাহা তুমি দেখাও, তার চেয়ে বেশি তোমার থাকা উচিত🤬" + " " + name, mentions: arraytag });
 }, 17000);
 
 setTimeout(() => {
 a({ body: "যা তুমি জান, তার তুলনায় কম কথা বলা উচিত।🤟" + " " + name, mentions: arraytag });
 }, 20000);
 
 setTimeout(() => {
 a({ body: "বন্ধুত্ব হোক কিংবা ভালোবাসা। টিকিয়ে রাখার দায়িত্ব কিন্তু দু'জনেরই। 🤝" + " " + name, mentions: arraytag });
 }, 23000);
 
 setTimeout(() => {
 a({ body: "যদি স্বপ্ন দেখতে পারো, তবে তা বাস্তবায়নও করতে পারবে।💉।" + " " + name, mentions: arraytag });
 }, 25000);
 
 setTimeout(() => {
 a({ body: "যে তোমাকে আজ অবহেলা করছে। ধৈর্য ধরো একদিন। তোমাকে তার প্রয়োজন হবেই" + " " + name, mentions: arraytag });
 }, 28500);
 
 setTimeout(() => {
 a({ body: "তাকে ছেড়ে চলে যেও না।💔 যে তোমার শত খারাপ। ব্যবহারের পরেও তোমাকে ছেড়ে যাইনি।😘 ✋" + " " + name, mentions: arraytag });
 }, 31000);
 
 setTimeout(() => {
 a({ body: " আল্লাহর দেখানো পথে চলুন 🥰" + " " + name, mentions: arraytag });
 }, 36000);
 
 setTimeout(() => {
 a("~ অন্যকে গালি দেওয়া থেকে বিরত থাকুন♥️");
 }, 39000);
 
 setTimeout(() => {
 a({ body: "গার্লফ্রেন্ডকে না✌️ নিজের মা বাবাকে ভালোবাসুন✋🥰।" + " " + name, mentions: arraytag });
 }, 42000);
 
 setTimeout(() => {
 a({ body: "নিজের ওপর বিশ্বাস রাখার মানেই একজন মানুষ আত্মবিশ্বাসী।সে বিশ্বাস করে নিজের জন্য সঠিক সিদ্ধান্ত নেয়ার ক্ষমতা তার আছে।😍.." + " " + name, mentions: arraytag });
 }, 48000);
 
 setTimeout(() => {
 a({ body: "মৃত্যু নিশ্চিত কিন্তু সময় টা অনিশ্চিত.. ইয়া আল্লা্হ! যখনি মৃত্যু দিবা ঈমানী হালতে দিও। 😍🐰" + " " + name, mentions: arraytag });
 }, 51000);
 
 setTimeout(() => {
 a({ body: "টেনশন দূর করতে। - নেশা নয়। পাঁচ ওয়াক্ত নামাজই যথেষ্ট।💔!" + " " + name, mentions: arraytag });
 }, 54000);
 
 setTimeout(() => {
 a({ body: "তোমার গার্লফ্রেন্ড তোমাকে রেখে বড়লোক ছেলে পেয়ে তোমাকে ছেড়ে চলে গেছে?? তুমি নিজেকে কষ্ট দিচ্ছো? নেশা করতাছো?? আরে বোকা তুমি নিজেকে এমন ভাবে তৈরি করো যাতে তোমার সেই গার্লফ্রেন্ড তোমাকে দেখে আফসোস করে এবং সে তোমার কাছে ফিরতে আসতে চাই ✌️" + " " + name, mentions: arraytag });
 }, 57000);
 
 setTimeout(() => {
 a({ body: "১০ টাকার নামাজ শিক্ষার বইয়ে যা আছে, - পৃথিবীর দামী বইয়েও তা নেই😍 " + " " + name, mentions: arraytag });
 }, 59400);
 
 setTimeout(() => {
 a({ body: "দেহের রোগের ঔষধ ফার্মেসিতে থাকলেও। - মনের রোগের ঔষধ আল কোরআনে আছে। ✋" + " " + name, mentions: arraytag });
 }, 63000);
 
 setTimeout(() => {
 a({ body: "যে ব্যক্তি ধোঁকাবাজি করে।- আমার সাথে তার কোন সম্পর্ক নেই।🤟" + " " + name, mentions: arraytag });
 }, 66000);
 
 setTimeout(() => {
 a({ body: "হে আল্লাহ মুসলমান যখন বানিয়েছো - ঈমানের সাথে মৃত্যু দিও। " + " " + name, mentions: arraytag });
 }, 69000);
 
 setTimeout(() => {
 a({ body: "হারামের টাকায় টেবিল ভর্তি খাবারের চেয়ে, হালাল টাকার সীমিত খাবারের মজাই আলাদা।💉।" + " " + name, mentions: arraytag });
 }, 72000);
 
 setTimeout(() => {
 a({ body: "দুনিয়াতে সেই সবচেয়ে কৃপন, যে মুসলমান অন্য মুসলমানকে সালাম দিতে কৃপনতা করে।" + " " + name, mentions: arraytag });
 }, 75000);
 
 setTimeout(() => {
 a({ body: "চরিত্রহীন স্বামীর সঙ্গে রাজপ্রসাদে থাকার চেয়ে,,,, দরিদ্র আদর্শবান স্বামীর সঙ্গে কুঁড়েঘরে থাকা অনেক সুখের। 🙂✋" + " " + name, mentions: arraytag });
 }, 78000);
};