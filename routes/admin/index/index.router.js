const express = require("express");
const router = express.Router();

const index = require("./index.controller");
const { withLocale } = require("@helpers/i18n");

router.route("/").get(withLocale("admin/dashboard"), index.getAdminPage);
router
  .route("/overview")
  .get(withLocale("admin/dashboard"), index.getOverviewPage);
router
  .route("/submodule")
  .get(withLocale("admin/dashboard"), index.getSubModulePage);

module.exports = router;
