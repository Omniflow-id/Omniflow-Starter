require("./instrument.js");
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const nunjucks = require("nunjucks");
const nunjucksDate = require("nunjucks-date-filter");
const moment = require("moment-timezone");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const helmet = require("helmet");
const { marked } = require("marked");

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "cdn.jsdelivr.net",
          "use.fontawesome.com",
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    expectCt: { maxAge: 86400, enforce: true },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    permittedCrossDomainPolicies: { policy: "none" },
    referrerPolicy: { policy: "no-referrer" },
    xssFilter: true,
  })
);
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
env.addFilter("formatRupiah", function(amount) {
  if (!amount && amount !== 0) return "Rp 0";
  const number = parseFloat(amount);
  if (isNaN(number)) return "Rp 0";
  
  return "Rp " + number.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
});

// Add moment timezone filter for Jakarta
env.addFilter("formatDateTime", function(date, format) {
  if (!date) return "";
  const defaultFormat = format || "DD MMMM YYYY HH:mm:ss";
  return moment(date).tz("Asia/Jakarta").format(defaultFormat);
});

// Add moment timezone filter for date only
env.addFilter("formatDate", function(date, format) {
  if (!date) return "";
  const defaultFormat = format || "DD MMMM YYYY";
  return moment(date).tz("Asia/Jakarta").format(defaultFormat);
});

// Add moment timezone filter for time only
env.addFilter("formatTime", function(date, format) {
  if (!date) return "";
  const defaultFormat = format || "HH:mm:ss";
  return moment(date).tz("Asia/Jakarta").format(defaultFormat);
});

app.set("view engine", "njk");
app.use(morgan("combined"));
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(flash());
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
app.set("trust proxy", true);
app.enable("trust proxy");

const adminRouter = require("./routes/admin/admin.router");
const clientRouter = require("./routes/client/client.router");

app.use("/", clientRouter);
app.use("/admin", adminRouter);

// Debug endpoint removed - using OpenTelemetry for monitoring

const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

module.exports = app;
