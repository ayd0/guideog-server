const createError = require("http-errors");
const express = require("express");
const path = require("path");
const logger = require("morgan");
const passport = require("passport");
const config = require("./config");

const mongoose = require("mongoose");
const url = config.mongoUrl;

var db = mongoose.connection;
db.on("connecting", () => console.log("Connecting to database server"));
db.on("disconnected", () => {
    console.log("Disconnected from database server");
    mongoose.connect(url).then(
        () => console.log("Connected to database server"),
        (err) => console.error(err)
    );
});

mongoose.connect(url).then(
    () => console.log("Connected to database server"),
    (err) => console.error(err)
);

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const categoryRouter = require("./routes/category");
const subjectRouter = require("./routes/subject");
const guideRouter = require("./routes/guide");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());

// Routes
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/category", categoryRouter);
app.use(
    "/subject",
    (req, res, next) => {
        req.isPrimaryRoute = true;
        next();
    },
    subjectRouter
);
app.use(
    "/category/:categoryId/subject",
    (req, res, next) => {
        req.categoryId = req.params.categoryId;
        next();
    },
    subjectRouter
);
app.use(
    "/guide",
    (req, res, next) => {
      req.isPrimaryRoute = true;
      next();
    },
    guideRouter
);
app.use(
    "/category/:categoryId/subject/:subjectId/guide",
    (req, res, next) => {
      req.subjectId = req.params.subjectId;
      next();
    },
    guideRouter
)

app.use(express.static(path.join(__dirname, "public")));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
