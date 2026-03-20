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
    pageTitle: locale.pageTitle,
    title: locale.pageTitle,
    nav: {
      dashboard: locale.breadcrumb?.dashboard || locale.nav?.dashboard,
    },
    stats: {
      connected: locale.stats?.connected,
      disconnected: locale.stats?.disconnected,
      enabled: locale.stats?.enabled,
      title: locale.stats?.title,
      totalKeys: locale.stats?.totalKeys,
      connectedLabel: locale.stats?.connectedLabel,
    },
    labels: {
      host: locale.labels?.host,
      database: locale.labels?.database,
      status: locale.labels?.status,
      defaultTTL: locale.labels?.defaultTTL,
      keyPrefix: locale.labels?.keyPrefix,
      patternPlaceholder: locale.labels?.patternPlaceholder,
      wildcardInfo: locale.labels?.wildcardInfo,
      performanceTesting: locale.labels?.performanceTesting,
      testDescription: locale.labels?.testDescription,
      cacheKeys: locale.labels?.cacheKeys,
      patternExample: locale.labels?.patternExample,
      realtimeStats: locale.labels?.realtimeStats,
      flushDescription: locale.labels?.flushDescription,
    },
    actions: {
      flush: locale.actions?.flush,
      invalidate: locale.actions?.invalidate,
    },
    buttons: {
      flush: locale.buttons?.flush,
      invalidate: locale.buttons?.invalidate,
      benchmark: locale.buttons?.benchmark,
      refresh: locale.buttons?.refresh,
      cancel: locale.buttons?.cancel,
      confirm: locale.buttons?.confirm,
    },
    test: {
      title: locale.test?.title,
      benchmark: locale.test?.benchmark,
      result: locale.test?.result,
    },
    messages: {
      redisUnavailable: locale.messages?.redisUnavailable,
      cacheStatsUnavailable: locale.messages?.cacheStatsUnavailable,
      keysWillAppear: locale.messages?.keysWillAppear,
      clickRefresh: locale.messages?.clickRefresh,
      realtimeReady: locale.messages?.realtimeReady,
      clickRefreshStats: locale.messages?.clickRefreshStats,
    },
    modals: {
      confirmAction: locale.modals?.confirmAction,
      confirmMessage: locale.modals?.confirmMessage,
    },
  });
});

module.exports = { getCacheStatsPage };
