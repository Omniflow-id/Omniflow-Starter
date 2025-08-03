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
const {
  generatePredictablePassword,
  validatePassword,
} = require("@helpers/passwordPolicy");

const createNewUser = async (req, res) => {
  const { username, email, full_name, role } = req.body;

  const ip = getClientIP(req);
  const userAgentData = getUserAgent(req);

  try {
    // Input validation
    if (!username || !email || !full_name || !role) {
      req.flash("error", "All fields are required");
      return res.redirect("/admin/user/index");
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.flash("error", "Please provide a valid email address");
      return res.redirect("/admin/user/index");
    }

    // Role validation
    const validRoles = ["Admin", "Manager", "User"];
    if (!validRoles.includes(role)) {
      await logUserActivity({
        activity: `Invalid role selection attempted: ${role}`,
        actionType: ACTION_TYPES.CREATE,
        resourceType: RESOURCE_TYPES.USER,
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
        errorMessage: "Invalid role selected",
        errorCode: "INVALID_ROLE",
        metadata: {
          attemptedRole: role,
          validRoles,
          formData: { username, email, full_name },
        },
        req,
        level: LOG_LEVELS.WARN,
      });
      req.flash("error", "Invalid role selected");
      return res.redirect("/admin/user/index");
    }

    // Generate predictable password from full name
    const generatedPassword = generatePredictablePassword(full_name);
    if (!generatedPassword) {
      req.flash("error", "Could not generate password from full name");
      return res.redirect("/admin/user/index");
    }

    // Validate generated password against policy (skip email/username checks for generated passwords)
    const passwordValidation = validatePassword(generatedPassword);

    if (!passwordValidation.isValid) {
      await logUserActivity({
        activity: `Generated password failed validation for user: ${username}`,
        actionType: ACTION_TYPES.CREATE,
        resourceType: RESOURCE_TYPES.USER,
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
        errorMessage: "Generated password does not meet security requirements",
        errorCode: "PASSWORD_VALIDATION_FAILED",
        metadata: {
          passwordErrors: passwordValidation.errors,
          formData: { username, email, full_name, role },
        },
        req,
        level: LOG_LEVELS.ERROR,
      });
      req.flash(
        "error",
        "Generated password does not meet security requirements"
      );
      return res.redirect("/admin/user/index");
    }

    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Check if email exists
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      await logUserActivity({
        activity: `Failed to create user - email already exists: ${email}`,
        actionType: ACTION_TYPES.CREATE,
        resourceType: RESOURCE_TYPES.USER,
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
        errorMessage: "Email already exists in system",
        errorCode: "EMAIL_ALREADY_EXISTS",
        metadata: {
          duplicateEmail: email,
          existingUserId: existingUser[0].id,
          formData: { username, email, full_name, role },
        },
        req,
        level: LOG_LEVELS.WARN,
      });
      req.flash("error", "Email already exists!");
      return res.redirect("/admin/user/index");
    }

    const [result] = await db.query(
      "INSERT INTO users (username, email, full_name, role, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [username, email, full_name, role, hashedPassword, true, now, now]
    );

    const newUserId = result.insertId;
    const createdUserData = {
      id: newUserId,
      username,
      email,
      full_name,
      role,
      password_hash: hashedPassword, // Will be masked
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    await logUserActivity({
      activity: `Created new user: ${username} (${role})`,
      actionType: ACTION_TYPES.CREATE,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: newUserId.toString(),
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
        newData: createdUserData,
        maskSensitive: true, // Will mask password_hash
      },
      metadata: {
        creationMethod: "admin_panel",
        passwordGenerated: true,
        passwordPattern: "predictable",
        generatedBy: req.session.user.username,
      },
      req,
    });

    // Invalidate user-related caches
    await invalidateCache("admin:users:*", true);
    await invalidateCache("user:*", true);

    // Store generated password for display
    req.session.singleUserPassword = {
      username: username,
      email: email,
      full_name: full_name,
      role: role,
      generatedPassword: generatedPassword,
    };

    req.flash(
      "success",
      `User created successfully! Generated password: ${generatedPassword}`
    );
    res.redirect("/admin/user/index");
  } catch (err) {
    await logUserActivity({
      activity: `Failed to create user: ${username || "unknown"}`,
      actionType: ACTION_TYPES.CREATE,
      resourceType: RESOURCE_TYPES.USER,
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
      errorMessage: err.message,
      errorCode: err.code || "USER_CREATION_FAILED",
      metadata: {
        formData: { username, email, full_name, role },
        errorDetails: err.name,
        createdBy: req.session.user.username,
      },
      req,
      level: LOG_LEVELS.ERROR,
    });
    req.flash("error", `Error creating user: ${err.message}`);
    res.redirect("/admin/user/index");
  }
};

module.exports = { createNewUser };
