const { db } = require("@db/db");
const { invalidateCache } = require("@helpers/cache");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

/**
 * Update role permissions (AJAX endpoint)
 * Add or remove permissions from a role
 */
const updateRolePermissions = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const { permissionIds = [] } = req.body;

  // Validate role exists
  const [roles] = await db.query(
    "SELECT role_name FROM roles WHERE role_id = ? AND deleted_at IS NULL",
    [roleId]
  );
  if (roles.length === 0) {
    throw new ValidationError("Role not found");
  }

  const roleName = roles[0].role_name;

  // Validate permission IDs
  if (permissionIds.length > 0) {
    const [validPermissions] = await db.query(
      `
      SELECT permission_id FROM permissions 
      WHERE permission_id IN (${permissionIds.map(() => "?").join(",")}) 
      AND deleted_at IS NULL
    `,
      permissionIds
    );

    if (validPermissions.length !== permissionIds.length) {
      throw new ValidationError("Some permissions are invalid");
    }
  }

  // Get current permissions for logging
  const [currentPermissions] = await db.query(
    `
    SELECT p.permission_name 
    FROM role_permissions rp 
    JOIN permissions p ON rp.permission_id = p.permission_id 
    WHERE rp.role_id = ?
  `,
    [roleId]
  );

  // Start transaction
  await db.query("START TRANSACTION");

  try {
    // Remove all current permissions for this role
    await db.query("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);

    // Add new permissions
    if (permissionIds.length > 0) {
      const values = permissionIds.map((permissionId) => [
        roleId,
        permissionId,
        new Date(),
      ]);
      const placeholders = values.map(() => "(?, ?, ?)").join(", ");
      const flatValues = values.flat();

      await db.query(
        `INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES ${placeholders}`,
        flatValues
      );
    }

    // Get new permissions for logging
    const [newPermissions] = await db.query(
      `
      SELECT p.permission_name 
      FROM role_permissions rp 
      JOIN permissions p ON rp.permission_id = p.permission_id 
      WHERE rp.role_id = ?
    `,
      [roleId]
    );

    await db.query("COMMIT");

    // Log activity
    await logUserActivity(
      {
        activity: `Updated permissions for role: ${roleName}`,
        actionType: ACTION_TYPES.UPDATE,
        resourceType: RESOURCE_TYPES.ROLE,
        resourceId: roleId,
        dataChanges: {
          before: {
            permissions: currentPermissions.map((p) => p.permission_name),
          },
          after: { permissions: newPermissions.map((p) => p.permission_name) },
          changedFields: ["permissions"],
        },
        metadata: {
          roleId: roleId,
          roleName: roleName,
          permissionCount: newPermissions.length,
        },
      },
      req
    );

    // Invalidate cache
    await invalidateCache("permissions:*", true);
    await invalidateCache("users:*", true); // User cache may show roles

    res.json({
      success: true,
      message: `Successfully updated permissions for role: ${roleName}`,
      data: {
        roleId: roleId,
        roleName: roleName,
        permissionCount: newPermissions.length,
      },
    });
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
});

module.exports = { updateRolePermissions };
