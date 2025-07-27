const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadLimiter, exportLimiter } = require("@middlewares/rateLimiter");

const user = require("./user.controller");

const upload = multer({ dest: "uploads/" });

router.get("/user/index", user.getAllUsersPage);
router.get("/user/overview", user.getUserOverviewPage);
router.get("/user/download", exportLimiter, user.downloadUserData);
router.get("/user/download-template", exportLimiter, user.downloadUserTemplate);
router.post(
  "/user/upload",
  uploadLimiter,
  upload.single("fileUpload"),
  user.uploadNewUser
);
router.post("/user/create", user.createNewUser);

module.exports = router;
