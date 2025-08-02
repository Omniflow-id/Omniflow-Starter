// === Absolute / alias imports ===
const { checkActiveUser } = require("@middlewares/checkActiveUser");

const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "Admin") {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

// Combined middleware: check Admin role AND active status
const isAdminAndActive = [isAdmin, checkActiveUser];

module.exports = {
  isAdmin,
  isAdminAndActive,
};
