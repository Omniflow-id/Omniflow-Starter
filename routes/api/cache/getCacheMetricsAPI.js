// === Absolute / alias imports ===
const { getCacheStats } = require("@helpers/cache");
const { getRedisStats } = require("@db/redis");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * API endpoint to get cache metrics
 * Returns performance and usage metrics
 */
const getCacheMetricsAPI = asyncHandler(async (_req, res) => {
  const redisStats = getRedisStats();
  const cacheStats = await getCacheStats();

  // Calculate basic metrics
  const metrics = {
    uptime: redisStats.connected ? "online" : "offline",
    total_keys: cacheStats.database_keys || 0,
    default_ttl: cacheStats.default_ttl || 3600,
    connection_status: redisStats.connected ? "healthy" : "disconnected",
    cache_hit_ratio: "N/A", // Would need Redis INFO command for actual metrics
    memory_usage: "N/A", // Would need Redis INFO command for actual metrics
  };

  res.json({
    success: true,
    metrics,
    timestamp: new Date().toISOString(),
  });
});

module.exports = { getCacheMetricsAPI };
