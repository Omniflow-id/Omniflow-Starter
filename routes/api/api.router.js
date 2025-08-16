const express = require("express");
const router = express.Router();

const cache = require("./cache/cache.api.router");
const datatable = require("./datatable/datatable.api.router");
const index = require("./index/index.api.router");
const session = require("./session/session.api.router");

router.use("/cache", cache);
router.use("/datatable", datatable);
router.use("/session", session);
router.use("/", index);

module.exports = router;
