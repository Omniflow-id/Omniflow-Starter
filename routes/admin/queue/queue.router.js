const express = require("express");
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");
const { isLoggedIn } = require("@middlewares/isLoggedIn");
const { checkPermission } = require("@middlewares/checkPermission");
const { withLocale } = require("@helpers/i18n");
const controller = require("./queue.controller");

const router = express.Router();

router.use(isLoggedIn);
router.use(checkPermission("manage_queue"));

router.get("/", withLocale("admin/queue"), controller.getQueueStatsPage);
router.get("/jobs", withLocale("admin/queue"), controller.getAllJobsPage);
router.get("/failed", withLocale("admin/queue"), controller.getFailedJobsPage);
router.post("/test", doubleCsrfProtection, controller.sendTestJob);
router.post("/retry", doubleCsrfProtection, controller.retryFailedJobsAction);

module.exports = router;
