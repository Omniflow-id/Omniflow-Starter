/**
 * Template helper functions for Nunjucks
 * Provides utility functions for use in templates
 */

/**
 * Check if user has specific permission
 * @param {Array} userPermissions - Array of user permissions from session
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
function hasPermission(userPermissions, permission) {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return userPermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 * @param {Array} userPermissions - Array of user permissions from session
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean} - True if user has any of the permissions
 */
function hasAnyPermission(userPermissions, permissions) {
  if (
    !userPermissions ||
    !Array.isArray(userPermissions) ||
    !Array.isArray(permissions)
  ) {
    return false;
  }
  return permissions.some((permission) => userPermissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 * @param {Array} userPermissions - Array of user permissions from session
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean} - True if user has all of the permissions
 */
function hasAllPermissions(userPermissions, permissions) {
  if (
    !userPermissions ||
    !Array.isArray(userPermissions) ||
    !Array.isArray(permissions)
  ) {
    return false;
  }
  return permissions.every((permission) =>
    userPermissions.includes(permission)
  );
}

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
};
