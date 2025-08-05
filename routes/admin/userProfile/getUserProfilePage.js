// === Absolute / alias imports ===
const { db } = require("@db/db");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");
const { handleCache } = require("@helpers/cache");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

const getUserProfilePage = asyncHandler(async (req, res) => {
  const userID = req.session?.user?.id;

  if (!userID) {
    throw new ValidationError("User session not found");
  }

  // Cache user profile data for 5 minutes
  const result = await handleCache({
    key: `user:profile:${userID}`,
    ttl: 300, // 5 minutes
    dbQueryFn: async () => {
      const [users] = await db.query(
        "SELECT u.id, u.username, u.email, u.full_name, r.role_name as role, u.is_active, u.created_at FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.id = ? AND u.deleted_at IS NULL",
        [userID]
      );

      if (users.length === 0) {
        throw new ValidationError("User profile not found");
      }

      return users[0];
    },
  });

  // Log user profile view activity
  await logUserActivity(
    {
      activity: "User viewed their profile page",
      actionType: ACTION_TYPES.READ,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: userID,
      metadata: {
        viewType: "profile_page",
        cached: result.source === "redis",
        responseTime: result.duration_ms,
      },
    },
    req
  );

  res.render("pages/admin/userProfile/index", {
    userProfile: result.data,
    cacheInfo: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});

module.exports = { getUserProfilePage };
