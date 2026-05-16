// backend/routes/drills.js
// ✅ FULLY FIXED:
//   - All /sos/* static routes BEFORE /:id dynamic routes (no more 404)
//   - Both PATCH *and* POST registered for /:id/start & /:id/complete
//   - SOS /resolve returns updated alert object
//   - Consistent JSON responses everywhere

const express = require("express");
const router  = express.Router();
const pool    = require("../db");

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-INIT TABLES
// ─────────────────────────────────────────────────────────────────────────────
async function initTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS emergency_drills (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      title          VARCHAR(255) NOT NULL,
      description    TEXT,
      drill_type     VARCHAR(100) DEFAULT 'General',
      severity_level ENUM('low','medium','high','critical') DEFAULT 'medium',
      scheduled_date DATE NOT NULL,
      scheduled_time TIME NOT NULL,
      location_name  VARCHAR(255),
      instructions   TEXT,
      status         ENUM('scheduled','running','completed') DEFAULT 'scheduled',
      created_by     VARCHAR(255) NOT NULL,
      started_at     DATETIME NULL,
      completed_at   DATETIME NULL,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS sos_alerts (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      admin_id        VARCHAR(255),
      admin_name      VARCHAR(255),
      title           VARCHAR(500) NOT NULL,
      message         TEXT,
      location_name   TEXT,
      latitude        DOUBLE,
      longitude       DOUBLE,
      emergency_level ENUM('low','medium','high','critical') DEFAULT 'high',
      status          ENUM('active','acknowledged','resolved') DEFAULT 'active',
      resolved_at     DATETIME NULL,
      resolved_by     VARCHAR(255) NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS sos_acknowledgments (
      id                 INT AUTO_INCREMENT PRIMARY KEY,
      alert_id           INT NOT NULL,
      user_id            VARCHAR(255) NOT NULL,
      user_name          VARCHAR(255) NOT NULL,
      safety_status      ENUM('safe','injured','need_help','trapped') NOT NULL,
      responder_location TEXT,
      contact_number     VARCHAR(50),
      notes              TEXT,
      acknowledged_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_ack_user_alert (alert_id, user_id),
      FOREIGN KEY (alert_id) REFERENCES sos_alerts(id) ON DELETE CASCADE,
      INDEX idx_ack_alert (alert_id),
      INDEX idx_ack_user  (user_id)
    )`,

    `CREATE TABLE IF NOT EXISTS emergency_drill_participants (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      drill_id        INT NOT NULL,
      user_id         VARCHAR(255) NOT NULL,
      status          ENUM('pending','participated','missed') DEFAULT 'pending',
      feedback        TEXT,
      participated_at TIMESTAMP NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_drill_user (drill_id, user_id),
      FOREIGN KEY (drill_id) REFERENCES emergency_drills(id) ON DELETE CASCADE
    )`,
  ];

  for (const q of queries) {
    try { await pool.query(q); } catch (e) { console.error("initTable:", e.message); }
  }

  // Migration: ensure 'acknowledged' enum value exists on older DBs
  try {
    await pool.query(`
      ALTER TABLE sos_alerts
      MODIFY COLUMN status ENUM('active','acknowledged','resolved') DEFAULT 'active'
    `);
  } catch (_) {}

  console.log("✅ Drills & SOS tables ready");
}
initTables();

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — attach acknowledgments to each alert row
// ─────────────────────────────────────────────────────────────────────────────
async function attachAcks(alerts) {
  if (!alerts.length) return alerts;
  const ids = alerts.map(a => a.id);
  const [acks] = await pool.query(
    `SELECT * FROM sos_acknowledgments WHERE alert_id IN (?)
     ORDER BY acknowledged_at DESC`,
    [ids]
  );
  const ackMap = {};
  acks.forEach(a => {
    if (!ackMap[a.alert_id]) ackMap[a.alert_id] = [];
    ackMap[a.alert_id].push(a);
  });
  return alerts.map(alert => ({
    ...alert,
    acknowledgments: ackMap[alert.id] || [],
    ack_count:       (ackMap[alert.id] || []).length,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// ██  SOS ROUTES  ── must be BEFORE /:id dynamic routes
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/drills/sos/alerts
router.get("/sos/alerts", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM sos_alerts
       ORDER BY FIELD(emergency_level,'critical','high','medium','low'),
                created_at DESC
       LIMIT 200`
    );
    res.json(await attachAcks(rows));
  } catch (err) {
    console.error("GET /sos/alerts:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drills/sos/active
router.get("/sos/active", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM sos_alerts
       WHERE status IN ('active','acknowledged')
       ORDER BY FIELD(emergency_level,'critical','high','medium','low'),
                created_at DESC`
    );
    res.json(await attachAcks(rows));
  } catch (err) {
    console.error("GET /sos/active:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drills/sos  — create SOS alert
router.post("/sos", async (req, res) => {
  const {
    admin_id, admin_name, title, message,
    location_name, latitude, longitude, emergency_level,
  } = req.body;

  if (!title || !admin_id) {
    return res.status(400).json({ error: "title and admin_id are required" });
  }
  try {
    const [r] = await pool.query(
      `INSERT INTO sos_alerts
         (admin_id, admin_name, title, message, location_name,
          latitude, longitude, emergency_level, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        String(admin_id), admin_name || "",
        title, message || "", location_name || "",
        latitude || null, longitude || null,
        emergency_level || "high",
      ]
    );
    const [[alert]] = await pool.query(
      "SELECT * FROM sos_alerts WHERE id=?", [r.insertId]
    );
    res.status(201).json({ ...alert, acknowledgments: [], ack_count: 0 });
  } catch (err) {
    console.error("POST /sos:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drills/sos/:id/acknowledge
router.post("/sos/:id/acknowledge", async (req, res) => {
  const alertId = req.params.id;
  const { user_id, user_name, safety_status, responder_location, contact_number, notes } = req.body;

  if (!user_id || !user_name || !safety_status) {
    return res.status(400).json({ error: "user_id, user_name and safety_status are required" });
  }
  try {
    await pool.query(
      `INSERT INTO sos_acknowledgments
         (alert_id, user_id, user_name, safety_status, responder_location, contact_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         safety_status      = VALUES(safety_status),
         responder_location = VALUES(responder_location),
         contact_number     = VALUES(contact_number),
         notes              = VALUES(notes),
         acknowledged_at    = CURRENT_TIMESTAMP`,
      [alertId, String(user_id), user_name, safety_status,
       responder_location || null, contact_number || null, notes || null]
    );
    // Bump to acknowledged if still active
    await pool.query(
      `UPDATE sos_alerts SET status='acknowledged' WHERE id=? AND status='active'`,
      [alertId]
    );
    const [[alert]] = await pool.query("SELECT * FROM sos_alerts WHERE id=?", [alertId]);
    const [acks]    = await pool.query(
      `SELECT * FROM sos_acknowledgments WHERE alert_id=? ORDER BY acknowledged_at DESC`,
      [alertId]
    );
    res.json({ ok: true, alert: { ...alert, acknowledgments: acks, ack_count: acks.length } });
  } catch (err) {
    console.error("POST /sos/:id/acknowledge:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/drills/sos/:id/resolve  — returns full updated alert
router.patch("/sos/:id/resolve", async (req, res) => {
  const { resolved_by } = req.body;
  try {
    await pool.query(
      `UPDATE sos_alerts SET status='resolved', resolved_at=NOW(), resolved_by=? WHERE id=?`,
      [resolved_by || null, req.params.id]
    );
    const [[alert]] = await pool.query("SELECT * FROM sos_alerts WHERE id=?", [req.params.id]);
    const [acks]    = await pool.query(
      `SELECT * FROM sos_acknowledgments WHERE alert_id=? ORDER BY acknowledged_at DESC`,
      [req.params.id]
    );
    res.json({ ok: true, alert: { ...alert, acknowledgments: acks, ack_count: acks.length } });
  } catch (err) {
    console.error("PATCH /sos/:id/resolve:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ██  DRILLS CRUD  ── /:id routes kept AFTER all /sos/* routes
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/drills
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT *,
              DATE_FORMAT(scheduled_date, '%Y-%m-%d') AS scheduled_date,
              TIME_FORMAT(scheduled_time, '%H:%i')    AS scheduled_time
       FROM emergency_drills
       ORDER BY scheduled_date ASC, scheduled_time ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drills/upcoming
router.get("/upcoming", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT *,
              DATE_FORMAT(scheduled_date, '%Y-%m-%d') AS scheduled_date,
              TIME_FORMAT(scheduled_time, '%H:%i')    AS scheduled_time
       FROM emergency_drills
       WHERE scheduled_date >= CURDATE()
         AND status != 'completed'
       ORDER BY scheduled_date ASC, scheduled_time ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drills
router.post("/", async (req, res) => {
  const {
    title, description, drill_type, severity_level,
    scheduled_date, scheduled_time, location_name, instructions, created_by,
  } = req.body;

  if (!title || !scheduled_date || !scheduled_time || !created_by) {
    return res.status(400).json({
      error: "title, scheduled_date, scheduled_time and created_by are required",
    });
  }
  const timeVal = (scheduled_time || "").slice(0, 5);
  try {
    const [r] = await pool.query(
      `INSERT INTO emergency_drills
         (title, description, drill_type, severity_level, scheduled_date,
          scheduled_time, location_name, instructions, created_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [title, description || "", drill_type || "General",
       severity_level || "medium", scheduled_date, timeVal,
       location_name || null, instructions || null, created_by]
    );
    const [[newDrill]] = await pool.query(
      `SELECT *,
              DATE_FORMAT(scheduled_date,'%Y-%m-%d') AS scheduled_date,
              TIME_FORMAT(scheduled_time,'%H:%i')    AS scheduled_time
       FROM emergency_drills WHERE id=?`,
      [r.insertId]
    );
    res.status(201).json(newDrill);
  } catch (err) {
    console.error("POST /drills:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/drills/:id
router.put("/:id", async (req, res) => {
  const {
    title, description, drill_type, severity_level,
    scheduled_date, scheduled_time, location_name, instructions,
  } = req.body;
  const timeVal = (scheduled_time || "").slice(0, 5);
  try {
    await pool.query(
      `UPDATE emergency_drills SET
         title=?, description=?, drill_type=?, severity_level=?,
         scheduled_date=?, scheduled_time=?, location_name=?, instructions=?
       WHERE id=?`,
      [title, description || "", drill_type || "General",
       severity_level || "medium", scheduled_date, timeVal,
       location_name || null, instructions || null, req.params.id]
    );
    const [[updated]] = await pool.query(
      `SELECT *,
              DATE_FORMAT(scheduled_date,'%Y-%m-%d') AS scheduled_date,
              TIME_FORMAT(scheduled_time,'%H:%i')    AS scheduled_time
       FROM emergency_drills WHERE id=?`,
      [req.params.id]
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/drills/:id
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM emergency_drills WHERE id=?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Drill lifecycle handlers — registered for BOTH POST and PATCH
//    so any frontend HTTP-method mismatch never causes a 404
const startHandler = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE emergency_drills SET status='running', started_at=NOW() WHERE id=?`,
      [req.params.id]
    );
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: "Drill not found" });
    }
    const [[drill]] = await pool.query(
      `SELECT *,
              DATE_FORMAT(scheduled_date,'%Y-%m-%d') AS scheduled_date,
              TIME_FORMAT(scheduled_time,'%H:%i')    AS scheduled_time
       FROM emergency_drills WHERE id=?`,
      [req.params.id]
    );
    res.json({ ok: true, drill });
  } catch (err) {
    console.error("start drill:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const completeHandler = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE emergency_drills SET status='completed', completed_at=NOW() WHERE id=?`,
      [req.params.id]
    );
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: "Drill not found" });
    }
    const [[drill]] = await pool.query(
      `SELECT *,
              DATE_FORMAT(scheduled_date,'%Y-%m-%d') AS scheduled_date,
              TIME_FORMAT(scheduled_time,'%H:%i')    AS scheduled_time
       FROM emergency_drills WHERE id=?`,
      [req.params.id]
    );
    res.json({ ok: true, drill });
  } catch (err) {
    console.error("complete drill:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Register both methods — frontend used PATCH, older code used POST
router.post("/:id/start",     startHandler);
router.patch("/:id/start",    startHandler);
router.post("/:id/complete",  completeHandler);
router.patch("/:id/complete", completeHandler);

// POST /api/drills/:id/acknowledge  — drill participation
router.post("/:id/acknowledge", async (req, res) => {
  const { user_id, feedback } = req.body;
  try {
    await pool.query(
      `INSERT INTO emergency_drill_participants
         (drill_id, user_id, status, participated_at)
       VALUES (?, ?, 'participated', NOW())
       ON DUPLICATE KEY UPDATE
         status=VALUES(status), participated_at=VALUES(participated_at)`,
      [req.params.id, String(user_id)]
    );
    if (feedback) {
      await pool.query(
        `UPDATE emergency_drill_participants SET feedback=? WHERE drill_id=? AND user_id=?`,
        [feedback, req.params.id, String(user_id)]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drills/:id/feedback
router.post("/:id/feedback", async (req, res) => {
  const { user_id, feedback } = req.body;
  try {
    await pool.query(
      `UPDATE emergency_drill_participants SET feedback=? WHERE drill_id=? AND user_id=?`,
      [feedback, req.params.id, String(user_id)]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;