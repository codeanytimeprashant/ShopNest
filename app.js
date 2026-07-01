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

require('dotenv').config();

console.log("JWT_KEY =", process.env.JWT_KEY);
console.log("EXPRESS_SESSION_SECRET =", process.env.EXPRESS_SESSION_SECRET);


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        secret: process.env.EXPRESS_SESSION_SECRET,
    })
)
app.use(flash());
app.use(express.static(path.join(__dirname,"public")));
app.set("view engine","ejs");

app.use("/owners",ownersRouter);
app.use("/products",productsRouter);
app.use("/users",usersRouter);
app.use("/",indexRouter);



app.listen(3000);