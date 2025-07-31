const express = require("express");
const router = express.Router();

const index = require("./index/index.api.router");

router.use("/", index);

module.exports = router;
