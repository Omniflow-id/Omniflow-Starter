const express = require("express");
const router = express.Router();

const { isLoggedIn } = require("@middlewares/isLoggedIn");
const { adminLimiter } = require("@middlewares/rateLimiter");

const auth = require("./auth/auth.router");
const index = require("./index/index.router");
const log = require("./log/log.router");
const user = require("./user/user.router");

router.use("/", auth);
router.use("/", isLoggedIn, adminLimiter, index);
router.use("/", isLoggedIn, adminLimiter, log);
router.use("/", isLoggedIn, adminLimiter, user);

module.exports = router;
