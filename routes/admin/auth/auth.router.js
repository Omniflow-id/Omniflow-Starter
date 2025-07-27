const express = require("express");
const router = express.Router();
const { authLimiter } = require("@middlewares/rateLimiter");

const auth = require("./auth.controller");

router.get("/login", auth.getLoginPage);
router.post("/login", authLimiter, auth.login);
router.get("/register", auth.getRegisterPage);
router.post("/logout", auth.logout);

module.exports = router;
