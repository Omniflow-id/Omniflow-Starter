// === Absolute / alias imports ===
const { getRedis } = require("@db/redis");
const { asyncHandler } = require("@middlewares/errorHandler");
const config = require("@config");

/**
 * API endpoint to export cache data
 * Exports cache keys and values to JSON format
 */
const exportCacheAPI = asyncHandler(async (req, res) => {
  const redis = getRedis();

  if (!redis) {
    return res.status(503).json({
      success: false,
      error: "Redis not available",
      message: "Cache export requires Redis connection",
    });
  }

  try {
    // const { pattern = `${config.redis.keyPrefix}*`, format = "json" } =
    const { pattern = `${config.redis.keyPrefix}*` } = req.query;

    // Get all keys matching pattern
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return res.json({
        success: true,
        message: "No cache keys found matching pattern",
        pattern,
        data: [],
        count: 0,
      });
    }

    // Get all values for the keys
    const pipeline = redis.pipeline();
    keys.forEach((key) => {
      pipeline.get(key);
      pipeline.ttl(key);
    });

    const results = await pipeline.exec();

    // Process results into export format
    const exportData = [];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = results[i * 2][1]; // Get result, skip error
      const ttl = results[i * 2 + 1][1]; // Get TTL result

      exportData.push({
        key,
        value: value ? JSON.parse(value) : null,
        ttl: ttl > 0 ? ttl : null,
        exported_at: new Date().toISOString(),
      });
    }

    // Set appropriate headers for download
    const filename = `cache_export_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    res.json({
      success: true,
      message: `Exported ${keys.length} cache entries`,
      pattern,
      count: keys.length,
      exported_at: new Date().toISOString(),
      data: exportData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Export failed",
      message: error.message,
    });
  }
});

module.exports = { exportCacheAPI };
