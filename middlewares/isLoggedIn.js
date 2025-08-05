// === Absolute / alias imports ===
const { checkActiveUser } = require("@middlewares/checkActiveUser");

/**
 * Middleware to check if user is authenticated (logged in)
 * Works with RBAC system - permissions are loaded in session during login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    // User is logged in, session contains user info and permissions
    next();
  } else {
    res.redirect("/admin/login");
  }
};

// Combined middleware: check login AND active status
const isLoggedInAndActive = [isLoggedIn, checkActiveUser];

module.exports = {
  isLoggedIn,
  isLoggedInAndActive,
};
