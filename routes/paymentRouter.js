const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const isLoggedIn = require("../middlewares/isLoggedIn");

router.post("/create-order", isLoggedIn, paymentController.createRazorpayOrder);
router.post("/verify", isLoggedIn, paymentController.verifyPayment);
router.post("/save-failed", isLoggedIn, paymentController.saveFailedPayment);
router.post("/retry/:orderId", isLoggedIn, paymentController.retryPayment);
router.post("/verify-retry", isLoggedIn, paymentController.verifyRetry);

router.get("/success", isLoggedIn, (req, res) => {
    res.render("payment-success", { orderId: req.query.orderId });
});

router.get("/failed", isLoggedIn, (req, res) => {
    res.render("payment-failed");
});

module.exports = router;
