// === Absolute / alias imports ===
const { getCacheStats } = require("@helpers/cache");
const { getRedisStats } = require("@db/redis");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * API endpoint to get cache statistics
 * Returns detailed cache and Redis connection information
 */
const getCacheStatsAPI = asyncHandler(async (_req, res) => {
  const [cacheStats, redisStats] = await Promise.all([
    getCacheStats(),
    Promise.resolve(getRedisStats()),
  ]);

  res.json({
    success: true,
    data: {
      cache: cacheStats,
      redis: redisStats,
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = { getCacheStatsAPI };
