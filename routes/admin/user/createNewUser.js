// === Third-party modules ===
const bcrypt = require("bcrypt");

// === Absolute / alias imports ===
const { db } = require("@db/db");
const { invalidateCache } = require("@helpers/cache");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const { log, LOG_LEVELS } = require("@helpers/log");
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
      await log(
        `Invalid role "${role}" selected by ${req.session.user.username}`,
        LOG_LEVELS.WARN,
        req.session.user.id,
        userAgentData,
        ip
      );
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
      await log(
        `Generated password failed validation for user ${username}: ${passwordValidation.errors.join(", ")}`,
        LOG_LEVELS.ERROR,
        req.session.user.id,
        userAgentData,
        ip
      );
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
      await log(
        `Failed to create user - email ${email} already exists (attempted by ${req.session.user.username})`,
        LOG_LEVELS.WARN,
        req.session.user.id,
        userAgentData,
        ip
      );
      req.flash("error", "Email already exists!");
      return res.redirect("/admin/user/index");
    }

    await db.query(
      "INSERT INTO users (username, email, full_name, role, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [username, email, full_name, role, hashedPassword, true, now, now]
    );

    await log(
      `User ${username} (${role}) created with generated password by ${req.session.user.username}`,
      LOG_LEVELS.INFO,
      req.session.user.id,
      userAgentData,
      ip
    );

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
    await log(
      `Failed to create user ${username}: ${err.message} (by ${req.session.user.username})`,
      LOG_LEVELS.ERROR,
      req.session.user.id,
      userAgentData,
      ip
    );
    req.flash("error", `Error creating user: ${err.message}`);
    res.redirect("/admin/user/index");
  }
};

module.exports = { createNewUser };
