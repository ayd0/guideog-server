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
        res.statusCode = 403;
        res.end(
            `POST operation not supported on step/${req.stepId}/stepChain`
        );
    })
    .put([cors.corsWithOptions, authenticate.verifyUser], (req, res, next) => {
        Step.findById(req.stepId)
            .then((step) => {
                if (step.stepChain.references.filter(ref => ref.reference.toString() === req.body.reference)) {
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

stepChainRouter
    .route("/:stepReferenceId")
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get((req, res, next) => {
        res.statusCode = 403;
        res.end(
            `GET operation not supported on /stepChain/${req.params.stepReferenceId}`
        );
    })
    .post((req, res, next) => {
        res.statusCode = 403;
        res.end(
            `POST operation not supported on /stepChain/${req.params.stepReferenceId}`
        );
    })
    .put((req, res, next) => {
        res.statusCode = 403;
        res.end(
            `PUT operation not supported on /stepChain/${req.params.stepReferenceId}`
        );
    })
    .delete([cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin], (req, res, next) => {
        StepReference.deleteOne({ _id: req.params.stepReferenceId})
            .then((response) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(response);
            })
            .catch((err) => next(err));
    })

module.exports = stepChainRouter;
