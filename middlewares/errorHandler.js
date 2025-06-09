const notFoundHandler = (req, res, next) => {
  res.status(404).render("pages/admin/errors/404");
};

module.exports = notFoundHandler;
