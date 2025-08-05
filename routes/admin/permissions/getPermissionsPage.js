const { db } = require("@db/db");
const { handleCache } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * Get permissions management page
 * Shows all permissions and their descriptions
 */
const getPermissionsPage = asyncHandler(async (req, res) => {
  const result = await handleCache({
    key: "admin:permissions:list",
    ttl: 300, // 5 minutes
    dbQueryFn: async () => {
      const [permissions] = await db.query(`
        SELECT permission_id, permission_name, description, created_at, updated_at
        FROM permissions 
        WHERE deleted_at IS NULL 
        ORDER BY permission_name
      `);

      return permissions;
    },
  });

  res.render("pages/admin/permissions/index", {
    title: "Permissions Management",
    allPermissions: result.data,
    user: req.session.user,
    cacheInfo: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});

module.exports = getPermissionsPage;
