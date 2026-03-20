// === Absolute / alias imports ===
const { invalidateCache } = require("@helpers/cache");
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
 * Invalidate cache by pattern
 */
const invalidateCacheController = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);
  const { pattern } = req.body;

  if (!pattern) {
    // Log failed invalidation attempt
    await logUserActivity({
      activity: "Failed cache invalidation - missing pattern",
      actionType: ACTION_TYPES.DELETE,
      resourceType: RESOURCE_TYPES.CACHE,
      resourceId: "cache_invalidate",
      status: ACTIVITY_STATUS.FAILURE,
      userId: req.session.user.id,
      userInfo: {
        username: req.session.user.username,
        email: req.session.user.email,
        role_id: req.session.user.role_id,
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
      errorMessage: res.locals.t("common.errors.cachePatternRequired"),
      errorCode: "MISSING_CACHE_PATTERN",
      metadata: {
        operation: "cache_invalidate",
        triggeredBy: req.session.user.username,
      },
      durationMs: Date.now() - startTime,
      req,
    });

    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(400).json({
        success: false,
        error: res.locals.t("common.errors.cachePatternRequired"),
      });
    } else {
      req.flash("error_msg", "common.errors.cachePatternRequired");
      return res.redirect("/admin/cache/stats");
    }
  }

  // Determine if this is a pattern (contains * or ?) or exact key
  const isPattern = pattern.includes("*") || pattern.includes("?");
  const deletedCount = await invalidateCache(pattern, isPattern);

  // Log successful cache invalidation
  await logUserActivity({
    activity: `Cache invalidated by pattern: ${pattern} - ${deletedCount} entries deleted`,
    actionType: ACTION_TYPES.DELETE,
    resourceType: RESOURCE_TYPES.CACHE,
    resourceId: pattern,
    status: ACTIVITY_STATUS.SUCCESS,
    userId: req.session.user.id,
    userInfo: {
      username: req.session.user.username,
      email: req.session.user.email,
      role_id: req.session.user.role_id,
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
      operation: "cache_invalidate",
      pattern: pattern,
      isPattern: isPattern,
      deletedCount: deletedCount,
      triggeredBy: req.session.user.username,
    },
    durationMs: Date.now() - startTime,
    req,
  });

  if (req.xhr || req.headers.accept?.includes("application/json")) {
    res.json({
      success: true,
      message: res.locals.t("common.messages.cacheInvalidated"),
      deleted_count: deletedCount,
      pattern,
    });
  } else {
    req.flash("success_msg", "common.messages.cacheInvalidated");
    res.redirect("/admin/cache/stats");
  }
});

module.exports = { invalidateCache: invalidateCacheController };
