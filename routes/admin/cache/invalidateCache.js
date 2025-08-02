// === Absolute / alias imports ===
const { invalidateCache } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * Invalidate cache by pattern
 */
const invalidateCacheController = asyncHandler(async (req, res) => {
  const { pattern } = req.body;

  if (!pattern) {
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(400).json({
        success: false,
        error: "Pattern is required",
      });
    } else {
      req.flash("error_msg", "Cache pattern is required");
      return res.redirect("/admin/cache/stats");
    }
  }

  // Determine if this is a pattern (contains * or ?) or exact key
  const isPattern = pattern.includes("*") || pattern.includes("?");
  const deletedCount = await invalidateCache(pattern, isPattern);

  if (req.xhr || req.headers.accept?.includes("application/json")) {
    res.json({
      success: true,
      message: `Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`,
      deleted_count: deletedCount,
      pattern,
    });
  } else {
    req.flash(
      "success_msg",
      `Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`
    );
    res.redirect("/admin/cache/stats");
  }
});

module.exports = { invalidateCache: invalidateCacheController };
