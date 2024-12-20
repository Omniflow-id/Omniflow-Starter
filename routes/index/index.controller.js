const getAdminPage = (req, res) => {
  res.render("pages/index/index");
};

const getOverviewPage = (req, res) => {
  res.render("pages/index/overview");
};

const getSubModulePage = (req, res) => {
  res.render("pages/index/subModule");
};

module.exports = {
  getAdminPage,
  getOverviewPage,
  getSubModulePage,
};
