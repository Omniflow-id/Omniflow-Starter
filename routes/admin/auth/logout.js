const { LOG_LEVELS, log } = require("../../../helpers/log");
const { getClientIP } = require("../../../helpers/getClientIP");
const { getUserAgent } = require("../../../helpers/getUserAgent");

const logout = async (req, res) => {
  const user = req.session.user;

  if (user) {
    // Use middleware to log logout
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);
    await log(
      `Pengguna keluar: ${user.username}`,
      LOG_LEVELS.INFO,
      req.session?.user?.id || user.id,
      userAgent,
      clientIP
    );
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/login");
  });
};

module.exports = {
  logout,
};
