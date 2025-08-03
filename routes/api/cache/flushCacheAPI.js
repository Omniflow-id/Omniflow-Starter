// === Absolute / alias imports ===
const { flushCache } = require("@helpers/cache");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
  ACTIVITY_STATUS,
} = require("@helpers/log");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * API endpoint to flush all cache
 * Clears all cached data
 */
const flushCacheAPI = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  const deletedCount = await flushCache(true); // Only flush prefixed keys

  // Log API cache flush operation
  await logUserActivity({
    activity: `Cache flushed via API - ${deletedCount >= 0 ? `${deletedCount} keys deleted` : "All keys cleared"}`,
    actionType: ACTION_TYPES.DELETE,
    resourceType: RESOURCE_TYPES.CACHE,
    resourceId: "cache_flush_api",
    status: ACTIVITY_STATUS.SUCCESS,
    userId: req.user?.id || null,
    userInfo: {
      username: req.user?.username || null,
      email: req.user?.email || null,
      role: req.user?.role || null,
    },
    requestInfo: {
      ip: clientIP,
      userAgent: userAgent.userAgent,
      deviceType: userAgent.deviceType,
      browser: userAgent.browser,
      platform: userAgent.platform,
      method: req.method,
      url: req.originalUrl,
    },
    metadata: {
      operation: "cache_flush_api",
      deletedKeys: deletedCount,
      flushType: "prefixed_keys_only",
      apiEndpoint: "/api/cache/flush",
      accessMethod: "jwt_authenticated",
    },
    durationMs: Date.now() - startTime,
    req,
  });

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
