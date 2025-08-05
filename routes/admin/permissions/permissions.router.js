const express = require("express");
const router = express.Router();

// === Middlewares ===
const { isLoggedInAndActive } = require("@middlewares/isLoggedIn");
const { checkPermission } = require("@middlewares/checkPermission");
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");

// === Route Handlers ===
const permission = require("./permission.controller");

// === Permissions Management Routes ===

// Permissions list page
router.get(
  "/",
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  permission.getPermissionsPage
);

// CRUD for Permissions
router.post(
  "/",
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  doubleCsrfProtection,
  permission.createPermission
);
router.post(
  "/:permissionId/update",
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  doubleCsrfProtection,
  permission.updatePermission
);
router.post(
  "/:permissionId/delete",
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  doubleCsrfProtection,
  permission.deletePermission
);

module.exports = router;
