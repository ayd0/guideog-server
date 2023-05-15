const express = require("express");
const categoryRouter = express.Router();
const Category = require("../models/category").Category;
const authenticate = require("../authenticate");

categoryRouter
    .route("/")
    .get((req, res, next) => {
        Category.find()
            .then((categories) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(categories);
            })
            .catch((err) => next(err));
    })
    .post(authenticate.verifyUser, (req, res, next) => {
        req.body.author = req.user._id;
        Category.create(req.body)
            .then((category) => {
                console.log("Category Created ", category);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(category);
            })
            .catch((err) => next(err));
    })
    .put(authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /categories`);
    })
    .delete(
        [authenticate.verifyUser, authenticate.verifyAdmin],
        (req, res, next) => {
            Category.deleteMany()
                .then((response) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(response);
                })
                .catch((err) => next(err));
        }
    );

categoryRouter
    .route("/:categoryId")
    .get((req, res, next) => {
        Category.findById(req.params.categoryId)
            .then((category) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(category);
            })
            .catch((err) => next(err));
    })
    .post(authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(
            `POST operation not supported on /categories/${req.params.categoryId}`
        );
    })
    .put(authenticate.verifyUser, (req, res, next) => {
        Category.findByIdAndUpdate(
            req.params.categoryId,
            { $set: req.body },
            { new: true }
        )
            .then((category) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(category);
            })
            .catch((err) => next(err));
    })
    .delete(authenticate.verifyUser, (req, res, next) => {
        Category.findByIdAndDelete(req.params.categoryId)
            .then((response) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(response);
            })
            .catch((err) => next(err));
    });

module.exports = categoryRouter;
