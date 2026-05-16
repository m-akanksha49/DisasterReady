// backend/server.js
require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");

const authRouter        = require("./routes/auth");
const usersRouter       = require("./routes/users");
const modulesRouter     = require("./routes/modules");
const studentsRouter    = require("./routes/students");
const assignmentsRouter = require("./routes/assignments");
const drillsRouter      = require("./routes/drills");   // ✅ NEW


const quizRouter = require("./routes/quiz");
app.use("/api", quizRouter);

const app = express();

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/modules", modulesRouter);
app.use("/api/students", studentsRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/drills", drillsRouter);     // ✅ NEW

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server running" });
});

// Database check
app.get("/api/db-check", async (req, res) => {
  try {
    const pool   = require("./db");
    const [tables] = await pool.query("SHOW TABLES");
    res.json({ message: "Connected", tables });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  const pool = require("./db");
  pool.query("SELECT 1")
    .then(() => console.log("✅ MySQL Connected"))
    .catch((err) => console.error("❌ MySQL Error:", err.message));
});
