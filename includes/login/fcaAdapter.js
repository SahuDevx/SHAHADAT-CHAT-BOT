const logger = require("../../utils/log");

function normalizeApi(api) {
  if (!api || typeof api !== "object") return api;
  if (api.__normalized) return api;
  api.__normalized = true;

  if (typeof api.listenMqtt !== "function" && typeof api.listen === "function") {
    api.listenMqtt = function listenMqttCompat(callback) {
      logger(
        "FCA version exposes legacy listen(); aliased as listenMqtt() for compatibility.",
        "[ LOGIN ]"
      );
      return api.listen(callback);
    };
  }

  if (typeof api.setOptions !== "function") {
    api.setOptions = function setOptionsCompat(options) {
      logger(
        "FCA version missing setOptions(); using no-op shim.",
        "[ LOGIN ]"
      );
    };
  }

  if (typeof api.getAppState !== "function") {
    api.getAppState = function getAppStateCompat() {
      logger(
        "FCA version missing getAppState(); using no-op shim.",
        "[ LOGIN ]"
      );
      return null;
    };
  }

  if (typeof api.listenMqtt === "function") {
    const originalListenMqtt = api.listenMqtt;
    api.listenMqtt = function safeListenMqtt(callback) {
      try {
        const handle = originalListenMqtt.call(api, callback);
        if (typeof handle === "function") {
          const fn = handle;
          fn.stop = fn;
          fn.stopListening = fn;
          fn.end = fn;
          fn.close = fn;
          return fn;
        }
        if (handle && typeof handle === "object") {
          const stopper = handle.stopListening || handle.stop || handle.end || handle.close || (() => {});
          handle.stop = handle.stop || stopper;
          handle.stopListening = handle.stopListening || stopper;
          handle.end = handle.end || stopper;
          handle.close = handle.close || stopper;
          return handle;
        }
        return {
          stop: () => {},
          stopListening: () => {},
          end: () => {},
          close: () => {}
        };
      } catch (e) {
        logger(`listenMqtt error: ${e.message}`, "error");
        throw e;
      }
    };
  }

  return api;
}

module.exports = { normalizeApi };

