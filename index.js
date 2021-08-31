const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

/* -------- Initial Express App Setup -------- */
const app = express();
const PORT = process.env.PORT || 5000;
const userRoutes = require("./routes/user-routes");
const studentRoutes = require("./routes/student-routes");
const userBooksRoutes = require("./routes/user-books-routes");
const activityLogRoutes = require("./routes/activity-log-routes");
const authJwt = require("./middleware/authJWT");
const userValidate = require("./middleware/userValidate");

app.use(cors());
/*const buildPath = path.join(__dirname, "..", "build");
app.use(express.static(buildPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath + "/index.html"));
});*/
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api/user", userRoutes);
app.use(
  "/api/students",
  [authJwt.verifyToken, userValidate.validateUserID],
  studentRoutes
);
app.use(
  "/api/userbooks",
  [authJwt.verifyToken, userValidate.validateUserID],
  userBooksRoutes
);
app.use(
  "/api/activitylog",
  [authJwt.verifyToken, userValidate.validateUserID],
  activityLogRoutes
);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/* -------- Initial MongoDB Setup -------- */
mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
    auto_reconnect: true,
  })
  .then(() => {
    console.info("MongoDB Connected");
  })
  .catch((e) => {
    console.error("Connection Error", e.message);
  });

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));

db.on("reconnected", function () {
  console.log("MongoDB reconnected!");
});
db.on("disconnected", function () {
  console.log("MongoDB disconnected!");
  mongoose.connect(process.env.DB_URI, { auto_reconnect: true });
});

/* -------- Express API Connectors -------- */
/*
  Listed are just endpoints - the goal is to call api support functions
*/
