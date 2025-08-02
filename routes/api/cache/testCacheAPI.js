// === Absolute / alias imports ===
const { handleCache } = require("@helpers/cache");
const { db } = require("@db/db");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * API endpoint to test cache performance
 * Demonstrates cache usage with sample database queries
 */
const testCacheAPI = asyncHandler(async (_req, res) => {
  const result = await handleCache({
    key: "api:test:sample_data",
    ttl: 60, // 1 minute
    dbQueryFn: async () => {
      // Simulate database queries
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
});

module.exports = { testCacheAPI };
