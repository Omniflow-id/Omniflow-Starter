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
