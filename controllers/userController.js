const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const upload = require("../config/multer-config");

// GET /users/profile
exports.profilePage = async function (req, res) {
    try {
        const user = await userModel.findById(req.user._id);
        let success = req.flash("success");
        let error = req.flash("error");
        res.render("profile", { user, success, error });
    } catch (err) {
        req.flash("error", "Failed to load profile.");
        res.redirect("/shop");
    }
};

// POST /users/profile/update
exports.updateProfile = async function (req, res) {
    try {
        const { fullname, contact } = req.body;
        const updateData = { fullname, contact: Number(contact) || undefined };

        if (req.file && req.file.buffer) {
            // Store as base64 data URL for easy rendering
            updateData.picture = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        }

        await userModel.findByIdAndUpdate(req.user._id, updateData);
        req.flash("success", "Profile updated successfully.");
        res.redirect("/users/profile");
    } catch (err) {
        req.flash("error", "Failed to update profile: " + err.message);
        res.redirect("/users/profile");
    }
};

// POST /users/profile/change-password
exports.changePassword = async function (req, res) {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            req.flash("error", "New passwords do not match.");
            return res.redirect("/users/profile");
        }

        if (newPassword.length < 6) {
            req.flash("error", "New password must be at least 6 characters.");
            return res.redirect("/users/profile");
        }

        const user = await userModel.findById(req.user._id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            req.flash("error", "Current password is incorrect.");
            return res.redirect("/users/profile");
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        await userModel.findByIdAndUpdate(req.user._id, { password: hash });

        req.flash("success", "Password changed successfully.");
        res.redirect("/users/profile");
    } catch (err) {
        req.flash("error", "Failed to change password: " + err.message);
        res.redirect("/users/profile");
    }
};

// POST /users/profile/address/add
exports.addAddress = async function (req, res) {
    try {
        const { fullname, phone, street, city, state, pincode, country, isDefault } = req.body;
        const user = await userModel.findById(req.user._id);

        // If this is the first address or marked as default, unset all others
        if (isDefault === "on" || user.addresses.length === 0) {
            user.addresses.forEach(addr => { addr.isDefault = false; });
        }

        user.addresses.push({
            fullname, phone, street, city, state,
            pincode, country,
            isDefault: isDefault === "on" || user.addresses.length === 0
        });

        await user.save();
        req.flash("success", "Address added successfully.");
        res.redirect("/users/profile");
    } catch (err) {
        req.flash("error", "Failed to add address: " + err.message);
        res.redirect("/users/profile");
    }
};

// POST /users/profile/address/:id/delete
exports.deleteAddress = async function (req, res) {
    try {
        const user = await userModel.findById(req.user._id);
        user.addresses = user.addresses.filter(
            addr => addr._id.toString() !== req.params.id
        );
        await user.save();
        req.flash("success", "Address removed.");
        res.redirect("/users/profile");
    } catch (err) {
        req.flash("error", "Failed to remove address: " + err.message);
        res.redirect("/users/profile");
    }
};

// POST /users/profile/address/:id/set-default
exports.setDefaultAddress = async function (req, res) {
    try {
        const user = await userModel.findById(req.user._id);
        user.addresses.forEach(addr => {
            addr.isDefault = addr._id.toString() === req.params.id;
        });
        await user.save();
        req.flash("success", "Default address updated.");
        res.redirect("/users/profile");
    } catch (err) {
        req.flash("error", "Failed to update default address: " + err.message);
        res.redirect("/users/profile");
    }
};
