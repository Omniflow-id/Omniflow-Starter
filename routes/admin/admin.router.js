const express = require("express");
const router = express.Router();

const { isLoggedInAndActive } = require("@middlewares/isLoggedIn");
const { adminLimiter } = require("@middlewares/rateLimiter");

const auth = require("./auth/auth.router");
const cache = require("./cache/cache.router");
const index = require("./index/index.router");
const log = require("./log/log.router");
const permissionsRouter = require("./permissions/permissions.router");
const rolesRouter = require("./roles/roles.router");
const queue = require("./queue/queue.router");
const user = require("./user/user.router");
const userProfile = require("./userProfile/userProfile.router");

// Middleware to ensure permissions are available in res.locals for all admin routes
// This is needed because the sidebar checks permissions during template rendering
router.use(async (req, res, next) => {
  if (req.session.user) {
    // Ensure permissions are in session
    if (!req.session.permissions || req.session.permissions.length === 0) {
      // Load permissions if not in session
      const { db } = require("@db/db");
      try {
        const [rolePermissions] = await db.query(
          `SELECT DISTINCT p.permission_name
           FROM permissions p
           JOIN role_permissions rp ON p.permission_id = rp.permission_id
           WHERE rp.role_id = ? AND p.deleted_at IS NULL`,
          [req.session.user.role_id]
        );
        req.session.permissions = rolePermissions.map((p) => p.permission_name);
      } catch (err) {
        console.error("[ADMIN] Error loading permissions:", err.message);
        req.session.permissions = [];
      }
    }
    // Ensure permissions are available in res.locals for template rendering
    res.locals.permissions = req.session.permissions || [];
  } else {
    res.locals.permissions = [];
  }
  next();
});

router.use("/", auth);
router.use("/cache", isLoggedInAndActive, adminLimiter, cache);
router.use("/", isLoggedInAndActive, adminLimiter, index);
router.use("/", isLoggedInAndActive, adminLimiter, log);
router.use(
  "/permissions",
  isLoggedInAndActive,
  adminLimiter,
  permissionsRouter
);
router.use("/roles", isLoggedInAndActive, adminLimiter, rolesRouter);
router.use("/queue", isLoggedInAndActive, adminLimiter, queue);
router.use("/", isLoggedInAndActive, adminLimiter, user);
router.use("/", isLoggedInAndActive, adminLimiter, userProfile);

module.exports = router;
