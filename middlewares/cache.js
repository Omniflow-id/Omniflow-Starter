/**
 * Caching Middleware
 * Express middleware for automatic response caching with Redis
 */

// === Absolute / alias imports ===
const { handleCache, invalidateCache } = require("@helpers/cache");

/**
 * Response caching middleware factory
 * @param {Object} options - Caching options
 * @param {string|Function} options.keyGenerator - Cache key or function to generate key
 * @param {number} [options.ttl=3600] - TTL in seconds
 * @param {Function} [options.condition] - Function to determine if response should be cached
 * @param {boolean} [options.skipOnError=true] - Skip caching if response has error status
 * @returns {Function} Express middleware
 */
function cacheMiddleware({
  keyGenerator,
  ttl = 3600,
  condition = null,
  skipOnError = true,
}) {
  return async (req, res, next) => {
    // Generate cache key
    let cacheKey;
    if (typeof keyGenerator === "function") {
      cacheKey = keyGenerator(req);
    } else if (typeof keyGenerator === "string") {
      cacheKey = keyGenerator;
    } else {
      // Default key generation based on route and query
      const baseKey = req.route?.path || req.path;
      const queryString =
        Object.keys(req.query).length > 0
          ? `:${JSON.stringify(req.query)}`
          : "";
      cacheKey = `route:${baseKey}${queryString}`;
    }

    // Check condition if provided
    if (condition && !condition(req)) {
      return next();
    }

    // Store original res.json and res.send methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Try to get cached response
    try {
      const cached = await handleCache({
        key: cacheKey,
        ttl,
        dbQueryFn: async () => {
          // This will be called if cache miss
          return null;
        },
      });

      if (cached.source === "redis" && cached.data) {
        console.log(
          `CacheMiddleware: Serving cached response for key: ${cacheKey}`
        );

        // Add cache headers
        res.set({
          "X-Cache": "HIT",
          "X-Cache-Key": cacheKey,
          "X-Cache-TTL": ttl.toString(),
        });

        return res.json(cached.data);
      }
    } catch (err) {
      console.error(
        `CacheMiddleware: Error checking cache for key ${cacheKey}: ${err.message}`
      );
    }

    // Cache miss - intercept response to cache it
    let responseData = null;
    let statusCode = 200;

    // Override res.json
    res.json = (data) => {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson(data);
    };

    // Override res.send
    res.send = (data) => {
      // Try to parse JSON if it's a string
      if (typeof data === "string") {
        try {
          responseData = JSON.parse(data);
        } catch {
          responseData = data;
        }
      } else {
        responseData = data;
      }
      statusCode = res.statusCode;
      return originalSend(data);
    };

    // Continue to next middleware/route handler
    res.on("finish", async () => {
      // Cache the response if conditions are met
      if (
        responseData !== null &&
        statusCode >= 200 &&
        statusCode < 300 &&
        (!skipOnError || statusCode < 400)
      ) {
        try {
          await handleCache({
            key: cacheKey,
            ttl,
            dbQueryFn: async () => responseData,
          });

          console.log(`CacheMiddleware: Cached response for key: ${cacheKey}`);
        } catch (err) {
          console.error(
            `CacheMiddleware: Error caching response for key ${cacheKey}: ${err.message}`
          );
        }
      }
    });

    next();
  };
}

/**
 * Cache invalidation middleware factory
 * Invalidates specific cache keys after route execution
 * @param {string|string[]|Function} keys - Keys to invalidate or function returning keys
 * @param {boolean} [isPattern=false] - Whether keys are patterns
 * @returns {Function} Express middleware
 */
function invalidateCacheMiddleware(keys, isPattern = false) {
  return async (req, res, next) => {
    // Execute route first
    res.on("finish", async () => {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          let keysToInvalidate;

          if (typeof keys === "function") {
            keysToInvalidate = keys(req, res);
          } else {
            keysToInvalidate = Array.isArray(keys) ? keys : [keys];
          }

          for (const key of keysToInvalidate) {
            await invalidateCache(key, isPattern);
          }

          console.log(
            `CacheInvalidation: Invalidated cache keys: ${keysToInvalidate.join(", ")}`
          );
        } catch (err) {
          console.error(
            `CacheInvalidation: Error invalidating cache: ${err.message}`
          );
        }
      }
    });

    next();
  };
}

/**
 * User-specific cache middleware
 * Generates cache keys that include user ID
 * @param {Object} options - Caching options
 * @param {string} [options.keyPrefix="user"] - Prefix for user cache keys
 * @param {number} [options.ttl=1800] - TTL in seconds (default 30 minutes)
 * @returns {Function} Express middleware
 */
function userCacheMiddleware({ keyPrefix = "user", ttl = 1800 } = {}) {
  return cacheMiddleware({
    keyGenerator: (req) => {
      const userId = req.session?.user?.id || req.user?.id || "anonymous";
      const routePath = req.route?.path || req.path;
      const queryString =
        Object.keys(req.query).length > 0
          ? `:${JSON.stringify(req.query)}`
          : "";
      return `${keyPrefix}:${userId}:${routePath}${queryString}`;
    },
    ttl,
    condition: (req) => {
      // Only cache for authenticated users
      return req.session?.user || req.user;
    },
  });
}

/**
 * Admin-specific cache middleware
 * For admin routes with shorter TTL
 * @param {Object} options - Caching options
 * @param {number} [options.ttl=600] - TTL in seconds (default 10 minutes)
 * @returns {Function} Express middleware
 */
function adminCacheMiddleware({ ttl = 600 } = {}) {
  return cacheMiddleware({
    keyGenerator: (req) => {
      const userId = req.session?.user?.id || "unknown";
      const routePath = req.route?.path || req.path;
      return `admin:${userId}:${routePath}`;
    },
    ttl,
    condition: (req) => {
      // Only cache for admin users
      return req.session?.user?.role === "Admin";
    },
  });
}

/**
 * API cache middleware
 * For API routes with specific headers
 * @param {Object} options - Caching options
 * @param {number} [options.ttl=3600] - TTL in seconds
 * @returns {Function} Express middleware
 */
function apiCacheMiddleware({ ttl = 3600 } = {}) {
  return (req, res, next) => {
    // Add API-specific cache headers
    res.set({
      "Cache-Control": `public, max-age=${ttl}`,
      "X-Cache": "MISS",
    });

    return cacheMiddleware({
      keyGenerator: (req) => {
        const routePath = req.route?.path || req.path;
        const method = req.method;
        const queryString =
          Object.keys(req.query).length > 0
            ? `:${JSON.stringify(req.query)}`
            : "";
        return `api:${method}:${routePath}${queryString}`;
      },
      ttl,
    })(req, res, next);
  };
}

module.exports = {
  cacheMiddleware,
  invalidateCacheMiddleware,
  userCacheMiddleware,
  adminCacheMiddleware,
  apiCacheMiddleware,
};
