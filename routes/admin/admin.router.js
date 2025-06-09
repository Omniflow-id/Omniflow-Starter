const express = require("express");
const router = express.Router();

const { isLoggedIn } = require("../../middlewares/isLoggedIn");

const auth = require("./auth/auth.router");
const index = require("./index/index.router");
const log = require("./log/log.router");
const user = require("./user/user.router");

router.use("/", auth);
router.use("/", isLoggedIn, index);
router.use("/", isLoggedIn, log);
router.use("/", isLoggedIn, user);

module.exports = router;
