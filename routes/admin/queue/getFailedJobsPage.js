const { db } = require("@db/db");
const { handleCache } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

const getFailedJobsPage = asyncHandler(async (req, res) => {
  try {
    // Just get basic stats for page metadata - DataTable loads data via AJAX
    const result = await handleCache({
      key: "admin:queue:failed-jobs-metadata",
      ttl: 120, // 2 minutes cache
      dbQueryFn: async () => {
        const [countResult] = await db.query(
          "SELECT COUNT(*) as total FROM jobs WHERE status = 'failed'"
        );

        const total = countResult[0].total;
        return { total };
      },
    });

    res.render("pages/admin/queue/failed-jobs", {
      totalFailedJobs: result.data.total,
      user: req.session.user,
      cacheInfo: {
        source: result.source,
        duration_ms: result.duration_ms,
      },
    });
  } catch (error) {
    console.error("❌ [QUEUE] Error getting failed jobs page:", error.message);
    res.render("pages/admin/queue/failed-jobs", {
      totalFailedJobs: 0,
      user: req.session.user,
      error: "Failed to load failed jobs page",
      cacheInfo: {
        source: "error",
        duration_ms: 0,
      },
    });
  }
});

module.exports = getFailedJobsPage;
