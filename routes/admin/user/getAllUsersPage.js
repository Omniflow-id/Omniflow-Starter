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
    // Only load roles for modal - users data loaded via server-side DataTable
    const result = await handleCache({
      key: "users:roles:list",
      ttl: 300, // 5 minutes
      dbQueryFn: async () => {
        const [roles] = await db.query(
          "SELECT role_id, role_name FROM roles WHERE deleted_at IS NULL ORDER BY role_name"
        );
        return { roles };
      },
    });

    // Render page with roles only - DataTable will load users via AJAX
    res.render("pages/admin/user/index", {
      roles: result.data.roles,
      permissions: req.session.permissions || [], // Explicitly pass permissions
      session_user_id: req.session.user.id, // For preventing self-deactivation
      cacheInfo: {
        source: result.source,
        duration_ms: result.duration_ms,
      },
    });
  } catch (error) {
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await logUserActivity({
      activity: "Failed to load users page",
      actionType: ACTION_TYPES.READ,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: "users_page",
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
      errorCode: error.code || "USER_PAGE_LOAD_FAILED",
      metadata: {
        pageType: "users_page",
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
