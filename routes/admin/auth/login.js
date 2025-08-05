const { db } = require("@db/db");
const bcrypt = require("bcrypt");
const {
  LOG_LEVELS,
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
  ACTIVITY_STATUS,
} = require("@helpers/log");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const {
  generateOTP,
  createOTPSession,
  isDevelopmentBypass,
} = require("@helpers/emailOTP");
const { sendEmailSmart } = require("@helpers/queuedEmail");
const {
  asyncHandler,
  ValidationError,
  AuthenticationError,
  DatabaseError,
} = require("@middlewares/errorHandler");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Input validation with custom errors
  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Please provide a valid email address");
  }

  // Basic password length check (detailed validation only for new passwords)
  if (password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long");
  }

  let userRows;
  try {
    [userRows] = await db.query(
      `
      SELECT u.*, r.role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.role_id 
      WHERE u.email = ? AND u.deleted_at IS NULL
    `,
      [email]
    );
  } catch (dbError) {
    throw new DatabaseError(`Database query failed: ${dbError.message}`);
  }

  if (userRows.length === 0) {
    // Log failed login attempt
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await logUserActivity({
      activity: `Failed login attempt - email not found: ${email}`,
      actionType: ACTION_TYPES.LOGIN,
      resourceType: RESOURCE_TYPES.SESSION,
      status: ACTIVITY_STATUS.FAILURE,
      requestInfo: {
        ip: clientIP,
        userAgent: userAgent.userAgent,
        deviceType: userAgent.deviceType,
        browser: userAgent.browser,
        platform: userAgent.platform,
        method: req.method,
        url: req.originalUrl,
      },
      errorMessage: "Email not found in system",
      errorCode: "EMAIL_NOT_FOUND",
      metadata: {
        attemptedEmail: email,
        loginMethod: "password",
      },
      req,
      level: LOG_LEVELS.WARN,
    });

    throw new AuthenticationError("Invalid email or password");
  }

  const user = userRows[0];

  // Check if user account is active
  if (!user.is_active) {
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await logUserActivity({
      activity: `Inactive user attempted login: ${user.username}`,
      actionType: ACTION_TYPES.LOGIN,
      resourceType: RESOURCE_TYPES.SESSION,
      status: ACTIVITY_STATUS.FAILURE,
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
      errorMessage: "User account is deactivated",
      errorCode: "ACCOUNT_DEACTIVATED",
      metadata: {
        accountStatus: "inactive",
        loginMethod: "password",
      },
      req,
      level: LOG_LEVELS.WARN,
    });

    throw new AuthenticationError(
      "Your account has been deactivated. Please contact administrator."
    );
  }

  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    // Log invalid password attempt
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await logUserActivity({
      activity: `Failed login attempt - invalid password for user: ${user.username}`,
      actionType: ACTION_TYPES.LOGIN,
      resourceType: RESOURCE_TYPES.SESSION,
      status: ACTIVITY_STATUS.FAILURE,
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
      errorMessage: "Invalid password provided",
      errorCode: "INVALID_PASSWORD",
      metadata: {
        loginMethod: "password",
        accountStatus: "active",
      },
      req,
      level: LOG_LEVELS.WARN,
    });

    throw new AuthenticationError("Invalid email or password");
  }

  // Check if 2FA bypass is enabled for development
  if (isDevelopmentBypass()) {
    console.log("🔧 [2FA] Development bypass enabled - skipping OTP");

    // Load user permissions and complete login directly
    const userPermissions = await loadUserPermissions(user);

    // Set session with permissions
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
    };
    req.session.permissions = userPermissions;

    // Log successful login
    await logSuccessfulLogin(user, req);

    req.flash("success", "Berhasil login! (Development mode)");
    return res.redirect("/admin");
  }

  // 2FA Flow: Generate and send OTP
  try {
    const otp = generateOTP();
    const otpSession = createOTPSession(user, otp);

    // Store OTP session data
    req.session.pending2FA = otpSession;

    // Send OTP email via queue (non-blocking)
    const emailResult = await sendEmailSmart(
      "otp_email",
      user.email,
      otp,
      user.full_name,
      {
        metadata: {
          userId: user.id,
          loginAttempt: true,
          ipAddress: getClientIP(req),
          userAgent: getUserAgent(req).userAgent,
        },
      }
    );

    if (!emailResult.success) {
      console.error("❌ [2FA] Failed to queue OTP email:", emailResult.error);
      // Don't throw error - allow user to proceed and retry if needed
      console.warn(
        "⚠️ [2FA] Proceeding without email confirmation - user can request resend"
      );
    }

    // Log OTP generation
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await logUserActivity({
      activity: `OTP generated and sent to user: ${user.username}`,
      actionType: ACTION_TYPES.LOGIN,
      resourceType: RESOURCE_TYPES.SESSION,
      status: ACTIVITY_STATUS.INFO,
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
        loginMethod: "2fa_otp",
        otpExpiry: new Date(otpSession.expiresAt).toISOString(),
        emailQueued: emailResult.queued || false,
        emailMessageId: emailResult.messageId || null,
      },
      req,
    });

    // Flash message based on email result
    if (emailResult.success && emailResult.queued) {
      req.flash(
        "info",
        "OTP telah dikirim ke email Anda. Silakan periksa inbox dan masukkan kode OTP."
      );
    } else {
      req.flash(
        "warning",
        "OTP berhasil dibuat. Email sedang dikirim - silakan cek inbox Anda dan masukkan kode OTP di bawah."
      );
    }

    res.redirect("/admin/verify-otp");
  } catch (otpError) {
    console.error("❌ [2FA] OTP generation/sending failed:", otpError.message);
    throw new AuthenticationError("Failed to generate OTP. Please try again.");
  }
});

// Helper function to load user permissions
const loadUserPermissions = async (user) => {
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
    grantedPermissions.forEach((permission) => basePermissions.add(permission));

    // Remove revokes from base permissions
    revokedPermissions.forEach((permission) =>
      basePermissions.delete(permission)
    );

    userPermissions = Array.from(basePermissions);
  } catch (permissionError) {
    console.error(
      "❌ [LOGIN] Error loading user permissions:",
      permissionError.message
    );
    // Continue login without permissions - permissions will be empty array
  }

  return userPermissions;
};

// Helper function to log successful login
const logSuccessfulLogin = async (user, req) => {
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  await logUserActivity({
    activity: `User successfully logged in: ${user.username}`,
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
      loginMethod: isDevelopmentBypass() ? "password_dev" : "2fa_complete",
      sessionId: req.session.id,
      previousLogin: user.last_login,
    },
    req,
  });
};

module.exports = {
  login,
};
