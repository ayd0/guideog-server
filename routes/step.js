const express = require("express");
const stepRouter = express.Router();
const Guide = require("../models/category").Guide;
const Step = require("../models/category").Step;
const authenticate = require("../authenticate");

stepRouter
    .route("/")
    .get((req, res, next) => {
        if (req.isPrimaryRoute) {
            Step.find()
                .then((steps) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(steps);
                })
                .catch((err) => next(err));
        } else {
            Guide.findById(req.guideId)
                .then((guide) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(guide.steps);
                })
                .catch((err) => next(err));
        }
    })
    .post(authenticate.verifyUser, (req, res, next) => {
        if (req.isPrimaryRoute) {
            const err = new Error(
                "Can not post a step that isn't attached to a guide."
            );
            err.statusCode = 403;
            return next(err);
        } else {
            req.body.author = req.user._id;
            Guide.findById(req.guideId)
                .then((guide) => {
                    Step.create(req.body).then((step) => {
                        guide.steps.push(step);
                        guide.save();

                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(step);
                    });
                })
                .catch((err) => next(err));
        }
    })
    .put((req, res, next) => {
        const err = new Error("PUT operation not supported on /steps");
        res.statusCode = 403;
        return next(err);
    })
    .delete(
        [authenticate.verifyUser, authenticate.verifyAdmin],
        (req, res, next) => {
            if (req.isPrimaryRoute) {
                Guide.updateMany({ $set: { steps: [] } }).catch((err) =>
                    next(err)
                );
                Step.deleteMany().then((response) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(response);
                });
            } else {
                Guide.findById(req.guideId)
                    .then((guide) => {
                        if (guide) {
                            for (
                                let i = guide.steps.length - 1;
                                i >= 0;
                                --i
                            ) {
                                Step.findByIdAndDelete(
                                    guide.steps[i]._id
                                ).catch((err) => next(err));
                            }
                            Guide.updateOne(
                                { _id: guide._id },
                                {
                                    $set: { steps: [] },
                                }
                            )
                                .then(() => guide.save())
                                .catch((err) => next(err));
                            guide.save();
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(guide);
                        } else {
                            err = new Error(
                                `Guide ${req.guideId} not found`
                            );
                            err.status = 404;
                            return next(err);
                        }
                    })
                    .catch((err) => next(err));
            }
        }
    );

module.exports = stepRouter;