const express = require("express");
const router = express.Router();

const log = require("./log.controller");

router.get("/log/index", log.getLogPage);
router.get("/log/download", log.downloadLogData);

module.exports = router;
