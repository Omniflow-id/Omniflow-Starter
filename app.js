// === Side-effect imports (HARUS PALING ATAS) ===
require("./instrument.js");

// === Core modules ===
const path = require("node:path");

// === Third-party modules ===
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const flash = require("connect-flash");
const helmet = require("helmet");
const { marked } = require("marked");
const moment = require("moment-timezone");
const morgan = require("morgan");
const nunjucks = require("nunjucks");
const nunjucksDate = require("nunjucks-date-filter");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const { v4: uuidv4 } = require("uuid");

// === Absolute / alias imports ===
const {
  botProtectionLimiter,
  bannedIPLimiter,
  suspiciousActivityLogger,
} = require("@middlewares/botProtection");
const {
  compressionMiddleware,
  compressionLogger,
} = require("@middlewares/compressionMiddleware");
const { createCorsMiddleware } = require("@middlewares/corsMiddleware");
const { csrfGlobalMiddleware } = require("@middlewares/csrfProtection");
const { generalLimiter } = require("@middlewares/rateLimiter");
// === Relative imports ===
const { db } = require("@db/db");
const config = require("./config");

const app = express();
app.use(helmet(config.security.helmetConfig));

// CORS - apply early for cross-origin requests
app.use(createCorsMiddleware());

// Compression - apply early for better performance
if (config.compression.enabled) {
  app.use(compressionMiddleware);
  app.use(compressionLogger);
}

// Bot protection - apply first for maximum security
app.use(suspiciousActivityLogger);
app.use(bannedIPLimiter);
app.use(botProtectionLimiter);
app.use(generalLimiter);

// app.use(helmet())
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./public")));

// Serve MkDocs documentation (development only)
if (process.env.NODE_ENV === "development") {
  app.use(
    "/docs",
    express.static(path.join(__dirname, "documentation", "site"))
  );
}
const env = nunjucks.configure("views", {
  autoescape: true,
  express: app,
  watch: true,
});

// Update date filter configuration
nunjucksDate.setDefaultFormat("YYYY"); // Change default format to YYYY
env.addFilter("date", nunjucksDate);
env.addGlobal("currentYear", new Date().getFullYear()); // Add current year as global
env.addGlobal("marked", marked);

// Add app name with environment mode indicator
const baseAppName = process.env.APP_NAME || "Omniflow Starter";
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const appNameWithMode = isDevelopment ? `${baseAppName} (Dev)` : baseAppName;

env.addGlobal("appName", appNameWithMode); // Add app name as global
env.addGlobal("isDevelopment", isDevelopment); // Add development mode flag
env.addGlobal("isProduction", isProduction); // Add production mode flag

// Add template helper functions
const {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} = require("./helpers/templateHelpers");
env.addGlobal("hasPermission", hasPermission);
env.addGlobal("hasAnyPermission", hasAnyPermission);
env.addGlobal("hasAllPermissions", hasAllPermissions);

// Add formatRupiah filter
env.addFilter("formatRupiah", (amount) => {
  if (!amount && amount !== 0) return "Rp 0";
  const number = parseFloat(amount);
  if (Number.isNaN(number)) return "Rp 0";

  return (
    "Rp " +
    number.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
});

// Add moment timezone filters using config timezone
env.addFilter("formatDateTime", (date, format) => {
  if (!date) return "";
  const defaultFormat = format || "DD MMMM YYYY HH:mm:ss";
  return moment(date).tz(config.timezone).format(defaultFormat);
});

// Add moment timezone filter for date only (consistent with local time to avoid shifts)
env.addFilter("formatDate", (date, format) => {
  if (!date) return "";
  const defaultFormat = format || "DD MMMM YYYY";
  // We use moment(date) which treats the Date object as local time (same as DB's 00:00:00 local)
  return moment(date).format(defaultFormat);
});

// Add moment timezone filter for time only
env.addFilter("formatTime", (date, format) => {
  if (!date) return "";
  const defaultFormat = format || "HH:mm:ss";
  return moment(date).tz(config.timezone).format(defaultFormat);
});

app.set("view engine", "njk");
app.use(morgan("combined"));

// Session handling with MySQL Store
const sessionStore = new MySQLStore(config.session.storeOptions, db);

app.use(
  session({
    ...config.session,
    store: sessionStore,
  })
);

// Request ID middleware - Generate unique request ID for tracking
app.use((req, _res, next) => {
  req.requestId = uuidv4();
  next();
});

app.use(cookieParser());
app.use(flash());

// Global CSRF middleware - Laravel-style implementation
app.use(csrfGlobalMiddleware);
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.permissions = req.session.permissions || [];
  res.locals.url = req.originalUrl;
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  res.locals.warning_msg = req.flash("warning");
  res.locals.info_msg = req.flash("info");

  // Debugging
  console.log("Flash Messages:", {
    success: res.locals.success_msg,
    error: res.locals.error_msg,
    warning: res.locals.warning_msg,
    info: res.locals.info_msg,
  });

  next();
});
// Trust proxy setting - security consideration for rate limiting
if (process.env.NODE_ENV === "production") {
  // Production: Trust only first proxy (e.g., Nginx, Cloudflare)
  // This allows getting real client IP from X-Forwarded-For header
  app.set("trust proxy", 1);
} else {
  // Development: Don't trust proxy to prevent rate limiting bypass
  // Use direct connection IP (127.0.0.1, ::1)
  app.set("trust proxy", false);
}

const apiRouter = require("./routes/api/api.router");
const adminRouter = require("./routes/admin/admin.router");
const clientRouter = require("./routes/client/client.router");

app.use("/api", apiRouter);
app.use("/", clientRouter);
app.use("/admin", adminRouter);

// Debug endpoint removed - using OpenTelemetry for monitoring

// Error handling middlewares
const {
  centralizedErrorHandler,
  notFoundHandler,
} = require("./middlewares/errorHandler");

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Global error handler - must be last
app.use(centralizedErrorHandler);

module.exports = app;
