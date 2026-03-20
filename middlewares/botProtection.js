const rateLimit = require("express-rate-limit");
const { log, LOG_LEVELS } = require("@helpers/log");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");

// Suspicious paths that are commonly targeted by bots
const SUSPICIOUS_PATHS = [
  // WordPress related
  "/wp",
  "/wp/",
  "/wp-admin",
  "/wp-login",
  "/wp-content",
  "/wp-includes",
  "/wordpress",
  "/wordpress/",
  "/blog",
  "/blog/",
  "/xmlrpc.php",
  "/wp-xmlrpc.php",

  // Common CMS paths
  // "/admin", - Commented out because we use /admin for legitimate admin panel
  "/administrator",
  // "/login", - Commented out because we use /admin/login for legitimate login
  "/signin",
  "/phpmyadmin",
  "/pma",
  "/mysql",
  "/drupal",
  "/joomla",
  "/magento",

  // Config files
  "/.env",
  "/config",
  "/configuration",
  "/web.config",
  "/.htaccess",

  // Common attack vectors
  "/robots.txt",
  "/sitemap.xml",
  "/backup",
  "/db",
  "/database",
  "/shell",
  "/webshell",
  "/cmd",

  // Framework specific
  "/laravel",
  "/symfony",
  "/codeigniter",
  "/api/v1",
  "/api/v2",
  "/graphql",
];

// Legitimate paths that should NOT be considered suspicious
const LEGITIMATE_PATHS = [
  "/admin",
  "/admin/",
  "/admin/login",
  "/admin/logout",
  "/admin/user",
  "/admin/log",
  "/admin/index",
  "/admin/overview",
];

// Check if path is suspicious
const isSuspiciousPath = (path) => {
  const normalizedPath = path.toLowerCase();

  // First check if it's a legitimate admin path
  const isLegitimate = LEGITIMATE_PATHS.some((legitPath) =>
    normalizedPath.startsWith(legitPath.toLowerCase())
  );

  if (isLegitimate) {
    return false;
  }

  // Then check against suspicious patterns
  return SUSPICIOUS_PATHS.some((suspiciousPath) =>
    normalizedPath.includes(suspiciousPath.toLowerCase())
  );
};

// Aggressive rate limiter for suspicious requests
const botProtectionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Only 3 suspicious requests per 5 minutes
  message: {
    error: "Suspicious activity detected. Access temporarily restricted.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply to suspicious paths
    return !isSuspiciousPath(req.path);
  },
  handler: async (req, res) => {
    try {
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);

      // Log as security warning
      await log(
        `🚨 SECURITY: Aggressive bot activity detected - IP: ${req.ip}, Path: ${
          req.path
        }, UA: ${req.get("User-Agent") || "Unknown"}`,
        LOG_LEVELS.WARN,
        null,
        userAgent,
        clientIP
      );

      console.log(`🚨 Bot protection triggered: ${req.ip} -> ${req.path}`);
    } catch (logError) {
      console.error("Bot protection logging error:", logError.message);
    }

    // Always return JSON for bot requests (they don't need pretty pages)
    return res.status(429).json({
      success: false,
      error: {
        message: res.locals.t("common.errors.botProtectionTriggered"),
        code: "BOT_PROTECTION_TRIGGERED",
        timestamp: new Date().toISOString(),
      },
    });
  },
});

// Ultra-aggressive limiter for repeated offenders
const bannedIPLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1, // Only 1 request per hour for banned patterns
  message: {
    error: "common.errors.ipTemporarilyBanned",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Apply to IPs that are hitting multiple suspicious paths
    const path = req.path.toLowerCase();
    const userAgent = req.get("User-Agent") || "";

    // Ban obvious bot patterns
    const isBotUA =
      userAgent.includes("bot") ||
      userAgent.includes("crawler") ||
      userAgent.includes("spider") ||
      userAgent.includes("scan") ||
      userAgent.length === 0;

    const isObviousAttack =
      path.includes("wp-") ||
      path.includes("admin") ||
      path.includes(".env") ||
      path.includes("config");

    return !(isBotUA && isObviousAttack);
  },
  handler: async (req, res) => {
    try {
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);

      await log(
        `🔒 SECURITY: IP banned for malicious activity - IP: ${req.ip}, Path: ${req.path}`,
        LOG_LEVELS.WARN,
        null,
        userAgent,
        clientIP
      );

      console.log(`🔒 IP banned: ${req.ip} -> ${req.path}`);
    } catch (logError) {
      console.error("IP ban logging error:", logError.message);
    }

    return res.status(429).json({
      success: false,
      error: {
        message: res.locals.t("common.errors.ipTemporarilyBanned"),
        code: "IP_BANNED",
        timestamp: new Date().toISOString(),
        contact: res.locals.t("common.errors.contactSupportIfError"),
      },
    });
  },
});

// Middleware to log suspicious activity even if not rate limited
const suspiciousActivityLogger = async (req, _res, next) => {
  if (isSuspiciousPath(req.path)) {
    try {
      const clientIP = getClientIP(req);
      const userAgent = getUserAgent(req);

      await log(
        `⚠️ Suspicious path accessed: ${req.path} from IP: ${req.ip}`,
        LOG_LEVELS.WARN,
        null,
        userAgent,
        clientIP
      );

      console.log(`⚠️ Suspicious: ${req.ip} -> ${req.method} ${req.path}`);
    } catch (error) {
      console.error("Suspicious activity logging error:", error.message);
    }
  }
  next();
};

module.exports = {
  botProtectionLimiter,
  bannedIPLimiter,
  suspiciousActivityLogger,
  isSuspiciousPath,
};
