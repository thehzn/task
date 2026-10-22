const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const http = require("http");
const app = require("./app");
const databaseConnection = require("./config/databaseConnection");
const { initSocket } = require("./utils/socket");

const missing = ["MONGO_URI", "JWT_SECRET"].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env variables: ${missing.join(", ")}`);
  process.exit(1);
}


const server = http.createServer(app);
initSocket(server, app);

const PORT = process.env.PORT || 5000;

databaseConnection().then(() => {
  server.listen(PORT, () => console.log(`server is running on port ${PORT}`));
});
