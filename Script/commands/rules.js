module.exports.config = {
    name: "rules",
    aliases: ["rule"],
    version: "1.0.1",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Send group rules",
    commandCategory: "information",
    usages: "rules",
    cooldowns: 5,
    usePrefix: true
};

module.exports.run = async ({ api, event }) => {
    const botName = global.config.BOTNAME || "Shahadat Chat Bot";

    const message = `❐-আসসালামু আলাইকুম,🖤🌺
❐- 𝙶𝚁𝙾𝚄𝙿 এর কিছু 𝚁𝚄𝙻𝙴𝚂 আছে, এগুলো হয়তো অনেকেই জানেন না যারা জানেন না তারা জেনে রাখেন⬅️
<---------------------------->

০১) আজেবাজে খারাপ কথা বলা যাবে না ! ⚠️
০২) কাউকে অপমান কিংবা গালাগালি করা যাবে না ! ⚠️
০৩) অপ্রয়োজনীয় ট্যাগ বা সবাইকে বারবার mention করা যাবে না ! 🚫
০৪) মেয়েদের রিকু, ইনবক্স দেওয়ার চেষ্টা করলে সরাসরি রিমুভ ✅
০৫) অশ্লীল ছবি/ভিডিও/মিম শেয়ার করলে ব্যান খাবেন ⚡
০৬) নিজের ইউটিউব/পেজের লিংক দিয়ে স্প্যাম করলে KICK 🦵
০৭) অ্যাডমিনদের সম্মান করতে হবে 🛡️
০৮) কোনো ধর্ম বা জাতি নিয়ে কটাক্ষ করা যাবে না ❌
০৯) ভুয়া নিউজ/গুজব ছড়ালে রিপোর্ট + ব্লক 🚨
১০) রাত ১২টার পর শুধু ভদ্র ভাষায় মজা করা যাবে, অশ্লীলতা নয় 😌

<---------------------------->
❖ কারও সমস্যা থাকলে সরাসরি 𝙰𝙳𝙼𝙸𝙽𝚂 দের ইনবক্স করুন 💌
❖ রুলস ভাঙলে আগে ওয়ার্নিং, পরে অ্যাকশন 😈
_সাথেই থাকুন 🌺─꯭─⃝‌‌${botName}🌸_`;

    return api.sendMessage(
        message,
        event.threadID,
        event.messageID
    );
};
