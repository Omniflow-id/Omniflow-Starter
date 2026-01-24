// === Relative imports ===
const { getUserOverviewPage } = require("./getUserOverviewPage");
const { getAllUsersPage } = require("./getAllUsersPage");
const { downloadUserData } = require("./downloadUserData");
const { downloadUserTemplate } = require("./downloadUserTemplate");
const { uploadNewUser } = require("./uploadNewUser");
const { createNewUser } = require("./createNewUser");
const { toggleUserActive } = require("./toggleUserActive");
const { showGeneratedPasswordsPage } = require("./showGeneratedPasswordsPage");
const { getUserPermissionsPage } = require("./getUserPermissionsPage");
const { updateUserPermissions } = require("./updateUserPermissions");

const { deleteUser } = require("./deleteUser");

module.exports = {
  getUserOverviewPage,
  getAllUsersPage,
  downloadUserData,
  downloadUserTemplate,
  uploadNewUser,
  createNewUser,
  toggleUserActive,
  showGeneratedPasswordsPage,
  getUserPermissionsPage,
  updateUserPermissions,
  deleteUser,
};
