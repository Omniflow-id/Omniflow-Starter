const { db } = require("@db/db");

/**
 * Enhanced permission override system using metadata
 * Allows revoking role permissions and granting additional permissions
 */

/**
 * Get user's effective permissions with override support
 * @param {number} userId - User ID
 * @param {number} roleId - User's role ID
 * @returns {Promise<{effectivePermissions: string[], rolePermissions: string[], userGrants: string[], userRevokes: string[]}>}
 */
async function getUserEffectivePermissions(userId, roleId) {
  try {
    // Get base permissions from role
    const [rolePermissions] = await db.query(
      `
      SELECT DISTINCT p.permission_name, p.permission_id
      FROM permissions p 
      JOIN role_permissions rp ON p.permission_id = rp.permission_id 
      WHERE rp.role_id = ? AND p.deleted_at IS NULL
    `,
      [roleId]
    );

    // Get user-specific permission overrides with revoke support
    const [userOverrides] = await db.query(
      `
      SELECT DISTINCT p.permission_name, p.permission_id, up.is_revoked
      FROM permissions p
      JOIN user_permissions up ON p.permission_id = up.permission_id
      WHERE up.user_id = ? AND p.deleted_at IS NULL
    `,
      [userId]
    );

    // Separate grants and revokes based on is_revoked field
    const rolePermissionNames = rolePermissions.map((p) => p.permission_name);
    const userGrantNames = userOverrides
      .filter((p) => !p.is_revoked)
      .map((p) => p.permission_name);
    const userRevokeNames = userOverrides
      .filter((p) => p.is_revoked)
      .map((p) => p.permission_name);

    // Calculate effective permissions: (Role permissions + User grants) - User revokes
    const effectivePermissions = new Set([
      ...rolePermissionNames,
      ...userGrantNames,
    ]);

    // Remove revoked permissions
    userRevokeNames.forEach((permission) => {
      effectivePermissions.delete(permission);
    });

    return {
      effectivePermissions: Array.from(effectivePermissions),
      rolePermissions: rolePermissionNames,
      userGrants: userGrantNames,
      userRevokes: userRevokeNames,
    };
  } catch (error) {
    console.error(
      "❌ [PERMISSION] Error calculating effective permissions:",
      error.message
    );
    return {
      effectivePermissions: [],
      rolePermissions: [],
      userGrants: [],
      userRevokes: [],
    };
  }
}

/**
 * Update user permission overrides
 * @param {number} userId - User ID
 * @param {Object} permissions - Permissions object
 * @param {number[]} permissions.grants - Permission IDs to grant
 * @param {number[]} permissions.revokes - Permission IDs to revoke (future implementation)
 * @returns {Promise<boolean>} Success status
 */
async function updateUserPermissionOverrides(userId, permissions) {
  const { grants = [], revokes = [] } = permissions;

  try {
    // Start transaction
    await db.query("START TRANSACTION");

    // Clear existing user permissions (we'll re-insert them)
    await db.query("DELETE FROM user_permissions WHERE user_id = ?", [userId]);

    // Insert granted permissions (is_revoked = false)
    for (const permissionId of grants) {
      await db.query(
        "INSERT INTO user_permissions (user_id, permission_id, is_revoked, created_at) VALUES (?, ?, FALSE, NOW())",
        [userId, permissionId]
      );
    }

    // Insert revoked permissions (is_revoked = true)
    for (const permissionId of revokes) {
      await db.query(
        "INSERT INTO user_permissions (user_id, permission_id, is_revoked, created_at) VALUES (?, ?, TRUE, NOW())",
        [userId, permissionId]
      );
    }

    await db.query("COMMIT");
    return true;
  } catch (error) {
    await db.query("ROLLBACK");
    console.error(
      "❌ [PERMISSION] Error updating user permission overrides:",
      error.message
    );
    throw error;
  }
}

/**
 * Get comprehensive permission data for user management UI
 * @param {number} userId - User ID
 * @param {number} roleId - User's role ID
 * @returns {Promise<Object>} Complete permission data for UI
 */
async function getUserPermissionData(userId, roleId) {
  try {
    // Get all available permissions
    const [allPermissions] = await db.query(
      "SELECT permission_id, permission_name, description FROM permissions WHERE deleted_at IS NULL ORDER BY permission_name"
    );

    // Get role permissions
    const [rolePermissions] = await db.query(
      `
      SELECT DISTINCT p.permission_id, p.permission_name, p.description
      FROM permissions p 
      JOIN role_permissions rp ON p.permission_id = rp.permission_id 
      WHERE rp.role_id = ? AND p.deleted_at IS NULL
      ORDER BY p.permission_name
    `,
      [roleId]
    );

    // Get user-specific permissions (currently all grants)
    const [userPermissions] = await db.query(
      `
      SELECT DISTINCT p.permission_id, p.permission_name, p.description
      FROM permissions p
      JOIN user_permissions up ON p.permission_id = up.permission_id
      WHERE up.user_id = ? AND p.deleted_at IS NULL
      ORDER BY p.permission_name
    `,
      [userId]
    );

    // Calculate effective permissions
    const effectiveData = await getUserEffectivePermissions(userId, roleId);

    return {
      allPermissions,
      rolePermissions,
      userPermissions,
      ...effectiveData,
    };
  } catch (error) {
    console.error(
      "❌ [PERMISSION] Error getting user permission data:",
      error.message
    );
    throw error;
  }
}

module.exports = {
  getUserEffectivePermissions,
  updateUserPermissionOverrides,
  getUserPermissionData,
};
