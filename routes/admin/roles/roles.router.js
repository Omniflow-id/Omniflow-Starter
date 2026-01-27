const express = require("express");
const router = express.Router();

// === Middlewares ===
const { isLoggedInAndActive } = require("@middlewares/isLoggedIn");
const { checkPermission } = require("@middlewares/checkPermission");
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");
const { withLocale } = require("@helpers/i18n");

// === Route Handlers ===
const role = require("./role.controller");

// Roles and permissions management page
router.get(
  "/",
  withLocale("admin/roles"),
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  role.getRolesPage
);

// Update role permissions (AJAX)
router.post(
  "/:roleId/permissions",
  withLocale("admin/roles"),
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  doubleCsrfProtection,
  role.updateRolePermissions
);

// CRUD for Roles
router.post(
  "/",
  withLocale("admin/roles"),
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  doubleCsrfProtection,
  role.createRole
);
router.post(
  "/:roleId/update",
  withLocale("admin/roles"),
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  doubleCsrfProtection,
  role.updateRole
);
router.post(
  "/:roleId/delete",
  withLocale("admin/roles"),
  isLoggedInAndActive,
  checkPermission("manage_permissions"),
  doubleCsrfProtection,
  role.deleteRole
);

module.exports = router;
