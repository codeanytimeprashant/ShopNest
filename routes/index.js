const express = require("express");
const router = express.Router();

const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const reviewModel = require("../models/review-model");
const { submitReview, deleteReview } = require("../controllers/reviewController");

router.get("/", function (req, res) {
    let error = req.flash("error");
    res.render("index", { error, loggedin: false });
});

router.get("/shop", isLoggedIn, async function (req, res) {
    let query = {};
    if (req.query.search) {
        query.name = { $regex: req.query.search, $options: "i" };
    }
    if (req.query.category && req.query.category !== 'all') {
        query.category = { $regex: new RegExp("^" + req.query.category.trim() + "$", "i") };
    }

    let sortObj = {};
    if (req.query.sortby === 'newest') sortObj = { _id: -1 };
    else if (req.query.sortby === 'price-low-high') sortObj = { price: 1 };
    else if (req.query.sortby === 'price-high-low') sortObj = { price: -1 };
    else if (req.query.sortby === 'highest-discount') sortObj = { discount: -1 };

    let page = parseInt(req.query.page) || 1;
    let limit = 8;
    let skip = (page - 1) * limit;

    const totalProducts = await productModel.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await productModel.find(query).sort(sortObj).skip(skip).limit(limit);
    let success = req.flash("success");

    res.render("shop", {
        products,
        success,
        user: req.user,
        searchQuery: req.query.search || '',
        currentCategory: req.query.category || 'all',
        currentSort: req.query.sortby || '',
        currentPage: page,
        totalPages: totalPages
    });
});

router.get("/product/:id", isLoggedIn, async function (req, res) {
    try {
        const product = await productModel.findById(req.params.id);
        if (!product) return res.redirect("/shop");

        const reviews = await reviewModel.find({ product: req.params.id })
            .populate("user", "fullname picture")
            .sort({ createdAt: -1 });

        // Check if user already reviewed
        const userReview = reviews.find(r => r.user._id.toString() === req.user._id.toString());

        let success = req.flash("success");
        let error = req.flash("error");
        res.render("product-details", { product, reviews, userReview, user: req.user, success, error });
    } catch (err) {
        res.redirect("/shop");
    }
});

// Review submission and delete
router.post("/product/:id/review", isLoggedIn, submitReview);
router.post("/product/:id/review/:rid/delete", isLoggedIn, deleteReview);
router.get("/cart", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email })
        .populate("cart.product");

    // Clean up cart items for which the product no longer exists
    let originalCartLength = user.cart.length;
    user.cart = user.cart.filter(item => item.product && item.product.price !== undefined);

    if (user.cart.length !== originalCartLength) {
        await user.save();
    }

    let bill = 20;

    user.cart.forEach(item => {
        bill += (item.product.price - item.product.discount) * item.quantity;
    });

    res.render("cart", { user, bill });
});

router.get("/addtocart/:productid", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    console.log(user.cart);
    let existingProduct = user.cart.find(item =>
        item.product.toString() === req.params.productid
    );

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        user.cart.push({
            product: req.params.productid,
            quantity: 1
        });
    }

    await user.save();

    req.flash("success", "Product added to cart successfully");
    res.redirect("/shop");

});


router.get("/cart/increase/:productid", isLoggedIn, async function (req, res) {

    let user = await userModel.findOne({ email: req.user.email });

    let cartItem = user.cart.find(item =>
        item.product &&
        item.product.toString() === req.params.productid
    );

    if (cartItem) {
        cartItem.quantity += 1;
        await user.save();
    }

    res.redirect("/cart");
});

router.get("/cart/decrease/:productid", isLoggedIn, async function (req, res) {

    let user = await userModel.findOne({ email: req.user.email });

    let cartItem = user.cart.find(item =>
        item.product &&
        item.product.toString() === req.params.productid
    );

    if (cartItem) {

        if (cartItem.quantity > 1) {

            cartItem.quantity--;

        } else {

            user.cart = user.cart.filter(item =>
                item.product.toString() !== req.params.productid
            );

        }

        await user.save();
    }

    res.redirect("/cart");
});

module.exports = router;