const {
  getConnectionStatus,
  getStats,
  getRecentFailedJobs,
} = require("@helpers/queue");
const { handleCache } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

const getQueueStatsPage = asyncHandler(async (req, res) => {
  const result = await handleCache({
    key: "admin:queue:stats",
    ttl: 120, // 2 minutes cache
    dbQueryFn: async () => {
      const stats = await getStats();
      const recentFailedJobs = await getRecentFailedJobs(5);

      return {
        stats,
        recentFailedJobs,
      };
    },
  });

  const connectionStatus = getConnectionStatus();

  res.render("pages/admin/queue/stats", {
    ...result.data,
    connectionStatus,
    user: req.session.user,
    cacheInfo: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});

module.exports = getQueueStatsPage;
