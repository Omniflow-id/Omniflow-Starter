// === Absolute / alias imports ===
const { db } = require("@db/db");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const { log, LOG_LEVELS } = require("@helpers/log");

const getAllUsersPage = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, username, email, full_name, role, is_active FROM users ORDER BY id"
    );

    // Add session user ID to prevent self-deactivation
    const usersWithSessionInfo = users.map((user) => ({
      ...user,
      session_user_id: req.session.user.id,
    }));

    res.render("pages/admin/user/index", { users: usersWithSessionInfo });
  } catch (error) {
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await log(
      `Kesalahan saat mengambil daftar user: ${error.message}`,
      LOG_LEVELS.ERROR,
      req.session?.user?.id,
      userAgent,
      clientIP
    );

    res.status(500).send("Internal Server Error");
  }
};

module.exports = { getAllUsersPage };