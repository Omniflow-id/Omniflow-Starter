const express = require("express");
const router = express.Router();

const userProfile = require("./userProfile.controller");

router.get("/profile", userProfile.getUserProfilePage);

module.exports = router;
