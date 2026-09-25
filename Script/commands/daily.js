module.exports.config = {
    name: "daily",
    aliases: ["claim"],
    version: "2.0.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Claim daily coins with cooldown",
    commandCategory: "economy",
    cooldowns: 5,
    usePrefix: true,
    envConfig: {
        cooldownTime: 43200000
    }
};

module.exports.languages = {
    "en": {
        "cooldown": "⏳ You already claimed today's reward. Please come back after: %1 hours %2 minutes %3 seconds.",
        "rewarded": "🎉 You received %1 coins! Come back again in 12 hours."
    }
};

module.exports.run = async ({ event, api, Currencies, getText }) => {
    const { cooldownTime } = module.exports.config.envConfig;
    const { senderID, threadID, messageID } = event;

    try {
        let userData = (await Currencies.getData(senderID)).data || {};
        let lastClaim = userData.dailyCoolDown || 0;
        let timePassed = Date.now() - lastClaim;

        if (timePassed < cooldownTime) {
            let remaining = cooldownTime - timePassed;
            let seconds = Math.floor((remaining / 1000) % 60);
            let minutes = Math.floor((remaining / 1000 / 60) % 60);
            let hours = Math.floor(remaining / (1000 * 60 * 60));

            return api.sendMessage(
                getText("cooldown", hours, minutes, (seconds < 10 ? "0" : "") + seconds),
                threadID,
                messageID
            );
        }

        const rewardOptions = [1000, 2000, 5000, 10000];
        const rewardCoin = rewardOptions[Math.floor(Math.random() * rewardOptions.length)];

        await Currencies.increaseMoney(senderID, rewardCoin);
        userData.dailyCoolDown = Date.now();
        await Currencies.setData(senderID, { data: userData });

        return api.sendMessage(
            getText("rewarded", rewardCoin.toLocaleString("en-US")),
            threadID,
            messageID
        );
    } catch (err) {
        return api.sendMessage("⚠️ Error: " + err.message, threadID, messageID);
    }
};
