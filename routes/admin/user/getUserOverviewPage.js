// === Absolute / alias imports ===
const { db } = require("@db/db");
const { handleCache } = require("@helpers/cache");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const {
  LOG_LEVELS,
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
  ACTIVITY_STATUS,
} = require("@helpers/log");

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
          SELECT r.role_name, COUNT(u.id) as count 
          FROM users u
          JOIN roles r ON u.role_id = r.role_id
          GROUP BY r.role_name
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
      permissions: req.session.permissions || [], // Pass permissions for sidebar navigation
      cacheInfo: {
        source: result.source,
        duration_ms: result.duration_ms,
      },
    });
  } catch (error) {
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await logUserActivity({
      activity: "Failed to load user overview/statistics page",
      actionType: ACTION_TYPES.READ,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: "users_overview",
      status: ACTIVITY_STATUS.FAILURE,
      userId: req.session?.user?.id,
      requestInfo: {
        ip: clientIP,
        userAgent: userAgent.userAgent,
        deviceType: userAgent.deviceType,
        browser: userAgent.browser,
        platform: userAgent.platform,
        method: req.method,
        url: req.originalUrl,
      },
      errorMessage: error.message,
      errorCode: error.code || "USER_OVERVIEW_LOAD_FAILED",
      metadata: {
        pageType: "users_overview",
        cacheEnabled: true,
        cacheTTL: 300,
        statsRequested: ["totalUsers", "roleStats"],
        errorDetails: error.name,
      },
      req,
      level: LOG_LEVELS.ERROR,
    });

    res.status(500).send("Internal Server Error");
  }
};

module.exports = { getUserOverviewPage };
