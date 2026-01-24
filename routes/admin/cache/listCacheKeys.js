// === Absolute / alias imports ===
const { listKeys } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * List cache keys with optional pattern filtering
 */
const listCacheKeys = asyncHandler(async (req, res) => {
  const { pattern = "*", limit = 50 } = req.query;

  // Validate limit (max 100 for performance)
  const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);

  const result = await listKeys(pattern, parsedLimit);

  if (req.xhr || req.headers.accept?.includes("application/json")) {
    res.json({
      success: result.connected,
      data: result,
    });
  } else {
    // For web requests, redirect back to stats with keys data
    req.flash(
      result.connected ? "success_msg" : "error_msg",
      result.connected
        ? `Found ${result.keys.length} keys matching pattern: ${pattern}`
        : `Failed to list keys: ${result.error}`
    );
    res.redirect("/admin/cache/stats");
  }
});

module.exports = { listCacheKeys };
