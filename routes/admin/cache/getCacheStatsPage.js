// === Absolute / alias imports ===
const { getCacheStats } = require("@helpers/cache");
const { getRedisStats } = require("@db/redis");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * Cache Statistics Page
 * Shows cache status, Redis connection info, and management tools
 */
const getCacheStatsPage = asyncHandler(async (_req, res) => {
  const [cacheStats, redisStats] = await Promise.all([
    getCacheStats(),
    Promise.resolve(getRedisStats()),
  ]);

  res.render("pages/admin/cache/stats", {
    cacheStats,
    redisStats,
    pageTitle: "Cache Statistics",
  });
});

module.exports = { getCacheStatsPage };
