const http = require("http");
const env = require("./config/env");
const connectDB = require("./config/db");
const app = require("./app");
const { initSocket } = require("./services/socket.service");
const { startDeadlineNotifier } = require("./services/deadline-notifier.service");

connectDB();

const server = http.createServer(app);

initSocket(server, env.corsOrigins);
startDeadlineNotifier();

server.listen(env.port, () => console.log("Server running on port " + env.port));
