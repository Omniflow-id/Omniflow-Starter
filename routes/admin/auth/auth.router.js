const express = require("express");
const router = express.Router();
const { authLimiter } = require("@middlewares/rateLimiter");
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");

const auth = require("./auth.controller");
const { getVerifyOTP, postVerifyOTP } = require("./verifyOTP");

router.get("/login", auth.getLoginPage);
router.post("/login", authLimiter, doubleCsrfProtection, auth.login);
router.get("/verify-otp", getVerifyOTP);
router.post("/verify-otp", authLimiter, doubleCsrfProtection, postVerifyOTP);
router.get("/register", auth.getRegisterPage);
router.post("/logout", doubleCsrfProtection, auth.logout);
router.get("/logout", auth.logout); // GET logout for session timeout fallback

module.exports = router;
