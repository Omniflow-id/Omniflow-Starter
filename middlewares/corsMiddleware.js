// === Third-party modules ===
const cors = require("cors");

// === Absolute / alias imports ===
const config = require("@config");

/**
 * CORS Configuration Middleware
 *
 * Provides comprehensive Cross-Origin Resource Sharing (CORS) configuration
 * with environment-based settings for development and production environments.
 *
 * Features:
 * - Environment-aware origin configuration
 * - Credential support for authenticated requests
 * - Configurable methods and headers
 * - Custom preflight handling
 * - Security-focused defaults for production
 *
 * Environment Variables:
 * - CORS_ENABLED: Enable/disable CORS (default: true)
 * - CORS_ORIGIN: Allowed origins (default: "*" in dev, specific in prod)
 * - CORS_CREDENTIALS: Allow credentials (default: false)
 * - CORS_METHODS: Allowed HTTP methods
 * - CORS_ALLOWED_HEADERS: Allowed request headers
 * - CORS_EXPOSED_HEADERS: Headers exposed to client
 * - CORS_MAX_AGE: Preflight cache duration in seconds
 * - CORS_PREFLIGHT_CONTINUE: Pass preflight to next handler
 * - CORS_OPTIONS_SUCCESS_STATUS: Status code for successful OPTIONS requests
 */

const createCorsMiddleware = () => {
  if (!config.cors.enabled) {
    return (_req, _res, next) => next();
  }

  // Parse origin configuration
  let origin = config.cors.origin;
  if (origin && origin !== "*") {
    // Support comma-separated origins
    origin = origin.includes(",")
      ? origin.split(",").map((o) => o.trim())
      : origin;
  }

  // Parse methods
  const methods = config.cors.methods.split(",").map((m) => m.trim());

  // Parse allowed headers
  const allowedHeaders = config.cors.allowedHeaders
    ? config.cors.allowedHeaders.split(",").map((h) => h.trim())
    : undefined;

  // Parse exposed headers
  const exposedHeaders = config.cors.exposedHeaders
    ? config.cors.exposedHeaders.split(",").map((h) => h.trim())
    : undefined;

  const corsOptions = {
    origin: origin,
    credentials: config.cors.credentials,
    methods: methods,
    allowedHeaders: allowedHeaders,
    exposedHeaders: exposedHeaders,
    maxAge: config.cors.maxAge,
    preflightContinue: config.cors.preflightContinue,
    optionsSuccessStatus: config.cors.optionsSuccessStatus,
  };

  // Development logging
  if (config.app.env === "development") {
    console.log("🔗 [CORS] Configuration:", {
      enabled: config.cors.enabled,
      origin: origin,
      credentials: config.cors.credentials,
      methods: methods,
      allowedHeaders: allowedHeaders,
      exposedHeaders: exposedHeaders,
    });
  }

  return cors(corsOptions);
};

module.exports = {
  createCorsMiddleware,
};
