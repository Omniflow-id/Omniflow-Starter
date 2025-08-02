/**
 * Cache Management Routes
 * Administrative routes for cache management and monitoring
 */

// === Third-party modules ===
const express = require("express");

// === Absolute / alias imports ===
const { isAdmin } = require("@middlewares/isAdmin");
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");

// === Relative imports ===
const cache = require("./cache.controller");

const router = express.Router();

/**
 * Cache statistics page
 * GET /admin/cache/stats
 */
router.get("/stats", isAdmin, cache.getCacheStatsPage);

/**
 * Test cache endpoint - demonstrates cache usage
 * GET /admin/cache/test
 */
router.get("/test", isAdmin, cache.testCache);

/**
 * Flush all cache
 * POST /admin/cache/flush
 */
router.post("/flush", isAdmin, doubleCsrfProtection, cache.flushCache);

/**
 * Invalidate specific cache pattern
 * POST /admin/cache/invalidate
 */
router.post(
  "/invalidate",
  isAdmin,
  doubleCsrfProtection,
  cache.invalidateCache
);

/**
 * List cache keys
 * GET /admin/cache/keys
 */
router.get("/keys", isAdmin, cache.listCacheKeys);

module.exports = router;
