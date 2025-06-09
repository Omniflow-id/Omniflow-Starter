const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

module.exports = {
  isLoggedIn,
};
