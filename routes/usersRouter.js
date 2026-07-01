const express = require("express");
const router = express.Router();

const { registerUser, loginUser} = require("../controllers/authcontroller");


router.get("/", function (req, res) {
  res.send("Hey, its working for users");
});

router.post("/register", registerUser);
router.post("/login", loginUser);


module.exports = router;
