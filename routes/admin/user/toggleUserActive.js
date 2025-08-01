// === Absolute / alias imports ===
const { db } = require("@db/db");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const { log, LOG_LEVELS } = require("@helpers/log");

const toggleUserActive = async (req, res) => {
  const userId = req.params.id;

  const ip = getClientIP(req);
  const userAgentData = getUserAgent(req);

  try {
    // Check if trying to deactivate own account
    if (parseInt(userId) === req.session.user.id) {
      req.flash("error", "Cannot deactivate your own account");
      return res.redirect("/admin/user/index");
    }

    // Get current user status
    const [users] = await db.query(
      "SELECT username, is_active FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      req.flash("error", "User not found");
      return res.redirect("/admin/user/index");
    }

    const targetUser = users[0];
    const newStatus = !targetUser.is_active;

    // Update user status
    await db.query("UPDATE users SET is_active = ? WHERE id = ?", [
      newStatus,
      userId,
    ]);

    await log(
      `User ${targetUser.username} ${newStatus ? "activated" : "deactivated"} by ${req.session.user.username}`,
      LOG_LEVELS.INFO,
      req.session.user.id,
      userAgentData,
      ip
    );

    req.flash(
      "success",
      `User ${targetUser.username} has been ${newStatus ? "activated" : "deactivated"} successfully`
    );
    res.redirect("/admin/user/index");
  } catch (error) {
    await log(
      `Error toggling user active status: ${error.message}`,
      LOG_LEVELS.ERROR,
      req.session.user.id,
      userAgentData,
      ip
    );
    req.flash("error", "An error occurred while updating user status");
    res.redirect("/admin/user/index");
  }
};

module.exports = { toggleUserActive };