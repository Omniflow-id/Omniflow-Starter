const express = require("express");
const router = express.Router();

const index = require("./index.api.controller");

router.get("/", index.indexAPI);
router.get("/protected", index.protectedAPI);

module.exports = router;
