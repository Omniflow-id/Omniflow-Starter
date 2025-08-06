// === Third-party modules ===
const bcrypt = require("bcrypt");

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
const { validatePassword } = require("@helpers/passwordPolicy");
const { asyncHandler } = require("@middlewares/errorHandler");

const getChangePasswordPage = asyncHandler(async (req, res) => {
  res.render("pages/admin/userProfile/changePassword", {
    user: req.session.user,
    permissions: req.session.permissions,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.session.user.id;
  const ip = getClientIP(req);
  const userAgentData = getUserAgent(req);

  // Input validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    req.flash("error", "All fields are required");
    return res.redirect("/admin/change-password");
  }

  if (newPassword !== confirmPassword) {
    req.flash("error", "New passwords do not match");
    return res.redirect("/admin/change-password");
  }

  if (currentPassword === newPassword) {
    req.flash("error", "New password must be different from current password");
    return res.redirect("/admin/change-password");
  }

  // Get current user data
  const [users] = await db.query(
    "SELECT id, username, email, password_hash FROM users WHERE id = ?",
    [userId]
  );

  if (users.length === 0) {
    req.flash("error", "User not found");
    return res.redirect("/admin/change-password");
  }

  const user = users[0];

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password_hash
  );
  if (!isCurrentPasswordValid) {
    await logUserActivity({
      activity: `Failed password change - invalid current password: ${user.username}`,
      actionType: ACTION_TYPES.UPDATE,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: userId.toString(),
      status: ACTIVITY_STATUS.FAILURE,
      userId: userId,
      requestInfo: {
        ip,
        userAgent: userAgentData.userAgent,
        deviceType: userAgentData.deviceType,
        browser: userAgentData.browser,
        platform: userAgentData.platform,
        method: req.method,
        url: req.originalUrl,
      },
      errorMessage: "Current password verification failed",
      errorCode: "INVALID_CURRENT_PASSWORD",
      metadata: {
        passwordChangeAttempt: true,
        securityEvent: true,
      },
      req,
      level: LOG_LEVELS.WARN,
    });

    req.flash("error", "Current password is incorrect");
    return res.redirect("/admin/change-password");
  }

  // Validate new password against policy
  const passwordValidation = validatePassword(newPassword, {
    email: user.email,
    username: user.username,
  });

  if (!passwordValidation.isValid) {
    await logUserActivity({
      activity: `Password change failed - new password validation failed: ${user.username}`,
      actionType: ACTION_TYPES.UPDATE,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: userId.toString(),
      status: ACTIVITY_STATUS.FAILURE,
      userId: userId,
      requestInfo: {
        ip,
        userAgent: userAgentData.userAgent,
        deviceType: userAgentData.deviceType,
        browser: userAgentData.browser,
        platform: userAgentData.platform,
        method: req.method,
        url: req.originalUrl,
      },
      errorMessage: "New password does not meet security requirements",
      errorCode: "PASSWORD_VALIDATION_FAILED",
      metadata: {
        passwordErrors: passwordValidation.errors,
        passwordChangeAttempt: true,
      },
      req,
      level: LOG_LEVELS.WARN,
    });

    req.flash(
      "error",
      `Password requirements not met: ${passwordValidation.errors.join(", ")}`
    );
    return res.redirect("/admin/change-password");
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Update password in database
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  await db.query(
    "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
    [hashedNewPassword, now, userId]
  );

  // Log successful password change
  await logUserActivity({
    activity: `Password changed successfully: ${user.username}`,
    actionType: ACTION_TYPES.UPDATE,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: userId.toString(),
    status: ACTIVITY_STATUS.SUCCESS,
    userId: userId,
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
      before: { password_hash: "***masked***" },
      after: { password_hash: "***masked***", updated_at: now },
      changedFields: ["password_hash", "updated_at"],
    },
    metadata: {
      passwordChanged: true,
      securityEvent: true,
      changeMethod: "user_self_service",
    },
    req,
  });

  // Invalidate user-related caches
  await invalidateCache(`user:${userId}:*`, true);
  await invalidateCache("admin:users:*", true);

  req.flash("success", "Password changed successfully!");
  res.redirect("/admin/profile");
});

module.exports = {
  getChangePasswordPage,
  changePassword,
};
