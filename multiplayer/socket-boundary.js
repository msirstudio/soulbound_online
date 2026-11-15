"use strict";

// Apply the same transport boundary to every gameplay command. Socket.IO's
// disconnect event has its own argument contract and must pass through unchanged.
function bindSocket(socket) {
  const register = socket.on.bind(socket);
  return function on(event, handler) {
    if (event === "disconnect") return register(event, handler);
    return register(event, (payload, callback) => {
      let replied = false;
      const reply = result => {
        if (replied) return;
        replied = true;
        if (typeof callback === "function") callback(result);
      };
      if (payload !== undefined &&
          (payload === null || typeof payload !== "object" || Array.isArray(payload))) {
        reply({ ok: false, error: "Invalid command payload." });
        return;
      }
      const failed = () => reply({ ok: false, error: "Unable to process command." });
      try {
        const result = handler(payload === undefined ? {} : payload, reply);
        if (result && typeof result.then === "function") return Promise.resolve(result).catch(failed);
        return result;
      } catch {
        failed();
      }
    });
  };
}

module.exports = { bindSocket };
