// === Absolute / alias imports ===
const { getCacheStats } = require("@helpers/cache");
const { getRedisStats } = require("@db/redis");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * Cache Statistics Page
 * Shows cache status, Redis connection info, and management tools
 */
const getCacheStatsPage = asyncHandler(async (_req, res) => {
  const [cacheStats, redisStats] = await Promise.all([
    getCacheStats(),
    Promise.resolve(getRedisStats()),
  ]);

  // The locale data is already available via res.locals.locale from withLocale middleware
  const locale = res.locals.locale || {};

  res.render("pages/admin/cache/stats", {
    cacheStats,
    redisStats,
    // Use locale values with fallbacks
    pageTitle: locale.pageTitle || "Cache Statistics",
    title: locale.pageTitle || "Cache Statistics",
    nav: {
      dashboard:
        locale.breadcrumb?.dashboard || locale.nav?.dashboard || "Dashboard",
    },
    stats: {
      connected: locale.stats?.connected || "Redis Connection Status",
      disconnected: locale.stats?.disconnected || "Disconnected",
      enabled: locale.stats?.enabled || "Enabled & Running",
      title: locale.stats?.title || "Cache Statistics",
      totalKeys: locale.stats?.totalKeys || "Total Keys",
      connectedLabel: locale.stats?.connectedLabel || "Connected",
    },
    labels: {
      host: locale.labels?.host || "Host",
      database: locale.labels?.database || "Database",
      status: locale.labels?.status || "Status",
      defaultTTL: locale.labels?.defaultTTL || "Default TTL",
      keyPrefix: locale.labels?.keyPrefix || "Key Prefix",
      patternPlaceholder:
        locale.labels?.patternPlaceholder || "admin:users:*, user:*, logs:*",
      wildcardInfo:
        locale.labels?.wildcardInfo ||
        "Use * for wildcard matching (e.g., admin:* matches all admin keys)",
      performanceTesting:
        locale.labels?.performanceTesting || "Performance Testing",
      testDescription:
        locale.labels?.testDescription || "Tests cache read/write performance",
      cacheKeys: locale.labels?.cacheKeys || "Cache Keys",
      patternExample: locale.labels?.patternExample || "Pattern (e.g., user:*)",
      realtimeStats: locale.labels?.realtimeStats || "Real-time Statistics",
      flushDescription:
        locale.labels?.flushDescription || "Removes all cached data",
    },
    actions: {
      flush: locale.actions?.flush || "Flush All Cache",
      invalidate: locale.actions?.invalidate || "Pattern Invalidation",
    },
    buttons: {
      flush: locale.buttons?.flush || "Flush",
      invalidate: locale.buttons?.invalidate || "Invalidate",
      benchmark: locale.buttons?.benchmark || "Run Benchmark",
      refresh: locale.buttons?.refresh || "Refresh",
      cancel: locale.buttons?.cancel || "Cancel",
      confirm: locale.buttons?.confirm || "Confirm",
    },
    test: {
      title: locale.test?.title || "Cache Performance Test",
      benchmark: locale.test?.benchmark || "Run Benchmark",
      result: locale.test?.result || "Test Results",
    },
    messages: {
      redisUnavailable:
        locale.messages?.redisUnavailable ||
        "Redis is not available. Using database fallback.",
      cacheStatsUnavailable:
        locale.messages?.cacheStatsUnavailable ||
        "Cache statistics unavailable",
      keysWillAppear:
        locale.messages?.keysWillAppear || "Cache keys will appear here",
      clickRefresh:
        locale.messages?.clickRefresh ||
        "Click refresh to load existing cache keys",
      realtimeReady:
        locale.messages?.realtimeReady || "Real-time statistics ready",
      clickRefreshStats:
        locale.messages?.clickRefreshStats ||
        "Click refresh button to load current cache statistics",
    },
    modals: {
      confirmAction: locale.modals?.confirmAction || "Confirm Action",
      confirmMessage:
        locale.modals?.confirmMessage || "Are you sure you want to proceed?",
    },
  });
});

module.exports = { getCacheStatsPage };
