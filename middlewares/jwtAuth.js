const jwt = require("jsonwebtoken");

const config = require("@config");
const {
  asyncHandler,
  AuthenticationError,
} = require("@middlewares/errorHandler");

const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  const refreshToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

const verifyJWT = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  if (!token) {
    throw new AuthenticationError("Access token is required");
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AuthenticationError("Access token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new AuthenticationError("Invalid access token");
    }
    throw new AuthenticationError("Token verification failed");
  }
});

const verifyRefreshToken = asyncHandler(async (req, _res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AuthenticationError("Refresh token is required");
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AuthenticationError("Refresh token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new AuthenticationError("Invalid refresh token");
    }
    throw new AuthenticationError("Refresh token verification failed");
  }
});

module.exports = {
  generateTokens,
  verifyJWT,
  verifyRefreshToken,
};
