module.exports.config = {
    name: "adduser",
    aliases: ["useradd", "addmember"],
    version: "1.1.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Add user to group using profile link or UID",
    commandCategory: "system",
    usages: "[uid/link]",
    cooldowns: 5,
    usePrefix: true
};

const axios = require("axios");

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const out = msg => api.sendMessage(msg, threadID, messageID);

    if (!args[0]) return out("UID বা Link দিন......");


    if (!isNaN(args[0])) {
        return addUserToGroup(args[0]);
    }


    let link = args[0];
    let uid = null;

    try {
        if (!link.includes("facebook.com") && !link.includes("fb.com"))
            return out("Facebook link দিন.....");

        let res = await axios.get(link);
        let data = res.data;

        
        let match = data.match(/"userID":"(\d+)"/);
        if (match) uid = match[1];

        if (!uid) return out("UID পাওয়া যায়নি.....");

        return addUserToGroup(uid);

    } catch (e) {
        return out("Link থেকে UID বের করতে সমস্যা হয়েছে!");
    }

    async function addUserToGroup(uid) {
        try {
            let info = await api.getThreadInfo(threadID);
            let participantIDs = info.participantIDs.map(e => parseInt(e));
            let admins = info.adminIDs.map(e => parseInt(e.id));
            let botID = parseInt(api.getCurrentUserID());

            uid = parseInt(uid);

            if (participantIDs.includes(uid))
                return out("এই ইউজার গ্রুপে আগেই আছে.....");

            await api.addUserToGroup(uid, threadID);

            if (info.approvalMode === true && !admins.includes(botID))
                return out("Request list এ add হয়েছে ✔️");

            return out("Successfully added ✔️");

        } catch (err) {
            return out("Add করা যাচ্ছে না..!\nএই ইউজার হয়তো Friendlist এ নেই........");
        }
    }
};
