const path = require("path");
const express = require("express");
const morgan = require("morgan");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
app.use(morgan("dev"));

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
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000 },
  })
);
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

const adminRouter = require("./routes/index/index.router");

app.use("/", adminRouter);

module.exports = app;
