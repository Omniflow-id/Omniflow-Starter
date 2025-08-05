/**
 * Middleware to check if user has specific permission
 * Uses permissions loaded in session during login
 *
 * @param {string} requiredPermission - The permission name to check
 * @returns {Function} Express middleware function
 */
function checkPermission(requiredPermission) {
  return (req, res, next) => {
    // Get user permissions from session
    const userPermissions = req.session.permissions || [];

    // Check if user has the required permission
    if (userPermissions.includes(requiredPermission)) {
      next();
    } else {
      // Permission denied
      if (req.xhr || req.headers.accept?.includes("application/json")) {
        // API request - return JSON response
        return res.status(403).json({
          success: false,
          error: "Forbidden: No Access",
          message: `You don't have permission to access this resource. Required permission: ${requiredPermission}`,
        });
      } else {
        // Web request - redirect with flash message
        req.flash(
          "error_msg",
          `Access denied. You don't have permission: ${requiredPermission}`
        );
        return res.redirect("/admin/dashboard");
      }
    }
  };
}

module.exports = { checkPermission };
