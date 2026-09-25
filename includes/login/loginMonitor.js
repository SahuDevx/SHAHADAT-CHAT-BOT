const logger = require("../../utils/log");
const { errorText } = require("./appState");

const STATES = Object.freeze({
  IDLE: "IDLE",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  RECONNECTING: "RECONNECTING",
  DISCONNECTED: "DISCONNECTED",
  FATAL: "FATAL",
  HEARTBEAT_DEAD: "HEARTBEAT_DEAD"
});

function timestamp() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ConnectionMonitor {
  constructor(options = {}) {
    this.state = STATES.IDLE;
    this.connectedAt = null;
    this.lastActivity = Date.now();
    this.lastHeartbeat = Date.now();
    this.reconnectAttempts = 0;
    this.maxAttempts = options.maxAttempts || 999999;
    this.baseDelay = options.baseDelay || 3000;
    this.maxDelay = options.maxDelay || 30000;
    this.healthInterval = options.healthInterval || 60000;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.healthTimer = null;
    this.heartbeatTimer = null;
    this.isReconnecting = false;
    this.totalReconnects = 0;
  }

  setState(next, extra = "") {
    if (this.state === next) return;
    const prev = this.state;
    this.state = next;
    logger("[Connection] " + prev + " -> " + next + (extra ? " | " + extra : "") + " @ " + timestamp(), "[ LOGIN ]");
  }

  markConnecting() {
    this.setState(STATES.CONNECTING);
  }

  markConnected(extra) {
    this.connectedAt = Date.now();
    this.lastActivity = Date.now();
    this.lastHeartbeat = Date.now();
    this.reconnectAttempts = 0;
    this.setState(STATES.CONNECTED, extra || "session established");
  }

  markActivity() {
    this.lastActivity = Date.now();
    this.lastHeartbeat = Date.now();
  }

  markHeartbeat() {
    this.lastHeartbeat = Date.now();
  }

  markListenError(err) {
    this.setState(STATES.DISCONNECTED, "listen error: " + errorText(err));
  }

  markHeartbeatDead() {
    this.setState(STATES.HEARTBEAT_DEAD, "no heartbeat response");
  }

  markReconnecting(reason) {
    this.setState(STATES.RECONNECTING, String(reason || ""));
  }

  markFatal(reason) {
    this.setState(STATES.FATAL, String(reason || ""));
  }

  isConnected() {
    return this.state === STATES.CONNECTED;
  }

  uptimeMs() {
    return this.connectedAt ? Date.now() - this.connectedAt : 0;
  }

  uptimeFormatted() {
    const ms = this.uptimeMs();
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return hours + "h " + minutes + "m " + seconds + "s";
  }

  timeSinceLastHeartbeat() {
    return Date.now() - this.lastHeartbeat;
  }

  timeSinceLastActivity() {
    return Date.now() - this.lastActivity;
  }

  nextDelay(isFatal = false) {
    const base = isFatal ? Math.max(this.baseDelay * 3, 10000) : this.baseDelay;
    const max = isFatal ? Math.max(this.maxDelay, 60000) : this.maxDelay;
    const attempt = Math.min(this.reconnectAttempts, 8);
    const exponential = Math.min(max, base * Math.pow(1.5, attempt));
    const jitter = Math.floor(Math.random() * 1500);
    return Math.floor(exponential) + jitter;
  }

  isHeartbeatOverdue() {
    return this.timeSinceLastHeartbeat() > this.heartbeatInterval;
  }

  startHeartbeat(checkFn) {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.state !== STATES.IDLE) {
        if (this.isHeartbeatOverdue() && typeof checkFn === "function") {
          checkFn((isDead) => {
            if (isDead) {
              this.markHeartbeatDead();
            } else {
              this.markHeartbeat();
            }
          });
        }
      }
    }, this.heartbeatInterval);

    if (this.heartbeatTimer && typeof this.heartbeatTimer.unref === "function") {
      this.heartbeatTimer.unref();
    }
  }

  async reconnect(reconnectFn, onFatal) {
    if (this.isReconnecting) {
      return false;
    }

    this.isReconnecting = true;

    try {
      while (this.state !== STATES.IDLE) {
        if (this.reconnectAttempts >= this.maxAttempts) {
          logger(
            "[Connection] Reconnect attempt limit (" + this.maxAttempts + ") reached - backing off.",
            "warn"
          );
          this.setState(STATES.DISCONNECTED, "attempt limit reached");
          this.reconnectAttempts = 0;
          break;
        }

        const fatalState = (this.state === STATES.FATAL);
        if (fatalState) {
          this.state = STATES.DISCONNECTED;
        }

        this.reconnectAttempts++;
        this.totalReconnects++;
        const attempt = this.reconnectAttempts;
        const delay = this.nextDelay(fatalState);

        this.markReconnecting("attempt " + attempt + " in " + delay + "ms");

        await sleep(delay);
        if (this.state === STATES.IDLE) break;

        let ok = false;
        try {
          ok = await reconnectFn();
        } catch (e) {
          ok = false;
          if (typeof onFatal === "function") {
            onFatal(e);
          }
        }

        if (ok) {
          this.markConnected("recovered after " + attempt + " attempt(s)");
          this.isReconnecting = false;
          return true;
        }

        if (attempt % 5 === 0) {
          logger("[Connection] Still attempting single-session reconnect... (" + attempt + " attempts)", "warn");
        }
      }
    } catch (e) {
      logger("[Connection] Reconnect error: " + errorText(e), "error");
    } finally {
      this.isReconnecting = false;
    }
    return false;
  }

  startHealthCheck(reportFn) {
    if (!this.healthInterval || this.healthTimer) return;

    this.healthTimer = setInterval(() => {
      if (typeof reportFn === "function") {
        try {
          reportFn({
            state: this.state,
            uptime: this.uptimeMs(),
            uptimeFormatted: this.uptimeFormatted(),
            attempts: this.reconnectAttempts,
            totalReconnects: this.totalReconnects,
            lastHeartbeat: Math.round(this.timeSinceLastHeartbeat() / 1000)
          });
        } catch (e) {
          logger("[Connection] Health check error: " + errorText(e), "warn");
        }
      }
    }, this.healthInterval);

    if (this.healthTimer && typeof this.healthTimer.unref === "function") {
      this.healthTimer.unref();
    }
  }

  getStatus() {
    return {
      state: this.state,
      uptime: this.uptimeFormatted(),
      reconnectAttempts: this.reconnectAttempts,
      totalReconnects: this.totalReconnects,
      isConnected: this.isConnected()
    };
  }

  stop() {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  reset() {
    this.stop();
    this.state = STATES.IDLE;
    this.connectedAt = null;
    this.lastActivity = Date.now();
    this.lastHeartbeat = Date.now();
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }
}

module.exports = { ConnectionMonitor, STATES };
