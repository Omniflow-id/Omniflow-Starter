const express = require("express");
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");
const { isLoggedIn } = require("@middlewares/isLoggedIn");
const { checkPermission } = require("@middlewares/checkPermission");
const controller = require("./queue.controller");

const router = express.Router();

router.use(isLoggedIn);
router.use(checkPermission("manage_queue"));

router.get("/", controller.getQueueStatsPage);
router.get("/failed", controller.getFailedJobsPage);
router.post("/test", doubleCsrfProtection, controller.sendTestJob);
router.post("/retry", doubleCsrfProtection, controller.retryFailedJobsAction);

module.exports = router;
