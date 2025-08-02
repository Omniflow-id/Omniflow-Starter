// === Absolute / alias imports ===
const { invalidateCache } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * API endpoint to invalidate cache by pattern
 * Removes cache entries matching specified pattern
 */
const invalidateCacheAPI = asyncHandler(async (req, res) => {
  const { pattern } = req.body;

  if (!pattern) {
    return res.status(400).json({
      success: false,
      error: "Pattern is required",
      message: "Please provide a cache pattern to invalidate",
    });
  }

  const deletedCount = await invalidateCache(pattern, true);

  res.json({
    success: true,
    message: `Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`,
    deleted_count: deletedCount,
    pattern,
    timestamp: new Date().toISOString(),
  });
});

module.exports = { invalidateCacheAPI };
