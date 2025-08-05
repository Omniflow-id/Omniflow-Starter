const { createRole } = require("./createRole");
const { updateRole } = require("./updateRole");
const { deleteRole } = require("./deleteRole");
const { getRolesPage } = require("./getRolesPage");
const { updateRolePermissions } = require("./updateRolePermissions");

module.exports = {
  createRole,
  updateRole,
  deleteRole,
  getRolesPage,
  updateRolePermissions,
};
