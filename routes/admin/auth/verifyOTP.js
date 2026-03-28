// === Absolute / alias imports ===
const {
  LOG_LEVELS,
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
  ACTIVITY_STATUS,
} = require("@helpers/log");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const { verifyOTP, isDevelopmentBypass } = require("@helpers/emailOTP");
const {
  asyncHandler,
  ValidationError,
  AuthenticationError,
} = require("@middlewares/errorHandler");

// GET /admin/verify-otp - Show OTP input form
const getVerifyOTP = asyncHandler(async (req, res) => {
  // Check if there's a pending 2FA session
  if (!req.session.pending2FA) {
    req.flash("error", "messages.pendingOtpMissing");
    return res.redirect("/admin/login");
  }

  // Check if OTP has expired
  if (Date.now() > req.session.pending2FA.expiresAt) {
    delete req.session.pending2FA;
    req.flash("error", "messages.otpExpiredLoginAgain");
    return res.redirect("/admin/login");
  }

  const timeRemaining = Math.ceil(
    (req.session.pending2FA.expiresAt - Date.now()) / 1000
  );

  res.render("pages/admin/auth/verify-otp", {
    title: res.locals.t("verifyOtp.pageTitle"),
    userEmail: req.session.pending2FA.email,
    timeRemaining,
    isDevelopment: isDevelopmentBypass(),
  });
});

// POST /admin/verify-otp - Verify OTP code
const postVerifyOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  // Check if there's a pending 2FA session
  if (!req.session.pending2FA) {
    req.flash("error", "messages.pendingOtpMissing");
    return res.redirect("/admin/login");
  }

  const pending2FA = req.session.pending2FA;

  // Development bypass
  if (isDevelopmentBypass()) {
    console.log(
      "🔧 [2FA] Development bypass enabled - skipping OTP verification"
    );

    // Load user permissions and complete login
    const { db } = require("@db/db");
    const [userRows] = await db.query(
      "SELECT * FROM users WHERE id = ? AND deleted_at IS NULL",
      [pending2FA.userId]
    );

    if (userRows.length === 0) {
      delete req.session.pending2FA;
      throw new AuthenticationError("messages.accountNotFoundLoginAgain");
    }

    const user = userRows[0];
    const userPermissions = await loadUserPermissions(user);

    // Regenerate session ID to prevent session fixation
    return req.session.regenerate((err) => {
      if (err) {
        console.error("❌ [SESSION] Failed to regenerate session:", err.message);
        throw new AuthenticationError("Session regeneration failed");
      }

      // Set session after regeneration
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
      };
      req.session.permissions = userPermissions;

      // Clean up pending 2FA (note: no longer in session after regenerate)
      // (pending2FA is automatically cleared on regenerate)

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("❌ [SESSION] Failed to save session:", saveErr.message);
          throw new AuthenticationError("Session save failed");
        }

        // Log successful login and redirect after session regeneration
        logSuccessfulLogin(user, req, "2fa_dev_bypass").then(() => {
          req.flash("success", "messages.loginSuccessOtpBypass");
          res.redirect("/admin");
        }).catch((logError) => {
          console.error("❌ [2FA] Failed to log successful login:", logError.message);
          req.flash("success", "messages.loginSuccessOtpBypass");
          res.redirect("/admin");
        });
      });
    });
  }

  // Validate OTP input
  if (!otp) {
    throw new ValidationError("messages.otpCodeRequired");
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new ValidationError("messages.otpMustBe6Digits");
  }

  // Verify OTP
  const verification = verifyOTP(otp, pending2FA.otp, pending2FA.expiresAt);

  if (!verification.valid) {
    // Log failed OTP attempt
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await logUserActivity({
      activity: `Failed OTP verification for user: ${pending2FA.username}`,
      actionType: ACTION_TYPES.LOGIN,
      resourceType: RESOURCE_TYPES.SESSION,
      status: ACTIVITY_STATUS.FAILURE,
      userId: pending2FA.userId,
      userInfo: {
        username: pending2FA.username,
        email: pending2FA.email,
        role_id: pending2FA.role_id,
      },
      requestInfo: {
        ip: clientIP,
        userAgent: userAgent.userAgent,
        deviceType: userAgent.deviceType,
        browser: userAgent.browser,
        platform: userAgent.platform,
        method: req.method,
        url: req.originalUrl,
      },
      errorMessage: verification.reason,
      errorCode: "INVALID_OTP",
      metadata: {
        loginMethod: "2fa_otp",
        otpAttempt: otp,
        failureReason: verification.reason,
      },
      req,
      level: LOG_LEVELS.WARN,
    });

    throw new ValidationError(verification.reason);
  }

  // OTP is valid - complete login
  try {
    const { db } = require("@db/db");

    // Get fresh user data
    const [userRows] = await db.query(
      `
      SELECT u.*, r.role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.role_id 
      WHERE u.id = ? AND u.deleted_at IS NULL
    `,
      [pending2FA.userId]
    );

    if (userRows.length === 0) {
      delete req.session.pending2FA;
      throw new AuthenticationError("messages.accountNotFoundLoginAgain");
    }

    const user = userRows[0];

    // Check if user is still active
    if (!user.is_active) {
      delete req.session.pending2FA;
      throw new AuthenticationError("messages.accountDeactivatedContactAdmin");
    }

    // Load user permissions
    const userPermissions = await loadUserPermissions(user);

    // Regenerate session ID to prevent session fixation
    return req.session.regenerate((err) => {
      if (err) {
        console.error("❌ [SESSION] Failed to regenerate session:", err.message);
        throw new AuthenticationError("Session regeneration failed");
      }

      // Set session with permissions after regeneration
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
      };
      req.session.permissions = userPermissions;

      // Clean up pending 2FA session (note: automatically cleared on regenerate)
      // (pending2FA is automatically cleared on regenerate)

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("❌ [SESSION] Failed to save session:", saveErr.message);
          throw new AuthenticationError("Session save failed");
        }

        // Log successful 2FA completion and redirect
        logSuccessfulLogin(user, req, "2fa_complete").then(() => {
          req.flash("success", "messages.otpVerifiedWelcome");
          res.redirect("/admin");
        }).catch((logError) => {
          console.error("❌ [2FA] Failed to log successful login:", logError.message);
          req.flash("success", "messages.otpVerifiedWelcome");
          res.redirect("/admin");
        });
      });
    });
  } catch (error) {
    // Clean up pending 2FA on any error
    delete req.session.pending2FA;
    throw error;
  }
});

// Helper function to load user permissions (same as in login.js)
const loadUserPermissions = async (user) => {
  const { db } = require("@db/db");
  let userPermissions = [];

  try {
    // Get base permissions from role_permissions
    const [rolePermissions] = await db.query(
      `
      SELECT DISTINCT p.permission_name 
      FROM permissions p 
      JOIN role_permissions rp ON p.permission_id = rp.permission_id 
      WHERE rp.role_id = ? AND p.deleted_at IS NULL
    `,
      [user.role_id]
    );

    // Get user-specific permission overrides (both grants and revokes)
    const [userPermissionOverrides] = await db.query(
      `
      SELECT DISTINCT p.permission_name, up.is_revoked
      FROM permissions p
      JOIN user_permissions up ON p.permission_id = up.permission_id
      WHERE up.user_id = ? AND p.deleted_at IS NULL
    `,
      [user.id]
    );

    // Start with role permissions
    const basePermissions = new Set(
      rolePermissions.map((p) => p.permission_name)
    );

    // Apply user-specific grants (additional permissions)
    const grantedPermissions = userPermissionOverrides
      .filter((p) => !p.is_revoked)
      .map((p) => p.permission_name);

    // Apply user-specific revokes (remove role permissions)
    const revokedPermissions = userPermissionOverrides
      .filter((p) => p.is_revoked)
      .map((p) => p.permission_name);

    // Add grants to base permissions
    grantedPermissions.forEach((permission) => {
      basePermissions.add(permission);
    });

    // Remove revokes from base permissions
    revokedPermissions.forEach((permission) => {
      basePermissions.delete(permission);
    });

    userPermissions = Array.from(basePermissions);
  } catch (permissionError) {
    console.error(
      "❌ [2FA] Error loading user permissions:",
      permissionError.message
    );
    // Continue login without permissions - permissions will be empty array
  }

  return userPermissions;
};

// Helper function to log successful login
const logSuccessfulLogin = async (user, req, loginMethod = "2fa_complete") => {
  const { getClientIP } = require("@helpers/getClientIP");
  const { getUserAgent } = require("@helpers/getUserAgent");

  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  await logUserActivity({
    activity: `User successfully completed 2FA login: ${user.username}`,
    actionType: ACTION_TYPES.LOGIN,
    resourceType: RESOURCE_TYPES.SESSION,
    resourceId: req.session.id,
    status: ACTIVITY_STATUS.SUCCESS,
    userId: user.id,
    userInfo: {
      username: user.username,
      email: user.email,
      role: user.role_name,
    },
    requestInfo: {
      ip: clientIP,
      userAgent: userAgent.userAgent,
      deviceType: userAgent.deviceType,
      browser: userAgent.browser,
      platform: userAgent.platform,
      method: req.method,
      url: req.originalUrl,
    },
    metadata: {
      loginMethod,
      sessionId: req.session.id,
      previousLogin: user.last_login,
      authenticationSteps: ["password", "otp"],
    },
    req,
  });
};

module.exports = {
  getVerifyOTP,
  postVerifyOTP,
};
