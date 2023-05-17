const express = require("express");
const subjectRouter = express.Router();
const Category = require("../models/category").Category;
const Subject = require("../models/category").Subject;
const authenticate = require("../authenticate");
const cors = require("./cors");

subjectRouter
    .route("/")
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        if (req.isPrimaryRoute) {
            Subject.find()
                .then((subjects) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(subjects);
                })
                .catch((err) => next(err));
        } else {
            Category.findById(req.categoryId)
                .then((category) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(category.subjects);
                })
                .catch((err) => next(err));
        }
    })
    .post([cors.corsWithOptions, authenticate.verifyUser], (req, res, next) => {
        if (req.isPrimaryRoute) {
            const err = new Error(
                "Can not post a subject that isn't attached to a category."
            );
            err.statusCode = 403;
            return next(err);
        } else {
            req.body.author = req.user._id;
            Category.findById(req.categoryId)
                .then((category) => {
                    Subject.create(req.body).then((subject) => {
                        category.subjects.push(subject);
                        category.save();

                        res.setHeader("Content-Type", "application/json");
                        res.json(subject);
                    });
                })
                .catch((err) => next(err));
        }
    })
    .put([cors.corsWithOptions, authenticate.verifyUser], (req, res) => {
        res.statusCode = 403;
        res.end(
            `PUT operation not supported on /categories/${req.categoryId}/subject`
        );
    })
    .delete(
        [cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin],
        (req, res, next) => {
            if (req.isPrimaryRoute) {
                Category.updateMany({ $set: { subjects: [] } }).catch((err) =>
                    next(err)
                );
                Subject.deleteMany().then((response) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(response);
                });
            } else {
                Category.findById(req.categoryId)
                    .then((category) => {
                        if (category) {
                            for (
                                let i = category.subjects.length - 1;
                                i >= 0;
                                --i
                            ) {
                                Subject.findByIdAndDelete(
                                    category.subjects[i]._id
                                ).catch((err) => next(err));
                            }
                            Category.updateOne(
                                { _id: category._id },
                                {
                                    $set: { subjects: [] },
                                }
                            )
                                .then(() => category.save())
                                .catch((err) => next(err));
                            category.save();
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(category);
                        } else {
                            err = new Error(
                                `Category ${req.categoryId} not found`
                            );
                            err.status = 404;
                            return next(err);
                        }
                    })
                    .catch((err) => next(err));
            }
        }
    );

subjectRouter
    .route("/:subjectId")
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Subject.findById(req.params.subjectId)
            .then((subject) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(subject);
            })
            .catch((err) => next(err));
    })
    .post([cors.corsWithOptions, authenticate.verifyUser], (req, res) => {
        res.statusCode = 403;
        res.end(
            `POST operations not supported on subject/${req.params.subjectId}`
        );
    })
    .put([cors.corsWithOptions, authenticate.verifyUser], (req, res, next) => {
        if (req.isPrimaryRoute) {
            const err = new Error(
                "PUT is not supported on this route. You must use a route attached to a category ID."
            );
            return next(err);
        }
        Category.findById(req.categoryId)
            .then((category) => {
                Subject.findById(req.params.subjectId)
                    .then((subject) => {
                        // this is a hacky workaround as mongoose .indexOf() is currently not working as it should
                        let index = null;
                        for (let i = 0; i < category.subjects.length; ++i) {
                            if (category.subjects[i]._id.equals(subject._id)) {
                                index = i;
                                break;
                            }
                        }
                        if (index === null) {
                            const err = new Error(
                                `Not able to find subject: ${subject._id} in category ${category._id}`
                            );
                            return next(err);
                        }

                        let subList = category.subjects.slice();
                        subList[index].name = req.body.name || subject.name;
                        subList[index].description =
                            req.body.description || subject.description;

                        Category.updateOne(
                            { _id: category._id },
                            { $set: { subjects: subList } }
                        )
                            .then(() => category.save())
                            .catch((err) => next(err));

                        Subject.updateOne(
                            { _id: subject._id },
                            {
                                $set: {
                                    name: req.body.name || subject.name,
                                    description:
                                        req.body.description || subject.description,
                                },
                            }
                        )
                            .then(() => subject.save())
                            .catch((err) => next(err));

                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(subject);
                    })
                    .catch((err) => next(err));
            })
            .catch((err) => next(err));
    })
    .delete([cors.corsWithOptions, authenticate.verifyUser], (req, res, next) => {
        if (req.isPrimaryRoute) {
            const err = new Error(
                "DELETE is not supported on this route. You must use a route attached to a category ID."
            );
            return next(err);
        }
        Category.findById(req.categoryId).then((category) => {
            Subject.findById(req.params.subjectId).then((subject) => {
                let index = null;
                for (let i = 0; i < category.subjects.length; ++i) {
                    if (category.subjects[i]._id.equals(subject._id)) {
                        index = i;
                        break;
                    }
                }
                if (index === null) {
                    const err = new Error(
                        `Not able to find subject: ${subject._id} in category ${category._id}`
                    );
                    return next(err);
                }

                let subList = category.subjects.slice();
                subList.splice(index, 1);

                Category.updateOne(
                    { _id: category._id },
                    {
                        $set: { subjects: subList },
                    }
                ).catch((err) => next(err));

                Subject.deleteOne({ _id: subject._id })
                    .then((response) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(response);
                    })
                    .catch((err) => next(err));
            });
        });
    });

module.exports = subjectRouter;
