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
        "SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE id = ?",
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
