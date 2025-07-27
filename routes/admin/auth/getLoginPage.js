const getLoginPage = (_req, res) => {
  res.render("pages/admin/auth/login");
};

module.exports = {
  getLoginPage,
};
