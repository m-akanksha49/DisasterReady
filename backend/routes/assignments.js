// backend/routes/assignments.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ── Multer setup ─────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|ppt|pptx|doc|docx/.test(
      path.extname(file.originalname).toLowerCase().replace(".", "")
    );
    cb(null, allowed);
  },
});

// ─────────────────────────────────────────────────────────
// DB INIT: Create tables if not exist
// ─────────────────────────────────────────────────────────
async function initTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        title         VARCHAR(255) NOT NULL,
        description   TEXT,
        module_id     INT NULL,
        file_name     VARCHAR(255) NULL,
        file_url      VARCHAR(500) NULL,
        due_date      DATE NULL,
        timer_minutes INT NULL DEFAULT NULL,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignment_students (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        assignment_id INT NOT NULL,
        student_id    INT NOT NULL,
        status        ENUM('assigned','in_progress','completed') DEFAULT 'assigned',
        progress      INT DEFAULT 0,
        completed_at  DATETIME NULL,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_asn_stu (assignment_id, student_id),
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
      )
    `);

    // Add timer_minutes column if it doesn't exist (migration safety)
    try {
      await pool.query(`ALTER TABLE assignments ADD COLUMN timer_minutes INT NULL DEFAULT NULL`);
    } catch (e) {
      // column already exists — ignore
    }

    console.log("✅ Assignment tables ready");
  } catch (err) {
    console.error("Assignment table init error:", err.message);
  }
}
initTables();

// ─────────────────────────────────────────────────────────
// GET /api/assignments  — list all with per-student rows
// ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const [assignments] = await pool.query(`
      SELECT
        a.*,
        m.title          AS module_title,
        m.icon           AS module_icon,
        COUNT(s.id)                              AS total_assigned,
        SUM(s.status = 'completed')              AS completed_count,
        ROUND(AVG(s.progress), 1)                AS avg_progress
      FROM assignments a
      LEFT JOIN modules m ON m.id = a.module_id
      LEFT JOIN assignment_students s ON s.assignment_id = a.id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);

    // Attach per-student rows for each assignment
    for (const asn of assignments) {
      const [students] = await pool.query(`
        SELECT
          s.id           AS student_id,
          u.display_name AS name,
          u.email,
          s.status,
          s.progress,
          s.completed_at
        FROM assignment_students s
        JOIN users u ON u.id = s.student_id
        WHERE s.assignment_id = ?
        ORDER BY u.display_name ASC
      `, [asn.id]);
      asn.students = students;
    }

    res.json(assignments);
  } catch (err) {
    console.error("GET /api/assignments:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/assignments/student/:userId  — student's own assignments
// ─────────────────────────────────────────────────────────
router.get("/student/:userId", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.id            AS assignment_id,
        a.title,
        a.description,
        a.module_id,
        a.file_name,
        a.file_url,
        a.due_date,
        a.timer_minutes,
        a.created_at,
        m.title         AS module_title,
        m.icon          AS module_icon,
        s.status,
        s.progress,
        s.completed_at
      FROM assignment_students s
      JOIN assignments a ON a.id = s.assignment_id
      LEFT JOIN modules m ON m.id = a.module_id
      WHERE s.student_id = ?
      ORDER BY a.created_at DESC
    `, [req.params.userId]);

    res.json(rows);
  } catch (err) {
    console.error("GET /api/assignments/student/:userId:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/assignments  — create assignment
// ─────────────────────────────────────────────────────────
router.post("/", upload.single("file"), async (req, res) => {
  const { title, description, module_id, due_date, timer_minutes } = req.body;
  let student_ids = [];
  try {
    student_ids = JSON.parse(req.body.student_ids || "[]");
  } catch {
    return res.status(400).json({ error: "Invalid student_ids JSON" });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  if (!student_ids.length) {
    return res.status(400).json({ error: "At least one student must be selected" });
  }

  const file_name = req.file ? req.file.originalname : null;
  const file_url  = req.file ? `/uploads/${req.file.filename}` : null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [r] = await conn.query(`
      INSERT INTO assignments (title, description, module_id, file_name, file_url, due_date, timer_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      title.trim(),
      description || "",
      module_id || null,
      file_name,
      file_url,
      due_date || null,
      timer_minutes ? Number(timer_minutes) : null,
    ]);

    const asnId = r.insertId;

    for (const sid of student_ids) {
      await conn.query(`
        INSERT INTO assignment_students (assignment_id, student_id, status, progress)
        VALUES (?, ?, 'assigned', 0)
        ON DUPLICATE KEY UPDATE status = status
      `, [asnId, sid]);
    }

    await conn.commit();
    res.status(201).json({ ok: true, id: asnId });
  } catch (err) {
    await conn.rollback();
    console.error("POST /api/assignments:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/assignments/:id/student/:studentId  — update progress/status
// ─────────────────────────────────────────────────────────
router.patch("/:id/student/:studentId", async (req, res) => {
  const { progress, status } = req.body;
  try {
    const completed_at = status === "completed" ? new Date() : null;
    await pool.query(`
      UPDATE assignment_students
      SET progress = ?, status = ?, completed_at = ?
      WHERE assignment_id = ? AND student_id = ?
    `, [progress || 0, status || "assigned", completed_at, req.params.id, req.params.studentId]);
    res.json({ ok: true });
  } catch (err) {
    console.error("PATCH progress:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/assignments/:id
// ─────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM assignments WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;