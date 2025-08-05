const { db } = require("@db/db");
const { handleCache } = require("@helpers/cache");
const { getUserPermissionData } = require("@helpers/permissionOverride");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

/**
 * Get user permissions management page
 * Shows user details with their role permissions and direct permissions
 */
const getUserPermissionsPage = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await handleCache({
    key: `admin:user:${userId}:permissions`,
    ttl: 300, // 5 minutes
    dbQueryFn: async () => {
      // Get user details with role
      const [users] = await db.query(
        `
        SELECT u.id, u.username, u.email, u.full_name, u.role_id, r.role_name
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.role_id 
        WHERE u.id = ? AND u.deleted_at IS NULL
      `,
        [userId]
      );

      if (users.length === 0) {
        throw new ValidationError("User not found");
      }

      const user = users[0];

      // Get comprehensive permission data using new override system
      const permissionData = await getUserPermissionData(userId, user.role_id);

      return {
        user,
        ...permissionData,
      };
    },
  });

  res.render("pages/admin/user/permissions", {
    title: `User Permissions - ${result.data.user.full_name}`,
    ...result.data,
    cacheInfo: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});

module.exports = { getUserPermissionsPage };
