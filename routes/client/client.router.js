const express = require("express");
const router = express.Router();

const indexRouter = require("./index/index.router");

router.use("/", indexRouter);

module.exports = router;
