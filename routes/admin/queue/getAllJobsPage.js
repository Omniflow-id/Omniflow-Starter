const { db } = require("@db/db");
const { handleCache } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

const getAllJobsPage = asyncHandler(async (req, res) => {
  const status = req.query.status || "all";

  try {
    // Just get basic stats for page metadata - DataTable loads data via AJAX
    const result = await handleCache({
      key: `admin:queue:jobs-metadata:${status}`,
      ttl: 120, // 2 minutes cache
      dbQueryFn: async () => {
        let whereClause = "";
        const params = [];

        if (status && status !== "all") {
          whereClause = "WHERE status = ?";
          params.push(status);
        }

        const [countResult] = await db.query(
          `SELECT COUNT(*) as total FROM jobs ${whereClause}`,
          params
        );

        const total = countResult[0].total;
        return { total };
      },
    });

    res.render("pages/admin/queue/all-jobs", {
      currentStatus: status,
      totalJobs: result.data.total,
      user: req.session.user,
      cacheInfo: {
        source: result.source,
        duration_ms: result.duration_ms,
      },
    });
  } catch (error) {
    console.error("❌ [QUEUE] Error getting jobs page:", error.message);
    res.render("pages/admin/queue/all-jobs", {
      currentStatus: status,
      totalJobs: 0,
      user: req.session.user,
      error: "Failed to load jobs page",
      cacheInfo: {
        source: "error",
        duration_ms: 0,
      },
    });
  }
});

module.exports = getAllJobsPage;
