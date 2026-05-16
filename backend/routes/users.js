// backend/routes/users.js
const express = require("express");
const router  = express.Router();
const pool    = require("../db");
const admin   = require("../firebase-admin");

// GET /api/users/me
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const [rows] = await pool.query(
      `SELECT id, display_name AS name, email, role, created_at
       FROM users WHERE firebase_uid = ?`,
      [decoded.uid]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("AUTH ERROR:", err);
    res.status(401).json({ error: "Invalid token: " + err.message });
  }
});

module.exports = router;