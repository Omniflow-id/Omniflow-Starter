const express = require("express");
const router = express.Router();

const userProfile = require("./userProfile.controller");
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");

router.get("/profile", userProfile.getUserProfilePage);
router.get("/change-password", userProfile.getChangePasswordPage);
router.post(
  "/change-password",
  doubleCsrfProtection,
  userProfile.changePassword
);

module.exports = router;
