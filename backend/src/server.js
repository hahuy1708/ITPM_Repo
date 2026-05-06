require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");

const app = express();

// middleware
app.use(express.json());

// Connect to DATABASE
connectDB();

// test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log("Server running on port " + PORT));
