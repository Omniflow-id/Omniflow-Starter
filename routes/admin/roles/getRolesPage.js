const { db } = require("@db/db");
const { handleCache } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

/**
 * Get roles and permissions management page
 * Shows roles with their assigned permissions
 */
const getRolesPage = asyncHandler(async (req, res) => {
  const result = await handleCache({
    key: "admin:permissions:roles",
    ttl: 300, // 5 minutes
    dbQueryFn: async () => {
      // Get all roles
      const [roles] = await db.query(`
        SELECT role_id, role_name, description, created_at
        FROM roles 
        WHERE deleted_at IS NULL 
        ORDER BY role_name
      `);

      // Get all permissions
      const [permissions] = await db.query(`
        SELECT permission_id, permission_name, description
        FROM permissions 
        WHERE deleted_at IS NULL 
        ORDER BY permission_name
      `);

      // Get role-permission mappings
      const [rolePermissions] = await db.query(`
        SELECT rp.role_id, rp.permission_id, p.permission_name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE p.deleted_at IS NULL
      `);

      // Group permissions by role
      const rolesWithPermissions = roles.map((role) => ({
        ...role,
        permissions: rolePermissions
          .filter((rp) => rp.role_id === role.role_id)
          .map((rp) => ({
            permission_id: rp.permission_id,
            permission_name: rp.permission_name,
          })),
      }));

      return {
        roles: rolesWithPermissions,
        allPermissions: permissions,
        rolePermissionMappings: rolePermissions,
      };
    },
  });

  res.render("pages/admin/permissions/roles", {
    title: "Roles & Permissions Management",
    roles: result.data.roles,
    allPermissions: result.data.allPermissions,
    user: req.session.user,
    cacheInfo: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});

module.exports = { getRolesPage };
