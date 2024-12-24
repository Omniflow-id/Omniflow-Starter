const express = require("express");
const auth = require("./auth.controller");

const router = express.Router();

router.get("/login", auth.getLoginPage);
router.post("/login", auth.login);
router.get("/register", auth.getRegisterPage);
router.post("/logout", auth.logout);

module.exports = router;

