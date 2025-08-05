const { createPermission } = require("./createPermission");
const { updatePermission } = require("./updatePermission");
const { deletePermission } = require("./deletePermission");
const getPermissionsPage = require("./getPermissionsPage");

module.exports = {
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionsPage,
};
