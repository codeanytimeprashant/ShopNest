const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    { timestamps: true }
);

// Prevent a user from reviewing the same product twice
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("review", reviewSchema);
