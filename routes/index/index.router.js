const express = require("express");
const router = express.Router();

const index = require("./index.controller");

router.route("/").get(index.getAdminPage);
router.route("/admin/overview").get(index.getOverviewPage);
router.route("/admin/submodule").get(index.getSubModulePage);

module.exports = router;
