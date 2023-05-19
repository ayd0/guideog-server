const express = require("express");
const User = require("../models/user");
const passport = require("passport");
const authenticate = require("../authenticate");
const cors = require("./cors");

const router = express.Router();

/* GET users listing. */
router.get(
    "/",
    [cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin],
    function (req, res, next) {
        User.find()
            .then((users) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(users);
            })
            .catch((err) => next(err));
    }
);

router.post("/signup", cors.corsWithOptions, (req, res) => {
    User.register(
        new User({ username: req.body.username }),
        req.body.password,
        (err, user) => {
            if (err) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.json({ err: err });
            } else {
                user.save().then(
                    () => {
                        passport.authenticate("local")(req, res, () => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json({
                                success: true,
                                status: "Registration Successful!",
                            });
                        });
                    },
                    (err) => {
                        res.statusCode = 500;
                        res.setHeader("Content-Type", "application/json");
                        res.json({ err: err });
                        return;
                    }
                );
            }
        }
    );
});

router.post("/login", cors.corsWithOptions, passport.authenticate("local"), (req, res) => {
    const token = authenticate.getToken({ _id: req.user._id });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json({
        success: true,
        token: token,
        status: "You are successfully logged in!",
    });
});

router.get("/logout", cors.corsWithOptions, (req, res, next) => {
    const err = new Error("You are not logged in!");
    err.status = 401;
    return next(err);
});

router
    .route("/:userId")
    .delete(
        [cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin],
        (req, res, next) => {
            const uid = req.params.userId;
            User.findByIdAndDelete(uid)
                .then((response) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(response);
                })
                .catch((err) => next(err));
        }
    );

module.exports = router;
