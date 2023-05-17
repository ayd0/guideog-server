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
                            for (let i = guide.steps.length - 1; i >= 0; --i) {
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
                            err = new Error(`Guide ${req.guideId} not found`);
                            err.status = 404;
                            return next(err);
                        }
                    })
                    .catch((err) => next(err));
            }
        }
    );

stepRouter
    .route("/:stepId")
    .get((req, res, next) => {
        Step.findById(req.params.stepId)
            .then((step) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(step);
            })
            .catch((err) => next(err));
    })
    .post((req, res) => {
        res.statusCode = 403;
        res.end(
            `POST operations not supported on route: step/${req.params.stepId}`
        );
    })
    .put((req, res, next) => {
        if (req.isPrimaryRoute) {
            const err = new Error(
                "PUT is not supported on this route. You must use a route attached to a guide ID."
            );
            return next(err);
        }
        Guide.findById(req.guideId)
            .then((guide) => {
                Step.findById(req.params.stepId)
                    .then((step) => {
                        // this is a hacky workaround as mongoose .indexOf() is currently not working as it should
                        let index = null;
                        for (let i = 0; i < guide.steps.length; ++i) {
                            if (guide.steps[i]._id.equals(step._id)) {
                                index = i;
                                break;
                            }
                        }
                        if (index === null) {
                            const err = new Error(
                                `Not able to find step: ${step._id} in guide ${guide._id}`
                            );
                            return next(err);
                        }

                        let stepList = guide.steps.slice();
                        stepList[index].name = req.body.name || step.name;
                        stepList[index].contents =
                            req.body.contents || step.contents;
                        stepList[index].rating = req.body.rating || step.rating;

                        Guide.updateOne(
                            { _id: guide._id },
                            { $set: { step: stepList } }
                        )
                            .then(() => guide.save())
                            .catch((err) => next(err));

                        Step.updateOne(
                            { _id: step._id },
                            {
                                $set: {
                                    name: req.body.name || step.name,
                                    contents:
                                        req.body.contents || step.contents,
                                    rating: req.body.rating || step.rating,
                                },
                            }
                        )
                            .then(() => step.save())
                            .catch((err) => next(err));

                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(step);
                    })
                    .catch((err) => next(err));
            })
            .catch((err) => next(err));
    })
    .delete((req, res, next) => {
        if (req.isPrimaryRoute) {
            const err = new Error(
                "DELETE is not supported on this route. You must use a route attached to a guide ID."
            );
            return next(err);
        }
        Guide.findById(req.guideId).then((guide) => {
            Step.findById(req.params.stepId).then((step) => {
                let index = null;
                for (let i = 0; i < guide.steps.length; ++i) {
                    if (guide.steps[i]._id.equals(step._id)) {
                        index = i;
                        break;
                    }
                }
                if (index === null) {
                    const err = new Error(
                        `Not able to find step: ${step._id} in guide ${guide._id}`
                    );
                    return next(err);
                }

                let stepList = guide.steps.slice();
                stepList.splice(index, 1);

                Guide.updateOne(
                    { _id: guide._id },
                    {
                        $set: { step: stepList },
                    }
                ).catch((err) => next(err));

                Step.deleteOne({ _id: step._id })
                    .then((response) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(response);
                    })
                    .catch((err) => next(err));
            });
        });
    });

module.exports = stepRouter;
