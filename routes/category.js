const express = require("express");
const categoryRouter = express.Router();
const Category = require("../models/category").Category;
const authenticate = require("../authenticate");
const cors = require("./cors");

categoryRouter
    .route("/")
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Category.find()
            .then((categories) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(categories);
            })
            .catch((err) => next(err));
    })
    .post([cors.corsWithOptions, authenticate.verifyUser], (req, res, next) => {
        req.body.author = req.user._id;
        Category.create(req.body)
            .then((category) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(category);
            })
            .catch((err) => next(err));
    })
    .put([cors.corsWithOptions, authenticate.verifyUser], (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /categories`);
    })
    .delete(
        [cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin],
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
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Category.findById(req.params.categoryId)
            .then((category) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(category);
            })
            .catch((err) => next(err));
    })
    .post([cors.corsWithOptions, authenticate.verifyUser], (req, res) => {
        res.statusCode = 403;
        res.end(
            `POST operation not supported on /categories/${req.params.categoryId}`
        );
    })
    .put([cors.corsWithOptions, authenticate.verifyUser], (req, res, next) => {
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
    .delete([cors.corsWithOptions, authenticate.verifyUser], (req, res, next) => {
        Category.findByIdAndDelete(req.params.categoryId)
            .then((response) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(response);
            })
            .catch((err) => next(err));
    });

module.exports = categoryRouter;
