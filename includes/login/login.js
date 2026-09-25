const fca = require("sahu-fca"); //এখানে আপনার FCA নাম দিন।

const logger = require("../../utils/log");
const {
  errorText,
  getAppStatePath,
  loadAppState,
  saveAppState,
  hasSessionCookies,
  loadAppStateFromEnv,
  validateAppState
} = require("./appState");
const { existsSync } = require("fs");
const { classifyError, isFatal, isTransient, isConnectionDead, validateSession } = require("./loginValidator");
const { normalizeApi } = require("./fcaAdapter");
const { ConnectionMonitor, STATES } = require("./loginMonitor");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(undefined);
    }, Math.max(0, Number(ms) || 0));

    Promise.resolve(promise)
      .then((value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(undefined);
      });
  });
}

function loginFca(appState, callback) {
  try {
    fca({ appState }, getFCAOptions(), (err, api) => {
      if (err) return callback(err);
      try {
        normalizeApi(api);
      } catch (e) {
        logger("API normalization warning: " + errorText(e), "warn");
      }
      callback(null, api);
    });
  } catch (e) {
    callback(e);
  }
}

function getLoginConfig() {
  const cfg = (global.config && global.config.Login) || {};
  const num = (v, d) => (Number.isFinite(v) ? v : d);
  return {
    autoRetryLogin: cfg.autoRetryLogin !== false,
    maxLoginRetries: num(cfg.maxLoginRetries, 999999),
    reconnectOnListenError: cfg.reconnectOnListenError !== false,
    maxReconnectAttempts: num(cfg.maxReconnectAttempts, 999999),
    reconnectBaseDelay: num(cfg.reconnectBaseDelay, 3000),
    reconnectMaxDelay: num(cfg.reconnectMaxDelay, 30000),
    healthCheckInterval: num(cfg.healthCheckInterval, 60000),
    heartbeatInterval: num(cfg.heartbeatInterval, 45000),
    persistAppState: cfg.persistAppState !== false,
    persistInterval: num(cfg.persistInterval, 300000),
    backupAppState: cfg.backupAppState !== false,
    recoveryCooldownMs: num(cfg.recoveryCooldownMs, 60000),
    deadConnectionGraceMs: num(cfg.deadConnectionGraceMs, 180000),
    reloginMinIntervalMs: num(cfg.reloginMinIntervalMs, 300000)
  };
}

function getFCAOptions() {
  const opts = { ...((global.config && global.config.FCAOption) || {}) };
  if (typeof opts.autoReconnect === "undefined") opts.autoReconnect = true;
  if (typeof opts.autoListen === "undefined") opts.autoListen = false;
  if (typeof opts.autoReLogin === "undefined") opts.autoReLogin = false;
  return opts;
}

module.exports = function fcaLogin(loginData, callback) {
  const cfg = getLoginConfig();
  const appStatePath = getAppStatePath();

  let appState;
  try {
    appState = loadAppState(appStatePath, loginData && loginData.appState);
    logger("AppState loaded and validated.", "[ LOGIN ]");
  } catch (err) {
    logger("AppState load failed: " + errorText(err), "error");
    if (typeof callback === "function") callback(err);
    return;
  }

  const cookies = hasSessionCookies(appState);
  if (!cookies.ok) {
    logger("AppState missing session cookie(s): " + cookies.missing.join(", ") + ". Login will likely fail.", "warn");
  } else {
    logger("Session cookies (c_user, xs) present.", "[ LOGIN ]");
  }

  const monitor = new ConnectionMonitor({
    maxAttempts: cfg.maxReconnectAttempts,
    baseDelay: cfg.reconnectBaseDelay,
    maxDelay: cfg.reconnectMaxDelay,
    healthInterval: cfg.healthCheckInterval,
    heartbeatInterval: cfg.heartbeatInterval
  });

  let persistTimer = null;
  let originalListenMqtt = null;
  let storedListenCallback = null;
  let storedHandle = null;
  let listenerGeneration = 0;
  let reconnecting = false;
  let apiInstance = null;
  let isShuttingDown = false;
  let loginAttempt = 0;

  const envOnlyCredentials = !existsSync(appStatePath) && !!loadAppStateFromEnv();

  let lastRecoveryAt = 0;
  let lastReloginAt = 0;
  let lastErrorAt = 0;
  let deadSince = null;
  let sessionMarkedDead = false;

  function persistAppState(api) {
    try {
      if (envOnlyCredentials) return;
      if (!api || typeof api.getAppState !== "function") return;
      const fresh = api.getAppState();
      const check = validateAppState(fresh);
      if (!check.valid) return;

      let current = null;
      try {
        current = JSON.stringify(loadAppState(appStatePath));
      } catch (_) {
        current = null;
      }
      if (current !== null && JSON.stringify(fresh) === current) return;

      if (saveAppState(appStatePath, fresh, { backup: cfg.backupAppState })) {
        logger("AppState refreshed & saved.", "[ LOGIN ]");
      }
    } catch (e) {
      logger("AppState persist skipped: " + errorText(e), "[ LOGIN ]");
    }
  }


  function getMqttClient(api) {
    try {
      const ctx = api && api.ctx;
      return (ctx && ctx.mqttClient) || null;
    } catch (_) {
      return null;
    }
  }

  function isSocketConnected() {
    try {
      const client = getMqttClient(apiInstance);
      if (client && typeof client.connected === "boolean") return client.connected;
      if (apiInstance && typeof apiInstance.getReconnectStatus === "function") {
        const status = apiInstance.getReconnectStatus();
        if (status && typeof status.connected === "boolean") return status.connected;
      }
    } catch (_) {}
    return null;
  }

  async function waitForConnection(timeoutMs) {
    const deadline = Date.now() + Math.max(0, Number(timeoutMs) || 0);
    while (Date.now() < deadline) {
      if (isShuttingDown) return "down";
      if (isSocketConnected() === true) return "up";
      await sleep(1000);
    }
    const state = isSocketConnected();
    if (state === true) return "up";
    return state === false ? "down" : "unknown";
  }

  function isSessionDeadError(error) {
    if (!error) return false;
    if (error === true) return true;
    if (typeof error === "object") {
      if (error.requiresReLogin === true) return true;
      if (error.type === "account_inactive" || error.type === "sessionExpired") return true;
    }
    return isFatal(error);
  }

  function makeListenWrapper(userCallback, generation) {
    return function wrappedListener(error, message) {
      if (isShuttingDown || generation !== listenerGeneration) return;

      try {
        if (error) {
          lastErrorAt = Date.now();
          monitor.markListenError(error);
          const text = typeof global.getText === "function"
            ? global.getText("shahadat", "handleListenError", errorText(error))
            : "Listener error: " + errorText(error);
          logger(text, "error");

          if (isSessionDeadError(error)) {
            sessionMarkedDead = true;
            monitor.markFatal("session dead: " + errorText(error));
            logger("Session looks dead (re-login required): " + errorText(error), "error");
          }

          if (cfg.reconnectOnListenError && isSessionDeadError(error)) {
            safeReconnect("listener reported a dead session");
          }
        } else {
          monitor.markActivity();
          if (!monitor.isConnected()) {
            monitor.markConnected("traffic resumed");
          }
          deadSince = null;
          sessionMarkedDead = false;
        }
      } catch (e) {
        logger("Listen wrapper error: " + errorText(e), "warn");
      }
      try {
        return userCallback(error, message);
      } catch (e) {
        logger("User callback error: " + errorText(e), "error");
      }
    };
  }

  function stopHandle(handle) {
    if (!handle) return;
    const stoppers = ["stopListening", "stop", "end", "close", "unsubscribe"];
    for (const name of stoppers) {
      if (typeof handle[name] === "function") {
        try {
          handle[name]();
        } catch (_) {}
        return;
      }
    }
    if (typeof handle === "function") {
      try {
        handle();
      } catch (_) {}
    }
  }

  function stopListenerSync() {
    const handle = storedHandle;
    listenerGeneration++;
    storedHandle = null;
    if (global.handleListen === handle) global.handleListen = null;

    const api = apiInstance;
    if (api && typeof api.stopListening === "function") {
      try {
        api.stopListening();
      } catch (_) {}
    } else {
      stopHandle(handle);
    }
  }

  async function stopListenerHandle(cooldownMs = 2000) {
    const api = apiInstance;

    const stopAsync =
      api && typeof api.stopListeningAsync === "function"
        ? api.stopListeningAsync.bind(api)
        : null;
    const clientToClose = getMqttClient(api);

    stopListenerSync();

    if (stopAsync) {
      await withTimeout(Promise.resolve().then(() => stopAsync()), 8000);
    } else {
      await sleep(1000);
    }

    if (
      clientToClose &&
      typeof clientToClose.end === "function" &&
      getMqttClient(api) === clientToClose
    ) {
      try {
        clientToClose.end(true);
      } catch (_) {}
    }

    if (cooldownMs > 0) {
      await sleep(cooldownMs);
    }
  }

  function startListener() {
    if (!originalListenMqtt || !storedListenCallback) return false;

    if (storedHandle && isSocketConnected() !== false) {
      logger("A listener is already active - not starting a second one.", "warn");
      try {
        if (typeof apiInstance.setReconnectOptions === "function") {
          apiInstance.setReconnectOptions({ autoReconnect: getFCAOptions().autoReconnect !== false });
        }
      } catch (_) {}
      return true;
    }

    const generation = ++listenerGeneration;
    storedHandle = originalListenMqtt(makeListenWrapper(storedListenCallback, generation));
    global.handleListen = storedHandle;

    try {
      if (apiInstance && typeof apiInstance.setReconnectOptions === "function") {
        apiInstance.setReconnectOptions({ autoReconnect: getFCAOptions().autoReconnect !== false });
      }
    } catch (_) {}
    return true;
  }

  async function doReListen() {
    if (!originalListenMqtt || !storedListenCallback) {
      logger("Cannot re-listen: missing original handler", "warn");
      return false;
    }

    await stopListenerHandle(2000);

    if (apiInstance) {
      const sessionStatus = await validateSession(apiInstance);
      if (!sessionStatus.ok) {
        logger("Session invalidated (" + sessionStatus.error + "), transitioning to fresh login...", "warn");
        return false;
      }
    }

    try {
      logger("Re-establishing single MQTT listener...", "[ LOGIN ]");
      return startListener();
    } catch (e) {
      logger("Re-listen failed: " + errorText(e), "error");
      return false;
    }
  }

  async function doFreshLogin() {
    const sinceLastRelogin = Date.now() - lastReloginAt;
    if (lastReloginAt && sinceLastRelogin < cfg.reloginMinIntervalMs) {
      logger(
        "Fresh login skipped (rate limit: next attempt in " +
          Math.ceil((cfg.reloginMinIntervalMs - sinceLastRelogin) / 1000) +
          "s).",
        "warn"
      );
      return false;
    }

    let latest;
    try {
      latest = loadAppState(appStatePath);
    } catch (_) {
      latest = appState;
    }

    await stopListenerHandle(2000);

    lastReloginAt = Date.now();
    loginAttempt++;
    logger("Attempting single-session fresh FCA login (attempt " + loginAttempt + ")...", "warn");

    return new Promise((resolve) => {
      loginFca(latest, (err, api) => {
        if (err) {
          const kind = classifyError(err);
          logger("Fresh login failed [" + kind + "]: " + errorText(err), "error");

          if (isFatal(err)) {
            monitor.markFatal("fatal login error");
            logger("FATAL: Session invalid or restricted. Backing off...", "error");
          }

          setTimeout(() => resolve(false), cfg.reconnectBaseDelay);
          return;
        }

        if (apiInstance) {
          Object.assign(apiInstance, api);
        } else {
          apiInstance = api;
        }

        wireApi(apiInstance);
        if (global.client) global.client.api = apiInstance;

        try {
          if (typeof apiInstance.getAppState === "function") {
            saveAppState(appStatePath, apiInstance.getAppState(), { backup: cfg.backupAppState });
          }
        } catch (_) {}

        sessionMarkedDead = false;
        deadSince = null;

        if (storedListenCallback && typeof apiInstance.listenMqtt === "function") {
          logger("Fresh login OK - restarting single MQTT listener...", "[ LOGIN ]");
          startListener();
          monitor.markConnected("recovered via fresh login");
          loginAttempt = 0;
          return resolve(true);
        }
        resolve(true);
      });
    });
  }

  function checkHeartbeat(callback) {
    if (!apiInstance) return callback(true);
    try {
      if (typeof apiInstance.getCurrentUserID === "function") {
        const id = apiInstance.getCurrentUserID();
        return callback(!id);
      }
      callback(false);
    } catch (e) {
      callback(true);
    }
  }

  async function safeReconnect(reason) {
    if (reconnecting || isShuttingDown) return false;

    if (!storedListenCallback) return false;

    const now = Date.now();
    if (lastRecoveryAt && now - lastRecoveryAt < cfg.recoveryCooldownMs) {
      logger(
        "[Connection] Recovery skipped - cooldown active (" +
          Math.ceil((cfg.recoveryCooldownMs - (now - lastRecoveryAt)) / 1000) +
          "s left).",
        "warn"
      );
      return false;
    }

    if (isSocketConnected() === true) {
      logger("[Connection] MQTT socket is already connected - recovery not needed.", "[ LOGIN ]");
      return false;
    }

    if (sessionMarkedDead && lastReloginAt && now - lastReloginAt < cfg.reloginMinIntervalMs) {
      logger(
        "[Connection] Session needs a fresh login, but re-login is rate limited for another " +
          Math.ceil((cfg.reloginMinIntervalMs - (now - lastReloginAt)) / 1000) +
          "s.",
        "warn"
      );
      return false;
    }

    lastRecoveryAt = now;
    reconnecting = true;
    deadSince = null;

    try {
      logger("[Connection] Starting single-session recovery (" + (reason || "unknown reason") + ")...", "[ LOGIN ]");

      const recovered = await monitor.reconnect(
        async () => {
          if (isSocketConnected() === true) return true;

          const sessionDead = sessionMarkedDead;

          if (!sessionDead) {
            const relistened = await doReListen();
            if (relistened) {
              const state = await waitForConnection(20000);
              if (state === "up") return true;
              if (state === "unknown") {
                logger("[Connection] Listener restarted (socket state not exposed) - assuming FCA is connecting.", "warn");
                return true;
              }
              logger("[Connection] Re-listen did not come up - escalating to fresh login.", "warn");
            }
          }

          const relogged = await doFreshLogin();
          if (!relogged) return false;

          const state = await waitForConnection(20000);
          if (state === "down") return false;
          return true;
        },
        (fatalErr) => {
          logger("Reconnection alert: " + errorText(fatalErr), "warn");
        }
      );

      if (!recovered) {
        logger("Reconnection loop completed attempt, standby for next check...", "warn");
      } else {
        logger("[Connection] Single-session reconnection successful!", "[ LOGIN ]");
      }
      return recovered;
    } catch (e) {
      logger("SafeReconnect error: " + errorText(e), "error");
      return false;
    } finally {
      reconnecting = false;
    }
  }

  function wireApi(api) {
    const options = getFCAOptions();
    if (typeof api.setOptions === "function") {
      try {
        api.setOptions(options);
      } catch (e) {
        logger("setOptions failed: " + errorText(e), "warn");
      }
    }

    try {
      if (typeof api.setReconnectOptions === "function") {
        api.setReconnectOptions({ autoReconnect: options.autoReconnect !== false });
      }
    } catch (_) {}

    try {
      if (
        typeof api.isAutoReLoginEnabled === "function" &&
        api.isAutoReLoginEnabled() &&
        typeof api.enableAutoReLogin === "function"
      ) {
        api.enableAutoReLogin(false);
        logger("FCA auto re-login was enabled - turned off (login.js owns re-login).", "warn");
      }
    } catch (_) {}

    if (typeof api.listenMqtt === "function" && originalListenMqtt !== api.listenMqtt) {
      originalListenMqtt = api.listenMqtt.bind(api);
      api.listenMqtt = function monitoredListenMqtt(userCallback) {
        storedListenCallback = userCallback;
        monitor.markConnected();
        try {
          if (storedHandle || (apiInstance && apiInstance.ctx && apiInstance.ctx._listeningActive)) {
            stopListenerSync();
          }
          if (startListener()) {
            return storedHandle;
          }
          return undefined;
        } catch (e) {
          logger("listenMqtt error: " + errorText(e), "error");
          throw e;
        }
      };
    }
  }

  function attemptLogin() {
    if (isShuttingDown) return;

    loginAttempt++;
    monitor.markConnecting();
    logger("Attempting FCA login (attempt " + loginAttempt + ")...", "[ LOGIN ]");

    let state = appState;
    try {
      state = loadAppState(appStatePath) || appState;
    } catch (_) {
      state = appState;
    }

    loginFca(state, (err, api) => {
      if (err) {
        const kind = classifyError(err);
        logger("Login failed [" + kind + "]: " + errorText(err), "error");

        if (isFatal(err)) {
          monitor.markFatal("fatal login error");
          logger("FATAL: Session may need refresh. Will keep retrying...", "error");
        }

        const slow = loginAttempt > cfg.maxLoginRetries;
        if (loginAttempt === cfg.maxLoginRetries) {
          logger(
            "Fast login retries exhausted (" + cfg.maxLoginRetries + ") - continuing with slow retries.",
            "warn"
          );
        }
        const delay = slow ? cfg.reconnectMaxDelay : (isFatal(err) ? cfg.reconnectMaxDelay : cfg.reconnectBaseDelay);
        setTimeout(() => attemptLogin(), delay);
        return;
      }

      apiInstance = api;
      wireApi(api);

      try {
        if (typeof api.getAppState === "function") {
          if (saveAppState(appStatePath, api.getAppState(), { backup: cfg.backupAppState })) {
            logger("AppState saved securely after login.", "[ LOGIN ]");
          }
        }
      } catch (e) {
        logger("AppState save skipped: " + errorText(e), "[ LOGIN ]");
      }

      validateSession(api).then((result) => {
        if (result.ok) {
          logger("Session validated" + (result.userID ? " (userID: " + result.userID + ")" : "") + ".", "[ LOGIN ]");
          loginAttempt = 0;
        } else {
          logger("Session validation warning: " + result.error, "warn");
        }

        if (cfg.persistAppState && cfg.persistInterval > 0) {
          persistTimer = setInterval(() => {
            try {
              persistAppState(api);
            } catch (e) {
              logger("Persist error: " + errorText(e), "warn");
            }
          }, cfg.persistInterval);
          if (persistTimer && typeof persistTimer.unref === "function") {
            persistTimer.unref();
          }
        }

        monitor.startHealthCheck((info) => {
          if (info.state !== STATES.CONNECTED) {
            logger("[Connection] Status: " + info.state + ", uptime=" + info.uptimeFormatted + ", reconnects=" + info.totalReconnects, "warn");
          }
        });

        monitor.startHeartbeat((cb) => {
          let triggerRecovery = false;
          try {
            const connected = isSocketConnected();
            if (connected === true) {
              if (deadSince) logger("[Connection] MQTT socket is connected again.", "[ LOGIN ]");
              deadSince = null;
            } else if (storedListenCallback) {
              if (!deadSince) {
                deadSince = Date.now();
                logger("[Connection] MQTT socket is down - waiting for FCA auto-reconnect.", "warn");
              }
              const downFor = Date.now() - deadSince;
              if (downFor >= cfg.deadConnectionGraceMs) {
                logger(
                  "[Connection] MQTT socket down for " + Math.round(downFor / 1000) + "s - starting recovery.",
                  "error"
                );
                deadSince = null;
                triggerRecovery = true;
              }
            }
          } catch (_) {}
          cb(triggerRecovery);
          if (triggerRecovery) safeReconnect("heartbeat: socket down");
        });

        logger("Login complete (attempt " + loginAttempt + ").", "[ LOGIN ]");
        if (typeof callback === "function") callback(null, api);
      }).catch((e) => {
        logger("Session validation error: " + errorText(e), "warn");
        if (typeof callback === "function") callback(null, api);
      });
    });
  }

  async function shutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger("[Connection] Shutdown initiated...", "[ LOGIN ]");
    if (persistTimer) clearInterval(persistTimer);
    monitor.stop();
    await stopListenerHandle(1000);
  }

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  attemptLogin();
};
