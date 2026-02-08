const express = require("express");
const router = express.Router();

const cache = require("./cache/cache.api.router");
const datatable = require("./datatable/datatable.api.router");
const health = require("./health/health.api.routes");
const index = require("./index/index.api.router");
const session = require("./session/session.api.router");

router.use("/cache", cache);
router.use("/datatable", datatable);
router.use("/health", health);
router.use("/session", session);
router.use("/ai-assistant", require("./aiAssistant/aiAssistant.router"));
router.use("/ai-copilot", require("./aiCopilot/aiCopilot.router"));
router.use("/", index);

module.exports = router;
