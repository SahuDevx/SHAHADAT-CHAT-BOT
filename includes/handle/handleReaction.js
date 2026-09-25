module.exports = function ({ api, models, Users, Threads, Currencies }) {
    return function ({ event }) {
        const { handleReaction, commands } = global.client;
        const { messageID, threadID } = event;
        const senderID = String(event.userID || event.senderID);

        const ADMINBOT = global.config.ADMINBOT || [];
        const DEVELOPER = global.config.DEVELOPER || [];
        const adminbot = require('./../../config.json');
        const isDeveloper = global.isDeveloper ? global.isDeveloper(senderID) : DEVELOPER.includes(senderID);
        const isBotAdmin = ADMINBOT.map(String).includes(senderID);
        const isDevOnly = adminbot.developerOnly === true || global.config.developerOnly === true;
        const isAdminOnly = adminbot.adminOnly === true || global.config.adminOnly === true;

        if (isDevOnly && !isDeveloper) return;
        if (isAdminOnly && !isDeveloper && !isBotAdmin) return;

        try {
            const reactUnsend = Array.isArray(global.config.reactUnsend)
                ? global.config.reactUnsend
                : [];

            let reaction =
                event.reaction ||
                event.reactionEmoji ||
                event.emoji ||
                event.reactionValue ||
                '';

            const norm = v => String(v == null ? '' : v).replace(/[️‍]/g, '').trim();

            const isUnsendReact =
                reaction &&
                reactUnsend.some(emoji => norm(emoji) === norm(reaction));

            const hasPermission = isDeveloper || isBotAdmin;

            if (isUnsendReact && hasPermission && messageID) {
                api.unsendMessage(messageID, () => {});
            }
        } catch (error) {
            console.error('[handleReaction] reactUnsend error:', error);
        }

        if (!handleReaction || handleReaction.length === 0) return;

        const indexOfHandle = handleReaction.findIndex(e => e.messageID == messageID);
        if (indexOfHandle < 0) return;

        const indexOfMessage = handleReaction[indexOfHandle];
        const handleNeedExec = commands.get(indexOfMessage.name);

        if (!handleNeedExec) {
            return api.sendMessage(
                global.getText('handleReaction', 'missingValue'),
                threadID,
                messageID
            );
        }

        try {
            var getText2;

            if (handleNeedExec.languages && typeof handleNeedExec.languages == 'object') {
                getText2 = (...value) => {
                    const react = handleNeedExec.languages || {};

                    if (!react.hasOwnProperty(global.config.language)) {
                        return api.sendMessage(
                            global.getText(
                                'handleCommand',
                                'notFoundLanguage',
                                handleNeedExec.config.name
                            ),
                            threadID,
                            messageID
                        );
                    }

                    var lang = handleNeedExec.languages[global.config.language][value[0]] || '';

                    for (var i = value.length; i > 0x2 * -0xb7d + 0x2111 * 0x1 + -0xa17; i--) {
                        const expReg = RegExp('%' + i, 'g');
                        lang = lang.replace(expReg, value[i]);
                    }

                    return lang;
                };
            } else {
                getText2 = () => {};
            }

            const Obj = {};
            Obj.api = api;
            Obj.event = event;
            Obj.models = models;
            Obj.Users = Users;
            Obj.Threads = Threads;
            Obj.Currencies = Currencies;
            Obj.handleReaction = indexOfMessage;
            Obj.getText = getText2;

            handleNeedExec.handleReaction(Obj);
        } catch (error) {
            return api.sendMessage(
                global.getText('handleReaction', 'executeError', error),
                threadID,
                messageID
            );
        }
    };
};
