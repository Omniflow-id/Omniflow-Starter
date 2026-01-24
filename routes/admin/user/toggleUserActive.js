// === Absolute / alias imports ===
const { db } = require("@db/db");
const { invalidateCache } = require("@helpers/cache");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const {
  LOG_LEVELS,
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
  ACTIVITY_STATUS,
} = require("@helpers/log");

const toggleUserActive = async (req, res) => {
  const userId = req.params.id;

  const ip = getClientIP(req);
  const userAgentData = getUserAgent(req);

  try {
    // Check if trying to deactivate own account
    if (parseInt(userId, 10) === req.session.user.id) {
      req.flash("error", "Cannot deactivate your own account");
      return res.redirect("/admin/user/index");
    }

    // Get current user data for change tracking
    const [users] = await db.query(
      "SELECT u.id, u.username, u.email, u.full_name, r.role_name as role, u.is_active, u.updated_at FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.id = ? AND u.deleted_at IS NULL",
      [userId]
    );

    if (users.length === 0) {
      req.flash("error", "User not found");
      return res.redirect("/admin/user/index");
    }

    const targetUser = users[0];
    const oldData = { ...targetUser };
    const newStatus = !targetUser.is_active;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Update user status
    await db.query(
      "UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?",
      [newStatus, now, userId]
    );

    const newData = {
      ...targetUser,
      is_active: newStatus,
      updated_at: now,
    };

    await logUserActivity({
      activity: `User ${targetUser.username} ${newStatus ? "activated" : "deactivated"}`,
      actionType: ACTION_TYPES.UPDATE,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: userId,
      status: ACTIVITY_STATUS.SUCCESS,
      userId: req.session.user.id,
      requestInfo: {
        ip,
        userAgent: userAgentData.userAgent,
        deviceType: userAgentData.deviceType,
        browser: userAgentData.browser,
        platform: userAgentData.platform,
        method: req.method,
        url: req.originalUrl,
      },
      dataChanges: {
        oldData,
        newData,
        excludeFields: ["updated_at"], // Exclude timestamp from change tracking
        maskSensitive: true,
      },
      metadata: {
        statusChange: {
          from: targetUser.is_active ? "active" : "inactive",
          to: newStatus ? "active" : "inactive",
        },
        targetUser: {
          username: targetUser.username,
          email: targetUser.email,
          role: targetUser.role,
        },
        actionBy: req.session.user.username,
        reason: "admin_action",
      },
      req,
    });

    // Invalidate user-related caches after status change
    await invalidateCache("users:*", true);
    await invalidateCache("datatable:users:*", true); // DataTable cache
    await invalidateCache(`users:${userId}:*`, true);

    req.flash(
      "success",
      `User ${targetUser.username} has been ${newStatus ? "activated" : "deactivated"} successfully`
    );
    res.redirect("/admin/user/index");
  } catch (error) {
    await logUserActivity({
      activity: `Failed to toggle user active status for user ID: ${userId}`,
      actionType: ACTION_TYPES.UPDATE,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: userId,
      status: ACTIVITY_STATUS.FAILURE,
      userId: req.session.user.id,
      requestInfo: {
        ip,
        userAgent: userAgentData.userAgent,
        deviceType: userAgentData.deviceType,
        browser: userAgentData.browser,
        platform: userAgentData.platform,
        method: req.method,
        url: req.originalUrl,
      },
      errorMessage: error.message,
      errorCode: error.code || "USER_STATUS_UPDATE_FAILED",
      metadata: {
        targetUserId: userId,
        actionBy: req.session.user.username,
        errorDetails: error.name,
      },
      req,
      level: LOG_LEVELS.ERROR,
    });
    req.flash("error", "An error occurred while updating user status");
    res.redirect("/admin/user/index");
  }
};

module.exports = { toggleUserActive };
