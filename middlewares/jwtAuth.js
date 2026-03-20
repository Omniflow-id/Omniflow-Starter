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
    throw new AuthenticationError("common.errors.accessTokenRequired");
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AuthenticationError("common.errors.accessTokenExpired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new AuthenticationError("common.errors.invalidAccessToken");
    }
    throw new AuthenticationError("common.errors.tokenVerificationFailed");
  }
});

const verifyRefreshToken = asyncHandler(async (req, _res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AuthenticationError("common.errors.refreshTokenRequired");
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AuthenticationError("common.errors.refreshTokenExpired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new AuthenticationError("common.errors.invalidRefreshToken");
    }
    throw new AuthenticationError("common.errors.refreshTokenVerificationFailed");
  }
});

module.exports = {
  generateTokens,
  verifyJWT,
  verifyRefreshToken,
};
