const mongoose = require("mongoose");

const stepReferenceSchema = new mongoose.Schema({
    // reference to a step
    reference: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    // chain hierarchy rating
    rating: {
        type: Number,
        default: 0,
    },
});

const stepChainSchema = new mongoose.Schema({
    references: [stepReferenceSchema],
});

const stepSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
        },
        name: {
            type: String,
            required: true,
        },
        contents: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            default: 0,
        },
        stepChain: [stepChainSchema],
    },
    {
        timestamps: true,
    }
);

const guideSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            default: 0,
        },
        steps: [stepSchema],
    },
    {
        timestamps: true,
    }
);

const subjectSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        guides: [guideSchema]
    }
)

const categorySchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        subjects: [subjectSchema],
    },
    {
        timestamps: true,
    }
);

exports.Category = mongoose.model("Category", categorySchema);
exports.Subject = mongoose.model("Subject", subjectSchema);
exports.Guide  = mongoose.model("Guide", guideSchema);
exports.Step  = mongoose.model("Step", stepSchema);