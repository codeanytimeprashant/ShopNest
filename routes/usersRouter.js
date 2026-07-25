const express = require("express");
const router = express.Router();
const upload = require("../config/multer-config");
const isLoggedIn = require("../middlewares/isLoggedIn");

const { registerUser, loginUser, logoutUser } = require("../controllers/authcontroller");
const { profilePage, updateProfile, changePassword, addAddress, deleteAddress, setDefaultAddress } = require("../controllers/userController");

router.get("/", function (req, res) {
  res.send("Hey, its working for users");
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);

// ─── Profile Routes ───────────────────────────────────────────────────
router.get("/profile", isLoggedIn, profilePage);
router.post("/profile/update", isLoggedIn, upload.single("picture"), updateProfile);
router.post("/profile/change-password", isLoggedIn, changePassword);
router.post("/profile/address/add", isLoggedIn, addAddress);
router.post("/profile/address/:id/delete", isLoggedIn, deleteAddress);
router.post("/profile/address/:id/set-default", isLoggedIn, setDefaultAddress);

module.exports = router;
