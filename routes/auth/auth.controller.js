const { db } = require("../../db/db");
const bcrypt = require("bcrypt");
const { LOG_LEVELS, log } = require("../../helpers/log");
const { getClientIP } = require("../../helpers/getClientIP");
const { getUserAgent } = require("../../helpers/getUserAgent");

const getLoginPage = (req, res) => {
  res.render("pages/auth/login");
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash("error", "Email and password are required");
    return res.redirect("/login");
  }

  if (password.length < 8) {
    req.flash("error", "Password must be at least 8 characters long");
    return res.redirect("/login");
  }

  try {
    const [userRows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (userRows.length === 0) {
      // Use middleware to log failed login attempt
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);
      await log(
        `Percobaan login gagal untuk email: ${email}`,
        LOG_LEVELS.WARN,
        req.session?.user?.id || null,
        userAgent,
        clientIP
      );

      req.flash("error", "Invalid credentials");
      return res.redirect("/login");
    }

    const user = userRows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      // Use middleware to log invalid password attempt
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);
      await log(
        `Percobaan password salah untuk pengguna: ${user.username}`,
        LOG_LEVELS.WARN,
        req.session?.user?.id || user.id,
        userAgent,
        clientIP
      );

      req.flash("error", "Invalid credentials");
      return res.redirect("/login");
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    // Use middleware to log successful login
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
    return res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);

    // Use middleware to log system error
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);
    await log(
      `Kesalahan sistem login: ${err.message}`,
      LOG_LEVELS.ERROR,
      req.session?.user?.id || null,
      userAgent,
      clientIP
    );

    req.flash("error", "An error occurred. Please try again later.");
    return res.redirect("/login");
  }
};

const getRegisterPage = (req, res) => {
  res.render("pages/auth/register");
};

const logout = async (req, res) => {
  const user = req.session.user;

  if (user) {
    // Use middleware to log logout
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);
    await log(
      `Pengguna keluar: ${user.username}`,
      LOG_LEVELS.INFO,
      req.session?.user?.id || user.id,
      userAgent,
      clientIP
    );
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/login");
  });
};

module.exports = { getLoginPage, getRegisterPage, logout, login };
