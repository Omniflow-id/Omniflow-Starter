const bcrypt = require("bcrypt");

const { db } = require("@db/db");
const { log, LOG_LEVELS } = require("@helpers/log");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const {
  asyncHandler,
  ValidationError,
  AuthenticationError,
} = require("@middlewares/errorHandler");
const { generateTokens } = require("@middlewares/jwtAuth");

const indexAPI = (_req, res) => {
  res.status(200).json({
    message: "Success fetching the API",
    success: true,
    data: null,
  });
};

const loginAPI = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);

  if (users.length === 0) {
    throw new AuthenticationError("Invalid email or password");
  }

  const user = users[0];
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AuthenticationError("Invalid email or password");
  }

  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
  };

  const { accessToken, refreshToken } = generateTokens(payload);

  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);
  await log(
    `User ${user.username} logged in via API`,
    LOG_LEVELS.INFO,
    user.id,
    userAgent,
    clientIP
  );

  res.status(200).json({
    message: "Login successful",
    success: true,
    data: {
      user: payload,
      accessToken,
      refreshToken,
    },
  });
});

const refreshTokenAPI = asyncHandler(async (req, res) => {
  const payload = {
    id: req.user.id,
    email: req.user.email,
    username: req.user.username,
    full_name: req.user.full_name,
    role: req.user.role,
  };

  const { accessToken, refreshToken } = generateTokens(payload);

  res.status(200).json({
    message: "Token refreshed successfully",
    success: true,
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const protectedAPI = (req, res) => {
  res.status(200).json({
    message: "This is a protected API endpoint",
    success: true,
    data: {
      user: req.user,
    },
  });
};

module.exports = {
  indexAPI,
  loginAPI,
  refreshTokenAPI,
  protectedAPI,
};
