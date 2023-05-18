const express = require("express");
const stepChainRouter = express.Router();
const Step = require("../models/category").Step;
const StepReference = require("../models/category").StepReference;
const authenticate = require("../authenticate");
const cors = require("./cors");

stepChainRouter
    .route("/")
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.corsWithOptions, (req, res, next) => {
        Step.findById(req.stepId)
            .then((step) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(step.stepChain);
            })
            .catch((err) => next(err));
    })
    .post((req, res, next) => {
        const err = new Error(`Unable to post to step/${req.stepId}/stepChain/`);
        err.statusCode = 403;
        return next(err);
    })
    .put(cors.corsWithOptions, (req, res, next) => {
        Step.findById(req.stepId)
            .then((step) => {
                Step.findById(req.body.reference).then((refStep) => {
                    StepReference.create(req.body).then((stepReference) => {
                        step.stepChain.references.push(stepReference);
                        step.save();

                        res.statusCode = 200;
                        res.setHeader("Conent-Type", "application/json");
                        res.json(step);
                    });
                });
            })
            .catch((err) => next(err));
    });

module.exports = stepChainRouter;
