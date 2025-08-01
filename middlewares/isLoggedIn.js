// === Absolute / alias imports ===
const { checkActiveUser } = require("@middlewares/checkActiveUser");

const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

// Combined middleware: check login AND active status
const isLoggedInAndActive = [isLoggedIn, checkActiveUser];

module.exports = {
  isLoggedIn,
  isLoggedInAndActive,
};
