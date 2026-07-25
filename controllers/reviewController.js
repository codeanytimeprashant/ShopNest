const reviewModel = require("../models/review-model");
const productModel = require("../models/product-model");
const orderModel = require("../models/order-model");

// Helper: recalculate and save average rating + reviewCount on the product
async function updateProductRating(productId) {
    const reviews = await reviewModel.find({ product: productId });
    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    await productModel.findByIdAndUpdate(productId, {
        rating: Math.round(avg * 10) / 10,  // round to 1 decimal
        reviewCount: count
    });
}

// POST /product/:id/review
exports.submitReview = async function (req, res) {
    try {
        const productId = req.params.id;
        const { rating, comment } = req.body;

        // Check user has actually bought this product
        const hasBought = await orderModel.findOne({
            user: req.user._id,
            "products.product": productId,
            paymentStatus: { $in: ["Paid", "Pending"] }
        });

        if (!hasBought) {
            req.flash("error", "You can only review products you have purchased.");
            return res.redirect("/product/" + productId);
        }

        // Upsert: if they somehow review again it updates their old review
        await reviewModel.findOneAndUpdate(
            { user: req.user._id, product: productId },
            { rating: Number(rating), comment },
            { upsert: true, new: true }
        );

        await updateProductRating(productId);

        req.flash("success", "Your review was submitted. Thank you!");
        res.redirect("/product/" + productId);
    } catch (err) {
        req.flash("error", "Failed to submit review: " + err.message);
        res.redirect("/product/" + req.params.id);
    }
};

// POST /product/:id/review/:rid/delete
exports.deleteReview = async function (req, res) {
    try {
        const { id: productId, rid } = req.params;

        const review = await reviewModel.findById(rid);
        if (!review || review.user.toString() !== req.user._id.toString()) {
            req.flash("error", "You cannot delete this review.");
            return res.redirect("/product/" + productId);
        }

        await reviewModel.findByIdAndDelete(rid);
        await updateProductRating(productId);

        req.flash("success", "Review deleted.");
        res.redirect("/product/" + productId);
    } catch (err) {
        req.flash("error", "Failed to delete review: " + err.message);
        res.redirect("/product/" + req.params.id);
    }
};
