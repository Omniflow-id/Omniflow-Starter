const getAdminPage = (req, res) => {
  res.render("pages/admin/index/index");
};

module.exports = {
  getAdminPage,
};
