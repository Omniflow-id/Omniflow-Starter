require("./instrument.js");
const path = require("node:path");
const express = require("express");
const morgan = require("morgan");
const nunjucks = require("nunjucks");
const nunjucksDate = require("nunjucks-date-filter");
const moment = require("moment-timezone");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { csrfGlobalMiddleware } = require("@middlewares/csrfProtection");
const {
  compressionMiddleware,
  compressionLogger,
} = require("@middlewares/compressionMiddleware");
const { marked } = require("marked");
const config = require("./config");
const { generalLimiter } = require("@middlewares/rateLimiter");
const {
  botProtectionLimiter,
  bannedIPLimiter,
  suspiciousActivityLogger,
} = require("@middlewares/botProtection");

const app = express();
app.use(helmet(config.security.helmetConfig));

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

// Add moment timezone filter for date only
env.addFilter("formatDate", (date, format) => {
  if (!date) return "";
  const defaultFormat = format || "DD MMMM YYYY";
  return moment(date).tz(config.timezone).format(defaultFormat);
});

// Add moment timezone filter for time only
env.addFilter("formatTime", (date, format) => {
  if (!date) return "";
  const defaultFormat = format || "HH:mm:ss";
  return moment(date).tz(config.timezone).format(defaultFormat);
});

app.set("view engine", "njk");
app.use(morgan("combined"));
app.use(session(config.session));
app.use(cookieParser());
app.use(flash());

// Global CSRF middleware - Laravel-style implementation
app.use(csrfGlobalMiddleware);
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.url = req.originalUrl;
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");

  // Debugging
  console.log("Flash Messages:", {
    success: res.locals.success_msg,
    error: res.locals.error_msg,
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

const adminRouter = require("./routes/admin/admin.router");
const clientRouter = require("./routes/client/client.router");

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
