const orderModel = require("../models/order-model");
const userModel = require("../models/user-model");
const productModel = require("../models/product-model");

exports.adminDashboard = async function (req, res) {
    try {
        const totalUsers = await userModel.countDocuments();
        const totalOrders = await orderModel.countDocuments();

        const orders = await orderModel.find();

        let totalRevenue = 0;
        orders.forEach(order => {
            if (order.paymentStatus === "Paid" || order.paymentStatus === "Pending") {
                totalRevenue += order.totalPrice;
            }
        });

        const recentOrders = await orderModel.find().populate("user").sort({ createdAt: -1 }).limit(5);

        let success = req.flash("success");
        let error = req.flash("error");
        res.render("admin-dashboard", {
            success,
            error,
            totalUsers,
            totalOrders,
            totalRevenue,
            recentOrders
        });
    } catch (err) {
        req.flash("error", "Error loading admin dashboard: " + err.message);
        res.redirect("/owners/admin");
    }
};

exports.adminOrders = async function (req, res) {
    try {
        const orders = await orderModel.find().populate("user").sort({ createdAt: -1 });
        let success = req.flash("success");
        let error = req.flash("error");
        res.render("admin-orders", { success, error, orders });
    } catch (err) {
        req.flash("error", "Error loading admin orders: " + err.message);
        res.redirect("/owners/admin/dashboard");
    }
};

exports.updateOrderStatus = async function (req, res) {
    try {
        const { orderStatus, trackingStatus } = req.body;
        const orderId = req.params.id;

        await orderModel.findByIdAndUpdate(orderId, {
            orderStatus,
            trackingStatus
        });

        req.flash("success", "Order status updated successfully.");
        res.redirect("/owners/admin/orders");
    } catch (err) {
        req.flash("error", "Error updating order status: " + err.message);
        res.redirect("/owners/admin/orders");
    }
};

// ─── Inventory Management ────────────────────────────────────────────

exports.getInventory = async function (req, res) {
    try {
        const products = await productModel.find().sort({ _id: -1 });
        let success = req.flash("success");
        let error = req.flash("error");
        res.render("admin-inventory", { products, success, error });
    } catch (err) {
        req.flash("error", "Error loading inventory: " + err.message);
        res.redirect("/owners/admin/dashboard");
    }
};

exports.editProductPage = async function (req, res) {
    try {
        const product = await productModel.findById(req.params.id);
        if (!product) {
            req.flash("error", "Product not found.");
            return res.redirect("/owners/admin/inventory");
        }
        let success = req.flash("success");
        let error = req.flash("error");
        res.render("admin-edit-product", { product, success, error });
    } catch (err) {
        req.flash("error", "Error loading product: " + err.message);
        res.redirect("/owners/admin/inventory");
    }
};

exports.updateProduct = async function (req, res) {
    try {
        const { name, price, discount, description, category, stock, brand, bgcolor, panelcolor, textcolor } = req.body;

        const updateData = { name, price: Number(price), discount: Number(discount) || 0, description, category, stock: Number(stock) || 0, brand, bgcolor, panelcolor, textcolor };

        // Only update image if a new one was uploaded
        if (req.file && req.file.buffer) {
            updateData.image = req.file.buffer;
        }

        await productModel.findByIdAndUpdate(req.params.id, updateData);
        req.flash("success", "Product updated successfully.");
        res.redirect("/owners/admin/inventory");
    } catch (err) {
        req.flash("error", "Error updating product: " + err.message);
        res.redirect("/owners/admin/inventory");
    }
};

exports.deleteProduct = async function (req, res) {
    try {
        await productModel.findByIdAndDelete(req.params.id);
        req.flash("success", "Product deleted successfully.");
        res.redirect("/owners/admin/inventory");
    } catch (err) {
        req.flash("error", "Error deleting product: " + err.message);
        res.redirect("/owners/admin/inventory");
    }
};
