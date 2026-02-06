// === Core modules ===
const https = require("node:https");
const os = require("node:os");

/**
 * BeepBot Notification Helper
 *
 * Critical system notifications via BeepBot service
 * Used when internal logging systems (database, file) are unavailable
 *
 * Features:
 * - Emergency notifications for system failures
 * - Database connection errors
 * - Redis/RabbitMQ connection failures
 * - Application startup/shutdown alerts
 * - Critical error notifications
 */

const BEEPBOT_CONFIG = {
  url: "https://beepbot.ngodings.my.id/notify",
  timeout: 10000, // 10 seconds
  secret: process.env.BEEPBOT_SECRET || null,
  chatId: process.env.BEEPBOT_CHAT_ID || "1185624008",
  enabled: process.env.BEEPBOT_ENABLED === "true",
};

/**
 * Send notification to BeepBot
 * @param {string} message - Notification message
 * @param {Object} options - Additional options
 * @param {string} options.level - Error level (info, warning, error, critical)
 * @param {string} options.component - System component (database, redis, rabbitmq, etc)
 * @param {Object} options.metadata - Additional metadata
 * @returns {Promise<boolean>} Success status
 */
async function sendNotification(message, options = {}) {
  if (!BEEPBOT_CONFIG.enabled) {
    console.log("🔕 [BEEPBOT] Notifications disabled, skipping");
    return false;
  }

  if (!BEEPBOT_CONFIG.secret) {
    console.error("❌ [BEEPBOT] Missing BEEPBOT_SECRET environment variable");
    return false;
  }

  const { level = "info", component = "system", metadata = {} } = options;

  // Get Jakarta timezone timestamp
  const jakartaTime = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Format notification message
  const emoji = getEmoji(level);
  const formattedMessage = formatMessage(message, {
    level,
    component,
    timestamp: jakartaTime,
    metadata,
    emoji,
  });

  const payload = {
    text: formattedMessage,
    chat_id: BEEPBOT_CONFIG.chatId,
  };

  try {
    const success = await makeHttpRequest(payload);

    if (success) {
      console.log(
        `✅ [BEEPBOT] Notification sent: ${level.toUpperCase()} - ${component}`
      );
    } else {
      console.error(
        `❌ [BEEPBOT] Failed to send notification: ${level.toUpperCase()} - ${component}`
      );
    }

    return success;
  } catch (error) {
    console.error(`❌ [BEEPBOT] Notification error:`, error.message);
    return false;
  }
}

/**
 * Get emoji for notification level
 * @param {string} level - Notification level
 * @returns {string} Emoji
 */
function getEmoji(level) {
  const emojis = {
    info: "ℹ️",
    warning: "⚠️",
    error: "❌",
    critical: "🚨",
    success: "✅",
  };
  return emojis[level] || "📢";
}

/**
 * Get internal IP address
 * @returns {string} IP address
 */
/**
 * Get internal network information
 * @returns {Object} Network info with local and tailscale IPs
 */
function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  let localIP = "unknown";
  let tailscaleIP = "not connected";

  for (const name of Object.keys(interfaces)) {
    // Identify virtual interfaces to avoid them overwriting physical ones
    const isVirtual = /docker|veth|br-|br\./i.test(name);

    for (const iface of interfaces[name]) {
      if ((iface.family === "IPv4" || iface.family === 4) && !iface.internal) {
        // Tailscale (usually 100.x.y.z)
        if (iface.address.startsWith("100.") || name.toLowerCase().includes("tailscale")) {
          tailscaleIP = iface.address;
        } else {
          // If it's not virtual, or we haven't found any IP yet, use it
          if (localIP === "unknown" || !isVirtual) {
            localIP = iface.address;
          }
        }
      }
    }
  }
  return { localIP, tailscaleIP };
}

/**
 * Format notification message
 * @param {string} message - Base message
 * @param {Object} options - Formatting options
 * @returns {string} Formatted message
 */
function formatMessage(message, options) {
  const { level, component, timestamp, metadata, emoji } = options;
  const { localIP, tailscaleIP } = getNetworkInfo();

  // Use plain text formatting to avoid Telegram markdown issues
  const appName = (process.env.APP_NAME || "OMNIFLOW").toUpperCase();
  let formatted = `${emoji} ${appName} ALERT\n\n`;
  formatted += `Level: ${level.toUpperCase()}\n`;
  formatted += `Application: ${process.env.APP_NAME || "Omniflow Starter"}\n`;
  formatted += `Instance: ${os.hostname()}\n`;
  formatted += `Node: ${process.env.INSTANCE_NODE_NAME || "Thinkpad L15"}\n`;
  formatted += `IP (Local): ${localIP}\n`;
  formatted += `IP (Tailscale): ${tailscaleIP}\n`;
  formatted += `Component: ${component}\n`;
  formatted += `Time: ${timestamp}\n`;
  formatted += `Environment: ${process.env.NODE_ENV || "development"}\n\n`;
  formatted += `Message:\n${message}`;

  // Add metadata if available
  if (metadata && Object.keys(metadata).length > 0) {
    formatted += `\n\nDetails:\n`;
    for (const [key, value] of Object.entries(metadata)) {
      // Ensure value is string and handle special characters
      const safeValue = String(value).replace(/[*_`[\]]/g, "\\$&");
      formatted += `• ${key}: ${safeValue}\n`;
    }
  }

  return formatted;
}

/**
 * Make HTTP request to BeepBot API
 * @param {Object} payload - Request payload
 * @returns {Promise<boolean>} Success status
 */
function makeHttpRequest(payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const url = new URL(BEEPBOT_CONFIG.url);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        "X-Notify-Secret": BEEPBOT_CONFIG.secret,
      },
      timeout: BEEPBOT_CONFIG.timeout,
    };

    const req = https.request(options, (res) => {
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          console.error(`❌ [BEEPBOT] HTTP ${res.statusCode}:`, responseBody);
          resolve(false);
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ [BEEPBOT] Request error:", error.message);
      resolve(false);
    });

    req.on("timeout", () => {
      console.error("❌ [BEEPBOT] Request timeout");
      req.destroy();
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// Convenience functions for different notification levels

/**
 * Send info notification
 * @param {string} message - Message
 * @param {string} component - System component
 * @param {Object} metadata - Additional metadata
 */
async function notifyInfo(message, component = "system", metadata = {}) {
  return sendNotification(message, { level: "info", component, metadata });
}

/**
 * Send warning notification
 * @param {string} message - Message
 * @param {string} component - System component
 * @param {Object} metadata - Additional metadata
 */
async function notifyWarning(message, component = "system", metadata = {}) {
  return sendNotification(message, { level: "warning", component, metadata });
}

/**
 * Send error notification
 * @param {string} message - Message
 * @param {string} component - System component
 * @param {Object} metadata - Additional metadata
 */
async function notifyError(message, component = "system", metadata = {}) {
  return sendNotification(message, { level: "error", component, metadata });
}

/**
 * Send critical notification
 * @param {string} message - Message
 * @param {string} component - System component
 * @param {Object} metadata - Additional metadata
 */
async function notifyCritical(message, component = "system", metadata = {}) {
  return sendNotification(message, { level: "critical", component, metadata });
}

/**
 * Send success notification
 * @param {string} message - Message
 * @param {string} component - System component
 * @param {Object} metadata - Additional metadata
 */
async function notifySuccess(message, component = "system", metadata = {}) {
  return sendNotification(message, { level: "success", component, metadata });
}

// Specific notification functions for common system events

/**
 * Notify database connection error
 * @param {Error} error - Database error
 * @param {Object} metadata - Additional metadata
 */
async function notifyDatabaseError(error, metadata = {}) {
  return notifyCritical(
    `Database connection failed: ${error.message}`,
    "database",
    {
      errorCode: error.code,
      sqlState: error.sqlState,
      errno: error.errno,
      ...metadata,
    }
  );
}

/**
 * Notify Redis connection error
 * @param {Error} error - Redis error
 * @param {Object} metadata - Additional metadata
 */
async function notifyRedisError(error, metadata = {}) {
  return notifyError(`Redis connection failed: ${error.message}`, "redis", {
    errorCode: error.code,
    ...metadata,
  });
}

/**
 * Notify RabbitMQ connection error
 * @param {Error} error - RabbitMQ error
 * @param {Object} metadata - Additional metadata
 */
async function notifyRabbitMQError(error, metadata = {}) {
  return notifyError(
    `RabbitMQ connection failed: ${error.message}`,
    "rabbitmq",
    {
      errorCode: error.code,
      ...metadata,
    }
  );
}

/**
 * Notify application startup
 * @param {Object} metadata - Additional metadata
 */
async function notifyAppStartup(metadata = {}) {
  return notifySuccess(`Application started successfully`, "application", {
    port: process.env.PORT || 1234,
    nodeEnv: process.env.NODE_ENV,
    ...metadata,
  });
}

/**
 * Notify application shutdown
 * @param {Object} metadata - Additional metadata
 */
async function notifyAppShutdown(metadata = {}) {
  return notifyWarning(`Application shutting down`, "application", {
    reason: metadata.reason || "manual",
    uptime: process.uptime(),
    ...metadata,
  });
}

/**
 * Check BeepBot configuration
 * @returns {Object} Configuration status
 */
function checkConfig() {
  return {
    enabled: BEEPBOT_CONFIG.enabled,
    hasSecret: !!BEEPBOT_CONFIG.secret,
    chatId: BEEPBOT_CONFIG.chatId,
    url: BEEPBOT_CONFIG.url,
    timeout: BEEPBOT_CONFIG.timeout,
  };
}

module.exports = {
  sendNotification,
  notifyInfo,
  notifyWarning,
  notifyError,
  notifyCritical,
  notifySuccess,
  notifyDatabaseError,
  notifyRedisError,
  notifyRabbitMQError,
  notifyAppStartup,
  notifyAppShutdown,
  checkConfig,
};
