const express = require("express");
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");
const { isLoggedIn } = require("@middlewares/isLoggedIn");
const { isAdmin } = require("@middlewares/isAdmin");
const controller = require("./queue.controller");

const router = express.Router();

router.use(isLoggedIn);
router.use(isAdmin);

router.get("/", controller.getQueueStatsPage);
router.get("/failed", controller.getFailedJobsPage);
router.post("/test", doubleCsrfProtection, controller.sendTestJob);
router.post("/retry", doubleCsrfProtection, controller.retryFailedJobsAction);

module.exports = router;
