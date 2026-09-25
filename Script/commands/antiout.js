module.exports.config = {
    name: "antiout",
    aliases: ["rejoin", "readd", "autoadd", "autojoin"],
    version: "2.0.0",
    credits: "SHAHADAT SAHU",
    hasPermssion: 1,
    description: "Turn antiout on or off",
    usages: "antiout on/off",
    commandCategory: "system",
    cooldowns: 0
};

module.exports.run = async ({ api, event, Threads }) => {
    const args = event.body.trim().split(/\s+/);
    const action = (args[1] || "").toLowerCase();

    if (action !== "on" && action !== "off") {
        return api.sendMessage(
            "⚠️ ব্যবহার করুন:antiout on / antiout off",
            event.threadID
        );
    }

    const data = (await Threads.getData(event.threadID)).data || {};

    data.antiout = action === "on";

    await Threads.setData(event.threadID, { data });

    global.data.threadData.set(
        parseInt(event.threadID),
        data
    );

    return api.sendMessage(
        data.antiout
            ? "✅ Antiout সফলভাবে ON করা হয়েছে।"
            : "📛 Antiout সফলভাবে OFF করা হয়েছে।",
        event.threadID
    );
};
