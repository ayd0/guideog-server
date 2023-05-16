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

guideRouter
    .route("/:guideId")
    .get((req, res, next) => {
        Guide.findById(req.params.guideId)
            .then((guide) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(guide);
            })
            .catch((err) => next(err));
    })
    .post((req, res) => {
        res.statusCode = 403;
        res.end(
            `POST operations not supported on route: guide/${req.params.guideId}`
        );
    })
    .put((req, res, next) => {
        if (req.isPrimaryRoute) {
            const err = new Error(
                "PUT is not supported on this route. You must use a route attached to a subject ID."
            );
            return next(err);
        }
        Subject.findById(req.subjectId)
            .then((subject) => {
                Guide.findById(req.params.guideId)
                    .then((guide) => {
                        // this is a hacky workaround as mongoose .indexOf() is currently not working as it should
                        let index = null;
                        for (let i = 0; i < subject.guides.length; ++i) {
                            if (subject.guides[i]._id.equals(guide._id)) {
                                index = i;
                                break;
                            }
                        }
                        if (index === null) {
                            const err = new Error(
                                `Not able to find guide: ${guide._id} in subject ${subject._id}`
                            );
                            return next(err);
                        }

                        let guideList = subject.guides.slice();
                        guideList[index].name = req.body.name || guide.name;
                        guideList[index].description =
                            req.body.description || guide.description;
                        guideList[index].rating =
                            req.body.rating || guide.rating;

                        Subject.updateOne(
                            { _id: subject._id },
                            { $set: { guide: guideList } }
                        )
                            .then(() => subject.save())
                            .catch((err) => next(err));

                        Guide.updateOne(
                            { _id: guide._id },
                            {
                                $set: {
                                    name: req.body.name || guide.name,
                                    description:
                                        req.body.description ||
                                        guide.description,
                                    rating: req.body.rating || guide.rating,
                                },
                            }
                        )
                            .then(() => guide.save())
                            .catch((err) => next(err));

                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(guide);
                    })
                    .catch((err) => next(err));
            })
            .catch((err) => next(err));
    })
    .delete((req, res, next) => {
        if (req.isPrimaryRoute) {
            const err = new Error(
                "DELETE is not supported on this route. You must use a route attached to a subject ID."
            );
            return next(err);
        }
        Subject.findById(req.subjectId).then((subject) => {
            Guide.findById(req.params.guideId).then((guide) => {
                let index = null;
                for (let i = 0; i < subject.guides.length; ++i) {
                    if (subject.guides[i]._id.equals(guide._id)) {
                        index = i;
                        break;
                    }
                }
                if (index === null) {
                    const err = new Error(
                        `Not able to find guide: ${guide._id} in subject ${subject._id}`
                    );
                    return next(err);
                }

                let guideList = subject.guides.slice();
                guideList.splice(index, 1);

                Subject.updateOne(
                    { _id: subject._id },
                    {
                        $set: { guides: guideList },
                    }
                ).catch((err) => next(err));

                Guide.deleteOne({ _id: guide._id })
                    .then((response) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(response);
                    })
                    .catch((err) => next(err));
            });
        });
    });

module.exports = guideRouter;
