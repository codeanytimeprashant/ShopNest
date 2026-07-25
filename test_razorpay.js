const Razorpay = require('razorpay');
require('dotenv').config();

console.log("ENV Key ID length:", (process.env.RAZORPAY_KEY_ID || "").length);
console.log("ENV Secret length:", (process.env.RAZORPAY_KEY_SECRET || "").length);

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

instance.orders.create({
    amount: 1000,
    currency: "INR",
    receipt: "test_receipt"
}).then(order => {
    console.log("DIAGNOSTIC_SUCCESS: Order created successfully:", order.id);
}).catch(err => {
    console.log("DIAGNOSTIC_FAILURE: Error details below:");
    console.error(err);
});
