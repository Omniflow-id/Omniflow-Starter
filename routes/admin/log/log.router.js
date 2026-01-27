const express = require("express");
const router = express.Router();
const { exportLimiter } = require("@middlewares/rateLimiter");
const { withLocale } = require("@helpers/i18n");

const log = require("./log.controller");

router.get("/log/index", withLocale("admin/logs"), log.getLogPage);
router.get("/log/download", exportLimiter, log.downloadLogData);

module.exports = router;
