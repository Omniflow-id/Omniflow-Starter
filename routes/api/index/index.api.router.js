const express = require("express");
const router = express.Router();

const index = require("./index.api.controller");
const { verifyJWT, verifyRefreshToken } = require("@middlewares/jwtAuth");

router.get("/", index.indexAPI);
router.get("/health", index.healthAPI);
router.post("/login", index.loginAPI);
router.post("/refresh", verifyRefreshToken, index.refreshTokenAPI);
router.get("/protected", verifyJWT, index.protectedAPI);

module.exports = router;
