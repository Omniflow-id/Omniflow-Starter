const express = require("express");
const router = express.Router();

const { doubleCsrfProtection } = require("@middlewares/csrfProtection");
const sessionAPI = require("./session.api.controller");

router.post("/keep-alive", doubleCsrfProtection, sessionAPI.keepAliveAPI);

module.exports = router;
