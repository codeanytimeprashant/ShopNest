const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owner-model');
const upload = require('../config/multer-config');
const { adminDashboard, adminOrders, updateOrderStatus, getInventory, editProductPage, updateProduct, deleteProduct } = require("../controllers/ownerController");

if (process.env.NODE_ENV === "development") {
    router.post("/create", async function (req, res) {
        let owners = await ownerModel.find();

        if (owners.length > 0) {
            return res.status(503).send("You don't have permission to create a new owner");
        }

        let { fullname, email, password } = req.body;
        let createdOwner = await ownerModel.create({
            fullname,
            email,
            password
        })
        res.status(201).send(createdOwner);
    })
}


router.get("/admin", function (req, res) {
    let success = req.flash("success");
    res.render("createproducts", { success });
})

router.get("/admin/dashboard", adminDashboard);
router.get("/admin/orders", adminOrders);
router.post("/admin/orders/:id/status", updateOrderStatus);

// Inventory Management
router.get("/admin/inventory", getInventory);
router.get("/admin/products/:id/edit", editProductPage);
router.post("/admin/products/:id/update", upload.single('image'), updateProduct);
router.post("/admin/products/:id/delete", deleteProduct);

module.exports = router;