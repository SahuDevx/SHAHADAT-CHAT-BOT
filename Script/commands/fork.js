module.exports.config = {
    name: "fork",
    aliases: ["fork daw", "repo", "repository", "forklink", "foeklink", "fork-link", "repo-link", "repository-link", "github", "git", "gitrepo", "git-repo", "source", "sourcecode", "source-code"],
    version: "1.0.1",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU",
    description: "Send official repository link",
    commandCategory: "other",
    usages: "fork",
    cooldowns: 0,
    usePrefix: false
};

module.exports.run = async function({ api, event }) {
    const message = "আমাদের অফিসিয়াল Repository:\nhttps://gitlab.com/shahadat-sahu/SHAHADAT-CHAT-BOT.git";
    return api.sendMessage(message, event.threadID, event.messageID);
};
