const express = require("express");
const { isLoggedIn } = require("@middlewares/isLoggedIn");
const { checkPermission } = require("@middlewares/checkPermission");
const controller = require("./datatable.api.controller");

const router = express.Router();

// All datatable endpoints require session authentication (for web interface)
router.use(isLoggedIn);

// DataTable endpoints with permission checks
router.get("/users", checkPermission("view_users"), controller.getUsersDataTable);
router.get("/logs", checkPermission("view_logs"), controller.getLogsDataTable);
router.get("/jobs", checkPermission("manage_queue"), controller.getJobsDataTable);
router.get("/failed-jobs", checkPermission("manage_queue"), controller.getFailedJobsDataTable);

module.exports = router;