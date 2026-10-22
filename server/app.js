const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { allowedOrigins } = require("./config/origins");

const app = express();

app.set("trust proxy", 1); 

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");


app.get("/api/health", (req, res) => res.json({ success: true, status: "ok" }));

app.use("/api/auth", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tasks", taskRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
 const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err.stack);
  res.status(status).json({
    success: false,
    message:
      status >= 500 && process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
});

module.exports = app;
