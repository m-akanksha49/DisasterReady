import React, { useState, useEffect } from "react";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TsunamiModule from "./TsunamiModule";
import EarthquakeModule from "./EarthquakeModule";
import DesertificationModule from "./DesertificationModule";
import "./Dashboard.css";
// ✅ NEW: Real SOS Alerts + Emergency Drills for students
import AlertsTab     from "../emergency/AlertsTab";
import StudentDrills from "../drills/StudentDrills";
import GlobalEmergencyPopup from "../emergency/GlobalEmergencyPopup";
import { useSOSAlerts } from "../../hooks/useSOSAlerts";

// ── Static quiz & alert data ─────────────────────────────────
const QUIZZES = [
  { id: 1, title: "Earthquake Quiz",  score: 92, date: "May 1"  },
  { id: 2, title: "Fire Safety Quiz", score: 88, date: "Apr 28" },
  { id: 3, title: "First Aid Basics", score: 75, date: "Apr 20" },
];
const ALERTS = [
  { id: 1, type: "info",    message: "New module available: Cyclone Safety",   time: "2h ago" },
  { id: 2, type: "success", message: "You earned the 'Fire Safety' badge!",    time: "1d ago" },
  { id: 3, type: "warning", message: "Quiz deadline: Flood Safety — May 10",   time: "2d ago" },
];

// ── Static assignments data ───────────────────────────────────
const STATIC_ASSIGNMENTS = [
  {
    id: 1,
    title: "Earthquake Preparedness Report",
    module: "Earthquake Preparedness",
    dueDate: "May 15, 2025",
    status: "pending",
    description: "Write a 500-word report on earthquake safety measures for your local area.",
    points: 100,
    icon: "🏔️",
    color: "#f59e0b",
  },
  {
    id: 2,
    title: "Tsunami Evacuation Map",
    module: "Tsunami Awareness",
    dueDate: "May 20, 2025",
    status: "submitted",
    description: "Create an evacuation map for a coastal community showing safe routes and assembly points.",
    points: 80,
    icon: "🌊",
    color: "#06b6d4",
  },
  {
    id: 3,
    title: "Desertification Impact Essay",
    module: "Desertification",
    dueDate: "May 25, 2025",
    status: "graded",
    grade: 88,
    description: "Analyze the causes and effects of desertification in a region of your choice.",
    points: 90,
    icon: "🏜️",
    color: "#10b981",
  },
];

// ── Hardcoded static modules (always visible) ────────────────
const BASE_MODULES = [
  { id: 1, title: "Earthquake Preparedness", icon: "🏔️", lessons: 12, color: "#f59e0b" },
  { id: 5, title: "Tsunami Awareness",        icon: "🌊", lessons: 10, color: "#06b6d4", isTsunami: true },
  { id: 7, title: "Desertification",          icon: "🏜️", lessons: 8,  color: "#10b981" },
];

const BASE_URL = "http://localhost:5000";

// ── Helper: tag label & class for static modules ─────────────
function getStaticTag(id) {
  if (id === 5) return { label: "NEW",         cls: "tag-new"      };
  if (id === 1) return { label: "ESSENTIAL",   cls: "tag-essential" };
  return           { label: "ENVIRONMENTAL", cls: "tag-env"      };
}
function getStaticMeta(id) {
  if (id === 5) return "10 interactive slides · Causes, warning signs, safety protocols";
  if (id === 1) return "12 lessons · Drop, Cover & Hold On — seismic survival skills";
  return              "8 lessons · Causes, impacts, and land degradation solutions";
}

// ── Assignment status helpers ─────────────────────────────────
function getAssignmentStatusStyle(status) {
  switch ((status || "").toUpperCase()) {
    case "PENDING":   return { bg: "#f59e0b22", color: "#f59e0b", label: "Pending",   dot: "#f59e0b" };
    case "SUBMITTED": return { bg: "#3b82f622", color: "#3b82f6", label: "Submitted", dot: "#3b82f6" };
    case "GRADED":    return { bg: "#10b98122", color: "#10b981", label: "Graded",    dot: "#10b981" };
    case "OVERDUE":   return { bg: "#ef444422", color: "#ef4444", label: "Overdue",   dot: "#ef4444" };
    default:          return { bg: "#ffffff11", color: "#94a3b8", label: (status || "unknown"),      dot: "#94a3b8" };
  }
}

// ─────────────────────────────────────────────────────────────
function StudentDashboard() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────
  const [user,              setUser]              = useState(null);
  const [activeTab,         setActiveTab]         = useState("overview");
  const [greeting,          setGreeting]          = useState("Good day");
  const [quizHover,         setQuizHover]         = useState(false);
  const [tsunamiOpen,       setTsunamiOpen]       = useState(false);
  const [earthquakeOpen,    setEarthquakeOpen]    = useState(false);
  const [desertOpen,        setDesertOpen]        = useState(false);
  const [moduleProgress,    setModuleProgress]    = useState({});
  const [loadingProgress,   setLoadingProgress]   = useState(false);

  // ── DB published modules ──────────────────────────────────
  const [dbModules,         setDbModules]         = useState([]);
  const [loadingModules,    setLoadingModules]    = useState(false);

  // ── DB assignments ────────────────────────────────────────
  const [dbAssignments,     setDbAssignments]     = useState([]);
  const [loadingAssignments,setLoadingAssignments]= useState(false);

  // ✅ NEW: Real SOS alerts via shared hook
  const { alerts: sosAlerts } = useSOSAlerts();
  const activeAlertCount = sosAlerts.filter(a => a.status === "active").length;

  // ── Opened DB module viewer ───────────────────────────────
  const [openDbModule,      setOpenDbModule]      = useState(null);

  // ── Selected assignment detail ────────────────────────────
  const [selectedAssignment,setSelectedAssignment]= useState(null);

  // ── Fetch published DB modules ────────────────────────────
  const fetchDbModules = async () => {
    setLoadingModules(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/modules`);
      setDbModules(res.data);
    } catch (err) {
      console.warn("Could not load DB modules:", err.message);
    } finally {
      setLoadingModules(false);
    }
  };

  // ── Fetch assignments from DB ─────────────────────────────
const fetchDbAssignments = async (uid) => {
  setLoadingAssignments(true);
  try {
    const res = await axios.get(`${BASE_URL}/api/assignments${uid ? `?userId=${uid}` : ""}`);
    
    // Transform the assignments to ensure file_url is properly formatted
    const transformedAssignments = res.data.map(assignment => ({
      ...assignment,
      // Ensure file_url has the correct format
      file_url: assignment.file_url ? assignment.file_url : null,
      file_name: assignment.file_name || null
    }));
    
    setDbAssignments(transformedAssignments);
  } catch (err) {
    console.warn("Could not load DB assignments, using static:", err.message);
    // Fallback to static assignments if API not available
    setDbAssignments([]);
  } finally {
    setLoadingAssignments(false);
  }
};
 
  // ── Fetch student progress ────────────────────────────────
  const fetchProgress = async (uid) => {
    setLoadingProgress(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/modules/progress/${uid}`);
      const map = {};
      res.data.forEach((row) => {
        map[row.module_id] = { progress: row.progress, completed: row.completed };
      });
      setModuleProgress(map);
    } catch (err) {
      const tsunamiPct    = parseInt(localStorage.getItem("tsunami_progress")    || "0", 10);
      const earthquakePct = parseInt(localStorage.getItem("earthquake_progress") || "0", 10);
      const desertPct     = parseInt(localStorage.getItem("desert_progress")     || "0", 10);
      setModuleProgress({
        5: { progress: tsunamiPct,    completed: tsunamiPct    >= 100 },
        1: { progress: earthquakePct, completed: earthquakePct >= 100 },
        7: { progress: desertPct,     completed: desertPct     >= 100 },
      });
    } finally {
      setLoadingProgress(false);
    }
  };

  // ── On mount ──────────────────────────────────────────────
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12)      setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else                setGreeting("Good evening");

    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        await fetchProgress(u.uid);
        await fetchDbAssignments(u.uid);
      } else {
        await fetchDbAssignments(null);
      }
    });

    fetchDbModules();

    return () => unsub();
  }, []);

  // ── Handle assignment completion ─────────────────────────────
// ── Handle assignment completion (frontend-only version) ────
const handleComplete = async (assignmentId) => {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("Please login to complete assignments");
      return;
    }
    
    // Update local state only (no backend call)
    setDbAssignments(prevAssignments => 
      prevAssignments.map(assignment => 
        (assignment.assignment_id === assignmentId || assignment.id === assignmentId)
          ? { ...assignment, status: "completed", progress: 100 }
          : assignment
      )
    );
    
    alert("✅ Assignment marked as completed! (Local update)");
  } catch (err) {
    console.error("Error completing assignment:", err);
    alert("Failed to mark assignment as completed");
  }
};
  // ── Static module close handlers ─────────────────────────
  const saveProgress = async (moduleId, localKey) => {
    const pct = parseInt(localStorage.getItem(localKey) || "0", 10);
    setModuleProgress((prev) => ({
      ...prev,
      [moduleId]: { progress: pct, completed: pct >= 100 },
    }));
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await axios.post(`${BASE_URL}/api/modules/progress`, {
          userId: uid, moduleId, progress: pct, completed: pct >= 100,
        });
      }
    } catch (err) {
      console.warn("Progress save failed:", err.message);
    }
  };

  const handleTsunamiClose    = async () => { setTsunamiOpen(false);    await saveProgress(5, "tsunami_progress");    };
  const handleEarthquakeClose = async () => { setEarthquakeOpen(false); await saveProgress(1, "earthquake_progress"); };
  const handleDesertClose     = async () => { setDesertOpen(false);     await saveProgress(7, "desert_progress");     };

  // ── Save progress for DB modules ─────────────────────────
  const handleDbModuleClose = async (moduleId, pct) => {
    setOpenDbModule(null);
    setModuleProgress((prev) => ({
      ...prev,
      [moduleId]: { progress: pct, completed: pct >= 100 },
    }));
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await axios.post(`${BASE_URL}/api/modules/progress`, {
          userId: uid, moduleId, progress: pct, completed: pct >= 100,
        });
      }
    } catch (err) {
      console.warn("DB module progress save failed:", err.message);
    }
  };

  // ── Build merged module list ──────────────────────────────
  const getAllModules = () => {
    const statics = BASE_MODULES.map((m) => {
      const p        = moduleProgress[m.id];
      const progress = p ? p.progress : 0;
      const completed = Math.round((progress / 100) * m.lessons);
      const badge    = progress === 100 ? "Completed" : progress > 0 ? "In Progress" : "Not Started";
      return { ...m, progress, completed, badge, isStatic: true };
    });

    const dynamics = dbModules
      .filter((dm) => !BASE_MODULES.find((sm) => sm.id === dm.id))
      .map((dm) => {
        const p        = moduleProgress[dm.id];
        const progress = p ? p.progress : 0;
        const lessons  = dm.lessons_count || 0;
        const completed = Math.round((progress / 100) * lessons);
        const badge    = progress === 100 ? "Completed" : progress > 0 ? "In Progress" : "Not Started";
        return {
          ...dm,
          lessons,
          progress,
          completed,
          badge,
          isDynamic: true,
          icon:  dm.icon  || "📚",
          color: dm.color || "#3b82f6",
        };
      });

    return [...statics, ...dynamics];
  };

  const MODULES = getAllModules();

  // ── Merge static + DB assignments ────────────────────────
  const getAllAssignments = () => {
    if (dbAssignments.length > 0) return dbAssignments;
    return STATIC_ASSIGNMENTS;
  };
  const ASSIGNMENTS = getAllAssignments();

  // ── Misc ──────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("role");
    navigate("/login");
  };

  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Student";

  const overallProgress =
    MODULES.length > 0
      ? Math.round(MODULES.reduce((a, m) => a + m.progress, 0) / MODULES.length)
      : 0;

  // ── Open handler for any module ──────────────────────────
  const openModule = (m) => {
    if (m.isStatic) {
      if (m.id === 1) setEarthquakeOpen(true);
      if (m.id === 5) setTsunamiOpen(true);
      if (m.id === 7) setDesertOpen(true);
    } else {
      setOpenDbModule(m);
    }
  };

  // FIXED: Safe filter for pendingCount
  const pendingCount = ASSIGNMENTS.filter(
    a => ((a.status || "") === "pending" || (a.status || "") === "overdue")
  ).length;

  const NAV_ITEMS = [
    { id: "overview",     label: "Overview",
      icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
    { id: "modules",      label: "Modules",
      icon: "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z" },
    { id: "assignments",  label: "Assignments",
      icon: "M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" },
    { id: "quizzes",      label: "Quizzes",
      icon: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" },
    // ✅ NEW: Drills tab
    { id: "drills",       label: "Drills",
      icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h-2v-2h2v2zm0-4h-2V7h2v6z" },
    // ✅ FIXED: Real alert badge count
    { id: "alerts",       label: "Alerts",
      icon: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
      badge: activeAlertCount },
  ];

  // ── DB Module inline viewer ───────────────────────────────
  if (openDbModule) {
    return (
      <DbModuleViewer
        module={openDbModule}
        progress={moduleProgress[openDbModule.id]?.progress || 0}
        onClose={(pct) => handleDbModuleClose(openDbModule.id, pct)}
      />
    );
  }

  // ── Assignment detail modal ───────────────────────────────
  if (selectedAssignment) {
    return (
      <AssignmentDetail
        assignment={selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
      />
    );
  }

  // ── Main render ───────────────────────────────────────────
  return (
    <div className="dash-root">
      {/* Static module modals */}
      {tsunamiOpen    && <TsunamiModule          onClose={handleTsunamiClose}    moduleId={5} />}
      {earthquakeOpen && <EarthquakeModule        onClose={handleEarthquakeClose} />}
      {desertOpen     && <DesertificationModule   onClose={handleDesertClose}     />}

      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 2L28 9v14L16 30 4 23V9L16 2z" fill="url(#hexGradD)" />
            <circle cx="16" cy="16" r="3" fill="white" />
            <defs>
              <linearGradient id="hexGradD" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6ee7b7" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <span>DisasterReady</span>
        </div>

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
              {/* ✅ FIXED: show live active alert count, animate when >0 */}
              {item.id === "alerts" && activeAlertCount > 0 && (
                <span className="nav-badge" style={{ background: "#ef4444", animation: "pulse 1.5s infinite" }}>
                  {activeAlertCount}
                </span>
              )}
              {item.id === "assignments" && pendingCount > 0 && (
                <span className="nav-badge" style={{ background: "#ef4444" }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Progress ring */}
        <div className="sidebar-progress-card">
          <p className="sidebar-progress-label">Overall Progress</p>
          <div className="sidebar-progress-ring">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
              <circle
                cx="30" cy="30" r="24" fill="none" stroke="#6ee7b7" strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - overallProgress / 100)}`}
                strokeLinecap="round"
                style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <span className="sidebar-progress-pct">{overallProgress}%</span>
          </div>
        </div>

        <div className="dash-sidebar-footer">
          <div className="dash-user-pill">
            <div className="dash-avatar">{firstName.charAt(0).toUpperCase()}</div>
            <div className="dash-user-info">
              <span className="dash-user-name">{firstName}</span>
              <span className="dash-user-role">Student</span>
            </div>
          </div>
          <button className="dash-logout" onClick={handleLogout} title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dash-main">
        {/* Topbar */}
        <div className="dash-topbar">
          <div>
            <h2 className="dash-welcome">{greeting}, {firstName} 👋</h2>
            <p className="dash-date">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="dash-topbar-actions">
            <div className="dash-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input placeholder="Search modules, quizzes…" />
            </div>
          </div>
        </div>

        {/* ══════════════ OVERVIEW TAB ══════════════ */}
        {activeTab === "overview" && (
          <div className="dash-content">
            {/* AI Quiz Banner */}
            <div
              className={`quiz-banner-student ${quizHover ? "hovered" : ""}`}
              onClick={() => navigate("/quiz-generator")}
              onMouseEnter={() => setQuizHover(true)}
              onMouseLeave={() => setQuizHover(false)}
            >
              <div className="qb-orb qb-orb-1" />
              <div className="qb-orb qb-orb-2" />
              <div className="qb-orb qb-orb-3" />
              <div className="qb-left">
                <div className="qb-icon-wrap">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                  </svg>
                  <div className="qb-icon-ping" />
                </div>
                <div className="qb-text">
                  <div className="qb-badge">AI POWERED</div>
                  <h3 className="qb-title">Take an AI Quiz</h3>
                  <p className="qb-desc">Test your disaster-preparedness knowledge with personalized AI-generated questions</p>
                </div>
              </div>
              <div className="qb-right">
                <div className="qb-stats">
                  <div className="qb-stat"><span className="qb-stat-num">10</span><span className="qb-stat-label">Questions</span></div>
                  <div className="qb-stat-divider" />
                  <div className="qb-stat"><span className="qb-stat-num">60s</span><span className="qb-stat-label">Per Q</span></div>
                </div>
                <div className="qb-cta-btn">
                  Start Quiz
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="stat-grid">
              {[
                { label: "Overall Progress",    value: `${overallProgress}%`,                                                            color: "#3b82f6", icon: "M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.81 6-4.72 7.72L13 17v5h5l-1.22-1.22C19.91 19.07 22 15.76 22 12c0-5.18-3.95-9.45-9-9.95zM11 2.05C5.95 2.55 2 6.82 2 12c0 3.76 2.09 7.07 5.22 8.78L6 22h5V2.05z" },
                { label: "Completed Modules",   value: `${MODULES.filter(m => m.progress === 100).length}/${MODULES.length}`,           color: "#10b981", icon: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" },
                { label: "Avg. Quiz Score",     value: `${Math.round(QUIZZES.reduce((a, q) => a + q.score, 0) / QUIZZES.length)}%`,    color: "#8b5cf6", icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" },
                { label: "Pending Assignments", value: pendingCount,                                                                      color: "#f59e0b", icon: "M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" },
              ].map((stat) => (
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

            {/* Learning Modules list */}
            <div className="section-card">
              <div className="mod-section-header">
                <h3 className="section-title" style={{ margin: 0 }}>Learning Modules</h3>
                <span className="mod-count-pill">{MODULES.length} modules</span>
              </div>

              {loadingModules && (
                <p style={{ color: "#94a3b8", fontSize: 13, padding: "8px 0" }}>Loading modules…</p>
              )}

              <div className="mod-cards-list">
                {MODULES.map((m) => {
                  const badgeClass  = m.progress === 100 ? "completed" : m.progress > 0 ? "inprogress" : "notstarted";
                  const badgeLabel  = m.progress === 100 ? "Completed"  : m.progress > 0 ? "In Progress" : "Not Started";
                  const tag         = m.isStatic ? getStaticTag(m.id) : { label: (m.category || "MODULE").toUpperCase(), cls: "tag-new" };
                  const metaText    = m.isStatic
                    ? getStaticMeta(m.id)
                    : (m.description || `${m.lessons} lessons`);

                  return (
                    <div
                      key={m.id}
                      className="mod-list-card"
                      style={{ "--accent": m.color, "--icon-bg": m.color + "1a" }}
                      onClick={() => openModule(m)}
                    >
                      <div className="mod-list-icon">{m.icon}</div>
                      <div className="mod-list-body">
                        <div className="mod-list-top">
                          <p className="mod-list-title">{m.title}</p>
                          {/* FIXED: Safe toUpperCase for tag label */}
                          <span className={`mod-list-tag ${tag.cls}`}>{(tag.label || "").toUpperCase()}</span>
                        </div>
                        <p className="mod-list-meta">{metaText}</p>
                        <div className="mod-list-progress-row">
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${m.progress}%`, background: m.color }} />
                          </div>
                          <span className="mod-list-pct" style={{ color: m.progress > 0 ? m.color : "rgba(255,255,255,0.25)" }}>
                            {m.progress}%
                          </span>
                          <span className={`mod-list-badge ${badgeClass}`}>{badgeLabel}</span>
                        </div>
                      </div>
                      <span className="mod-list-arrow">›</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Assignments preview */}
            {/* Recent Assignments preview */}
<div className="section-card">
  <div className="mod-section-header">
    <h3 className="section-title" style={{ margin: 0 }}>Recent Assignments</h3>
    <button
      onClick={() => setActiveTab("assignments")}
      style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
    >
      View all →
    </button>
  </div>
  {ASSIGNMENTS.slice(0, 3).map((a) => {
    const s = getAssignmentStatusStyle(a.status);
    return (
      <div
        key={a.id}
        className="quiz-row"
        style={{ cursor: "pointer" }}
        onClick={() => setSelectedAssignment(a)}  // This now opens the updated AssignmentDetail
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>{a.icon}</span>
          <div>
            <p className="quiz-name">{a.title}</p>
            <p className="quiz-date">Due: {a.dueDate} · {a.module}</p>
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "4px 10px",
          borderRadius: 20, background: s.bg, color: s.color,
          border: `1px solid ${s.color}44`, letterSpacing: "0.3px",
        }}>
          {(s.label || "").toUpperCase()}
        </span>
      </div>
    );
  })}
</div>

            {/* Recent Quizzes */}
            <div className="section-card">
              <h3 className="section-title">Recent Quiz Results</h3>
              {QUIZZES.map((q) => (
                <div key={q.id} className="quiz-row">
                  <div>
                    <p className="quiz-name">{q.title}</p>
                    <p className="quiz-date">{q.date}</p>
                  </div>
                  <div className="quiz-score" style={{ color: q.score >= 85 ? "#10b981" : q.score >= 70 ? "#f59e0b" : "#ef4444" }}>
                    {q.score}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ MODULES TAB ══════════════ */}
        {activeTab === "modules" && (
          <div className="dash-content">
            {loadingModules && (
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>Loading modules…</p>
            )}
            <div className="modules-grid">
              {MODULES.map((m) => (
                <div
                  key={m.id}
                  className="module-card"
                  onClick={() => openModule(m)}
                  style={{ cursor: "pointer", ...(m.isTsunami ? { border: `1px solid ${m.color}44` } : {}) }}
                >
                  <div className="module-card-header" style={{ background: m.color + "22" }}>
                    <span style={{ fontSize: 36 }}>{m.icon}</span>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      {m.isDynamic && (
                        <span style={{ fontSize: 10, color: m.color, background: m.color + "22", border: `1px solid ${m.color}44`, borderRadius: 20, padding: "2px 8px", fontWeight: 700, letterSpacing: "0.4px" }}>
                          NEW
                        </span>
                      )}
                      <span
                        className="module-badge"
                        style={{
                          background: m.progress === 100 ? "#10b98122" : m.progress > 0 ? "#f59e0b22" : "#ffffff11",
                          color:      m.progress === 100 ? "#10b981"   : m.progress > 0 ? "#f59e0b"   : "#94a3b8",
                        }}
                      >
                        {m.badge}
                      </span>
                    </div>
                  </div>
                  <div className="module-card-body">
                    <h4 className="module-card-title">{m.title}</h4>
                    <p className="module-card-meta">{m.completed}/{m.lessons} lessons</p>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${m.progress}%`, background: m.color }} />
                    </div>
                    <button
                      className="module-cta"
                      style={{ borderColor: m.color, color: m.color }}
                      onClick={(e) => { e.stopPropagation(); openModule(m); }}
                    >
                      {m.progress === 100 ? "Review" : m.progress > 0 ? "Continue" : "Start"} →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ ASSIGNMENTS TAB ══════════════ */}
                {/* ══════════════ ASSIGNMENTS TAB ══════════════ */}
                {/* ══════════════ ASSIGNMENTS TAB - PROFESSIONAL REDESIGN ══════════════ */}
                {/* ══════════════ ASSIGNMENTS TAB - FIXED LAYOUT ══════════════ */}
        {activeTab === "assignments" && (
          <div className="assignments-container">
            {/* Header Stats - Compact */}
            <div className="assignments-stats">
              <div className="stat-chip">
                <span className="stat-chip-label">Total</span>
                <span className="stat-chip-value">{ASSIGNMENTS.length}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-label">Pending</span>
                <span className="stat-chip-value pending">{ASSIGNMENTS.filter(a => (a.status || "") === "pending").length}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-label">In Progress</span>
                <span className="stat-chip-value progress">{ASSIGNMENTS.filter(a => (a.status || "") === "in_progress").length}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-label">Completed</span>
                <span className="stat-chip-value completed">{ASSIGNMENTS.filter(a => (a.status || "") === "completed" || a.status === "graded").length}</span>
              </div>
            </div>

            {loadingAssignments && (
              <div className="loading-skeleton">Loading assignments...</div>
            )}

            {ASSIGNMENTS.length === 0 && (
              <div className="empty-assignments">
                <span className="empty-icon">📭</span>
                <p>No assignments yet</p>
              </div>
            )}

            <div className="assignments-list">
              {ASSIGNMENTS.map((assignment) => (
                <div className="assignment-item" key={assignment.id}>
                  {/* Left Section */}
                  <div className="assignment-info">
                    <div className="assignment-title-section">
                      <h3 className="assignment-title">{assignment.title}</h3>
                      {assignment.file_url && assignment.file_name && (
                        <a
                          href={`http://localhost:5000${assignment.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="file-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                          </svg>
                          {assignment.file_name}
                        </a>
                      )}
                    </div>
                    
                    <div className="progress-section">
                      <div className="progress-bar-container">
                        <div className="progress-bar-bg">
                          <div 
                            className="progress-bar-fill" 
                            style={{ width: `${assignment.progress || 0}%` }}
                          />
                        </div>
                      </div>
                      <span className="progress-percentage">{assignment.progress || 0}%</span>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="assignment-actions-section">
                    <span className={`status-pill ${assignment.status === "completed" || assignment.status === "graded" ? "completed" : assignment.status === "in_progress" ? "in-progress" : "pending"}`}>
                      {assignment.status === "completed" || assignment.status === "graded" ? "Completed" : 
                       assignment.status === "in_progress" ? "In Progress" : "Pending"}
                    </span>
                    
                    <div className="action-buttons">
                      <button 
                        className="action-btn start-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAssignment(assignment);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Start
                      </button>
                      <button
                        className="action-btn complete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComplete(assignment.assignment_id || assignment.id);
                        }}
                        disabled={assignment.status === "completed" || assignment.status === "graded"}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                        Complete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ══════════════ QUIZZES TAB ══════════════ */}
        {activeTab === "quizzes" && (
          <div className="dash-content">
            <div className="quiz-tab-cta" onClick={() => navigate("/quiz-generator")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z" /></svg>
              Generate a new AI Quiz
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "auto" }}><path d="M8 5v14l11-7z" /></svg>
            </div>
            <div className="section-card">
              <h3 className="section-title">All Quiz Results</h3>
              {QUIZZES.map((q) => (
                <div key={q.id} className="quiz-row" style={{ padding: "18px 0" }}>
                  <div>
                    <p className="quiz-name" style={{ fontSize: 16 }}>{q.title}</p>
                    <p className="quiz-date">{q.date}</p>
                  </div>
                  <div className="quiz-score-bar">
                    <div className="score-track">
                      <div className="score-fill" style={{ width: `${q.score}%`, background: q.score >= 85 ? "#10b981" : q.score >= 70 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <span className="quiz-score" style={{ color: q.score >= 85 ? "#10b981" : q.score >= 70 ? "#f59e0b" : "#ef4444" }}>{q.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ DRILLS TAB ══════════════ */}
        {activeTab === "drills" && (
          <div className="dash-content">
            <StudentDrills />
          </div>
        )}

        {/* ══════════════ ALERTS TAB ══════════════ */}
        {/* ✅ FIXED: Real live SOS alerts, visible to students, correct timestamps, full ack */}
        {activeTab === "alerts" && (
          <div className="dash-content">
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0 }}>
                🚨 Emergency Alerts
              </h2>
              <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
                Real-time SOS alerts from your institution. Respond immediately if active.
              </p>
            </div>
            <AlertsTab embedded={false} />
          </div>
        )}
      </main>

      {/* ✅ NEW: Global popup for students too */}
      <GlobalEmergencyPopup />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Assignment Detail — full-screen overlay
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Assignment Detail — full-screen overlay with PDF support
// ─────────────────────────────────────────────────────────────
function AssignmentDetail({ assignment: a, onClose }) {
  const s = getAssignmentStatusStyle(a.status);
  
  // Check if assignment has a file attachment
  const hasFile = a.file_url && a.file_name;
  
  // Construct the full PDF URL
  const pdfUrl = hasFile ? `http://localhost:5000${a.file_url}` : null;

  return (
    <div style={overlayStyle}>
      <div style={{ ...panelStyle, maxWidth: hasFile ? 900 : 600 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: (a.color || "#3b82f6") + "22",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
            }}>
              {a.icon || "📋"}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, color: "#f1f5f9" }}>{a.title}</h2>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{a.module}</p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* Status + meta */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "4px 12px",
              borderRadius: 20, background: s.bg, color: s.color,
              border: `1px solid ${s.color}44`, letterSpacing: "0.4px",
            }}>
              {(s.label || "").toUpperCase()}
            </span>
            <span style={chipStyle("#64748b")}>📅 Due: {a.dueDate}</span>
            <span style={chipStyle("#8b5cf6")}>🏆 {a.points} pts</span>
            {a.status === "graded" && a.grade !== undefined && (
              <span style={chipStyle("#10b981")}>✅ Grade: {a.grade}%</span>
            )}
          </div>

          {/* Description */}
          <h4 style={{ color: "#94a3b8", fontSize: 12, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 8px" }}>
            Description
          </h4>
          <p style={{ color: "#cbd5e1", lineHeight: 1.8, fontSize: 14, margin: "0 0 24px" }}>
            {a.description || "No description provided."}
          </p>

          {/* PDF File Section - CORRECTED URL FORMAT */}
          {hasFile && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ color: "#94a3b8", fontSize: 12, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 12px" }}>
                📄 Assignment File
              </h4>
              <div style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 10,
                padding: "16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>📎</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#e2e8f0", margin: 0, fontWeight: 600 }}>{a.file_name}</p>
                    <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 12 }}>PDF Document</p>
                  </div>
                </div>
                
                {/* CORRECTED LINK - Using the exact format from instructions */}
                <a
                  href={`http://localhost:5000${a.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#3b82f6",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#2563eb"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#3b82f6"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  Open PDF in New Tab
                </a>
              </div>
            </div>
          )}

          {/* Submission area — only for pending */}
          {a.status === "pending" && (
            <div>
              <h4 style={{ color: "#94a3b8", fontSize: 12, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 10px" }}>
                Your Submission
              </h4>
              <textarea
                placeholder="Type your answer or paste your work here…"
                style={{
                  width: "100%", minHeight: 120, background: "#1e293b",
                  border: "1px solid #334155", borderRadius: 10, padding: "12px 14px",
                  color: "#e2e8f0", fontSize: 14, lineHeight: 1.7, resize: "vertical",
                  outline: "none", boxSizing: "border-box",
                }}
              />
              <button
                style={{ ...primaryBtn(a.color || "#3b82f6"), marginTop: 12 }}
                onClick={() => alert("Submission feature coming soon!")}
              >
                Submit Assignment →
              </button>
            </div>
          )}

          {a.status === "submitted" && (
            <div style={{ padding: "16px", background: "#06b6d422", borderRadius: 10, border: "1px solid #06b6d444" }}>
              <p style={{ color: "#06b6d4", fontSize: 14, margin: 0, fontWeight: 600 }}>
                ✅ Assignment submitted. Awaiting grading.
              </p>
            </div>
          )}

          {a.status === "graded" && (
            <div style={{ padding: "16px", background: "#10b98122", borderRadius: 10, border: "1px solid #10b98144" }}>
              <p style={{ color: "#10b981", fontSize: 14, margin: 0, fontWeight: 600 }}>
                🎉 Graded! You scored {a.grade}% on this assignment.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #1e293b" }}>
          <button onClick={onClose} style={secondaryBtn}>← Back to Assignments</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DB Module Viewer — shown when a student opens a dynamic module
// ─────────────────────────────────────────────────────────────
function DbModuleViewer({ module: mod, progress: initialProgress, onClose }) {
  const [sections,    setSections]    = useState([]);
  const [quizzes,     setQuizzes]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [step,        setStep]        = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizDone,    setQuizDone]    = useState(false);
  const [score,       setScore]       = useState(0);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/modules/${mod.id}`)
      .then(res => {
        setSections(res.data.sections || []);
        setQuizzes(res.data.quizzes   || []);
      })
      .catch(err => console.warn("Module load error:", err.message))
      .finally(() => setLoading(false));
  }, [mod.id]);

  const totalSteps   = 1 + sections.length + (quizzes.length > 0 ? 1 : 0);
  const currentPct   = Math.round(((step) / Math.max(totalSteps - 1, 1)) * 100);
  const isQuizStep   = step === 1 + sections.length && quizzes.length > 0;
  const isIntro      = step === 0;
  const sectionIndex = step - 1;

  const handleAnswer = (qIdx, ans) => setQuizAnswers(prev => ({ ...prev, [qIdx]: ans }));

  // FIXED: Safe comparison for quiz answers
  const submitQuiz = () => {
    let correct = 0;
    quizzes.forEach((q, i) => {
      if (((quizAnswers[i] || "").toUpperCase()) === ((q.correct_answer || "").toUpperCase())) correct++;
    });
    setScore(Math.round((correct / quizzes.length) * 100));
    setQuizDone(true);
  };

  const handleFinish = () => onClose(100);

  if (loading) {
    return (
      <div style={overlayStyle}>
        <div style={panelStyle}>
          <p style={{ color: "#94a3b8", textAlign: "center", paddingTop: 60 }}>Loading module…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{mod.icon}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: "#f1f5f9" }}>{mod.title}</h2>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{mod.category}</p>
            </div>
          </div>
          <button onClick={() => onClose(currentPct)} style={closeBtnStyle}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ padding: "12px 24px 0" }}>
          <div style={{ height: 4, background: "#1e293b", borderRadius: 4 }}>
            <div style={{ height: "100%", width: `${currentPct}%`, background: mod.color, borderRadius: 4, transition: "width .4s ease" }} />
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>
            {step === 0 ? "Introduction" : isQuizStep ? "Quiz" : `Section ${sectionIndex + 1} of ${sections.length}`} · {currentPct}%
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* INTRO */}
          {isIntro && (
            <div>
              <h3 style={{ color: "#f1f5f9", marginTop: 0 }}>About this module</h3>
              <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>{mod.description || "No description provided."}</p>
              <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span style={chipStyle(mod.color)}>📖 {sections.length} sections</span>
                {quizzes.length > 0 && <span style={chipStyle("#8b5cf6")}>🧠 {quizzes.length} quiz questions</span>}
                <span style={chipStyle("#10b981")}>📂 {mod.category}</span>
              </div>
            </div>
          )}

          {/* SECTION */}
          {!isIntro && !isQuizStep && sections[sectionIndex] && (() => {
            const sec = sections[sectionIndex];
            return (
              <div>
                {sec.tag && <span style={chipStyle(sec.color || mod.color)}>{(sec.tag || "").toUpperCase()}</span>}
                <h3 style={{ color: "#f1f5f9", marginTop: sec.tag ? 10 : 0 }}>{sec.title}</h3>
                {sec.image_url && (
                  <img src={sec.image_url} alt={sec.title} style={{ width: "100%", borderRadius: 10, marginBottom: 16, objectFit: "cover", maxHeight: 220 }} />
                )}
                <p style={{ color: "#94a3b8", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{sec.content}</p>
              </div>
            );
          })()}

          {/* QUIZ */}
          {isQuizStep && !quizDone && (
            <div>
              <h3 style={{ color: "#f1f5f9", marginTop: 0 }}>Module Quiz</h3>
              {quizzes.map((q, i) => (
                <div key={q.id} style={{ marginBottom: 28 }}>
                  <p style={{ color: "#e2e8f0", fontWeight: 600, marginBottom: 10 }}>
                    Q{i + 1}. {q.question}
                  </p>
                  {["A", "B", "C", "D"].map((opt) => {
                    const text = q[`option_${opt.toLowerCase()}`];
                    if (!text) return null;
                    const selected = quizAnswers[i] === opt;
                    return (
                      <div
                        key={opt}
                        onClick={() => handleAnswer(i, opt)}
                        style={{
                          padding: "10px 14px", borderRadius: 8, marginBottom: 6, cursor: "pointer",
                          border: `1px solid ${selected ? mod.color : "#334155"}`,
                          background: selected ? mod.color + "22" : "#1e293b",
                          color: selected ? mod.color : "#94a3b8", fontSize: 14, transition: "all .2s",
                        }}
                      >
                        <strong>{opt}.</strong> {text}
                      </div>
                    );
                  })}
                </div>
              ))}
              <button
                onClick={submitQuiz}
                disabled={Object.keys(quizAnswers).length < quizzes.length}
                style={{ ...primaryBtn(mod.color), opacity: Object.keys(quizAnswers).length < quizzes.length ? 0.5 : 1 }}
              >
                Submit Quiz
              </button>
            </div>
          )}

          {/* QUIZ RESULT */}
          {isQuizStep && quizDone && (
            <div style={{ textAlign: "center", paddingTop: 20 }}>
              <div style={{ fontSize: 56 }}>{score >= 70 ? "🎉" : "📚"}</div>
              <h3 style={{ color: "#f1f5f9" }}>Quiz Complete!</h3>
              <p style={{ fontSize: 32, fontWeight: 700, color: score >= 70 ? "#10b981" : "#f59e0b" }}>{score}%</p>
              <p style={{ color: "#64748b" }}>{score >= 70 ? "Great job! Module completed." : "Keep practising — you can retake the quiz."}</p>
              <button onClick={handleFinish} style={primaryBtn(mod.color)}>Finish Module ✓</button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {!(isQuizStep && quizDone) && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid #1e293b" }}>
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{ ...secondaryBtn, opacity: step === 0 ? 0.4 : 1 }}
            >
              ← Back
            </button>

            {isQuizStep ? (
              <button onClick={submitQuiz} style={primaryBtn(mod.color)}
                disabled={Object.keys(quizAnswers).length < quizzes.length}
              >
                Submit Quiz
              </button>
            ) : step < totalSteps - 1 ? (
              <button onClick={() => setStep(s => s + 1)} style={primaryBtn(mod.color)}>
                {step === sections.length && quizzes.length === 0 ? "Finish ✓" : "Next →"}
              </button>
            ) : (
              <button onClick={handleFinish} style={primaryBtn(mod.color)}>Finish ✓</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline styles ─────────────────────────────────────────────
const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, padding: 16,
};
const panelStyle = {
  background: "#0f172a", borderRadius: 16, width: "100%", maxWidth: 680,
  maxHeight: "90vh", display: "flex", flexDirection: "column",
  border: "1px solid #1e293b", boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
};
const closeBtnStyle = {
  background: "transparent", border: "none", color: "#64748b",
  fontSize: 18, cursor: "pointer", padding: "4px 8px", borderRadius: 6,
};
const chipStyle = (color) => ({
  fontSize: 12, color, background: color + "22",
  border: `1px solid ${color}44`, borderRadius: 20,
  padding: "3px 10px", fontWeight: 600,
});
const primaryBtn = (color) => ({
  background: color, color: "#fff", border: "none",
  borderRadius: 8, padding: "10px 22px", fontWeight: 700,
  fontSize: 14, cursor: "pointer",
});
const secondaryBtn = {
  background: "transparent", color: "#94a3b8",
  border: "1px solid #334155", borderRadius: 8,
  padding: "10px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer",
};

export default StudentDashboard;