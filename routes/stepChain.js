const express = require("express");
const stepChainRouter = express.Router();
const Step = require("../models/category").Step;
const StepChain = require("../models/category").StepChain;
const StepReference = require("../models/category").StepReference;
const authenticate = require("../authenticate");
const cors = require("./cors");

stepChainRouter
    .route("/")
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.corsWithOptions, (req, res, next) => {
        Step.find(req.stepId)
            .then((step) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(step.stepChain);
            })
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, (req, res, next) => {
        Step.find(req.stepId)
            .then((step) => {
                StepChain.create()
                    .then((stepChain) => {
                        for (reference of step.body) {
                            StepReference.create(reference)
                                .then((reference) => {
                                    stepChain.references.push(reference);
                                })
                                .catch((err) => next(err));
                        }

                        Step.updateOne(
                            { _id: step._id },
                            {
                                $set: { stepChain: stepChain },
                            }
                        )
                            .then(() => step.save())
                            .catch((err) => next(err));

                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application.json");
                        res.json(step);
                    })
                    .catch((err) => next(err));
            })
            .catch((err) => next(err));
    });

module.exports = stepChainRouter;
