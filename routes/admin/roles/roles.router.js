const express = require("express");
const router = express.Router();

// === Middlewares ===
const { isLoggedInAndActive } = require("@middlewares/isLoggedIn");
const { checkPermission } = require("@middlewares/checkPermission");
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");

// === Route Handlers ===
const role = require("./role.controller");

// Roles and permissions management page
router.get(
  "/",
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  role.getRolesPage
);

// Update role permissions (AJAX)
router.post(
  "/:roleId/permissions",
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  doubleCsrfProtection,
  role.updateRolePermissions
);

// CRUD for Roles
router.post(
  "/",
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  doubleCsrfProtection,
  role.createRole
);
router.post(
  "/:roleId/update",
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  doubleCsrfProtection,
  role.updateRole
);
router.post(
  "/:roleId/delete",
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  doubleCsrfProtection,
  role.deleteRole
);

module.exports = router;
