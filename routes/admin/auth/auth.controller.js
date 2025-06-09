const { getLoginPage } = require("./getLoginPage");
const { getRegisterPage } = require("./getRegisterPage");
const { login } = require("./login");
const { logout } = require("./logout");

module.exports = { getLoginPage, getRegisterPage, logout, login };
