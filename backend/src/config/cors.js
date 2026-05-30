const env = require("./env");

const corsOptions = {
  origin: env.corsOrigins,
  credentials: true,
};

module.exports = {
  corsOptions,
};
