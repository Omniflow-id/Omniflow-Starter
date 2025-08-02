/**
 * Cache API Routes
 * RESTful API endpoints for cache management and monitoring
 */

// === Third-party modules ===
const express = require("express");

// === Absolute / alias imports ===
const { verifyJWT } = require("@middlewares/jwtAuth");
const { adminLimiter } = require("@middlewares/rateLimiter");

// === Relative imports ===
const cacheAPI = require("./cache.api.controller");

const router = express.Router();

/**
 * Get cache statistics
 * GET /api/cache/stats
 */
router.get("/stats", verifyJWT, adminLimiter, cacheAPI.getCacheStatsAPI);

/**
 * Test cache performance
 * GET /api/cache/test
 */
router.get("/test", verifyJWT, adminLimiter, cacheAPI.testCacheAPI);

/**
 * Get cache health status
 * GET /api/cache/health
 */
router.get("/health", verifyJWT, adminLimiter, cacheAPI.getCacheHealthAPI);

/**
 * Get cache metrics
 * GET /api/cache/metrics
 */
router.get("/metrics", verifyJWT, adminLimiter, cacheAPI.getCacheMetricsAPI);

/**
 * Export cache data
 * GET /api/cache/export
 */
router.get("/export", verifyJWT, adminLimiter, cacheAPI.exportCacheAPI);

/**
 * Import cache data
 * POST /api/cache/import
 */
router.post("/import", verifyJWT, adminLimiter, cacheAPI.importCacheAPI);

/**
 * Flush all cache
 * POST /api/cache/flush
 */
router.post("/flush", verifyJWT, adminLimiter, cacheAPI.flushCacheAPI);

/**
 * Invalidate cache by pattern
 * POST /api/cache/invalidate
 */
router.post(
  "/invalidate",
  verifyJWT,
  adminLimiter,
  cacheAPI.invalidateCacheAPI
);

/**
 * List cache keys
 * GET /api/cache/keys
 */
router.get("/keys", verifyJWT, adminLimiter, cacheAPI.listCacheKeysAPI);

module.exports = router;
