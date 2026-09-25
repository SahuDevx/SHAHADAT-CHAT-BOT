module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    return function ({ event }) {
        const { allowInbox } = global.config;
        const { userBanned, threadBanned } = global.data;
        const { commands, eventRegistered } = global.client;
        var { senderID, threadID } = event;
        senderID = String(senderID);
        threadID = String(threadID);
        if (userBanned.has(senderID) || threadBanned.has(threadID) || (allowInbox == false && senderID == threadID)) return;

        const ADMINBOT = global.config.ADMINBOT || [];
        const DEVELOPER = global.config.DEVELOPER || [];
        const adminbot = require('./../../config.json');
        const isDeveloper = global.isDeveloper ? global.isDeveloper(senderID) : DEVELOPER.includes(senderID);
        const isBotAdmin = ADMINBOT.includes(senderID.toString()) || ADMINBOT.includes(senderID);
        const isDevOnly = adminbot.developerOnly === true || global.config.developerOnly === true;
        const isAdminOnly = adminbot.adminOnly === true || global.config.adminOnly === true;

        if (isDevOnly && !isDeveloper) return;
        if (isAdminOnly && !isDeveloper && !isBotAdmin) return;
        for (const eventReg of eventRegistered) {
            const cmd = commands.get(eventReg);
            if (!cmd || typeof cmd.handleEvent !== 'function') continue;
            var getText2;

            if (cmd.languages && typeof cmd.languages == 'object') {
                getText2 = (...values) => {
                    const commandModule = cmd.languages || {};
                    if (!commandModule.hasOwnProperty(global.config.language)) 
                        return api.sendMessage(global.getText('handleCommand','notFoundLanguage', cmd.config.name), threadID, messengeID); 
                    var lang = cmd.languages[global.config.language][values[0]] || '';
                    for (var i = values.length - 1; i >= 0; i--) {
                        const expReg = RegExp('%' + (i + 1), 'g');
                        lang = lang.replace(expReg, values[i]);
                    }
                    return lang;
                };
            } else {
                getText2 = () => {};
            }

            try {
                const Obj = {};
                Obj.event = event;
                Obj.api = api;
                Obj.models = models;
                Obj.Users = Users;
                Obj.Threads = Threads;
                Obj.Currencies = Currencies;
                Obj.getText = getText2;
                if (cmd) cmd.handleEvent(Obj);
            } catch (error) {
                logger(global.getText('handleCommandEvent', 'moduleError', cmd.config.name), 'error');
            }
        }
    };
};
