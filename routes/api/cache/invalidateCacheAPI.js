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
      error: res.locals.t("common.errors.cachePatternRequired"),
      message: res.locals.t("common.errors.cachePatternPromptRequired"),
    });
  }

  const deletedCount = await invalidateCache(pattern, true);

  res.json({
    success: true,
    message: res.locals.t("common.messages.cacheInvalidated"),
    deleted_count: deletedCount,
    pattern,
    timestamp: new Date().toISOString(),
  });
});

module.exports = { invalidateCacheAPI };
