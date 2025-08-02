// === Absolute / alias imports ===
const { db } = require("@db/db");
const { handleCache } = require("@helpers/cache");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const { log, LOG_LEVELS } = require("@helpers/log");

const getAllUsersPage = async (req, res) => {
  try {
    // Use cache with 5-minute TTL for user list
    const result = await handleCache({
      key: "admin:users:list",
      ttl: 300, // 5 minutes
      dbQueryFn: async () => {
        const [users] = await db.query(
          "SELECT id, username, email, full_name, role, is_active FROM users ORDER BY id"
        );
        return users;
      },
    });

    // Add session user ID to prevent self-deactivation
    const usersWithSessionInfo = result.data.map((user) => ({
      ...user,
      session_user_id: req.session.user.id,
    }));

    // Add cache info to template data for debugging
    res.render("pages/admin/user/index", {
      users: usersWithSessionInfo,
      cacheInfo: {
        source: result.source,
        duration_ms: result.duration_ms,
      },
    });
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
