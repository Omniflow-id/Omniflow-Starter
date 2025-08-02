const express = require("express");
const router = express.Router();

const cache = require("./cache/cache.api.router");
const index = require("./index/index.api.router");

router.use("/cache", cache);
router.use("/", index);

module.exports = router;
