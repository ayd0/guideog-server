const express = require("express");
const guideRouter = express.Router();
const Subject = require("../models/category").Subject;
const Guide = require("../models/category").Guide;
const authenticate = require("../authenticate");

guideRouter
    .route("/")
    .get((req, res, next) => {
        if (req.isPrimaryRoute) {
            Guide.find()
                .then((guides) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(guides);
                })
                .catch((err) => next(err));
        } else {
            Subject.findById(req.subjectId)
                .then((subject) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(subject.guides);
                })
                .catch((err) => next(err));
        }
    })
    .post(authenticate.verifyUser, (req, res, next) => {
        if (req.isPrimaryRoute) {
            const err = new Error(
                "Can not post a guide that isn't attached to a subject."
            );
            err.statusCode = 403;
            return next(err);
        } else {
            req.body.author = req.user._id;
            Subject.findById(req.subjectId)
                .then((subject) => {
                    Guide.create(req.body).then((guide) => {
                        subject.guides.push(guide);
                        subject.save();

                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(guide);
                    });
                })
                .catch((err) => next(err));
        }
    })
    .put((req, res, next) => {
        const err = new Error("PUT operation not supported on /guides");
        res.statusCode = 403;
        return next(err);
    })
    .delete(
        [authenticate.verifyUser, authenticate.verifyAdmin],
        (req, res, next) => {
            if (req.isPrimaryRoute) {
                Subject.updateMany({ $set: { guides: [] } }).catch((err) =>
                    next(err)
                );
                Guide.deleteMany().then((response) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(response);
                });
            } else {
                Subject.findById(req.subjectId)
                    .then((subject) => {
                        if (subject) {
                            for (
                                let i = subject.guides.length - 1;
                                i >= 0;
                                --i
                            ) {
                                Guide.findByIdAndDelete(
                                    subject.guides[i]._id
                                ).catch((err) => next(err));
                            }
                            Subject.updateOne(
                                { _id: subject._id },
                                {
                                    $set: { guides: [] },
                                }
                            )
                                .then(() => subject.save())
                                .catch((err) => next(err));
                            subject.save();
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(subject);
                        } else {
                            err = new Error(
                                `Subject ${req.subjectId} not found`
                            );
                            err.status = 404;
                            return next(err);
                        }
                    })
                    .catch((err) => next(err));
            }
        }
    );

module.exports = guideRouter;
