const { errorText } = require("./appState");


const FATAL_PATTERNS = [
  /checkpoint/i,
  /account (has been |is )?(temporarily |permanently )?(locked|disabled|restricted|suspended)/i,
  /please (log ?in|confirm your identity)/i,
  /not logged in/i,
  /session (expired|invalid|revoked)/i,
  /login approval|two[- ]factor|2fa\b/i,
  /invalid (cookies|appstate|session|credentials)/i,
  /c_user.*(missing|required|invalid)/i,
  /fbgraphexception|graphqlerror/i,
  /permission denied|access denied/i,
  /authorization has been denied/i,
  /\b401\b/,
  /\b403\b/,
  /already (logged in|authorized) as/i,
  /getcurrentuserid.*null/i,
  /multiple sessions/i,
  /you can'?t create multiple sessions/i,
  /you couldn'?t create multiple sessions/i,
  /session conflict/i,
  /concurrent connection/i,
  /too many active sessions/i
];

const TRANSIENT_PATTERNS = [
  /enotfound|etimedout|econnreset|econnrefused|econnaborted|eai_again|eai_eagain|epipe/i,
  /getaddrinfo|socket hang up|network error|network (is )?unreachable/i,
  /connection (refused|reset|aborted|closed|lost|timed out|terminated)/i,
  /eaddrinuse|eaddrnotavail/i,
  /ssl| TLS |tls handshake/i,
  /protocol error|invalid packet/i,
  /\bdisconnect(ed)?\b/i,
  /\bmqtt\b/i,
  /\b429\b|too many requests|rate.?limit/i,
  /\b50[234]\b|bad gateway|service unavailable|internal server error/i,
  /timeout|timed out/i,
  /server error/i,
  /ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/i
];

function classifyError(err) {
  const text = errorText(err);
  if (!text) return "UNKNOWN";
  if (FATAL_PATTERNS.some((re) => re.test(text))) return "FATAL";
  if (TRANSIENT_PATTERNS.some((re) => re.test(text))) return "TRANSIENT";
  return "UNKNOWN";
}

function isFatal(err) {
  return classifyError(err) === "FATAL";
}

function isTransient(err) {
  return classifyError(err) !== "FATAL";
}

function isConnectionDead(err) {
  const text = errorText(err).toLowerCase();
  const deadIndicators = [
    'socket hang up',
    'connection closed',
    'connection destroyed',
    'not logged in',
    'econnreset',
    'etimedout',
    'enotfound',
    'protocol error',
    'mqtt disconnect',
    'stream closed'
  ];
  return deadIndicators.some(ind => text.includes(ind));
}

function validateSession(api) {
  return new Promise((resolve) => {
    if (!api) return resolve({ ok: false, error: "no api object" });
    if (typeof api.getCurrentUserID !== "function") {
      return resolve({ ok: true });
    }
    try {
      const id = api.getCurrentUserID();
      if (id) return resolve({ ok: true, userID: String(id) });
      resolve({ ok: false, error: "getCurrentUserID() returned empty" });
    } catch (e) {
      resolve({ ok: false, error: errorText(e) });
    }
  });
}

module.exports = {
  classifyError,
  isFatal,
  isTransient,
  isConnectionDead,
  validateSession,
  FATAL_PATTERNS,
  TRANSIENT_PATTERNS
};
