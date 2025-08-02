// === Absolute / alias imports ===
const { getRedisStats } = require("@db/redis");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * API endpoint for cache health check
 * Returns cache system health status
 */
const getCacheHealthAPI = asyncHandler(async (_req, res) => {
  const redisStats = getRedisStats();
  const isHealthy = redisStats.connected && redisStats.enabled;

  res.status(isHealthy ? 200 : 503).json({
    success: true,
    healthy: isHealthy,
    redis: {
      connected: redisStats.connected,
      enabled: redisStats.enabled,
      host: redisStats.host,
      port: redisStats.port,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = { getCacheHealthAPI };
