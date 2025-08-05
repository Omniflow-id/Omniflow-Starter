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

const getAllUsersPage = async (req, res) => {
  try {
    // Use cache with 5-minute TTL for user list
    const result = await handleCache({
      key: "admin:users:list",
      ttl: 300, // 5 minutes
      dbQueryFn: async () => {
        const [users] = await db.query(
          "SELECT u.id, u.username, u.email, u.full_name, r.role_name as role, u.is_active FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.deleted_at IS NULL ORDER BY u.id"
        );
        const [roles] = await db.query(
          "SELECT role_id, role_name FROM roles WHERE deleted_at IS NULL ORDER BY role_name"
        );
        return { users, roles };
      },
    });

    // Add session user ID to prevent self-deactivation
    const usersWithSessionInfo = result.data.users.map((user) => ({
      ...user,
      session_user_id: req.session.user.id,
    }));

    // Add cache info to template data for debugging
    res.render("pages/admin/user/index", {
      users: usersWithSessionInfo,
      roles: result.data.roles,
      cacheInfo: {
        source: result.source,
        duration_ms: result.duration_ms,
      },
    });
  } catch (error) {
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await logUserActivity({
      activity: "Failed to load users list page",
      actionType: ACTION_TYPES.READ,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: "users_list",
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
      errorCode: error.code || "USER_LIST_LOAD_FAILED",
      metadata: {
        pageType: "users_list",
        cacheEnabled: true,
        cacheTTL: 300,
        errorDetails: error.name,
      },
      req,
      level: LOG_LEVELS.ERROR,
    });

    res.status(500).send("Internal Server Error");
  }
};

module.exports = { getAllUsersPage };
