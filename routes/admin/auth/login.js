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
    [userRows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
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
        role: user.role,
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
        role: user.role,
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

  // Set session
  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  // Log successful login
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
      role: user.role,
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
      loginMethod: "password",
      sessionId: req.session.id,
      previousLogin: user.last_login,
    },
    req,
  });

  req.flash("success", "Berhasil login!");
  res.redirect("/admin");
});

module.exports = {
  login,
};
