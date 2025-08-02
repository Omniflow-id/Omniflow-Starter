// === Absolute / alias imports ===
const { getRedis } = require("@db/redis");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * API endpoint to import cache data
 * Imports cache data from JSON format
 */
const importCacheAPI = asyncHandler(async (req, res) => {
  const redis = getRedis();

  if (!redis) {
    return res.status(503).json({
      success: false,
      error: "Redis not available",
      message: "Cache import requires Redis connection",
    });
  }

  try {
    const { data, overwrite = false } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: "Invalid data format",
        message:
          "Expected an array of cache entries with key, value, and optional ttl",
      });
    }

    const pipeline = redis.pipeline();
    let importedCount = 0;
    let skippedCount = 0;

    for (const entry of data) {
      const { key, value, ttl } = entry;

      if (!key || value === undefined) {
        continue; // Skip invalid entries
      }

      // Check if key exists (unless overwrite is true)
      if (!overwrite) {
        const exists = await redis.exists(key);
        if (exists) {
          skippedCount++;
          continue;
        }
      }

      // Set the value
      const serializedValue = JSON.stringify(value);

      if (ttl && ttl > 0) {
        pipeline.setex(key, ttl, serializedValue);
      } else {
        pipeline.set(key, serializedValue);
      }

      importedCount++;
    }

    // Execute all commands
    await pipeline.exec();

    res.json({
      success: true,
      message: `Cache import completed. ${importedCount} entries imported, ${skippedCount} skipped`,
      imported_count: importedCount,
      skipped_count: skippedCount,
      total_entries: data.length,
      overwrite_mode: overwrite,
      imported_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Import failed",
      message: error.message,
    });
  }
});

module.exports = { importCacheAPI };
