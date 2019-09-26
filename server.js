const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session");

const config = require("./config.json");
const authMiddleware = require("./middleware/auth");
const user = require("./api/user");
const singup = require("./api/singup");
const cart = require("./api/cart");
const category = require("./api/category");
const order = require("./api/order");
const product = require("./api/product");
const { upload } = require("./aws");

const app = express();
const port = config.PORT || 5000;

app.set("jwt-secret", config.JWT_SECRET);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(cookieParser());
app.use(
  session({
    secret: "asadlfkj!@#!@#dfgasdg",
    resave: false,
    saveUninitialized: true
  })
);

app.post("/api/auth/login", user.login);
app.get("/api/auth/token", authMiddleware);
app.get("/api/auth/token", user.check);

app.get("/api/auth/user", authMiddleware);
app.get("/api/auth/user", user.GET_ONE);
app.put("/api/auth/user", authMiddleware);
app.put("/api/auth/user", user.PUT);
app.get("/api/users", user.GET);
app.put("/api/users", user.PUT);

app.post("/api/user/duplicate", singup.GET);
app.post("/api/user", singup.POST);
app.delete("/api/user", singup.DELETE);

app.get("/api/categories", category.GET);
app.post("/api/category", category.POST);
app.delete("/api/category", category.DELETE);

app.get("/api/product", product.GET_ONE);
app.get("/api/products", product.GET);
app.post("/api/product", product.POST);
app.put("/api/product", product.PUT);
app.delete("/api/product", product.DELETE);
app.post("/api/product/photo", upload.array("photo", 6), product.PHOTO.POST);
app.delete("/api/product/photo", upload.single("photo"), product.PHOTO.DELETE);

app.get("/api/carts", authMiddleware);
app.get("/api/carts", cart.GET);
app.post("/api/cart", authMiddleware);
app.post("/api/cart", cart.POST);
app.delete("/api/cart", cart.DELETE);

app.get("/api/auth/order", authMiddleware);
app.get("/api/auth/order", order.GET_ONE);
app.get("/api/order", order.GET);
app.put("/api/order", order.PUT);
app.post("/api/order", authMiddleware);
app.post("/api/order", order.POST);

app.listen(port, () => console.log(`server is running on ${port} port`));
