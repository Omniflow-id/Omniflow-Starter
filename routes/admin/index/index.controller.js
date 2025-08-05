const getAdminPage = (_req, res) => {
  res.render("pages/admin/index/index");
};

const getOverviewPage = (_req, res) => {
  res.render("pages/admin/index/overview");
};

const getSubModulePage = (_req, res) => {
  res.render("pages/admin/index/submodule");
};

module.exports = {
  getAdminPage,
  getOverviewPage,
  getSubModulePage,
};
