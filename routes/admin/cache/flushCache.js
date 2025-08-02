// === Absolute / alias imports ===
const { flushCache } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * Flush all cache data
 */
const flushCacheController = asyncHandler(async (req, res) => {
  const deletedCount = await flushCache(true); // Only flush prefixed keys

  if (req.xhr || req.headers.accept?.includes("application/json")) {
    res.json({
      success: true,
      message: `Cache flushed successfully. ${deletedCount >= 0 ? `${deletedCount} keys deleted.` : "All keys cleared."}`,
      deleted_count: deletedCount,
    });
  } else {
    req.flash(
      "success_msg",
      `Cache flushed successfully. ${deletedCount >= 0 ? `${deletedCount} keys deleted.` : "All keys cleared."}`
    );
    res.redirect("/admin/cache/stats");
  }
});

module.exports = { flushCache: flushCacheController };
