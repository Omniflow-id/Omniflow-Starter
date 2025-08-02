/**
 * Cache Helper Utilities
 * Provides high-level caching functions with Redis fallback to database
 */

// === Absolute / alias imports ===
const config = require("@config");
const { getRedis, isConnected } = require("@db/redis");

/**
 * Generic cache handler with Redis fallback
 * @param {Object} options - Cache options
 * @param {string} options.key - Cache key
 * @param {number} [options.ttl] - TTL in seconds (defaults to config default)
 * @param {Function} options.dbQueryFn - Function to execute if cache miss
 * @param {Redis} [options.redis] - Redis instance (optional, uses global if not provided)
 * @param {boolean} [options.skipCache] - Skip cache and go directly to DB
 * @returns {Promise<Object>} Result with data, source, and metadata
 */
async function handleCache({
  key,
  ttl = config.redis.defaultTTL,
  dbQueryFn,
  redis = null,
  skipCache = false,
}) {
  const start = Date.now();
  const fullKey = `${config.redis.keyPrefix}${key}`;

  // Use provided Redis instance or get global one
  const redisClient = redis || getRedis();
  let cacheAvailable = isConnected() && redisClient && !skipCache;
  let dataFromRedis = null;

  // Cache lookup - no need to log for performance reasons in production

  // Try to get data from Redis first
  if (cacheAvailable) {
    try {
      const cached = await redisClient.get(fullKey);
      if (cached) {
        dataFromRedis = JSON.parse(cached);
        // Cache HIT - consider logging only in debug mode if needed
      } else {
        // Cache MISS - consider logging only in debug mode if needed
      }
    } catch (err) {
      console.error(`Redis GET error for key ${fullKey}: ${err.message}`);
      cacheAvailable = false;
    }
  } else {
    const reason = !config.redis.enabled
      ? "Redis disabled"
      : !isConnected()
        ? "Redis not connected"
        : skipCache
          ? "Cache skipped"
          : "Redis unavailable";

    console.log(`Cache: Using DB fallback for key ${fullKey}: ${reason}`);
  }

  // Return cached data if available
  if (dataFromRedis) {
    return {
      source: "redis",
      data: dataFromRedis,
      duration_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
      key: fullKey,
      ttl: ttl,
    };
  }

  // Cache miss or unavailable - fetch from database
  const data = await dbQueryFn();

  // Store in cache if available
  if (cacheAvailable && data !== null && data !== undefined) {
    try {
      await redisClient.set(fullKey, JSON.stringify(data), "EX", ttl);
      console.log(`Cache: Data cached for key: ${fullKey}, TTL: ${ttl}s`);
    } catch (err) {
      console.error(
        `Cache: Redis SET error for key ${fullKey}: ${err.message}`
      );
    }
  }

  return {
    source: "database",
    data,
    duration_ms: Date.now() - start,
    timestamp: new Date().toISOString(),
    key: fullKey,
    ttl: ttl,
    cached: cacheAvailable,
  };
}

/**
 * Invalidate cache for specific key or pattern
 * @param {string} keyOrPattern - Cache key or pattern (supports Redis patterns)
 * @param {boolean} [isPattern=false] - Whether the key is a pattern
 * @returns {Promise<number>} Number of keys deleted
 */
async function invalidateCache(keyOrPattern, isPattern = false) {
  const redisClient = getRedis();

  if (!isConnected() || !redisClient) {
    console.warn("Cache: Cannot invalidate cache - Redis not available");
    return 0;
  }

  try {
    const fullKey = keyOrPattern.startsWith(config.redis.keyPrefix)
      ? keyOrPattern
      : `${config.redis.keyPrefix}${keyOrPattern}`;

    let deletedCount = 0;

    if (isPattern) {
      // Use SCAN for pattern-based deletion (safer than KEYS)
      const stream = redisClient.scanStream({
        match: fullKey,
        count: 100,
      });

      const keysToDelete = [];
      stream.on("data", (keys) => {
        keysToDelete.push(...keys);
      });

      await new Promise((resolve, reject) => {
        stream.on("end", resolve);
        stream.on("error", reject);
      });

      if (keysToDelete.length > 0) {
        deletedCount = await redisClient.del(...keysToDelete);
        console.log(
          `Cache: Invalidated ${deletedCount} keys matching pattern: ${fullKey}`
        );
      }
    } else {
      // Single key deletion
      deletedCount = await redisClient.del(fullKey);
      if (deletedCount > 0) {
        console.log(`Cache: Invalidated cache key: ${fullKey}`);
      }
    }

    return deletedCount;
  } catch (err) {
    console.error(
      `Cache: Error invalidating cache ${keyOrPattern}: ${err.message}`
    );
    return 0;
  }
}

/**
 * Set cache data directly
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} [ttl] - TTL in seconds
 * @returns {Promise<boolean>} Success status
 */
async function setCache(key, data, ttl = config.redis.defaultTTL) {
  const redisClient = getRedis();

  if (!isConnected() || !redisClient) {
    console.warn("Cache: Cannot set cache - Redis not available");
    return false;
  }

  try {
    const fullKey = `${config.redis.keyPrefix}${key}`;
    await redisClient.set(fullKey, JSON.stringify(data), "EX", ttl);
    console.log(`Cache: Set cache key: ${fullKey}, TTL: ${ttl}s`);
    return true;
  } catch (err) {
    console.error(`Cache: Error setting cache ${key}: ${err.message}`);
    return false;
  }
}

/**
 * Get cache data directly
 * @param {string} key - Cache key
 * @returns {Promise<*|null>} Cached data or null
 */
async function getCache(key) {
  const redisClient = getRedis();

  if (!isConnected() || !redisClient) {
    return null;
  }

  try {
    const fullKey = `${config.redis.keyPrefix}${key}`;
    const cached = await redisClient.get(fullKey);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error(`Cache: Error getting cache ${key}: ${err.message}`);
    return null;
  }
}

/**
 * Flush all cache data
 * @param {boolean} [onlyPrefixed=true] - Only flush keys with our prefix
 * @returns {Promise<number>} Number of keys deleted
 */
async function flushCache(onlyPrefixed = true) {
  const redisClient = getRedis();

  if (!isConnected() || !redisClient) {
    console.warn("Cache: Cannot flush cache - Redis not available");
    return 0;
  }

  try {
    let deletedCount = 0;

    if (onlyPrefixed) {
      // Only delete keys with our prefix
      deletedCount = await invalidateCache(`${config.redis.keyPrefix}*`, true);
      console.log(`Cache: Flushed ${deletedCount} prefixed cache keys`);
    } else {
      // Flush entire Redis database (use with caution!)
      await redisClient.flushdb();
      deletedCount = -1; // Unknown count
      console.warn("Cache: Flushed entire Redis database");
    }

    return deletedCount;
  } catch (err) {
    console.error(`Cache: Error flushing cache: ${err.message}`);
    return 0;
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
async function getCacheStats() {
  const redisClient = getRedis();

  if (!isConnected() || !redisClient) {
    return {
      connected: false,
      error: "Redis not available",
    };
  }

  try {
    const info = await redisClient.info("memory");
    const dbsize = await redisClient.dbsize();

    return {
      connected: true,
      database_keys: dbsize,
      memory_info: info,
      prefix: config.redis.keyPrefix,
      default_ttl: config.redis.defaultTTL,
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
    };
  }
}

/**
 * List cache keys with optional pattern filtering
 * @param {string} [pattern="*"] - Pattern to match keys (supports Redis patterns)
 * @param {number} [limit=50] - Maximum number of keys to return
 * @returns {Promise<Object>} Object with keys array and metadata
 */
async function listKeys(pattern = "*", limit = 50) {
  const redisClient = getRedis();

  if (!isConnected() || !redisClient) {
    return {
      connected: false,
      keys: [],
      total: 0,
      error: "Redis not available",
    };
  }

  try {
    // Ensure pattern includes our prefix
    const fullPattern = pattern.startsWith(config.redis.keyPrefix)
      ? pattern
      : `${config.redis.keyPrefix}${pattern}`;

    const keys = [];
    const stream = redisClient.scanStream({
      match: fullPattern,
      count: Math.min(limit * 2, 1000), // Scan more than limit to account for filtering
    });

    let scannedCount = 0;
    const maxScan = limit * 10; // Safety limit to prevent infinite scanning

    stream.on("data", (batch) => {
      for (const key of batch) {
        if (keys.length >= limit) {
          stream.destroy(); // Stop scanning when limit reached
          break;
        }
        keys.push(key);
      }
      scannedCount += batch.length;

      if (scannedCount >= maxScan) {
        stream.destroy(); // Safety break
      }
    });

    await new Promise((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
      stream.on("close", resolve); // Handle stream.destroy()
    });

    // Get TTL for each key (sample first 10 for performance)
    const keysWithTTL = [];
    const sampleKeys = keys.slice(0, Math.min(10, keys.length));

    for (const key of keys) {
      const shouldGetTTL = sampleKeys.includes(key);
      let ttl = null;

      if (shouldGetTTL) {
        try {
          ttl = await redisClient.ttl(key);
        } catch (_err) {
          // Ignore TTL errors for individual keys
        }
      }

      keysWithTTL.push({
        key: key,
        short_key: key.replace(config.redis.keyPrefix, ""), // Remove prefix for display
        ttl: shouldGetTTL ? ttl : null,
        has_ttl_info: shouldGetTTL,
      });
    }

    // Get total count with dbsize (approximate)
    const totalKeys = await redisClient.dbsize();

    return {
      connected: true,
      keys: keysWithTTL,
      total: totalKeys,
      pattern: fullPattern,
      limit: limit,
      prefix: config.redis.keyPrefix,
    };
  } catch (err) {
    console.error(`Cache: Error listing keys: ${err.message}`);
    return {
      connected: false,
      keys: [],
      total: 0,
      error: err.message,
    };
  }
}

module.exports = {
  handleCache,
  invalidateCache,
  setCache,
  getCache,
  flushCache,
  getCacheStats,
  listKeys,
};
