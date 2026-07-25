const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },

        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "product",
                },

                name: String,

                image: Buffer,

                price: Number,

                quantity: {
                    type: Number,
                    default: 1,
                },
            },
        ],

        totalPrice: {
            type: Number,
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending",
        },

        orderStatus: {
            type: String,
            enum: [
                "Placed",
                "Packed",
                "Shipped",
                "Delivered",
                "Cancelled",
            ],
            default: "Placed",
        },

        paymentId: String,
        razorpayOrderId: String,
        paymentMethod: {
            type: String,
            default: "Razorpay"
        },
        razorpaySignature: String,
        paymentDate: {
            type: Date,
            default: Date.now
        },
        cancelReason: String,
        trackingHistory: [
            {
                status: String,
                date: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        shippingAddress: {
            fullname: String,
            phone: String,
            street: String,
            city: String,
            state: String,
            pincode: String,
            country: String
        },
        estimatedDelivery: String,
        invoiceNumber: String,
        trackingStatus: {
            type: String,
            enum: [
                "Placed",
                "Confirmed",
                "Packed",
                "Shipped",
                "Out For Delivery",
                "Delivered",
                "Cancelled"
            ],
            default: "Placed"
        }
    },
    {
        timestamps: true,
    });

module.exports = mongoose.model("order", orderSchema);