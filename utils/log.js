const chalk = require("chalk");

let logName = "";
let logNickName = "";
let loaded = false;

const REDACTED = "[REDACTED]";

const COOKIE_KEYS = "c_user|xs|datr|fr|sb|wd|sid|presence|spin|m_pixel_ratio|noscript|oo|lu|usida";

const APPSTATE_MARKER = new RegExp('"key"\\s*:\\s*"(?:' + COOKIE_KEYS + ')"', "i");
const APPSTATE_VALUE = /"value"\s*:\s*"[^"]*"/gi;
const COOKIE_ASSIGNMENT = new RegExp("\\b(?:" + COOKIE_KEYS + ")\\s*=\\s*([^;\"'\\s,]+)", "gi");
const SECRET_KEY_VALUE = /\b(pass(?:word|wd)?|email|otpkey|otp|secret|token|access[_-]?token|refresh[_-]?token|api[_-]?key|authorization|cookie|session[_-]?id|fb_dtsg|jazoest|lsd)\b(\s*['"]?\s*[:=]\s*)(['"]?)([^\s,"'}\];]+)\3/gi;
const AUTH_HEADER = /\b(bearer|basic)\s+[A-Za-z0-9._\-+/=]{8,}/gi;

function redactSecrets(input) {
  let text;
  if (typeof input === "string") {
    text = input;
  } else if (input === null || typeof input === "undefined") {
    return input;
  } else {
    try {
      text = String(input.message && input.stack ? input.stack : JSON.stringify(input));
    } catch (_) {
      try {
        text = String(input);
      } catch (_) {
        return "";
      }
    }
  }

  if (!text) return text;

  if (APPSTATE_MARKER.test(text)) {
    text = text.replace(APPSTATE_VALUE, '"value":"' + REDACTED + '"');
  }

  text = text.replace(COOKIE_ASSIGNMENT, (match) => match.split("=")[0] + "=" + REDACTED);
  text = text.replace(AUTH_HEADER, (match) => match.split(/\s+/)[0] + " " + REDACTED);
  text = text.replace(SECRET_KEY_VALUE, (match, key, sep, quote) => key + sep + (quote || "") + REDACTED + (quote || ""));

  return text;
}

function randomColor() {
  let color = "";

  for (let i = 0; i < 3; i++) {
    const hex = Math.floor(Math.random() * 256).toString(16);
    color += hex.length === 1 ? "0" + hex : hex;
  }

  return "#" + color;
}

module.exports = (message, type) => {
  if (
    !loaded &&
    typeof message === "string" &&
    typeof type === "string" &&
    message.length > 0 &&
    type.length > 0 &&
    type !== "warn" &&
    type !== "error" &&
    !type.startsWith("[")
  ) {
    logName = message;
    logNickName = type;
    loaded = true;
    return module.exports;
  }

  const text = redactSecrets(message);

  switch (type) {
    case "warn":
      console.log(
        chalk.bold.hex("#ff0000").bold("» Log « ") + text
      );
      break;

    case "error":
      console.log(
        chalk.bold.hex("#ff0000").bold("» Log « ") + text
      );
      break;

    default:
      console.log(
        chalk.bold.hex(randomColor()).bold(type + " » ") + text
      );
      break;
  }
};

module.exports.loader = (message, type) => {
  message = redactSecrets(message);

  switch (type) {
    case "warn":
      console.log(
        chalk.bold
          .hex(randomColor())
          .bold(" •─༅" + logName + " ༅─• ") +
        chalk.bold.hex("#8B8878").bold(message) +
        chalk.bold.hex("FF00DD")("")
      );
      break;

    case "error":
      console.log(
        chalk.bold
          .hex(randomColor())
          .bold(" •─༅" + logName + " ༅─• ") +
        message +
        chalk.bold.hex("5EFF00")("")
      );
      break;

    default:
      console.log(
        chalk.bold
          .hex(randomColor())
          .bold("∞∞" + logNickName + " LOADED∞∞") +
        chalk.bold.hex(randomColor()).bold(message) +
        chalk.bold.hex("FFF0000")("")
      );
      break;
  }
};

module.exports.redactSecrets = redactSecrets;
