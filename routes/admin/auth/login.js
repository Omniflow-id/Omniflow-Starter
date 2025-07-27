const { db } = require("../../../db/db");
const bcrypt = require("bcrypt");
const { LOG_LEVELS, log } = require("../../../helpers/log");
const { getClientIP } = require("../../../helpers/getClientIP");
const { getUserAgent } = require("../../../helpers/getUserAgent");
const { asyncHandler, ValidationError, AuthenticationError, DatabaseError } = require("../../../middlewares/errorHandler");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Input validation with custom errors
  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  if (password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long");
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Please provide a valid email address");
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
    await log(
      `Percobaan login gagal untuk email: ${email}`,
      LOG_LEVELS.WARN,
      req.session?.user?.id || null,
      userAgent,
      clientIP
    );

    throw new AuthenticationError("Invalid email or password");
  }

  const user = userRows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    // Log invalid password attempt
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);
    await log(
      `Percobaan password salah untuk pengguna: ${user.username}`,
      LOG_LEVELS.WARN,
      req.session?.user?.id || user.id,
      userAgent,
      clientIP
    );

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
  await log(
    `Pengguna berhasil masuk: ${user.username}`,
    LOG_LEVELS.INFO,
    req.session?.user?.id || user.id,
    userAgent,
    clientIP
  );

  req.flash("success", "Berhasil login!");
  res.redirect("/admin");
});

module.exports = {
  login,
};
