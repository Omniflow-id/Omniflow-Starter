// === Third-party modules ===
const { db } = require("@db/db");

// === Absolute / alias imports ===
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const { log, LOG_LEVELS } = require("@helpers/log");

/**
 * Middleware to check if user account is active
 * Should be used after authentication middleware (isLoggedIn)
 */
const checkActiveUser = async (req, res, next) => {
  try {
    // Skip check if user is not logged in (let authentication middleware handle it)
    if (!req.session?.user?.id) {
      return next();
    }

    // Check user's active status from database
    const [users] = await db.query(
      "SELECT is_active FROM users WHERE id = ? AND deleted_at IS NULL",
      [req.session.user.id]
    );

    if (users.length === 0) {
      // User not found in database - clear session
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
      });

      req.flash("error", "User account not found. Please login again.");
      return res.redirect("/admin/login");
    }

    const user = users[0];

    // Check if user account is inactive
    if (!user.is_active) {
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);

      await log(
        `Inactive user ${req.session.user.username} attempted to access ${req.originalUrl}`,
        LOG_LEVELS.WARN,
        req.session.user.id,
        userAgent,
        clientIP
      );

      // Clear session for inactive user
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
      });

      req.flash(
        "error",
        "Your account has been deactivated. Please contact administrator."
      );
      return res.redirect("/admin/login");
    }

    // User is active, continue to next middleware
    next();
  } catch (error) {
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await log(
      `Error checking user active status: ${error.message}`,
      LOG_LEVELS.ERROR,
      req.session?.user?.id,
      userAgent,
      clientIP
    );

    // On error, allow access but log the issue
    next();
  }
};

module.exports = { checkActiveUser };
