const { db } = require("../../db/db");
const bcrypt = require("bcrypt");
const { log, LOG_LEVELS } = require("../../helpers/log");
const UAParser = require("ua-parser-js");
const { getClientIP } = require("../../helpers/getClientIP");

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

  const ip = getClientIP(req);
  const parser = new UAParser(req.headers["user-agent"]);
  const userAgentData = (() => {
    const result = parser.getResult();
    return {
      deviceType:
        result.device.type || (result.device.vendor ? "Mobile" : "Desktop"),
      browser: `${result.browser.name} ${result.browser.version}`,
      platform: `${result.os.name} ${result.os.version}`,
    };
  })();

  try {
    const [userRows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (userRows.length === 0) {
      await log(
        `Failed login attempt for email: ${email}`,
        LOG_LEVELS.WARN,
        null,
        userAgentData,
        ip
      );
      req.flash("error", "Invalid credentials");
      return res.redirect("/login");
    }

    const user = userRows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      await log(
        `Invalid password attempt for user: ${user.username}`,
        LOG_LEVELS.WARN,
        user.id,
        userAgentData,
        ip
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

    await log(
      `User ${user.username} - ${user.role} logged IN`,
      LOG_LEVELS.INFO,
      user.id,
      userAgentData,
      ip
    );

    req.flash("success", "Berhasil login!");
    return res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);

    await log(
      `Login system error: ${err.message}`,
      LOG_LEVELS.ERROR,
      null,
      userAgentData,
      ip
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
    const ip = getClientIP(req);
    const parser = new UAParser(req.headers["user-agent"]);
    const result = parser.getResult();

    const userAgentData = {
      deviceType:
        result.device.type || (result.device.vendor ? "Mobile" : "Desktop"),
      browser: `${result.browser.name} ${result.browser.version}`,
      platform: `${result.os.name} ${result.os.version}`,
    };

    await log(
      `User ${user.username} - ${user.role} logged OUT`,
      LOG_LEVELS.INFO,
      user.id,
      userAgentData,
      ip
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
