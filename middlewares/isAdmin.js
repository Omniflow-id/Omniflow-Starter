const { db } = require("@db/db");
const { checkActiveUser } = require("@middlewares/checkActiveUser");

const isAdmin = async (req, res, next) => {
  if (req.session.user?.role_id) {
    try {
      const [roles] = await db.query(
        "SELECT role_name FROM roles WHERE role_id = ?",
        [req.session.user.role_id]
      );

      if (roles.length > 0 && roles[0].role_name === "Admin") {
        return next();
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      return res.status(500).send("Internal Server Error");
    }
  }
  res.redirect("/admin/login");
};

// Combined middleware: check Admin role AND active status
const isAdminAndActive = [isAdmin, checkActiveUser];

module.exports = {
  isAdmin,
  isAdminAndActive,
};

module.exports = {
  isAdmin,
  isAdminAndActive,
};
