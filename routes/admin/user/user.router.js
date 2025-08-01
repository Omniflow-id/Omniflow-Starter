const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadLimiter, exportLimiter } = require("@middlewares/rateLimiter");
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");

const user = require("./user.controller");

// Use memory storage instead of disk storage for temporary Excel processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Only allow Excel files
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls) are allowed"));
    }
  },
});

router.get("/user/index", user.getAllUsersPage);
router.get("/user/overview", user.getUserOverviewPage);
router.get("/user/passwords", user.showGeneratedPasswordsPage);
router.get("/user/download", exportLimiter, user.downloadUserData);
router.get("/user/download-template", exportLimiter, user.downloadUserTemplate);
router.post(
  "/user/upload",
  uploadLimiter,
  upload.single("fileUpload"),
  doubleCsrfProtection,
  user.uploadNewUser
);
router.post("/user/create", doubleCsrfProtection, user.createNewUser);
router.post(
  "/user/toggle-active/:id",
  doubleCsrfProtection,
  user.toggleUserActive
);

module.exports = router;
