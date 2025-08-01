// === Absolute / alias imports ===
const { db } = require("@db/db");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const { log, LOG_LEVELS } = require("@helpers/log");

const getUserOverviewPage = async (req, res) => {
  try {
    // Get total users
    const [totalUsers] = await db.query("SELECT COUNT(*) as total FROM users");

    // Get count of users by role
    const [roleStats] = await db.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

    res.render("pages/admin/user/overview", {
      totalUsers: totalUsers[0].total,
      roleStats,
    });
  } catch (error) {
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await log(
      `Kesalahan saat mengambil statistik user: ${error.message}`,
      LOG_LEVELS.ERROR,
      req.session?.user?.id,
      userAgent,
      clientIP
    );

    res.status(500).send("Internal Server Error");
  }
};

module.exports = { getUserOverviewPage };