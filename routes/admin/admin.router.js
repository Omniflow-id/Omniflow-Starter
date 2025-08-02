const express = require("express");
const router = express.Router();

const { isLoggedInAndActive } = require("@middlewares/isLoggedIn");
const { adminLimiter } = require("@middlewares/rateLimiter");

const auth = require("./auth/auth.router");
const cache = require("./cache/cache.router");
const index = require("./index/index.router");
const log = require("./log/log.router");
const user = require("./user/user.router");

router.use("/", auth);
router.use("/cache", isLoggedInAndActive, adminLimiter, cache);
router.use("/", isLoggedInAndActive, adminLimiter, index);
router.use("/", isLoggedInAndActive, adminLimiter, log);
router.use("/", isLoggedInAndActive, adminLimiter, user);

module.exports = router;
