const express = require("express");
const router = express.Router();

const index = require("./index.controller");

router.route("/").get(index.getAdminPage);

module.exports = router;
