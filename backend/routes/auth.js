// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const admin = require("../firebase-admin");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { firebase_uid, email, display_name, role } = req.body;
  if (!firebase_uid || !email) {
    return res.status(400).json({ error: "firebase_uid and email are required" });
  }
  try {
    await pool.query(
      `INSERT INTO users (firebase_uid, email, display_name, role)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email = VALUES(email),
         display_name = VALUES(display_name)`,
      [firebase_uid, email, display_name || null, role || "student"]
    );
    const [rows] = await pool.query(
      `SELECT id, firebase_uid, email, display_name, role, created_at
       FROM users WHERE firebase_uid = ?`,
      [firebase_uid]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error("POST /api/auth/register:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const [rows] = await pool.query(
      `SELECT id, firebase_uid, email, display_name, role, created_at
       FROM users WHERE firebase_uid = ?`,
      [decoded.uid]
    );
    if (!rows.length) return res.status(404).json({ error: "User not in DB yet" });
    res.json(rows[0]);
  } catch (err) {
    res.status(401).json({ error: "Token invalid: " + err.message });
  }
});

// PATCH /api/auth/last-active
router.patch("/last-active", async (req, res) => {
  const { firebase_uid } = req.body;
  try {
    await pool.query(
      `UPDATE users SET last_active = NOW() WHERE firebase_uid = ?`,
      [firebase_uid]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;