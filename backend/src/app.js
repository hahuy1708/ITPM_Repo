const express = require("express");
const cors = require("cors");
const { corsOptions } = require("./config/cors");
const { uploadRoot } = require("./config/storage");
const apiRoutes = require("./routes");
const { globalErrorHandler, notFoundHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());
app.use("/uploads", express.static(uploadRoot));
app.use(cors(corsOptions));

app.use("/api", apiRoutes);

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "ITPM API is running",
  });
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
