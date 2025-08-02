// === Absolute / alias imports ===
const { db } = require("@db/db");
const { handleCache } = require("@helpers/cache");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const { log, LOG_LEVELS } = require("@helpers/log");

const getUserOverviewPage = async (req, res) => {
  try {
    // Use cache with 5-minute TTL for user overview statistics
    const result = await handleCache({
      key: "admin:users:overview",
      ttl: 300, // 5 minutes
      dbQueryFn: async () => {
        // Get total users
        const [totalUsers] = await db.query(
          "SELECT COUNT(*) as total FROM users"
        );

        // Get count of users by role
        const [roleStats] = await db.query(`
          SELECT role, COUNT(*) as count 
          FROM users 
          GROUP BY role
        `);

        return {
          totalUsers: totalUsers[0].total,
          roleStats,
        };
      },
    });

    res.render("pages/admin/user/overview", {
      totalUsers: result.data.totalUsers,
      roleStats: result.data.roleStats,
      cacheInfo: {
        source: result.source,
        duration_ms: result.duration_ms,
      },
    });
  } catch (error) {
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await log(
      `Kesalahan saat mengambil statistik user: ${error.message}`,
      LOG_LEVELS.ERROR,
      req.session?.user?.id,
      userAgent,
      clientIP
    );

    res.status(500).send("Internal Server Error");
  }
};

module.exports = { getUserOverviewPage };
