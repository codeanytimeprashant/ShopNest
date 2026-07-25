require('dotenv').config();
const express = require('express');
const app = express();

const db = require("./config/mongoose-connection");

const cookieParser = require('cookie-parser');
const path = require('path');
const expressSession = require('express-session');
const flash = require('connect-flash');

const ownersRouter = require('./routes/ownersRouter');
const productsRouter = require('./routes/productsRouter');
const usersRouter = require('./routes/usersRouter');
const indexRouter = require('./routes/index');
const ordersRouter = require("./routes/ordersRouter");
const paymentRouter = require("./routes/paymentRouter");




app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        secret: process.env.EXPRESS_SESSION_SECRET,
    })
)
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.use("/owners", ownersRouter);
app.use("/products", productsRouter);
app.use("/users", usersRouter);
app.use("/orders", ordersRouter);
app.use("/payment", paymentRouter);
app.use("/", indexRouter);



// Reload server once more to load discount correction logic
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`ShopNest is running on port ${PORT}`);
});
