const express = require("express");
const router = express.Router();

const index = require("./index.controller");

router.get("/", index.getClientIndexPage);

module.exports = router;
