module.exports = function ({ api, models, Users, Threads, Currencies }) {
  const stringSimilarity = require('string-similarity'),
    escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    logger = require("../../utils/log.js");
  const axios = require('axios')
  const moment = require("moment-timezone");
  return async function ({ event }) {
    const dateNow = Date.now()
    const time = moment.tz("Asia/Dhaka").format("HH:MM:ss DD/MM/YYYY");
    const ADMINBOT = global.config.ADMINBOT || [];
    const DEVELOPER = global.config.DEVELOPER || [];
    const { allowInbox, PREFIX, DeveloperMode, adminOnly, keyAdminOnly, developerOnly, adminPaOnly } = global.config;
    const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
    const { commands, cooldowns } = global.client;
    const resolveCommand = (token) => {
      if (typeof global.client.resolveCommand === 'function') return global.client.resolveCommand(token);
      const key = String(token || '').trim().toLowerCase();
      for (const [name, command] of commands) if (String(name).toLowerCase() === key) return command;
      const canonical = (global.client.commandAliases || new Map()).get(key);
      return canonical === undefined ? null : (commands.get(canonical) || null);
    };
    const resolveCommandName = (token) => {
      if (typeof global.client.resolveCommandName === 'function') return global.client.resolveCommandName(token);
      for (const name of commands.keys()) if (String(name).toLowerCase() === String(token || '').trim().toLowerCase()) return name;
      const canonical = (global.client.commandAliases || new Map()).get(String(token || '').trim().toLowerCase());
      return canonical === undefined ? null : canonical;
    };
    var { body, senderID, threadID, messageID } = event;
    var senderID = String(senderID),
      threadID = String(threadID);
    const threadSetting = threadData.get(threadID) || {}
    const threadPrefix = String(
      threadSetting.hasOwnProperty("PREFIX") && threadSetting.PREFIX
        ? threadSetting.PREFIX
        : PREFIX
    );
    const prefixRegex = new RegExp(`^(<@!?${senderID}>|${escapeRegex(threadPrefix)})\\s*`);
    const prefixOnlyMessage = typeof body === 'string' && body.trim() !== '' && body.trim() === threadPrefix;
    const prefixMatch = prefixOnlyMessage ? [body] : (body ? body.match(prefixRegex) : null);
    if (!prefixMatch && (!body || !body.trim())) return;
    var noPrefixCommand = null;
    if (!prefixMatch) {
      const trimmedBody = String(body).trim();
      if (!trimmedBody) return;
      const noPrefixParts = trimmedBody.split(/ +/);
      noPrefixCommand = resolveCommand(noPrefixParts[0]);
      if (!noPrefixCommand) return;
      const cmdUsePrefix = noPrefixCommand.config ? noPrefixCommand.config.usePrefix : undefined;
      const allowNoPrefix = (cmdUsePrefix === true || cmdUsePrefix === false) ? cmdUsePrefix : (global.config.usePrefix === true);
      if (!allowNoPrefix) return;
    }
    const adminbot = require('./../../config.json');
    const isDeveloper = global.isDeveloper ? global.isDeveloper(senderID) : DEVELOPER.includes(senderID);
    const isBotAdmin = ADMINBOT.includes(senderID.toString()) || ADMINBOT.includes(senderID);
    const isDevOnly = adminbot.developerOnly === true || developerOnly === true;
    const isAdminOnly = adminbot.adminOnly === true || adminOnly === true;
    if (isDevOnly && !isDeveloper) return;
    if (isAdminOnly && !isDeveloper && !isBotAdmin) return;
    if (!global.data.allThreadID.includes(threadID) && !isBotAdmin && !isDeveloper && adminbot.adminPaOnly == true)
    return api.sendMessage("MODE » Only admins can use bots in their own inbox", threadID, messageID)
    const dataAdbox = require('../../Script/commands/cache/data.json');
    var threadInf = (threadInfo.get(threadID) || await Threads.getInfo(threadID));
    const findd = threadInf.adminIDs.find(el => el.id == senderID);
    if (dataAdbox.adminbox.hasOwnProperty(threadID) && dataAdbox.adminbox[threadID] == true && !isBotAdmin && !isDeveloper && !findd && event.isGroup == true) return api.sendMessage('MODE » Only admins can use bots', event.threadID, event.messageID)
    if (userBanned.has(senderID) || threadBanned.has(threadID) || allowInbox == ![] && senderID == threadID) {
      if (!isBotAdmin && !isDeveloper) {
        if (userBanned.has(senderID)) {
          const { reason, dateAdded } = userBanned.get(senderID) || {};
          return api.sendMessage(global.getText("handleCommand", "userBanned", reason, dateAdded), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
        } else {
          if (threadBanned.has(threadID)) {
            const { reason, dateAdded } = threadBanned.get(threadID) || {};
            return api.sendMessage(global.getText("handleCommand", "threadBanned", reason, dateAdded), threadID, async (err, info) => {
              await new Promise(resolve => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            }, messageID);
          }
        }
      }
    }
    const matchedPrefix = prefixMatch ? prefixMatch[0] : '',
      args = body.slice(matchedPrefix.length).trim().split(/ +/);
    let commandName = args.shift().toLowerCase();
    var command = prefixMatch && !commandName
      ? [...commands.values()].find(cmd => cmd.config && cmd.config.prefixOnly === true)
      : (prefixMatch ? resolveCommand(commandName) : noPrefixCommand);
    if (command && !commandName) commandName = command.config.name;
    if (!command) {
      if (!prefixMatch) return;
      if (!commandName) return;
      const allCommandName = typeof global.client.commandCandidates === 'function'
        ? global.client.commandCandidates()
        : [...commands.keys()].map(String);
      const checker = stringSimilarity.findBestMatch(commandName, allCommandName);
      let suggestion = null;
      if (checker.bestMatch.rating >= 0.5 && checker.bestMatch.target) {
        suggestion = resolveCommandName(checker.bestMatch.target) || checker.bestMatch.target;
        if (!commands.has(suggestion)) suggestion = null;
        else command = commands.get(suggestion);
      }
      if (!command) {
        const prefixUsed = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : PREFIX;
        const notExistText = suggestion
          ? global.getText("handleCommand", "commandNotExist", `${prefixUsed}${suggestion}`)
          : global.getText("handleCommand", "commandNotExistName", commandName, prefixUsed);
        return api.sendMessage(notExistText, threadID);
      }
    }
    if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
      if (!isBotAdmin && !isDeveloper) {
        const banThreads = commandBanned.get(threadID) || [],
          banUsers = commandBanned.get(senderID) || [];
        if (banThreads.includes(command.config.name))
          return api.sendMessage(global.getText("handleCommand", "commandThreadBanned", command.config.name), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000))
            return api.unsendMessage(info.messageID);
          }, messageID);
        if (banUsers.includes(command.config.name))
          return api.sendMessage(global.getText("handleCommand", "commandUserBanned", command.config.name), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
      }
    }
    if (command.config.commandCategory.toLowerCase() == 'nsfw' && !global.data.threadAllowNSFW.includes(threadID) && !isBotAdmin && !isDeveloper)
      return api.sendMessage(global.getText("handleCommand", "threadNotAllowNSFW"), threadID, async (err, info) => {
        await new Promise(resolve => setTimeout(resolve, 5 * 1000))
        return api.unsendMessage(info.messageID);
      }, messageID);
    var threadInfo2;
    if (event.isGroup == !![])
      try {
        threadInfo2 = (threadInfo.get(threadID) || await Threads.getInfo(threadID))
        if (Object.keys(threadInfo2).length == 0) throw new Error();
      } catch (err) {
        logger(global.getText("handleCommand", "cantGetInfoThread", "error"));
      }
    var permssion = 0;
    var threadInfoo = (threadInfo.get(threadID) || await Threads.getInfo(threadID));
    const find = threadInfoo.adminIDs.find(el => el.id == senderID);
    if (find) permssion = 1;
    if (isBotAdmin) permssion = 2;
    if (isDeveloper) permssion = 3;
    const commandPermission = command.config.hasPermssion !== undefined
      ? command.config.hasPermssion
      : (command.config.hasPermission !== undefined
        ? command.config.hasPermission
        : (command.config.permission !== undefined ? command.config.permission : 0));
    if (commandPermission > permssion) return api.sendMessage(global.getText("handleCommand", "permssionNotEnough", command.config.name), event.threadID, event.messageID);
       if (!client.cooldowns.has(command.config.name)) client.cooldowns.set(command.config.name, new Map());
        const timestamps = client.cooldowns.get(command.config.name);;
        const expirationTime = (command.config.cooldowns || 1) * 1000;
        if (!isBotAdmin && !isDeveloper && timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime)
      return api.sendMessage(`You just used this command and\ntry again later ${((timestamps.get(senderID) + expirationTime - dateNow)/1000).toString().slice(0, 5)} In another second, use the order again slowly`, threadID, messageID);
    var getText2;
    if (command.languages && typeof command.languages == 'object' && command.languages.hasOwnProperty(global.config.language))
      getText2 = (...values) => {
        var lang = command.languages[global.config.language][values[0]] || '';
        for (var i = values.length; i > 0x2533 + 0x1105 + -0x3638; i--) {
          const expReg = RegExp('%' + i, 'g');
          lang = lang.replace(expReg, values[i]);
        }
        return lang;
      };
    else getText2 = () => { };
    try {
      const Obj = {};
      Obj.api = api
      Obj.event = event
      Obj.args = args
      Obj.models = models
      Obj.Users = Users
      Obj.Threads = Threads
      Obj.Currencies = Currencies
      Obj.permssion = permssion
      Obj.getText = getText2
      Obj.commandName = command.config.name
      Obj.usedName = commandName
      command.run(Obj);
      timestamps.set(senderID, dateNow);
      if (DeveloperMode == !![])
        logger(global.getText("handleCommand", "executeCommand", time, commandName, senderID, threadID, args.join(" "), (Date.now()) - dateNow), "[ DEV MODE ]");
      return;
    } catch (e) {
      return api.sendMessage(global.getText("handleCommand", "commandError", commandName, e), threadID);
    }
  };
};