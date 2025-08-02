// === Absolute / alias imports ===
const { flushCache } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * API endpoint to flush all cache
 * Clears all cached data
 */
const flushCacheAPI = asyncHandler(async (_req, res) => {
  const deletedCount = await flushCache(true); // Only flush prefixed keys

  res.json({
    success: true,
    message: `Cache flushed successfully. ${
      deletedCount >= 0 ? `${deletedCount} keys deleted.` : "All keys cleared."
    }`,
    deleted_count: deletedCount,
    timestamp: new Date().toISOString(),
  });
});

module.exports = { flushCacheAPI };
