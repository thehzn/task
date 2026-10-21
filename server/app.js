const express = require("express");
const cors = require("cors");
const app = express();
const cookieParse = require("cookie-parser");

app.use(cors({
    origin:'http://localhost:5173',
       credentials: true,              
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParse());
app.use(express.urlencoded({extended:true}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const adminRoutes = require("./routes/adminRoutes");
const userRoutes  =require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");

app.use("/api/auth",userRoutes);
app.use("/api/admin" ,adminRoutes);
app.use("/api/tasks",taskRoutes);


app.use((req, res) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal server error" });
});

module.exports = app;