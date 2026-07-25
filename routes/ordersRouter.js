const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const isLoggedIn = require("../middlewares/isLoggedIn");

router.get("/checkout", isLoggedIn, orderController.checkoutPage);
router.post("/place-order", isLoggedIn, orderController.placeOrder);
router.get("/my-orders",
    isLoggedIn,
    orderController.myOrders
);
router.get("/:orderId", isLoggedIn, orderController.orderDetails);

module.exports = router;