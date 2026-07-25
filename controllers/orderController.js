const userModel = require("../models/user-model");
const orderModel = require("../models/order-model");

exports.checkoutPage = async function (req, res) {

    let user = await userModel
        .findById(req.user._id)
        .populate("cart.product");

    let originalCartLength = user.cart.length;
    user.cart = user.cart.filter(item => item.product && item.product.price !== undefined);
    if (user.cart.length !== originalCartLength) {
        await user.save();
    }

    let totalPrice = 20; // Platform Fee

    user.cart.forEach(item => {
        totalPrice +=
            (item.product.price - item.product.discount) *
            item.quantity;
    });

    res.render("checkout", {
        user,
        totalPrice
    });

};


exports.placeOrder = async function (req, res) {



    const user = await userModel
        .findById(req.user._id)
        .populate("cart.product");

    let originalCartLength = user.cart.length;
    user.cart = user.cart.filter(item => item.product && item.product.price !== undefined);
    if (user.cart.length !== originalCartLength) {
        await user.save();
    }

    let totalPrice = 20;

    const products = [];

    user.cart.forEach(item => {


        totalPrice +=
            (item.product.price - item.product.discount) *
            item.quantity;

        products.push({
            product: item.product._id,
            name: item.product.name,
            image: item.product.image,
            price: item.product.price,
            quantity: item.quantity
        });

    });


    const order = await orderModel.create({
        user: user._id,
        products,
        totalPrice
    });

    user.orders.push(order._id);
    user.cart = [];

    await user.save();

    res.redirect("/orders/my-orders");
};


exports.myOrders = async function (req, res) {

    const user = await userModel
        .findById(req.user._id)
        .populate("orders");

    res.render("orders", {

        orders: user.orders

    });

};

exports.orderDetails = async function (req, res) {

    const order = await orderModel
        .findById(req.params.orderId)
        .populate("user");

    if (!order) {
        return res.send("Order not found");
    }

    res.render("order-details", {
        order
    });
};