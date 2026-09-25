const chalk = require("chalk");
const moment = require("moment-timezone");

let consoleName;

const colors = [
  "FF9900", "FFFF33", "33FFFF", "FF99FF",
  "FF3366", "FFFF66", "FF00FF", "66FF99",
  "00CCFF", "FF0099", "FF0066", "7900FF",
  "93FFD8", "CFFFDC", "FF5B00", "3B44F6",
  "A6D1E6", "7F5283", "A66CFF", "F05454",
  "FCF8E8", "94B49F", "47B5FF", "B8FFF9",
  "42C2FF", "FF7396"
];

function randomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function init(name) {
  consoleName = name;
}

function log({
  groupName = "Name does not exist",
  threadID = "Unknown",
  userName = "Unknown User",
  senderID = "Unknown",
  content = "Photos, videos or special characters"
} = {}) {
  const time = moment
    .tz("Asia/Dhaka")
    .format("LLLL");

  console.log(
    chalk.hex("#" + randomColor())(
      `[💓]→ Group name: ${groupName}`
    ) +
      "\n" +
      chalk.hex("#" + randomColor())(
        `[🔎]→ Group ID: ${threadID}`
      ) +
      "\n" +
      chalk.hex("#" + randomColor())(
        `[🔱]→ User name: ${userName}`
      ) +
      "\n" +
      chalk.hex("#" + randomColor())(
        `[📝]→ User ID: ${senderID}`
      ) +
      "\n" +
      chalk.hex("#" + randomColor())(
        `[📩]→ Content: ${content}`
      ) +
      "\n" +
      chalk.hex("#" + randomColor())(
        `[ ${time} ]`
      ) +
      "\n" +
      chalk.hex("#" + randomColor())(
        `◆━━━━━━━━◆${consoleName}◆━━━━━━━━◆`
      ) +
      "\n"
  );
}

module.exports = {
  init,
  log
};
