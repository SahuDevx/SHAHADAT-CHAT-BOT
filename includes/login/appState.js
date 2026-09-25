const {
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  chmodSync,
  unlinkSync,
  copyFileSync
} = require("fs");
const { resolve, join } = require("path");
const logger = require("../../utils/log");

const REQUIRED_COOKIES = ["c_user", "xs"];

function errorText(err) {
  const redact = require("../../utils/log").redactSecrets;
  let text = "";
  if (!err) return "";
  if (typeof err === "string") text = err;
  else if (err.message) text = err.message;
  else if (err.error) text = String(err.error);
  else {
    try {
      text = JSON.stringify(err);
    } catch {
      text = String(err);
    }
  }
  try {
    return redact ? redact(text) : text;
  } catch (_) {
    return text;
  }
}

function getAppStatePath() {
  const envPath = process.env.APPSTATE_PATH;
  if (envPath && String(envPath).trim()) return resolve(String(envPath).trim());
  const name = (global.config && global.config.APPSTATEPATH) || "appstate.json";
  const root = (global.client && global.client.mainPath) || process.cwd();
  return resolve(join(root, name));
}

function parseAppStateValue(raw) {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;

  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (_) {
    try {
      parsed = JSON.parse(Buffer.from(text, "base64").toString("utf8"));
    } catch (_) {
      parsed = null;
    }
  }

  if (!Array.isArray(parsed)) {
    parsed = text
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((pair) => {
        const idx = pair.indexOf("=");
        const key = (idx === -1 ? pair : pair.slice(0, idx)).trim();
        const value = (idx === -1 ? "" : pair.slice(idx + 1)).trim();
        return { key, value, domain: ".facebook.com", path: "/", secure: true };
      });
    if (!parsed.length) return null;
  }

  const check = validateAppState(parsed);
  return check.valid ? parsed : null;
}

function loadAppStateFromEnv() {
  return parseAppStateValue(process.env.APPSTATE || process.env.APP_STATE);
}

function validateAppState(appState) {
  if (!Array.isArray(appState)) {
    return { valid: false, reason: "AppState must be an array of cookies" };
  }
  if (appState.length === 0) {
    return { valid: false, reason: "AppState is empty" };
  }
  for (const cookie of appState) {
    if (!cookie || typeof cookie !== "object" || !("key" in cookie)) {
      return { valid: false, reason: "AppState contains a malformed cookie entry" };
    }
  }
  return { valid: true };
}

function hasSessionCookies(appState) {
  if (!Array.isArray(appState)) {
    return { ok: false, missing: REQUIRED_COOKIES.slice() };
  }
  const keys = new Set(appState.map((c) => c && c.key));
  const missing = REQUIRED_COOKIES.filter((k) => !keys.has(k));
  return { ok: missing.length === 0, missing };
}

function loadAppState(filePath, fallback) {
  if (Array.isArray(fallback) && fallback.length) {
    const check = validateAppState(fallback);
    if (check.valid) return fallback;
    logger(`Passed AppState invalid (${check.reason}); falling back to file.`, "[ LOGIN ]");
  }

  const fromEnv = loadAppStateFromEnv();
  if (fromEnv) return fromEnv;

  const resolved = resolve(filePath || "");
  if (!resolved || !existsSync(resolved)) {
    throw new Error(
      `AppState file not found: ${resolved || "(no path)"}. Put the cookies in that file or in the APPSTATE environment variable.`
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(resolved, "utf8"));
  } catch (e) {
    throw new Error(`AppState file is malformed JSON: ${errorText(e)}`);
  }

  const check = validateAppState(parsed);
  if (!check.valid) {
    throw new Error(`AppState invalid: ${check.reason}`);
  }
  return parsed;
}

function backupAppState(filePath) {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) return false;
  try {
    copyFileSync(resolved, `${resolved}.bak`);
    return true;
  } catch (e) {
    logger(`AppState backup failed: ${errorText(e)}`, "warn");
    return false;
  }
}

function saveAppState(filePath, appState, options = {}) {
  if (!appState || !Array.isArray(appState) || appState.length === 0) {
    return false;
  }
  const check = validateAppState(appState);
  if (!check.valid) {
    logger(`Refusing to save invalid AppState (${check.reason}).`, "warn");
    return false;
  }

  const resolved = resolve(filePath);
  const { backup = true } = options;
  if (backup) backupAppState(resolved);

  const tmp = `${resolved}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(appState, null, "\t"), {
      encoding: "utf8",
      mode: 0o600
    });
    renameSync(tmp, resolved);
  } catch (e) {
    try {
      unlinkSync(tmp);
    } catch (_) {}
    logger(`AppState save failed: ${errorText(e)}`, "warn");
    return false;
  }

  try {
    chmodSync(resolved, 0o600);
  } catch (_) {}
  return true;
}

module.exports = {
  REQUIRED_COOKIES,
  errorText,
  parseAppStateValue,
  loadAppStateFromEnv,
  getAppStatePath,
  validateAppState,
  hasSessionCookies,
  loadAppState,
  saveAppState,
  backupAppState
};
