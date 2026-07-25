const mongoose = require('mongoose');
const dbgr = require('debug')("development:mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ShopNest";

mongoose
    .connect(MONGODB_URI)
    .then(function () {
        dbgr("connected to MongoDB");
        console.log("MongoDB connected");
    })
    .catch(function (err) {
        dbgr(err);
        console.error("MongoDB connection error:", err.message);
    })


module.exports = mongoose.connection;