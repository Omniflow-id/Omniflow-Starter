// === Relative imports ===
const { getUserOverviewPage } = require("./getUserOverviewPage");
const { getAllUsersPage } = require("./getAllUsersPage");
const { downloadUserData } = require("./downloadUserData");
const { downloadUserTemplate } = require("./downloadUserTemplate");
const { uploadNewUser } = require("./uploadNewUser");
const { createNewUser } = require("./createNewUser");
const { toggleUserActive } = require("./toggleUserActive");
const { showGeneratedPasswordsPage } = require("./showGeneratedPasswordsPage");

module.exports = {
  getUserOverviewPage,
  getAllUsersPage,
  downloadUserData,
  downloadUserTemplate,
  uploadNewUser,
  createNewUser,
  toggleUserActive,
  showGeneratedPasswordsPage,
};