const { db } = require("@db/db");
const { invalidateCache } = require("@helpers/cache");
const {
  updateUserPermissionOverrides,
} = require("@helpers/permissionOverride");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

/**
 * Update user permissions (AJAX endpoint)
 * Add or remove direct permissions from a user
 */
const updateUserPermissions = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { permissionIds = [], grants = [], revokes = [] } = req.body;

  // Validate user exists
  const [users] = await db.query(
    "SELECT username, full_name FROM users WHERE id = ? AND deleted_at IS NULL",
    [userId]
  );
  if (users.length === 0) {
    throw new ValidationError("User not found");
  }

  const user = users[0];

  // Use new grants/revokes format if available, fallback to permissionIds for backward compatibility
  const finalGrants = grants.length > 0 ? grants : permissionIds;
  const finalRevokes = revokes;
  const allPermissionIds = [...finalGrants, ...finalRevokes];

  // Validate permission IDs
  if (allPermissionIds.length > 0) {
    const [validPermissions] = await db.query(
      `
      SELECT permission_id FROM permissions 
      WHERE permission_id IN (${allPermissionIds.map(() => "?").join(",")}) 
      AND deleted_at IS NULL
    `,
      allPermissionIds
    );

    if (validPermissions.length !== allPermissionIds.length) {
      throw new ValidationError("Some permissions are invalid");
    }
  }

  // Get current user permissions for logging
  const [currentPermissions] = await db.query(
    `
    SELECT p.permission_name 
    FROM user_permissions up 
    JOIN permissions p ON up.permission_id = p.permission_id 
    WHERE up.user_id = ?
  `,
    [userId]
  );
  // Use the new permission override system
  await updateUserPermissionOverrides(userId, {
    grants: finalGrants,
    revokes: finalRevokes,
  });

  // Get new permissions for logging
  const [newPermissions] = await db.query(
    `
      SELECT p.permission_name, up.is_revoked
      FROM user_permissions up 
      JOIN permissions p ON up.permission_id = p.permission_id 
      WHERE up.user_id = ?
    `,
    [userId]
  );

  const grantedPermissions = newPermissions
    .filter((p) => !p.is_revoked)
    .map((p) => p.permission_name);
  const revokedPermissions = newPermissions
    .filter((p) => p.is_revoked)
    .map((p) => p.permission_name);

  // Log activity
  await logUserActivity(
    {
      activity: `Updated direct permissions for user: ${user.full_name} (${user.username})`,
      actionType: ACTION_TYPES.UPDATE,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: userId,
      dataChanges: {
        oldData: {
          permissions: currentPermissions.map((p) => p.permission_name),
        },
        newData: {
          grantedPermissions,
          revokedPermissions,
        },
        changedFields: ["permissions"],
      },
      metadata: {
        userId: userId,
        username: user.username,
        fullName: user.full_name,
        grantedCount: grantedPermissions.length,
        revokedCount: revokedPermissions.length,
        permissionType: "user_permission_overrides",
      },
    },
    req
  );

  // Invalidate cache
  // Invalidate cache
  await invalidateCache("permissions:*", true);
  await invalidateCache("users:*", true);
  await invalidateCache("datatable:users:*", true); // DataTable cache
  await invalidateCache(`users:${userId}:*`, true);

  res.json({
    success: true,
    message: `Successfully updated permissions for user: ${user.full_name}`,
    data: {
      userId: userId,
      username: user.username,
      fullName: user.full_name,
      grantedCount: grantedPermissions.length,
      revokedCount: revokedPermissions.length,
    },
  });
});

module.exports = { updateUserPermissions };
