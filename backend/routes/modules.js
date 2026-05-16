// backend/routes/modules.js
const express = require("express");
const router  = express.Router();
const pool    = require("../db");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");

// ── Multer ─────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /jpeg|jpg|png|gif|webp/.test(file.mimetype));
  },
});

const parseJSON = (v, fallback = []) => {
  if (!v) return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
};
const toBool = (v) => v === "true" || v === true || v === 1 ? 1 : 0;

// ════════════════════════════════════════════════════════
// IMPORTANT: specific named routes MUST come before /:id
// ════════════════════════════════════════════════════════

// GET /api/modules/test
router.get("/test", (req, res) => res.json({ ok: true }));

// GET /api/modules/stats — viewer counts per module
router.get("/stats", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        module_id        AS id,
        COUNT(*)         AS enrolled,
        ROUND(AVG(progress),1) AS avg_progress,
        SUM(completed=1) AS completed_count
      FROM module_progress
      GROUP BY module_id
    `);
    res.json(rows);
  } catch (err) {
    console.error("GET /stats:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/modules/progress/:userId
router.get("/progress/:userId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT module_id, progress, completed FROM module_progress WHERE user_id = ?",
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/modules/progress
router.post("/progress", async (req, res) => {
  const { userId, userName, moduleId, progress, completed } = req.body;
  if (!userId || !moduleId)
    return res.status(400).json({ ok: false, error: "userId and moduleId required" });
  try {
    await pool.query(
      `INSERT INTO module_progress (user_id, user_name, module_id, progress, completed)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         user_name=VALUES(user_name), progress=VALUES(progress), completed=VALUES(completed)`,
      [userId, userName || "", moduleId, progress || 0, completed ? 1 : 0]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/modules/student-progress/:moduleId — per-student progress for a module
router.get("/student-progress/:moduleId", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        mp.user_id,
        mp.user_name,
        u.email,
        mp.progress,
        mp.completed,
        mp.updated_at
      FROM module_progress mp
      LEFT JOIN users u ON u.id = mp.user_id
      WHERE mp.module_id = ?
      ORDER BY mp.progress DESC
    `, [req.params.moduleId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/modules (list) ────────────────────────────────────
router.get("/", async (req, res) => {
  const { role } = req.query;
  try {
    let sql = `
      SELECT m.*,
        (SELECT COUNT(*) FROM module_sections  WHERE module_id = m.id) AS section_count,
        (SELECT COUNT(*) FROM module_quizzes   WHERE module_id = m.id) AS quiz_count,
        (SELECT COUNT(*) FROM module_progress  WHERE module_id = m.id) AS viewer_count,
        (SELECT ROUND(AVG(progress),1) FROM module_progress WHERE module_id = m.id) AS avg_progress
      FROM modules m
    `;
    if (role !== "admin") sql += " WHERE m.is_published = 1";
    sql += " ORDER BY m.created_at DESC";
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("GET /:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/modules/:id ────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const [[mod]] = await pool.query("SELECT * FROM modules WHERE id=?", [req.params.id]);
    if (!mod) return res.status(404).json({ error: "Not found" });
    const [sections] = await pool.query(
      "SELECT * FROM module_sections WHERE module_id=? ORDER BY sort_order", [req.params.id]
    );
    const [quizzes] = await pool.query(
      "SELECT * FROM module_quizzes WHERE module_id=? ORDER BY sort_order", [req.params.id]
    );
    res.json({ ...mod, sections, quizzes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/modules (create) ──────────────────────────────────
router.post("/", upload.single("thumbnail"), async (req, res) => {
  const { title, description, category, icon, color,
          is_published, created_by, creator_name, sections, quizzes } = req.body;
  if (!title)       return res.status(400).json({ error: "Title required" });
  if (!created_by)  return res.status(400).json({ error: "created_by required" });

  const thumbnail_url   = req.file ? `/uploads/${req.file.filename}` : null;
  const parsedSections  = parseJSON(sections, []);
  const parsedQuizzes   = parseJSON(quizzes,  []);
  const publishedVal    = toBool(is_published);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO modules
        (title,description,category,thumbnail_url,icon,color,is_published,created_by,creator_name,lessons_count)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [title, description||"", category||"General", thumbnail_url,
       icon||"📚", color||"#3b82f6", publishedVal, created_by,
       creator_name||"", parsedSections.length]
    );
    const mid = r.insertId;

    for (let i = 0; i < parsedSections.length; i++) {
      const s = parsedSections[i];
      await conn.query(
        `INSERT INTO module_sections(module_id,sort_order,tag,title,content,image_url,color,icon)
         VALUES(?,?,?,?,?,?,?,?)`,
        [mid, i, s.tag||"", s.title||"Slide "+(i+1), s.content||"",
         s.image_url||"", s.color||color||"#3b82f6", s.icon||"📖"]
      );
    }
    for (let i = 0; i < parsedQuizzes.length; i++) {
      const q = parsedQuizzes[i];
      if (!q.question) continue;
      await conn.query(
        `INSERT INTO module_quizzes(module_id,sort_order,question,option_a,option_b,option_c,option_d,correct_answer,explanation)
         VALUES(?,?,?,?,?,?,?,?,?)`,
        [mid, i, q.question, q.option_a||"", q.option_b||"",
         q.option_c||"", q.option_d||"", q.correct_answer||"A", q.explanation||""]
      );
    }
    await conn.commit();
    res.status(201).json({ ok: true, moduleId: mid });
  } catch (err) {
    await conn.rollback();
    console.error("POST /:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ── PUT /api/modules/:id (update) ──────────────────────────────
router.put("/:id", upload.single("thumbnail"), async (req, res) => {
  const { id } = req.params;
  const { title, description, category, icon, color,
          is_published, sections, quizzes } = req.body;
  const parsedSections = parseJSON(sections, null);
  const parsedQuizzes  = parseJSON(quizzes,  null);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const fields = [], vals = [];
    if (title       !== undefined) { fields.push("title=?");        vals.push(title); }
    if (description !== undefined) { fields.push("description=?");  vals.push(description); }
    if (category    !== undefined) { fields.push("category=?");     vals.push(category); }
    if (icon        !== undefined) { fields.push("icon=?");         vals.push(icon); }
    if (color       !== undefined) { fields.push("color=?");        vals.push(color); }
    if (is_published !== undefined){ fields.push("is_published=?"); vals.push(toBool(is_published)); }
    if (req.file)   { fields.push("thumbnail_url=?"); vals.push(`/uploads/${req.file.filename}`); }
    if (fields.length) {
      vals.push(id);
      await conn.query(`UPDATE modules SET ${fields.join(",")} WHERE id=?`, vals);
    }
    if (parsedSections !== null) {
      await conn.query("DELETE FROM module_sections WHERE module_id=?", [id]);
      for (let i = 0; i < parsedSections.length; i++) {
        const s = parsedSections[i];
        await conn.query(
          `INSERT INTO module_sections(module_id,sort_order,tag,title,content,image_url,color,icon)
           VALUES(?,?,?,?,?,?,?,?)`,
          [id, i, s.tag||"", s.title||"", s.content||"", s.image_url||"",
           s.color||"#3b82f6", s.icon||"📖"]
        );
      }
      await conn.query("UPDATE modules SET lessons_count=? WHERE id=?",
        [parsedSections.length, id]);
    }
    if (parsedQuizzes !== null) {
      await conn.query("DELETE FROM module_quizzes WHERE module_id=?", [id]);
      for (let i = 0; i < parsedQuizzes.length; i++) {
        const q = parsedQuizzes[i];
        if (!q.question) continue;
        await conn.query(
          `INSERT INTO module_quizzes(module_id,sort_order,question,option_a,option_b,option_c,option_d,correct_answer,explanation)
           VALUES(?,?,?,?,?,?,?,?,?)`,
          [id, i, q.question, q.option_a||"", q.option_b||"",
           q.option_c||"", q.option_d||"", q.correct_answer||"A", q.explanation||""]
        );
      }
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ── PATCH /:id/publish ──────────────────────────────────────────
router.patch("/:id/publish", async (req, res) => {
  try {
    const val = toBool(req.body.is_published);
    await pool.query("UPDATE modules SET is_published=? WHERE id=?", [val, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /:id ─────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM modules WHERE id=?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;