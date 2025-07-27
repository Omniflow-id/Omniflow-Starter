const express = require("express");
const router = express.Router();
const { exportLimiter } = require("@middlewares/rateLimiter");

const log = require("./log.controller");

router.get("/log/index", log.getLogPage);
router.get("/log/download", exportLimiter, log.downloadLogData);

module.exports = router;
