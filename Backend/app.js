const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");
const session = require("express-session");
const UserRoute = require("./routes/UserRoute");
const PropertyRoute = require("./routes/PropertyRoute");
const BookingRoute = require("./routes/BookingRoute");
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: "jwt_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day or as you prefer
    },
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
  console.log("Session user:", req.session?.user);
  req.user = req.session?.user;
  next();
});
app.use((req, res, next) => {
  res.locals.user = req.user || req.session?.user || null;
  next();
});

app.use(UserRoute);
app.use(PropertyRoute);
app.use(BookingRoute);

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
