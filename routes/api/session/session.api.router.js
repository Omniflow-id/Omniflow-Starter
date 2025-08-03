const express = require("express");
const router = express.Router();

const sessionAPI = require("./session.api.controller");

router.post("/keep-alive", sessionAPI.keepAliveAPI);

module.exports = router;
