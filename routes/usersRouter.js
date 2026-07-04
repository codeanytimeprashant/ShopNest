const express = require("express");
const router = express.Router();

const { registerUser, loginUser, logoutUser} = require("../controllers/authcontroller");


router.get("/", function (req, res) {
  res.send("Hey, its working for users");
});


router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);



module.exports = router;
