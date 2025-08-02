/**
 * Redis Connection Management
 * Handles Redis client creation, connection management, and fallback strategies
 */

// === Third-party modules ===
const Redis = require("ioredis");

// === Absolute / alias imports ===
const config = require("@config");

let redis = null;
let isRedisConnected = false;
let isReconnecting = false;
let reconnectionTimer = null;

/**
 * Create Redis connection with comprehensive error handling
 * @returns {Redis|null} Redis instance or null if disabled/failed
 */
function createRedisConnection() {
  // Skip if Redis is disabled in configuration
  if (!config.redis.enabled) {
    console.log("Redis: Redis is disabled in configuration");
    return null;
  }

  // Prevent multiple concurrent connection attempts
  if (isReconnecting) {
    return redis;
  }

  isReconnecting = true;

  try {
    const redisConfig = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      username: config.redis.username,
      lazyConnect: config.redis.lazyConnect,
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
      enableReadyCheck: config.redis.enableReadyCheck,
      keepAlive: config.redis.keepAlive,
      retryStrategy: (times) => {
        if (times > config.redis.maxRetries) {
          console.error(
            `Redis: Max retries (${config.redis.maxRetries}) exceeded, giving up`
          );
          return null;
        }
        const delay = Math.min(
          2 ** times * config.redis.retryDelayOnFailover,
          10000
        );
        console.warn(`Redis: Retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
    };

    const newRedis = new Redis(redisConfig);

    // Connection success handler
    newRedis.on("connect", () => {
      console.log("Redis: Connected successfully");
      redis = newRedis;
      isRedisConnected = true;
      isReconnecting = false;

      // Clear any pending reconnection timer
      if (reconnectionTimer) {
        clearTimeout(reconnectionTimer);
        reconnectionTimer = null;
      }
    });

    // Ready handler (authenticated and ready to receive commands)
    newRedis.on("ready", () => {
      console.log("Redis: Ready to accept commands");
      isRedisConnected = true;
    });

    // Error handler
    newRedis.on("error", (err) => {
      console.error(`Redis: Connection error: ${err.message}`);
      redis = null;
      isRedisConnected = false;
      isReconnecting = false;
    });

    // Connection closed handler
    newRedis.on("close", () => {
      console.warn("Redis: Connection closed");
      redis = null;
      isRedisConnected = false;
      isReconnecting = false;

      // Schedule single reconnection attempt after delay
      if (!reconnectionTimer) {
        reconnectionTimer = setTimeout(() => {
          reconnectionTimer = null;
          if (!isRedisConnected && config.redis.enabled) {
            console.log("Redis: Attempting reconnection...");
            createRedisConnection();
          }
        }, 15000); // 15 seconds delay
      }
    });

    // End handler (connection terminated)
    newRedis.on("end", () => {
      console.warn("Redis: Connection ended");
      redis = null;
      isRedisConnected = false;
      isReconnecting = false;
    });

    // Attempt initial connection
    if (config.redis.lazyConnect) {
      newRedis.connect().catch((err) => {
        console.error(`Redis: Initial connection failed: ${err.message}`);
        isReconnecting = false;
      });
    }

    return newRedis;
  } catch (error) {
    console.error(`Redis: Failed to initialize: ${error.message}`);
    redis = null;
    isRedisConnected = false;
    isReconnecting = false;
    return null;
  }
}

/**
 * Get current Redis instance
 * @returns {Redis|null} Current Redis connection or null
 */
function getRedis() {
  return redis;
}

/**
 * Get Redis connection status
 * @returns {boolean} Connection status
 */
function isConnected() {
  return isRedisConnected;
}

/**
 * Close Redis connection gracefully
 * @returns {Promise<void>}
 */
async function closeRedis() {
  if (redis) {
    try {
      await redis.quit();
      console.log("Redis: Connection closed gracefully");
    } catch (err) {
      console.error(`Redis: Error closing connection: ${err.message}`);
    } finally {
      redis = null;
      isRedisConnected = false;
    }
  }

  // Clear reconnection timer
  if (reconnectionTimer) {
    clearTimeout(reconnectionTimer);
    reconnectionTimer = null;
  }
}

/**
 * Get Redis connection statistics
 * @returns {Object} Connection statistics
 */
function getRedisStats() {
  return {
    connected: isRedisConnected,
    reconnecting: isReconnecting,
    hasTimer: !!reconnectionTimer,
    enabled: config.redis.enabled,
    host: config.redis.host,
    port: config.redis.port,
    db: config.redis.db,
  };
}

// Initialize Redis connection if enabled
if (config.redis.enabled) {
  createRedisConnection();
} else {
  console.log("Redis: Redis caching is disabled");
}

module.exports = {
  getRedis,
  isConnected,
  closeRedis,
  getRedisStats,
  createRedisConnection,
};
