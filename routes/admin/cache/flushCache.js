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
 * Flush all cache data
 */
const flushCacheController = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  const deletedCount = await flushCache(true); // Only flush prefixed keys

  // Log cache flush operation
  await logUserActivity({
    activity: `Cache flushed by admin - ${deletedCount >= 0 ? `${deletedCount} keys deleted` : "All keys cleared"}`,
    actionType: ACTION_TYPES.DELETE,
    resourceType: RESOURCE_TYPES.CACHE,
    resourceId: "cache_flush_all",
    status: ACTIVITY_STATUS.SUCCESS,
    userId: req.session.user.id,
    userInfo: {
      username: req.session.user.username,
      email: req.session.user.email,
      role: req.session.user.role,
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
      operation: "cache_flush",
      deletedKeys: deletedCount,
      flushType: "prefixed_keys_only",
      triggeredBy: req.session.user.username,
    },
    durationMs: Date.now() - startTime,
    req,
  });

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
