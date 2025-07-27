const getRegisterPage = (_req, res) => {
  res.render("pages/auth/register");
};

module.exports = {
  getRegisterPage,
};
