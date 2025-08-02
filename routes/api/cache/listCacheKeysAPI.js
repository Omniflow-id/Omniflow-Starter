// === Absolute / alias imports ===
const { listKeys } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * API endpoint for listing cache keys
 */
const listCacheKeysAPI = asyncHandler(async (req, res) => {
  const { pattern = "*", limit = 50 } = req.query;

  // Validate limit (max 500 for API, higher than admin interface)
  const parsedLimit = Math.min(parseInt(limit) || 50, 500);

  const result = await listKeys(pattern, parsedLimit);

  res.json({
    success: result.connected,
    data: result,
    message: result.connected
      ? `Found ${result.keys.length} keys matching pattern: ${pattern}`
      : `Failed to list keys: ${result.error || "Redis not available"}`,
  });
});

module.exports = { listCacheKeysAPI };
