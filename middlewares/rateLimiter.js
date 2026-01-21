// === Third-party modules ===
const rateLimit = require("express-rate-limit");

// === Absolute / alias imports ===
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const { log, LOG_LEVELS } = require("@helpers/log");
const config = require("@config");
const { RedisStore } = require("rate-limit-redis");
const { getRedis } = require("@db/redis");

// Factory function to create unique Redis stores for each limiter
const createStore = (prefix) => {
  if (!config.redis?.enabled) return undefined;

  return new RedisStore({
    sendCommand: async (...args) => {
      const client = getRedis();
      if (!client) {
        console.error("❌ [RATE-LIMIT] Redis client is null but redis is enabled!");
        return null; // This causes the TypeError
      }
      try {
        const result = await client.call(...args);
        return result;
      } catch (err) {
        console.error("❌ [RATE-LIMIT] Redis call error:", err);
        throw err;
      }
    },
    // Ensure prefix ends with a colon if not provided
    prefix: prefix ? `${prefix}:` : "rl:",
  });
};

// Use express-rate-limit's built-in IP key generator for proper IPv6 handling
// const keyGenerator = rateLimit.default?.keyGenerator || ((req) => req.ip);

// Basic rate limiter - general requests
const generalLimiter = rateLimit({
  store: createStore("rl:general"),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for static assets to prevent spam
    const staticExtensions = [
      ".css",
      ".js",
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".ico",
      ".svg",
      ".woff",
      ".woff2",
      ".ttf",
    ];
    return staticExtensions.some((ext) => req.path.toLowerCase().endsWith(ext));
  },
  handler: async (req, res) => {
    try {
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);
      log(
        `Rate limit exceeded for IP: ${req.ip}`,
        LOG_LEVELS.WARN,
        req.session?.user?.id || null,
        userAgent,
        clientIP
      );
    } catch (logError) {
      console.error("Rate limit logging error:", logError.message);
    }

    // Check if it's an API request (JSON expected)
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(429).json({
        success: false,
        error: {
          message:
            "Too many requests from this IP, please try again after 15 minutes.",
          code: "RATE_LIMIT_EXCEEDED",
        },
      });
    }

    // For web requests, render error page (skip flash if not available)
    try {
      if (req.flash) {
        req.flash(
          "error",
          "Too many requests from this IP, please try again after 15 minutes."
        );
      }
    } catch (flashError) {
      console.error("Flash error in rate limiter:", flashError.message);
    }

    return res.status(429).render("pages/admin/errors/429", {
      title: "Rate Limit Exceeded",
      errorCode: 429,
      errorMessage: "Too Many Requests",
      errorDescription:
        "You have made too many requests. Please wait before trying again.",
      error_msg: [
        "Too many requests from this IP, please try again after 15 minutes.",
      ],
    });
  },
});

// Strict rate limiter - authentication endpoints
const authLimiter = rateLimit({
  store: createStore("rl:auth"),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    error:
      "Too many login attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    try {
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);
      log(
        `Login rate limit exceeded for IP: ${req.ip}`,
        LOG_LEVELS.WARN,
        req.session?.user?.id || null,
        userAgent,
        clientIP
      );
    } catch (logError) {
      console.error("Rate limit logging error:", logError.message);
    }

    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(429).json({
        success: false,
        error: {
          message:
            "Too many login attempts from this IP, please try again after 15 minutes.",
          code: "AUTH_RATE_LIMIT_EXCEEDED",
        },
      });
    }

    try {
      if (req.flash) {
        req.flash(
          "error",
          "Too many login attempts. Please try again after 15 minutes."
        );
        console.log("🔥 Flash message set in rate limiter");
        // Save session before redirect to ensure flash message persists
        return req.session.save((err) => {
          if (err) {
            console.error("Session save error in rate limiter:", err);
          }
          console.log("💾 Session saved, redirecting...");
          return res.status(429).redirect("/admin/login");
        });
      } else {
        console.log("❌ req.flash not available in rate limiter");
      }
    } catch (flashError) {
      console.error("Flash error in rate limiter:", flashError.message);
    }

    return res.status(429).redirect("/admin/login");
  },
});

// Admin operation limiter - admin-only operations
const adminLimiter = rateLimit({
  store: createStore("rl:admin"),
  windowMs: 15 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 50 admin requests per windowMs
  message: {
    error:
      "Too many admin requests from this IP, please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    try {
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);
      log(
        `Admin rate limit exceeded for IP: ${req.ip}, User: ${req.session.user?.email || "Unknown"
        }`,
        LOG_LEVELS.WARN,
        req.session?.user?.id || null,
        userAgent,
        clientIP
      );
    } catch (logError) {
      console.error("Rate limit logging error:", logError.message);
    }

    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(429).json({
        success: false,
        error: {
          message:
            "Too many admin requests from this IP, please try again after 5 minutes.",
          code: "ADMIN_RATE_LIMIT_EXCEEDED",
        },
      });
    }

    try {
      if (req.flash) {
        req.flash(
          "error",
          "Too many admin requests. Please slow down and try again."
        );
      }
    } catch (flashError) {
      console.error("Flash error in rate limiter:", flashError.message);
    }

    return res.status(429).render("pages/admin/errors/429", {
      title: "Rate Limit Exceeded",
      errorCode: 429,
      errorMessage: "Too Many Admin Requests",
      errorDescription:
        "You have made too many admin requests. Please wait before continuing.",
      error_msg: ["Too many admin requests. Please slow down and try again."],
    });
  },
});

// File upload limiter - file operations
const uploadLimiter = rateLimit({
  store: createStore("rl:upload"),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 file uploads per windowMs
  message: {
    error:
      "Too many file uploads from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    try {
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);
      log(
        `Upload rate limit exceeded for IP: ${req.ip}, User: ${req.session.user?.email || "Unknown"
        }`,
        LOG_LEVELS.WARN,
        req.session?.user?.id || null,
        userAgent,
        clientIP
      );
    } catch (logError) {
      console.error("Rate limit logging error:", logError.message);
    }

    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(429).json({
        success: false,
        error: {
          message:
            "Too many file uploads from this IP, please try again after 15 minutes.",
          code: "UPLOAD_RATE_LIMIT_EXCEEDED",
        },
      });
    }

    try {
      if (req.flash) {
        req.flash(
          "error",
          "Too many file uploads. Please wait before uploading again."
        );
      }
    } catch (flashError) {
      console.error("Flash error in rate limiter:", flashError.message);
    }

    return res.status(429).redirect("back");
  },
});

// Export limiter - data export operations
const exportLimiter = rateLimit({
  store: createStore("rl:export"),
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 exports per windowMs
  message: {
    error:
      "Too many export requests from this IP, please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    try {
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);
      log(
        `Export rate limit exceeded for IP: ${req.ip}, User: ${req.session.user?.email || "Unknown"
        }`,
        LOG_LEVELS.WARN,
        req.session?.user?.id || null,
        userAgent,
        clientIP
      );
    } catch (logError) {
      console.error("Rate limit logging error:", logError.message);
    }

    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(429).json({
        success: false,
        error: {
          message:
            "Too many export requests from this IP, please try again after 5 minutes.",
          code: "EXPORT_RATE_LIMIT_EXCEEDED",
        },
      });
    }

    try {
      if (req.flash) {
        req.flash(
          "error",
          "Too many export requests. Please wait before exporting again."
        );
      }
    } catch (flashError) {
      console.error("Flash error in rate limiter:", flashError.message);
    }

    return res.status(429).redirect("back");
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  adminLimiter,
  uploadLimiter,
  exportLimiter,
};
