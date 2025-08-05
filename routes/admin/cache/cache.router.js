/**
 * Cache Management Routes
 * Administrative routes for cache management and monitoring
 */

// === Third-party modules ===
const express = require("express");

// === Absolute / alias imports ===
const { checkPermission } = require("@middlewares/checkPermission");
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");

// === Relative imports ===
const cache = require("./cache.controller");

const router = express.Router();

/**
 * Cache statistics page
 * GET /admin/cache/stats
 */
router.get("/stats", checkPermission("manage_cache"), cache.getCacheStatsPage);

/**
 * Test cache endpoint - demonstrates cache usage
 * GET /admin/cache/test
 */
router.get("/test", checkPermission("manage_cache"), cache.testCache);

/**
 * Flush all cache
 * POST /admin/cache/flush
 */
router.post(
  "/flush",
  checkPermission("manage_cache"),
  doubleCsrfProtection,
  cache.flushCache
);

/**
 * Invalidate specific cache pattern
 * POST /admin/cache/invalidate
 */
router.post(
  "/invalidate",
  checkPermission("manage_cache"),
  doubleCsrfProtection,
  cache.invalidateCache
);

/**
 * List cache keys
 * GET /admin/cache/keys
 */
router.get("/keys", checkPermission("manage_cache"), cache.listCacheKeys);

module.exports = router;
