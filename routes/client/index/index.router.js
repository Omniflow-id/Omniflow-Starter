const express = require("express");
const router = express.Router();
const { withLocale } = require("@helpers/i18n");

const index = require("./index.controller");

router.get("/", withLocale("client/index"), index.getClientIndexPage);

module.exports = router;
