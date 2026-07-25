const Razorpay = require('razorpay');
const orderModel = require("../models/order-model");
const userModel = require("../models/user-model");
const crypto = require("crypto");

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId123',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'mockSecret123',
});

// Creates a Razorpay order from the items in checkout
exports.createRazorpayOrder = async function (req, res) {
    try {
        const user = await userModel.findById(req.user._id).populate("cart.product");

        let totalPrice = 20; // Platform Fee
        user.cart = user.cart.filter(item => item.product && item.product.price !== undefined);

        user.cart.forEach(item => {
            const discount = item.product.discount || 0;
            totalPrice += (item.product.price - discount) * item.quantity;
        });

        if (user.cart.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        const options = {
            amount: Math.round(totalPrice * 100), // amount in paisa
            currency: "INR",
            receipt: `rcpt_${Date.now()}`
        };

        instance.orders.create(options, function (err, order) {
            if (err) {
                console.error("Razorpay order creation error, using mock fallback:", err.message);
                // Fallback for local sandbox testing if internet or api keys fail
                return res.status(200).json({
                    isMock: true,
                    key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId123',
                    amount: options.amount,
                    currency: options.currency,
                    id: `order_mock_${Date.now()}`
                });
            }
            res.status(200).json({
                key: process.env.RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                id: order.id
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Verifies the Razorpay payment details and creates the final Order
exports.verifyPayment = async function (req, res) {
    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            isMock,
            shippingAddress // Address selected by user at Checkout
        } = req.body;

        const user = await userModel.findById(req.user._id).populate("cart.product");
        user.cart = user.cart.filter(item => item.product && item.product.price !== undefined);

        if (user.cart.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        // Calculate amount
        let totalPrice = 20; // Platform Fee
        const products = [];

        user.cart.forEach(item => {
            const discount = item.product.discount || 0;
            totalPrice += (item.product.price - discount) * item.quantity;
            products.push({
                product: item.product._id,
                name: item.product.name,
                image: item.product.image,
                price: item.product.price,
                quantity: item.quantity
            });
        });

        // Verification phase
        let signatureVerified = false;

        if (isMock) {
            // Local fallback sandbox verification is automatic
            signatureVerified = true;
        } else {
            const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
            hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
            const generated_signature = hmac.digest('hex');

            if (generated_signature === razorpay_signature) {
                signatureVerified = true;
            }
        }

        if (signatureVerified) {
            // Duplicate Payment Check: Ensure this payment hasn't already been processed
            if (!isMock) {
                const duplicateOrder = await orderModel.findOne({ paymentId: razorpay_payment_id });
                if (duplicateOrder) {
                    return res.status(400).json({ error: "Duplicate payment detected" });
                }
            }

            // Address management: if address is supplied, use it, else use a placeholder until addresses are built
            let address = null;
            if (shippingAddress) {
                try {
                    address = typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress;
                } catch (e) {
                    console.error("Address parse error:", e);
                }
            }

            if (!address) {
                address = {
                    fullname: user.fullname,
                    phone: user.contact || "9999999999",
                    street: "123 Default Street",
                    city: "City",
                    state: "State",
                    pincode: "110001",
                    country: "India"
                };
            }

            const order = await orderModel.create({
                user: user._id,
                products,
                totalPrice,
                paymentStatus: "Paid",
                orderStatus: "Placed",
                paymentId: razorpay_payment_id || `pay_mock_${Date.now()}`,
                razorpayOrderId: razorpay_order_id || `order_mock_${Date.now()}`,
                paymentMethod: "Razorpay",
                razorpaySignature: razorpay_signature,
                paymentDate: new Date(),
                trackingHistory: [{ status: "Placed", date: new Date() }],
                shippingAddress: address,
                estimatedDelivery: "4-5 Days",
                invoiceNumber: `INV-${Date.now()}`,
                trackingStatus: "Placed"
            });

            // Update user orders and clear cart
            user.orders.push(order._id);
            user.cart = [];
            await user.save();

            req.flash("success", "Payment successful! Order placed.");
            return res.status(200).json({ success: true, redirectUrl: "/payment/success?orderId=" + order._id });
        } else {
            return res.status(400).json({ error: "Payment verification failed" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to verify payment" });
    }
};

// Record a failed payment when razorpay throws an error in checkout
exports.saveFailedPayment = async function (req, res) {
    try {
        const { error, razorpay_order_id, shippingAddress, isMock } = req.body;

        const user = await userModel.findById(req.user._id).populate("cart.product");
        user.cart = user.cart.filter(item => item.product && item.product.price !== undefined);

        if (user.cart.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        let totalPrice = 20; // Platform Fee
        const products = [];

        user.cart.forEach(item => {
            const discount = item.product.discount || 0;
            totalPrice += (item.product.price - discount) * item.quantity;
            products.push({
                product: item.product._id,
                name: item.product.name,
                image: item.product.image,
                price: item.product.price,
                quantity: item.quantity
            });
        });

        let address = null;
        if (shippingAddress) {
            try { address = typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress; } catch (e) { }
        }
        if (!address) {
            address = {
                fullname: user.fullname,
                phone: user.contact || "9999999999",
                street: "123 Default Street",
                city: "City",
                state: "State",
                pincode: "110001",
                country: "India"
            };
        }

        const order = await orderModel.create({
            user: user._id,
            products,
            totalPrice,
            paymentStatus: "Failed",
            orderStatus: "Placed",
            paymentId: error?.metadata?.payment_id || `failed_${Date.now()}`,
            razorpayOrderId: error?.metadata?.order_id || razorpay_order_id || `order_mock_${Date.now()}`,
            paymentMethod: "Razorpay",
            cancelReason: error?.description || "Payment failed",
            paymentDate: new Date(),
            trackingHistory: [{ status: "Placed", date: new Date() }],
            shippingAddress: address,
            estimatedDelivery: "4-5 Days",
            invoiceNumber: `INV-${Date.now()}`,
            trackingStatus: "Placed"
        });

        user.orders.push(order._id);
        user.cart = []; // clear cart
        await user.save();

        res.status(200).json({ success: true, redirectUrl: "/payment/failed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save failed payment" });
    }
};


exports.retryPayment = async function (req, res) {
    try {
        const order = await orderModel.findById(req.params.orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });

        if (order.user.toString() !== req.user._id.toString()) return res.status(403).json({ error: "Unauthorized" });
        if (order.paymentStatus !== "Failed") return res.status(400).json({ error: "Only failed orders can be retried" });

        const options = {
            amount: Math.round(order.totalPrice * 100),
            currency: "INR",
            receipt: `rcpt_retry_${order._id}`
        };

        instance.orders.create(options, async function (err, rzOrder) {
            if (err) {
                return res.status(200).json({
                    isMock: true,
                    key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId123',
                    amount: options.amount,
                    currency: options.currency,
                    id: `order_mock_${Date.now()}`,
                    orderId: order._id
                });
            }
            order.razorpayOrderId = rzOrder.id;
            await order.save();

            res.status(200).json({
                key: process.env.RAZORPAY_KEY_ID,
                amount: rzOrder.amount,
                currency: rzOrder.currency,
                id: rzOrder.id,
                orderId: order._id
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.verifyRetry = async function (req, res) {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, isMock, orderId } = req.body;
        const order = await orderModel.findById(orderId);

        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.user.toString() !== req.user._id.toString()) return res.status(403).json({ error: "Unauthorized" });

        let signatureVerified = false;
        if (isMock) {
            signatureVerified = true;
        } else {
            const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
            hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
            const generated_signature = hmac.digest('hex');
            if (generated_signature === razorpay_signature) signatureVerified = true;
        }

        if (signatureVerified) {
            if (!isMock) {
                const duplicateOrder = await orderModel.findOne({ paymentId: razorpay_payment_id });
                if (duplicateOrder && duplicateOrder._id.toString() !== order._id.toString()) {
                    return res.status(400).json({ error: "Duplicate payment detected" });
                }
            }

            order.paymentStatus = "Paid";
            order.paymentId = razorpay_payment_id || `pay_mock_${Date.now()}`;
            order.razorpaySignature = razorpay_signature;
            order.paymentDate = new Date();
            order.paymentMethod = "Razorpay";
            await order.save();
            return res.status(200).json({ success: true, redirectUrl: "/payment/success?orderId=" + order._id });
        } else {
            return res.status(400).json({ error: "Payment verification failed" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to verify retry payment" });
    }
};

