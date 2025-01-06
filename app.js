const path = require("path");
const express = require("express");
const morgan = require("morgan");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const helmet = require("helmet");

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
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./public")));
nunjucks.configure("views", {
  autoescape: true,
  express: app,
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

const { isLoggedIn } = require("./middlewares/isLoggedIn");

const adminRouter = require("./routes/index/index.router");
const authRouter = require("./routes/auth/auth.router");
const userRouter = require("./routes/user/user.router");
const logRouter = require("./routes/log/log.router");

app.use("/", authRouter);
app.use("/", isLoggedIn, adminRouter);
app.use("/", isLoggedIn, userRouter);
app.use("/", isLoggedIn, logRouter);

const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

module.exports = app;
