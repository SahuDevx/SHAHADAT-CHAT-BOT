module.exports = function ({
  api,
  models,
  logAnthorName
}) {
  const fs = require("fs");

  const Users = require("./controllers/users")({
    models,
    api
  });

  const Threads = require("./controllers/threads")({
    models,
    api
  });

  const Currencies = require("./controllers/currencies")({
    models
  });

  const log = require("../utils/log.js");
  const moment = require("moment-timezone");
  const axios = require("axios");

  var lastDay = moment.tz("Asia/Dhaka").day();

  const handleMention = async (api, event) => {
    try {
      const {
        threadID,
        body
      } = event;

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        return;
      }

      if (event.messageReply && event.messageReply.senderID) {
        event.mentions = {
          [event.messageReply.senderID]: ''
        };
        return;
      }

      if (!body) {
        return;
      }

      const mentionMatch = body.match(/@([^\s]+)/);

      if (!mentionMatch) {
        return;
      }

      const searchName = mentionMatch[1].toLowerCase().trim();

      const threadInfo = await api.getThreadInfo(threadID);
      const userInfo = threadInfo.userInfo || [];
      const nicknames = threadInfo.nicknames || {};

      let matchedUserID = null;

      for (let userID in nicknames) {
        if (!nicknames[userID]) {
          continue;
        }

        if (
          (nicknames[userID] || '')
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(
              (searchName || '')
                .toLowerCase()
                .replace(/\s+/g, '')
            )
        ) {
          matchedUserID = userID;
          break;
        }
      }

      if (!matchedUserID) {
        for (let user of userInfo) {
          if (!user.name) {
            continue;
          }

          if (
            (user.name || '')
              .toLowerCase()
              .replace(/\s+/g, '')
              .includes(
                (searchName || '')
                  .toLowerCase()
                  .replace(/\s+/g, '')
              )
          ) {
            matchedUserID = user.id;
            break;
          }
        }
      }

      if (!matchedUserID) {
        for (let user of userInfo) {
          if (!user.name) {
            continue;
          }

          const nameParts = user.name
            .toLowerCase()
            .split(/[\s._-]+/);

          if (
            nameParts.some(part =>
              part.startsWith(searchName)
            )
          ) {
            matchedUserID = user.id;
            break;
          }
        }
      }

      if (!matchedUserID && searchName.length >= 2) {
        for (let user of userInfo) {
          if (!user.name) {
            continue;
          }

          if (
            (user.name || '')
              .toLowerCase()
              .replace(/\s+/g, '')
              .startsWith(
                (searchName || '')
                  .toLowerCase()
                  .replace(/\s+/g, '')
              )
          ) {
            matchedUserID = user.id;
            break;
          }
        }
      }

      if (matchedUserID) {
        event.mentions = {
          [matchedUserID]: ''
        };
      }
    } catch (error) {}
  };

  const handleReaction = ({
    event
  }) => {
    try {
      const isGroupThread =
        String(event.threadID).length > 16;

      const normEmoji = v =>
        String(v == null ? '' : v)
          .replace(/[️‍]/g, '')
          .trim();

      if (
        normEmoji(event.reaction) ===
          normEmoji('⚠️') &&
        isGroupThread &&
        String(event.userID) ===
          String(global.config.ADMINBOT[0])
      ) {
        api.getMessage(
          event.threadID,
          event.messageID,
          (err, data) => {
            if (err || !data || !data.senderID) return;

            const botID = api.getCurrentUserID();
            const targetID = String(data.senderID);

            if (
              targetID === String(botID) ||
              targetID === String(event.userID)
            ) {
              return;
            }

            api.removeUserFromGroup(
              targetID,
              event.threadID
            );
          }
        );
        return;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const interactionDirectory =
    __dirname +
    "/../Script/commands/checktuongtac/";

  setInterval(async () => {
    const currentDay =
      moment.tz("Asia/Dhaka").day();

    const allowedIDs = [
      ...(global.config.DEVELOPER || []),
      ...(global.config.ADMINBOT || []),
      ...(global.developers || [])
    ];

    try {
      if (lastDay != currentDay) {
        lastDay = currentDay;

        const files = fs
          .readdirSync(interactionDirectory)
          .filter(file => {
            const id = file.replace(".json", '');

            return (
              allowedIDs.includes(id) ||
              global.data.allThreadID.includes(id)
            );
          });

        console.log(logAnthorName + " ");

        await new Promise(async resolve => {
          for (const file of files) {
            const data = JSON.parse(
              fs.readFileSync(
                interactionDirectory + file
              )
            );

            let dailyData = [];
            let rank = 1;

            for (const user of data.day) {
              const name =
                (await Users.getNameUser(user.id)) ||
                logAnthorName + " ";

              user.name = name;
              dailyData.push(user);
            }

            dailyData.sort((a, b) => {
              if (a.count > b.count) {
                return -1;
              } else {
                return a.count < b.count
                  ? 1
                  : a.name.localeCompare(b.name);
              }
            });

            let message =
              "==" + logAnthorName + "  ❤️==\n\n";

            message += dailyData
              .slice(0, 10)
              .map(user => {
                return (
                  rank++ +
                  ". " +
                  user.name +
                  " with " +
                  user.count +
                  " message"
                );
              })
              .join("\n");

            api.sendMessage(
              message,
              file.replace(".json", ''),
              error =>
                error ? console.log(error) : ''
            );

            data.day.forEach(user => {
              user.count = 0;
            });

            data.time = currentDay;

            fs.writeFileSync(
              interactionDirectory + file,
              JSON.stringify(data, null, 4)
            );
          }

          resolve();
        });

        await new Promise(async resolve => {
          if (currentDay == 1) {
            console.log(logAnthorName + " ");

            for (const file of files) {
              const data = JSON.parse(
                fs.readFileSync(
                  interactionDirectory + file
                )
              );

              let weeklyData = [];
              let rank = 1;

              for (const user of data.week) {
                const name =
                  (await Users.getNameUser(user.id)) ||
                  "Sahu Hun Yar";

                user.name = name;
                weeklyData.push(user);
              }

              weeklyData.sort((a, b) => {
                if (a.count > b.count) {
                  return -1;
                } else {
                  return a.count < b.count
                    ? 1
                    : a.name.localeCompare(b.name);
                }
              });

              let message =
                "==" + logAnthorName + " ❤️==\n\n";

              message += weeklyData
                .slice(0, 10)
                .map(user => {
                  return (
                    rank++ +
                    ". " +
                    user.name +
                    " with " +
                    user.count +
                    " message"
                  );
                })
                .join("\n");

              api.sendMessage(
                message,
                file.replace(".json", ''),
                error =>
                  error ? console.log(error) : ''
              );

              data.week.forEach(user => {
                user.count = 0;
              });

              fs.writeFileSync(
                interactionDirectory + file,
                JSON.stringify(data, null, 4)
              );
            }
          }

          resolve();
        });

        global.client.sending_top = false;
      }
    } catch (error) {
      console.error(error);
    }
  }, 10000);

  (async function () {
    try {
      log(
        global.getText(
          "listen",
          "startLoadEnvironment"
        ),
        "[ " + logAnthorName + "  ]"
      );

      let threadList = await Threads.getAll();

      let userList = await Users.getAll([
        "userID",
        "name",
        "data"
      ]);

      let currencyList = await Currencies.getAll([
        "userID"
      ]);

      for (const thread of threadList) {
        const threadID = String(thread.threadID);

        global.data.allThreadID.push(threadID);

        global.data.threadData.set(
          threadID,
          thread.data || {}
        );

        global.data.threadInfo.set(
          threadID,
          thread.threadInfo || {}
        );

        if (
          thread.data &&
          thread.data.banned == true
        ) {
          global.data.threadBanned.set(
            threadID,
            {
              reason:
                thread.data.reason || '',
              dateAdded:
                thread.data.dateAdded || ''
            }
          );
        }

        if (
          thread.data &&
          thread.data.commandBanned &&
          thread.data.commandBanned.length != 0
        ) {
          global.data.commandBanned.set(
            threadID,
            thread.data.commandBanned
          );
        }

        if (
          thread.data &&
          thread.data.NSFW
        ) {
          global.data.threadAllowNSFW.push(
            threadID
          );
        }
      }

      log.loader(
        global.getText(
          "listen",
          "loadedEnvironmentThread"
        )
      );

      for (const user of userList) {
        const userID = String(user.userID);

        global.data.allUserID.push(userID);

        if (
          user.name &&
          user.name.length != 0
        ) {
          global.data.userName.set(
            userID,
            user.name
          );
        }

        if (
          user.data &&
          user.data.banned == 1
        ) {
          global.data.userBanned.set(
            userID,
            {
              reason:
                user.data.reason || '',
              dateAdded:
                user.data.dateAdded || ''
            }
          );
        }

        if (
          user.data &&
          user.data.commandBanned &&
          user.data.commandBanned.length != 0
        ) {
          global.data.commandBanned.set(
            userID,
            user.data.commandBanned
          );
        }
      }

      for (const currency of currencyList) {
        global.data.allCurrenciesID.push(
          String(currency.userID)
        );
      }

      log.loader(
        global.getText(
          "listen",
          "loadedEnvironmentUser"
        )
      );

      log(
        global.getText(
          "listen",
          "successLoadEnvironment"
        ),
        "[ Script ]"
      );
    } catch (error) {
      return log.loader(
        global.getText(
          "listen",
          "failLoadEnvironment",
          error
        ),
        "error"
      );
    }
  })();

  log(
    "[ " +
      global.config.PREFIX +
      " ] • " +
      (!global.config.BOTNAME
        ? ''
        : global.config.BOTNAME),
    "[ " + logAnthorName + "  ]"
  );

  const handleCommand = require(
    "./handle/handleCommand"
  )({
    api,
    models,
    Users,
    Threads,
    Currencies
  });

  const handleCommandEvent = require(
    "./handle/handleCommandEvent"
  )({
    api,
    models,
    Users,
    Threads,
    Currencies
  });

  const handleReply = require(
    "./handle/handleReply"
  )({
    api,
    models,
    Users,
    Threads,
    Currencies
  });

  const handleReactionEvent = require(
    "./handle/handleReaction"
  )({
    api,
    models,
    Users,
    Threads,
    Currencies
  });

  const handleEvent = require(
    "./handle/handleEvent"
  )({
    api,
    models,
    Users,
    Threads,
    Currencies
  });

  const handleCreateDatabase = require(
    "./handle/handleCreateDatabase"
  )({
    api,
    Threads,
    Users,
    Currencies,
    models
  });

  const scheduleFile =
    __dirname +
    "/../Script/commands/cache/datlich.json";

  const monthMilliseconds = {
    1: 2678400000,
    2: 2419200000,
    3: 2678400000,
    4: 2592000000,
    5: 2678400000,
    6: 2592000000,
    7: 2678400000,
    8: 2678400000,
    9: 2592000000,
    10: 2678400000,
    11: 2592000000,
    12: 2678400000
  };

  const convertDateToMilliseconds = dateArray =>
    new Promise(resolve => {
      dateArray.forEach(
        (value, index) =>
          (dateArray[index] = parseInt(
            String(value).trim()
          ))
      );

      if (
        dateArray[1] > 12 ||
        dateArray[1] < 1
      ) {
        resolve("Your month seems invalid");
      }

      if (
        dateArray[0] >
          (dateArray[1] == 0
            ? 0
            : dateArray[1] == 2
              ? dateArray[2] % 4 == 0
                ? 29
                : 28
              : [1, 3, 5, 7, 8, 10, 12].includes(
                  dateArray[1]
                )
                ? 31
                : 30) ||
        dateArray[0] < 1
      ) {
        resolve("Your date seems invalid");
      }

      if (dateArray[2] < 2022) {
        resolve("What era do you live in?");
      }

      if (
        dateArray[3] > 23 ||
        dateArray[3] < 0
      ) {
        resolve("Your time seems to be invalid");
      }

      if (
        dateArray[4] > 59 ||
        dateArray[3] < 0
      ) {
        resolve("Your minute seems invalid");
      }

      if (
        dateArray[5] > 59 ||
        dateArray[3] < 0
      ) {
        resolve("Your seconds seem invalid");
      }

      yr = dateArray[2] - 1970;

      yearToMS =
        yr *
        365 *
        24 *
        60 *
        60 *
        1000;

      yearToMS +=
        ((yr - 2) / 4).toFixed(0) *
        24 *
        60 *
        60 *
        1000;

      monthToMS = 0;

      for (
        let month = 1;
        month < dateArray[1];
        month++
      ) {
        monthToMS +=
          monthMilliseconds[month];
      }

      if (dateArray[2] % 4 == 0) {
        monthToMS += 86400000;
      }

      dayToMS =
        dateArray[0] *
        24 *
        60 *
        60 *
        1000;

      hourToMS =
        dateArray[3] *
        60 *
        60 *
        1000;

      minuteToMS =
        dateArray[4] *
        60 *
        1000;

      secondToMS =
        dateArray[5] *
        1000;

      oneDayToMS = 86400000;

      timeMs =
        yearToMS +
        monthToMS +
        dayToMS +
        hourToMS +
        minuteToMS +
        secondToMS -
        oneDayToMS;

      resolve(timeMs);
    });

  const processScheduledMessages = async () => {
    if (!fs.existsSync(scheduleFile)) {
      fs.writeFileSync(
        scheduleFile,
        JSON.stringify({}, null, 4)
      );
    }

    var schedules = JSON.parse(
      fs.readFileSync(scheduleFile)
    );

    var currentDateTime =
      moment()
        .tz("Asia/Dhaka")
        .format("DD/MM/YYYY_HH:mm:ss");

    currentDateTime =
      currentDateTime.split('_');

    currentDateTime = [
      ...currentDateTime[0].split('/'),
      ...currentDateTime[1].split(':')
    ];

    let pendingMessages = [];

    let currentTime =
      await convertDateToMilliseconds(
        currentDateTime
      );

    const processSchedule = scheduleTime =>
      new Promise(async resolve => {
        let scheduleTimestamp =
          await convertDateToMilliseconds(
            scheduleTime.split('_')
          );

        if (scheduleTimestamp < currentTime) {
          if (
            currentTime - scheduleTimestamp <
            600000
          ) {
            schedules[boxID][scheduleTime].TID =
              boxID;

            pendingMessages.push(
              schedules[boxID][scheduleTime]
            );

            delete schedules[boxID][scheduleTime];
          } else {
            delete schedules[boxID][scheduleTime];
          }

          fs.writeFileSync(
            scheduleFile,
            JSON.stringify(
              schedules,
              null,
              4
            )
          );
        }

        resolve();
      });

    await new Promise(async resolve => {
      for (boxID in schedules) {
        for (
          e of Object.keys(schedules[boxID])
        ) {
          await processSchedule(e);
        }
      }

      resolve();
    });

    for (el of pendingMessages) {
      try {
        var participantIDs =
          (
            await Threads.getInfo(el.TID)
          ).participantIDs;

        participantIDs.splice(
          participantIDs.indexOf(
            api.getCurrentUserID()
          ),
          1
        );

        var reason =
          el.REASON || "🥰🥰🥰";

        var mentions = [];

        for (
          let index = 0;
          index < participantIDs.length;
          index++
        ) {
          if (
            index == reason.length
          ) {
            reason += " ‍ ";
          }

          mentions.push({
            tag: reason[index],
            id: participantIDs[index],
            fromIndex: index - 1
          });
        }
      } catch (error) {
        return console.log(error);
      }

      var message = {
        body: reason,
        mentions
      };

      if ("ATTACHMENT" in el) {
        message.attachment = [];

        for (a of el.ATTACHMENT) {
          let attachmentData =
            (
              await axios.get(
                encodeURI(a.url),
                {
                  responseType:
                    "arraybuffer"
                }
              )
            ).data;

          fs.writeFileSync(
            __dirname +
              "/../Script/commands/cache/" +
              a.fileName,
            Buffer.from(
              attachmentData,
              "utf-8"
            )
          );

          message.attachment.push(
            fs.createReadStream(
              __dirname +
                "/../Script/commands/cache/" +
                a.fileName
            )
          );
        }
      }

      console.log(message);

      if ("BOX" in el) {
        await api.setTitle(
          el.BOX,
          el.TID
        );
      }

      api.sendMessage(
        message,
        el.TID,
        () =>
          "ATTACHMENT" in el
            ? el.ATTACHMENT.forEach(
                attachment =>
                  fs.unlinkSync(
                    __dirname +
                      "/../Script/commands/cache/" +
                      attachment.fileName
                  )
              )
            : ''
      );
    }
  };

  setInterval(
    processScheduledMessages,
    60000
  );

  const processedEventIDs = new Map();
  const EVENT_DEDUPE_TTL = 10 * 60 * 1000;
  const EVENT_DEDUPE_MAX = 5000;
  let lastDedupeSweep = Date.now();

  const getEventDedupeKey = event => {
    switch (event.type) {
      case "message":
      case "message_reply":
      case "message_unsend":
        return event.messageID
          ? event.type + "|" + event.messageID
          : null;

      case "message_reaction":
        return event.messageID
          ? [event.type, event.messageID, event.userID, event.reaction].join("|")
          : null;

      case "event":
        return event.logMessageId
          ? event.type + "|" + event.logMessageId
          : null;

      default:
        return null;
    }
  };

  const isDuplicateEvent = event => {
    const key = getEventDedupeKey(event);
    if (!key) return false;

    const now = Date.now();
    const seenAt = processedEventIDs.get(key);

    if (seenAt !== undefined && now - seenAt < EVENT_DEDUPE_TTL) {
      return true;
    }

    processedEventIDs.set(key, now);

    while (processedEventIDs.size > EVENT_DEDUPE_MAX) {
      const oldestKey = processedEventIDs.keys().next().value;
      processedEventIDs.delete(oldestKey);
    }

    if (now - lastDedupeSweep >= EVENT_DEDUPE_TTL) {
      for (const [key, seenAt] of processedEventIDs) {
        if (now - seenAt >= EVENT_DEDUPE_TTL) {
          processedEventIDs.delete(key);
        }
      }
      lastDedupeSweep = now;
    }

    return false;
  };

  return async event => {
    if (isDuplicateEvent(event)) return;

    switch (event.type) {
      case "message":
      case "message_reply":
      case "message_unsend":
        await handleMention(
          api,
          event
        );

        handleCreateDatabase({
          event
        });

        handleCommand({
          event
        });

        handleReply({
          event
        });

        handleCommandEvent({
          event
        });

        break;

      case "event":
        handleEvent({
          event
        });

        break;

      case "message_reaction":
        handleReactionEvent({
          event
        });

        handleReaction({
          event
        });

        break;

      default:
        break;
    }
  };
};
