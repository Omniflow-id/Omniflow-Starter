// === Absolute / alias imports ===
const { handleCache } = require("@helpers/cache");
const { db } = require("@db/db");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * Test cache performance - demonstrates cache usage
 */
const testCache = asyncHandler(async (req, res) => {
  const result = await handleCache({
    key: "test:sample_data",
    ttl: 60, // 1 minute
    dbQueryFn: async () => {
      // Simulate database query
      const [users] = await db.query(
        "SELECT COUNT(*) as user_count FROM users"
      );
      const [logs] = await db.query(
        "SELECT COUNT(*) as log_count FROM activity_logs"
      );

      return {
        users: users[0].user_count,
        logs: logs[0].log_count,
        generated_at: new Date().toISOString(),
        random_number: Math.floor(Math.random() * 1000),
      };
    },
  });

  if (req.xhr || req.headers.accept?.includes("application/json")) {
    res.json({
      success: true,
      cache_info: {
        source: result.source,
        duration_ms: result.duration_ms,
        key: result.key,
        ttl: result.ttl,
      },
      data: result.data,
    });
  } else {
    req.flash(
      "success_msg",
      `Cache test completed! Retrieved data from ${result.source} in ${result.duration_ms}ms`
    );
    res.redirect("/admin/cache/stats");
  }
});

module.exports = { testCache };
