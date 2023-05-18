const express = require("express");
const stepChainRouter = express.Router();
const Step = require("../models/category").Step;
const StepReference = require("../models/category").StepReference;
const authenticate = require("../authenticate");
const cors = require("./cors");

stepChainRouter
    .route("/")
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Step.findById(req.stepId)
            .then((step) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(step.stepChain);
            })
            .catch((err) => next(err));
    })
    .post((req, res, next) => {
        const err = new Error(
            `Unable to post to step/${req.stepId}/stepChain/`
        );
        err.statusCode = 403;
        return next(err);
    })
    .put([cors.corsWithOptions, authenticate.verifyUser], (req, res, next) => {
        Step.findById(req.stepId)
            .then((step) => {
                console.log(step.stepChain.references[0].reference.toString() === req.body.reference);
                if (step.stepChain.references.filter(ref => ref.reference.toString() === req.body.reference)) {
                    console.log(`FOUND REFERENCE: ${req.body.reference} in STEP`);
                    const err = new Error(`stepReference with reference value: ${req.body.reference} already exists in step: ${step._id}`);
                    err.statusCode = 409;
                    return next(err);
                }
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
    })
    .delete(
        [
            cors.corsWithOptions,
            authenticate.verifyUser,
            authenticate.verifyAdmin,
        ],
        (req, res, next) => {
            Step.findById(req.stepId)
                .then((step) => {
                    for (reference of step.stepChain.references) {
                        StepReference.deleteOne({ _id: reference._id }).catch(
                            (err) => next(err)
                        );
                    }
                })
                .catch((err) => next(err));

            Step.updateOne(
                { _id: req.stepId },
                {
                    $set: { stepChain: [] },
                }
            )
                .then((response) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(response);
                })
                .catch((err) => next(err));
        }
    );

module.exports = stepChainRouter;
