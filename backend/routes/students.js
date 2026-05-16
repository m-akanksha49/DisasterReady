// backend/routes/students.js
const express = require("express");
const router  = express.Router();
const pool    = require("../db");

// GET /api/students
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, display_name AS name, email, created_at, last_active, role
      FROM users
      WHERE role = 'student'
      ORDER BY display_name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("GET /api/students:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;