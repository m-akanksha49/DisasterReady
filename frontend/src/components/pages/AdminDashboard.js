// src/components/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";
import EarthquakeModule from "./EarthquakeModule";
import DesertificationModule from "./DesertificationModule";
import TsunamiModule from "./TsunamiModule";
import CreateModule from "./CreateModule";
import SOSButton from "../emergency/SOSButton";
import GlobalEmergencyPopup from "../emergency/GlobalEmergencyPopup";
import AlertsTab from "../emergency/AlertsTab";
import AdminDrillManagement from "../drills/AdminDrillManagement";

const BASE = "http://localhost:5000";

const STATIC_MODULES = [
  { id: 1, title: "Earthquake Preparedness", icon: "🏔️", lessons: 12, color: "#f59e0b", isStatic: true },
  { id: 5, title: "Tsunami Awareness", icon: "🌊", lessons: 10, color: "#06b6d4", isStatic: true, isNew: true },
  { id: 7, title: "Desertification", icon: "🏜️", lessons: 8, color: "#8b5cf6", isStatic: true },
];

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v11h-8v10zm0-18v6h8V3h-8z" },
  { id: "modules", label: "Modules", icon: "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z" },
  { id: "assignments", label: "Assignments", icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" },
  { id: "drills", label: "Drills", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h-2v-2h2v2zm0-4h-2V7h2v6z" },
  { id: "alerts", label: "Alerts", icon: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [greeting, setGreeting] = useState("Good day");
  const [quizHover, setQuizHover] = useState(false);
  
  // DB data
  const [dbModules, setDbModules] = useState([]);
  const [moduleStats, setModuleStats] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Modals
  const [earthquakeOpen, setEarthquakeOpen] = useState(false);
  const [tsunamiOpen, setTsunamiOpen] = useState(false);
  const [desertOpen, setDesertOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [assignModal, setAssignModal] = useState(false);
  
  // Assignment form state
  const [asnTitle, setAsnTitle] = useState("");
  const [asnDesc, setAsnDesc] = useState("");
  const [asnModuleId, setAsnModuleId] = useState("");
  const [asnDueDate, setAsnDueDate] = useState("");
  const [asnStudentIds, setAsnStudentIds] = useState([]);
  const [asnFile, setAsnFile] = useState(null);
  const [asnLoading, setAsnLoading] = useState(false);
  const [asnError, setAsnError] = useState("");
  const fileInputRef = useRef(null);

  // Fetch helpers
  const fetchDbModules = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/api/modules?role=admin`);
      setDbModules(res.data);
    } catch (e) {
      console.error("fetchDbModules:", e.message);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/api/modules/stats`);
      setModuleStats(res.data);
    } catch (e) {
      console.error("fetchStats:", e.message);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/api/students`);
      setStudents(res.data);
    } catch (e) {
      console.error("fetchStudents:", e.message);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/api/assignments`);
      setAssignments(res.data);
    } catch (e) {
      console.error("fetchAssignments:", e.message);
    }
  }, []);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    
    const unsub = auth.onAuthStateChanged(setUser);
    fetchDbModules();
    fetchStats();
    fetchStudents();
    fetchAssignments();
    
    return unsub;
  }, [fetchDbModules, fetchStats, fetchStudents, fetchAssignments]);

  const handleModuleDone = () => {
    setCreateOpen(false);
    setEditTarget(null);
    fetchDbModules();
    fetchStats();
  };

  const togglePublish = async (mod, e) => {
    e.stopPropagation();
    const newVal = !mod.is_published;
    try {
      await axios.patch(`${BASE}/api/modules/${mod.id}/publish`, { is_published: newVal });
      setDbModules(prev => prev.map(m => m.id === mod.id ? { ...m, is_published: newVal } : m));
    } catch (err) {
      alert("Failed to update: " + (err.response?.data?.error || err.message));
    }
  };

  const deleteModule = async (mod, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${mod.title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${BASE}/api/modules/${mod.id}`);
      setDbModules(prev => prev.filter(m => m.id !== mod.id));
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleAssignSubmit = async () => {
    setAsnError("");
    if (!asnTitle.trim()) return setAsnError("Title is required.");
    if (asnStudentIds.length === 0) return setAsnError("Select at least one student.");
    if (!asnModuleId && !asnFile) return setAsnError("Attach a file or select a module.");
    
    setAsnLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", asnTitle.trim());
      fd.append("description", asnDesc.trim());
      fd.append("student_ids", JSON.stringify(asnStudentIds));
      if (asnModuleId) fd.append("module_id", asnModuleId);
      if (asnDueDate) fd.append("due_date", asnDueDate);
      if (asnFile) fd.append("file", asnFile);
      
      await axios.post(`${BASE}/api/assignments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setAsnTitle("");
      setAsnDesc("");
      setAsnModuleId("");
      setAsnDueDate("");
      setAsnStudentIds([]);
      setAsnFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setAssignModal(false);
      fetchAssignments();
    } catch (err) {
      setAsnError(err.response?.data?.error || err.message);
    } finally {
      setAsnLoading(false);
    }
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await axios.delete(`${BASE}/api/assignments/${id}`);
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const toggleStudent = (id) => {
    setAsnStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Helpers
  const statFor = (id) => moduleStats.find(s => Number(s.id) === Number(id)) || { enrolled: 0, avg_progress: 0 };
  
  const allModulesForOverview = () => {
    const statics = STATIC_MODULES.map(m => {
      const s = statFor(m.id);
      return { ...m, enrolled: s.enrolled, avgScore: Math.round(s.avg_progress || 0) };
    });
    const dynamics = dbModules
      .filter(dm => !STATIC_MODULES.find(sm => sm.id === dm.id))
      .map(dm => {
        const s = statFor(dm.id);
        return { ...dm, lessons: dm.lessons_count || 0, enrolled: Number(s.enrolled) || 0, avgScore: Math.round(s.avg_progress || 0), isDynamic: true };
      });
    return [...statics, ...dynamics];
  };

  const overviewModules = allModulesForOverview();
  const publishedDynamic = dbModules.filter(dm => !STATIC_MODULES.find(sm => sm.id === dm.id) && dm.is_published);
  const draftDynamic = dbModules.filter(dm => !STATIC_MODULES.find(sm => sm.id === dm.id) && !dm.is_published);
  const allDynamic = dbModules.filter(dm => !STATIC_MODULES.find(sm => sm.id === dm.id));
  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Admin";
  
  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );
  
  const activeToday = students.filter(s => {
    if (!s.last_active) return false;
    const d = new Date(s.last_active);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  }).length;
  
  const allPublishedModules = [
    ...STATIC_MODULES,
    ...dbModules.filter(dm => !STATIC_MODULES.find(sm => sm.id === dm.id) && dm.is_published),
  ];

  const openStatic = (id) => {
    if (id === 1) setEarthquakeOpen(true);
    if (id === 5) setTsunamiOpen(true);
    if (id === 7) setDesertOpen(true);
  };

  const statusColor = (status) => {
    if (status === "completed") return { bg: "#10b98122", color: "#10b981" };
    if (status === "in_progress") return { bg: "#3b82f622", color: "#3b82f6" };
    return { bg: "#f59e0b22", color: "#f59e0b" };
  };

  return (
    <div className="dash-root">
      {/* Global Emergency Popup */}
      <GlobalEmergencyPopup />
      
      {/* Module Modals */}
      {earthquakeOpen && <EarthquakeModule onClose={() => setEarthquakeOpen(false)} />}
      {tsunamiOpen && <TsunamiModule onClose={() => setTsunamiOpen(false)} />}
      {desertOpen && <DesertificationModule onClose={() => setDesertOpen(false)} />}
      {createOpen && <CreateModule editData={editTarget} onDone={handleModuleDone} />}

      {/* ASSIGN MODAL */}
      {assignModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div style={{
            background: "#0f1117", border: "1px solid #1e2535", borderRadius: 16,
            width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto", padding: 32
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700, margin: 0 }}>📋 New Assignment</h2>
              <button onClick={() => setAssignModal(false)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 22, cursor: "pointer" }}>✕</button>
            </div>

            {asnError && (
              <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", color: "#ef4444", marginBottom: 16, fontSize: 13 }}>
                {asnError}
              </div>
            )}

            {/* Title */}
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>ASSIGNMENT TITLE *</label>
            <input
              value={asnTitle}
              onChange={e => setAsnTitle(e.target.value)}
              style={{
                width: "100%", background: "#1e2535", border: "1px solid #2d3748", borderRadius: 8,
                padding: "10px 14px", color: "#f1f5f9", fontSize: 14, marginBottom: 16, boxSizing: "border-box"
              }}
            />

            {/* Description */}
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>DESCRIPTION</label>
            <textarea
              value={asnDesc}
              onChange={e => setAsnDesc(e.target.value)}
              placeholder="Instructions or notes for students..."
              rows={3}
              style={{
                width: "100%", background: "#1e2535", border: "1px solid #2d3748", borderRadius: 8,
                padding: "10px 14px", color: "#f1f5f9", fontSize: 14, marginBottom: 16, resize: "vertical", boxSizing: "border-box"
              }}
            />

            {/* Module & Due Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>LINK MODULE (optional)</label>
                <select
                  value={asnModuleId}
                  onChange={e => setAsnModuleId(e.target.value)}
                  style={{
                    width: "100%", background: "#1e2535", border: "1px solid #2d3748", borderRadius: 8,
                    padding: "10px 14px", color: asnModuleId ? "#f1f5f9" : "#64748b", fontSize: 14, boxSizing: "border-box"
                  }}
                >
                  <option value="">— none —</option>
                  {allPublishedModules.map(m => (
                    <option key={m.id} value={m.id}>{m.icon} {m.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>DUE DATE (optional)</label>
                <input
                  type="date"
                  value={asnDueDate}
                  onChange={e => setAsnDueDate(e.target.value)}
                  style={{
                    width: "100%", background: "#1e2535", border: "1px solid #2d3748", borderRadius: 8,
                    padding: "10px 14px", color: "#f1f5f9", fontSize: 14, boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            {/* File Upload */}
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>UPLOAD FILE — PDF / PPT / DOC (optional)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${asnFile ? "#10b981" : "#2d3748"}`,
                borderRadius: 8, padding: "20px", textAlign: "center", cursor: "pointer",
                marginBottom: 16, background: asnFile ? "#10b98111" : "transparent", transition: "all 0.2s"
              }}
            >
              {asnFile ? (
                <div>
                  <div style={{ fontSize: 28 }}>📄</div>
                  <p style={{ color: "#10b981", fontSize: 13, margin: "6px 0 0" }}>{asnFile.name}</p>
                  <p style={{ color: "#64748b", fontSize: 11, margin: "2px 0 0" }}>{(asnFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28 }}>📎</div>
                  <p style={{ color: "#64748b", fontSize: 13, margin: "6px 0 0" }}>Click to upload PDF, PPT, or DOC</p>
                  <p style={{ color: "#475569", fontSize: 11, margin: "2px 0 0" }}>Max 50 MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                style={{ display: "none" }}
                onChange={e => setAsnFile(e.target.files[0] || null)}
              />
            </div>

            {/* Select Students */}
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>ASSIGN TO STUDENTS * ({asnStudentIds.length} selected)</label>
            
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button onClick={() => setAsnStudentIds(students.map(s => s.id))} style={{ background: "#1e2535", border: "1px solid #2d3748", borderRadius: 6, padding: "4px 12px", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
                Select All ({students.length})
              </button>
              <button onClick={() => setAsnStudentIds([])} style={{ background: "#1e2535", border: "1px solid #2d3748", borderRadius: 6, padding: "4px 12px", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
                Clear
              </button>
            </div>

            <div style={{ background: "#1e2535", border: "1px solid #2d3748", borderRadius: 8, maxHeight: 200, overflowY: "auto", marginBottom: 20 }}>
              {students.length === 0 ? (
                <p style={{ color: "#475569", padding: 16, textAlign: "center", fontSize: 13 }}>No registered students found.</p>
              ) : (
                students.map(s => (
                  <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #0f1117", background: asnStudentIds.includes(s.id) ? "#3b82f611" : "transparent", transition: "background 0.15s" }}>
                    <input type="checkbox" checked={asnStudentIds.includes(s.id)} onChange={() => toggleStudent(s.id)} style={{ accentColor: "#3b82f6", width: 15, height: 15 }} />
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#3b82f622", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {(s.name || s.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600, margin: 0 }}>{s.name || "—"}</p>
                      <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>{s.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setAssignModal(false)} style={{ flex: 1, padding: "11px", background: "none", border: "1px solid #2d3748", borderRadius: 8, color: "#64748b", cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={handleAssignSubmit} disabled={asnLoading} style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg,#3b82f6,#6366f1)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, opacity: asnLoading ? 0.6 : 1 }}>
                {asnLoading ? "Creating..." : "Create Assignment →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 2L28 9v14L16 30 4 23V9L16 2z" fill="url(#hexGrad)" />
            <circle cx="16" cy="16" r="3" fill="white" />
            <defs>
              <linearGradient id="hexGrad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6ee7b7" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <span>DisasterReady</span>
        </div>
        <div className="admin-badge-pill">ADMIN PANEL</div>

        <nav className="dash-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`dash-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d={item.icon} />
              </svg>
              {item.label}
              {item.id === "alerts" && (
                <span className="nav-badge" style={{ background: "#ef4444" }}>!</span>
              )}
            </button>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-user-pill">
            <div className="dash-avatar admin-avatar">{firstName[0].toUpperCase()}</div>
            <div className="dash-user-info">
              <span className="dash-user-name">{firstName}</span>
              <span className="dash-user-role">Administrator</span>
            </div>
          </div>
          <button className="dash-logout" onClick={async () => { await signOut(auth); localStorage.removeItem("role"); navigate("/login"); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        {/* Topbar */}
        <div className="dash-topbar">
          <div>
            <h2 className="dash-welcome">{greeting}, {firstName} 👋</h2>
            <p className="dash-date">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <div className="dash-topbar-actions">
            <div className="dash-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {/* SOS Button */}
            <SOSButton />
            {activeTab === "assignments" ? (
              <button className="btn-admin-action" onClick={() => setAssignModal(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                New Assignment
              </button>
            ) : activeTab === "modules" ? (
              <button className="btn-admin-action" onClick={() => { setEditTarget(null); setCreateOpen(true); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                Add Module
              </button>
            ) : null}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="dash-content">
            <div className="stat-grid">
              {[
                { label: "Total Students", value: students.length, color: "#8b5cf6", icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.52m8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.52" },
                { label: "Active Today", value: activeToday, color: "#10b981", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" },
                { label: "Total Modules", value: overviewModules.length, color: "#3b82f6", icon: "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z" },
                { label: "Assignments Sent", value: assignments.length, color: "#f59e0b", icon: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" },
              ].map(stat => (
                <div key={stat.label} className="stat-card">
                  <div className="stat-icon" style={{ background: stat.color + "22", color: stat.color }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={stat.icon} /></svg>
                  </div>
                  <div>
                    <p className="stat-label">{stat.label}</p>
                    <p className="stat-value">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Quiz Banner */}
            <div className="quiz-banner-admin" onClick={() => navigate("/quiz-generator")}>
              <div className="qba-glow" />
              <div className="qba-grid" />
              <div className="qba-left">
                <div className="qba-icon-cluster">
                  <div className="qba-icon-main">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                    </svg>
                  </div>
                  <div className="qba-icon-ring" />
                  <div className="qba-icon-ring qba-ring-2" />
                </div>
                <div>
                  <div className="qba-badge"><span className="qba-badge-dot" />ADMIN TOOL · AI POWERED</div>
                  <h3 className="qba-title">Create AI Quiz for Students</h3>
                  <p className="qba-desc">Generate personalized disaster-preparedness quizzes instantly</p>
                </div>
              </div>
              <button className="qba-btn" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                Create Quiz
              </button>
            </div>

            {/* Student Table */}
            <div className="section-card">
              <h3 className="section-title">Registered Students ({students.length})</h3>
              {students.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 20px", color: "#475569" }}>
                  <div style={{ fontSize: 40 }}>👥</div>
                  <p style={{ marginTop: 10 }}>No students registered yet.</p>
                </div>
              ) : (
                <div className="student-table-wrap">
                  <table className="student-table">
                    <thead>
                      <tr><th>Student</th><th>Joined</th><th>Assignments</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(s => {
                        const myAssignments = assignments.flatMap(a => (a.students || []).filter(st => st.student_id === s.id));
                        const done = myAssignments.filter(x => x.status === "completed").length;
                        return (
                          <tr key={s.id}>
                            <td>
                              <div className="student-cell">
                                <div className="student-avatar">{(s.name || s.email || "?")[0].toUpperCase()}</div>
                                <div>
                                  <p className="student-name">{s.name || "—"}</p>
                                  <p className="student-email">{s.email}</p>
                                </div>
                              </div>
                            </td>
                            <td><span className="last-active">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}</span></td>
                            <td><span style={{ color: "#f1f5f9", fontSize: 13 }}>{done}/{myAssignments.length} done</span></td>
                            <td><span className={`status-pill ${s.role === "student" ? "active" : "inactive"}`}>{s.role === "student" ? "Student" : s.role}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === "modules" && (
          <div className="dash-content">
            <div className="section-card" style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>Your Created Modules</h3>
                  <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{publishedDynamic.length} published · {draftDynamic.length} draft</p>
                </div>
                <button className="btn-admin-action" onClick={() => { setEditTarget(null); setCreateOpen(true); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                  New Module
                </button>
              </div>

              {allDynamic.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#475569" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                  <p>No modules created yet. Click "New Module" to get started.</p>
                </div>
              ) : (
                <div className="modules-grid">
                  {allDynamic.map(dm => {
                    const viewers = moduleStats.find(s => Number(s.id) === Number(dm.id))?.enrolled || 0;
                    const avgScore = Math.round(moduleStats.find(s => Number(s.id) === Number(dm.id))?.avg_progress || 0);
                    return (
                      <div key={dm.id} className="admin-module-card module-card">
                        <div className="module-card-header" style={{ background: dm.color + "22" }}>
                          <span style={{ fontSize: 36 }}>{dm.icon}</span>
                          <div style={{ display: "flex", gap: 6 }}>
                            {!dm.is_published && <span className="module-badge" style={{ background: "#f59e0b22", color: "#f59e0b" }}>Draft</span>}
                            <button className="btn-edit" onClick={(e) => { e.stopPropagation(); setEditTarget(dm); setCreateOpen(true); }}>Edit</button>
                          </div>
                        </div>
                        <div className="module-card-body">
                          <h4 className="module-card-title">{dm.title}</h4>
                          <div style={{ display: "flex", gap: 16, margin: "12px 0 4px", padding: "10px 12px", background: "#0f1117", borderRadius: 8, border: "1px solid #1e2535" }}>
                            <div style={{ textAlign: "center" }}>
                              <p style={{ fontSize: 18, fontWeight: 700, color: dm.color || "#3b82f6", margin: 0 }}>{viewers}</p>
                              <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Students</p>
                            </div>
                            <div style={{ width: 1, background: "#1e2535" }} />
                            <div style={{ textAlign: "center" }}>
                              <p style={{ fontSize: 18, fontWeight: 700, color: avgScore >= 70 ? "#10b981" : "#f59e0b", margin: 0 }}>{avgScore}%</p>
                              <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Avg Progress</p>
                            </div>
                            <div style={{ width: 1, background: "#1e2535" }} />
                            <div style={{ textAlign: "center" }}>
                              <p style={{ fontSize: 18, fontWeight: 700, color: "#94a3b8", margin: 0 }}>{dm.lessons_count || 0}</p>
                              <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Slides</p>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <button className="module-cta" style={{ flex: 1, borderColor: dm.is_published ? "#ef4444" : "#10b981", color: dm.is_published ? "#ef4444" : "#10b981", fontWeight: 700 }} onClick={e => togglePublish(dm, e)}>
                              {dm.is_published ? "Unpublish" : "Publish"}
                            </button>
                            <button className="module-cta" style={{ flex: 1, borderColor: "#ef4444", color: "#ef4444" }} onClick={e => deleteModule(dm, e)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Static Modules */}
            <div className="section-card">
              <h3 className="section-title">Core Preparedness Modules</h3>
              <div className="modules-grid">
                {STATIC_MODULES.map(m => {
                  const viewers = moduleStats.find(s => Number(s.id) === Number(m.id))?.enrolled || 0;
                  const avgScore = Math.round(moduleStats.find(s => Number(s.id) === Number(m.id))?.avg_progress || 0);
                  return (
                    <div key={m.id} className="module-card">
                      <div className="module-card-header" style={{ background: m.color + "22" }}>
                        <span style={{ fontSize: 36 }}>{m.icon}</span>
                        <div>
                          {m.isNew && <span className="module-badge" style={{ background: "#10b98122", color: "#10b981" }}>Published</span>}
                        </div>
                      </div>
                      <div className="module-card-body">
                        <h4 className="module-card-title">{m.title}</h4>
                        <p className="module-card-meta">{m.lessons} lessons · Built-in</p>
                        <div style={{ display: "flex", gap: 16, margin: "12px 0 4px", padding: "10px 12px", background: "#0f1117", borderRadius: 8, border: "1px solid #1e2535" }}>
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 18, fontWeight: 700, color: m.color, margin: 0 }}>{viewers}</p>
                            <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Students</p>
                          </div>
                          <div style={{ width: 1, background: "#1e2535" }} />
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 18, fontWeight: 700, color: avgScore > 70 ? "#10b981" : avgScore > 0 ? "#f59e0b" : "#475569", margin: 0 }}>{avgScore > 0 ? `${avgScore}%` : "-"}</p>
                            <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Avg Progress</p>
                          </div>
                          <div style={{ width: 1, background: "#1e2535" }} />
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 18, fontWeight: 700, color: "#94a3b8", margin: 0 }}>{m.lessons}</p>
                            <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Lessons</p>
                          </div>
                        </div>
                        <button className="module-cta" style={{ borderColor: m.color, color: m.color, marginTop: 10 }} onClick={e => { e.stopPropagation(); openStatic(m.id); }}>View Module →</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <div className="dash-content">
            <div className="stat-grid" style={{ marginBottom: 24 }}>
              {[
                { label: "Total Assignments", value: assignments.length, color: "#3b82f6" },
                { label: "Total Assigned", value: assignments.reduce((acc, a) => acc + Number(a.total_assigned || 0), 0), color: "#8b5cf6" },
                { label: "Completed", value: assignments.reduce((acc, a) => acc + Number(a.completed_count || 0), 0), color: "#10b981" },
                { label: "Avg Progress", value: assignments.length ? Math.round(assignments.reduce((acc, a) => acc + Number(a.avg_progress || 0), 0) / assignments.length) + "%" : "—", color: "#f59e0b" },
              ].map(stat => (
                <div key={stat.label} className="stat-card">
                  <div className="stat-icon" style={{ background: stat.color + "22", color: stat.color, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10 }}>📋</div>
                  <div>
                    <p className="stat-label">{stat.label}</p>
                    <p className="stat-value">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {assignments.length === 0 ? (
              <div className="section-card" style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
                <h3 style={{ color: "#f1f5f9", margin: "0 0 8px" }}>No Assignments Yet</h3>
                <p style={{ color: "#64748b", fontSize: 14 }}>Create your first assignment to track student progress.</p>
                <button className="btn-admin-action" style={{ margin: "16px auto 0" }} onClick={() => setAssignModal(true)}>+ Create First Assignment</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {assignments.map(asn => {
                  const total = Number(asn.total_assigned) || 0;
                  const done = Number(asn.completed_count) || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  const avgProg = Number(asn.avg_progress) || 0;
                  return (
                    <div key={asn.id} className="section-card" style={{ padding: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <h3 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 17, margin: 0 }}>{asn.title}</h3>
                            {asn.file_name && <span style={{ background: "#3b82f622", color: "#3b82f6", fontSize: 11, padding: "2px 8px", borderRadius: 10, border: "1px solid #3b82f633" }}>📎 {asn.file_name}</span>}
                            {asn.module_id && <span style={{ background: "#8b5cf622", color: "#8b5cf6", fontSize: 11, padding: "2px 8px", borderRadius: 10, border: "1px solid #8b5cf633" }}>📚 Module #{asn.module_id}</span>}
                            {asn.due_date && <span style={{ background: "#f59e0b22", color: "#f59e0b", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>📅 Due {new Date(asn.due_date).toLocaleDateString()}</span>}
                          </div>
                          {asn.description && <p style={{ color: "#64748b", fontSize: 13, margin: "6px 0 0" }}>{asn.description}</p>}
                        </div>
                        <button onClick={() => deleteAssignment(asn.id)} style={{ background: "none", border: "1px solid #ef444444", borderRadius: 6, color: "#ef4444", fontSize: 12, padding: "4px 10px", cursor: "pointer", marginLeft: 12, flexShrink: 0 }}>🗑️ Delete</button>
                      </div>

                      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                        <div style={{ background: "#0f1117", border: "1px solid #1e2535", borderRadius: 8, padding: "10px 16px", flex: 1, minWidth: 100 }}>
                          <p style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6", margin: 0 }}>{total}</p>
                          <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Assigned</p>
                        </div>
                        <div style={{ background: "#0f1117", border: "1px solid #1e2535", borderRadius: 8, padding: "10px 16px", flex: 1, minWidth: 100 }}>
                          <p style={{ fontSize: 20, fontWeight: 700, color: "#10b981", margin: 0 }}>{done}</p>
                          <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Completed</p>
                        </div>
                        <div style={{ background: "#0f1117", border: "1px solid #1e2535", borderRadius: 8, padding: "10px 16px", flex: 1, minWidth: 100 }}>
                          <p style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b", margin: 0 }}>{total - done}</p>
                          <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Pending</p>
                        </div>
                        <div style={{ background: "#0f1117", border: "1px solid #1e2535", borderRadius: 8, padding: "10px 16px", flex: 2, minWidth: 160 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Completion</p>
                            <p style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 700, margin: 0 }}>{pct}%</p>
                          </div>
                          <div style={{ background: "#1e2535", borderRadius: 4, height: 6 }}>
                            <div style={{ width: `${pct}%`, background: "linear-gradient(90deg,#3b82f6,#10b981)", borderRadius: 4, height: 6, transition: "width 0.4s" }} />
                          </div>
                          <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0" }}>Avg progress: {avgProg}%</p>
                        </div>
                      </div>

                      {asn.students && asn.students.filter(Boolean).length > 0 && (
                        <div style={{ background: "#0f1117", border: "1px solid #1e2535", borderRadius: 8, overflow: "hidden" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid #1e2535" }}>
                                <th style={{ padding: "10px 14px", color: "#64748b", fontWeight: 600, textAlign: "left" }}>Student</th>
                                <th style={{ padding: "10px 14px", color: "#64748b", fontWeight: 600, textAlign: "left" }}>Progress</th>
                                <th style={{ padding: "10px 14px", color: "#64748b", fontWeight: 600, textAlign: "left" }}>Status</th>
                                <th style={{ padding: "10px 14px", color: "#64748b", fontWeight: 600, textAlign: "left" }}>Completed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {asn.students.filter(Boolean).map((st, i) => {
                                const sc = statusColor(st.status);
                                return (
                                  <tr key={i} style={{ borderBottom: "1px solid #1e2535" }}>
                                    <td style={{ padding: "10px 14px" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#3b82f622", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                                          {(st.name || st.email || "?")[0].toUpperCase()}
                                        </div>
                                        <div>
                                          <p style={{ color: "#f1f5f9", fontWeight: 600, margin: 0 }}>{st.name || "-"}</p>
                                          <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>{st.email}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: "10px 14px", minWidth: 140 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ flex: 1, background: "#1e2535", borderRadius: 4, height: 5 }}>
                                          <div style={{ width: `${st.progress || 0}%`, background: "#3b82f6", borderRadius: 4, height: 5 }} />
                                        </div>
                                        <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 35 }}>{st.progress || 0}%</span>
                                      </div>
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                      <span style={{ background: sc.bg, color: sc.color, padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{st.status}</span>
                                    </td>
                                    <td style={{ padding: "10px 14px", fontSize: 11, color: "#64748b" }}>
                                      {st.completed_at ? new Date(st.completed_at).toLocaleDateString() : "-"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Drills Tab */}
        {activeTab === "drills" && (
          <div className="dash-content">
            <AdminDrillManagement />
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="dash-content">
            <AlertsTab />
          </div>
        )}
      </main>
    </div>
  );
}