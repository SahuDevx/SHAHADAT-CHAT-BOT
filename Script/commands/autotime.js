const schedule = require("node-schedule");

module.exports.config = {
  name: "autosent",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Automatically sends scheduled messages",
  commandCategory: "group messenger",
  usages: "[]",
  cooldowns: 0
};

const messages = [
    { time: '12:00 AM', message: 'এখন সময় রাত 12:00 AM ⏳\nঅনেক রাত হলো, ঘুমিয়ে পড় Bby Good Night 😴💤❤️', special: null },
    { time: '1:00 AM', message: 'এখন সময় রাত 1:00 AM ⏳\nকিরে তুই এখনো ঘুমাস নাই? তাড়াতাড়ি ঘুমিয়ে পড়!😾😴🛌', special: null },
    { time: '2:00 AM', message: 'এখন সময় রাত 2:00 AM ⏳\nঘুমে আয় ভাই! এখনো জাইগা আফসোস ক্যান?😤👊💤', special: null },
    { time: '3:00 AM', message: 'এখন সময় রাত 3:00 AM ⏳\nসবাই ঘুমাইয়া গেছে, তুই এখন জাইগা আসোস ক্যান?🙄🌃🛌', special: null },
    { time: '4:00 AM', message: 'এখন সময় ভোর 4:00 AM ⏳\nএকটু পর আজান হবে, সময় হয়ে গেছে। 🕌🕋🕓', special: null },
    { time: '5:00 AM', message: 'এখন সময় ভোর 5:00 AM ⏳\nফজরের আজান হয়ে গেছে, নামাজটা পরে নিও পিও~ 🕌✨🤲💖', special: null },
    { time: '6:00 AM', message: 'এখন সময় সকাল 6:00 AM ⏳\nআসসালামুয়ালাইকুম Good Morning Bby! এখন বিছানা থেকে উঠে ব্যায়াম টা করে ফেল 🌅💖😳', special: null },
    { time: '7:00 AM', message: 'এখন সময় সকাল 7:00 AM ⏳\nঘুম ভাঙতেই মোবাইল! দাঁত ব্রাশটা করবি তো নাকি!🛌➡️📱', special: null },
    { time: '8:00 AM', message: 'এখন সময় সকাল 8:00 AM ⏳\nপিও, মোবাইল রেখে দাঁত ব্রাশ করে খেয়ে নাও!📱🪥🍽️', special: null },
    { time: '9:00 AM', message: 'এখন সময় সকাল 9:00 AM ⏳\nBby, Breakfast korco?🍳🥞💖', special: null },
    { time: '10:00 AM', message: 'এখন সময় সকাল 10:00 AM ⏳\nকিরে ভন্ড, তুই আজ কলেজ যাস নাই? 😜📚🙄', special: null },
    { time: '11:00 AM', message: 'এখন সময় সকাল 11:00 AM ⏳\nনাটক কম কর পিও~ বস এখন বিজি আছে!🙄📱💼', special: null },
    { time: '12:00 PM', message: 'এখন সময় দুপুর 12:00 PM ⏳\nGood Afternoon! 🌞🙌🌸', special: null },
    { time: '1:00 PM', message: 'এখন সময় দুপুর 1:00 PM ⏳\nভন্ড কোথাকার মোবাইল বন্ধ করে জোহরের নামাজ পড়ে নাও😻❣️🥰', special: null },
    { time: '2:00 PM', message: 'এখন সময় দুপুর 2:00 PM ⏳\nভন্ড কোথাকার, মোবাইল রাখ! গোসল করে খাওয়া-দাওয়া করে নে🔪🛁🍽️', special: null },
    { time: '3:00 PM', message: 'এখন সময় বিকেল 3:00 PM ⏳\nJan, তোমাকে ছাড়া আর দুপুরে ঘুম হয় না….!😴💔🌙', special: null },
    { time: '4:00 PM', message: 'এখন সময় বিকেল 4:00 PM ⏳\nঅনেক গরম পড়েছিল আজ! 🥵🌞💦', special: null },
    { time: '5:00 PM', message: 'এখন সময় বিকেল 5:00 PM ⏳\nপরিস্থিতি যেমনি হোক না কেন, সব সময় হলে হাসতেই হবে! 😅🕒🙂', special: null },
    { time: '6:00 PM', message: 'এখন সময় সন্ধ্যা 6:00 PM ⏳\nGood Evening Everyone! সবাই হাত মুখ ধুয়ে নাও! 🌆👐💦', special: null },
    { time: '7:00 PM', message: 'এখন সময় সন্ধ্যা 7:00 PM ⏳\nকিরে ভন্ড, তুই আজ পড়তে বসছিলি নাকি?😏📚🤔', special: null },
    { time: '8:00 PM', message: 'এখন সময় রাত 8:00 PM ⏳\nওই ওই, এতো bot bot না করে আমার বস সাহু কে একটা গফ দে...!🫰😎🔥', special: null },
    { time: '9:00 PM', message: 'এখন সময় রাত 9:00 PM ⏳\nআমার cute bby টাহ খানা খাইছে...!😘🍽️❤️', special: null },
    { time: '10:00 PM', message: 'এখন সময় রাত 10:00 PM ⏳\nকিরে ভন্ড, খাইবি কখন? সারাদিন মোবাইল টিপস..!😜📱😾', special: null },
    { time: '11:00 PM', message: 'এখন সময় রাত 11:00 PM ⏳\nযে ছেড়ে গেছে 😔 তাকে ভুলে যাও 🙂 আমার বস সাহু এর সাথে প্রেম করে তাকে দেখিয়ে দাও...!🙈🐸🤗', special: null }
];

module.exports.onLoad = ({ api }) => {
  if (global.config?.autoSent === false) return;

  messages.forEach(({ time, message }) => {
    if (!time || !message) return;

    const [hour, minute, period] = time.split(/[: ]/);

    let hour24 = parseInt(hour, 10);

    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    }

    if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    const rule = new schedule.RecurrenceRule();

    rule.tz = "Asia/Dhaka";
    rule.hour = hour24;
    rule.minute = parseInt(minute, 10);

    schedule.scheduleJob(rule, () => {
      if (global.config?.autoSent === false) return;

      const threadIDs = global.data?.allThreadID;

      if (!Array.isArray(threadIDs)) return;

      threadIDs.forEach(threadID => {
        api.sendMessage(message, threadID);
      });
    });
  });
};

module.exports.run = () => {};
