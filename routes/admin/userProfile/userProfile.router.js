const express = require("express");
const router = express.Router();

const userProfile = require("./userProfile.controller");
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");

const { withLocale } = require("@helpers/i18n");

router.get(
  "/profile",
  withLocale("admin/profile"),
  userProfile.getUserProfilePage
);
router.get(
  "/change-password",
  withLocale("admin/profile"),
  userProfile.getChangePasswordPage
);
router.post(
  "/change-password",
  doubleCsrfProtection,
  userProfile.changePassword
);

module.exports = router;
