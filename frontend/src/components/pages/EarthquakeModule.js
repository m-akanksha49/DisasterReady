import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Make sure axios is installed
import "./EarthquakeModule.css"; 
import { auth } from "../../firebase";


const SLIDES = [
  {
    id: 1,
    type: "intro",
    icon: "🏔️",
    tag: "DEFINITION",
    title: "What is an Earthquake?",
    subtitle: "A sudden release of energy in the Earth's lithosphere",
    body: "An earthquake (also known as a quake, tremor or temblor) is the shaking of the surface of the Earth resulting from a sudden release of energy in the Earth's lithosphere that creates seismic waves. The focus is the point where the earthquake's motion starts, and the epicenter is the point on the Earth's surface directly above the focus. Onset type: Sudden — no sufficient time to react and escape.",
    fact: { label: "Richter Scale Created", value: "1935 by Charles Richter", icon: "📏" },
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    id: 2,
    type: "causes",
    icon: "🌍",
    tag: "CAUSES",
    title: "Causes of Earthquakes",
    subtitle: "Six primary mechanisms that trigger seismic activity",
    causes: [
      { icon: "🔀", label: "Tectonic Plates", desc: "Convergent, Divergent & Transform (slip) movement of tectonic plates." },
      { icon: "🌋", label: "Volcanic Eruption", desc: "Convective currents in mantle & volcanic eruptions release energy." },
      { icon: "↩️", label: "Elastic Rebound", desc: "Stress builds in rock until it snaps — energy radiates as seismic waves." },
      { icon: "🪨", label: "Faults & Folds", desc: "Dip-slip and strike-slip fault movements along rupture surfaces." },
      { icon: "🏗️", label: "Dam Construction", desc: "Reservoir-induced seismicity from huge water storage impoundment." },
      { icon: "💥", label: "Other Causes", desc: "Mining, underground explosions, and other human-induced triggers." },
    ],
    fact: { label: "Primary Cause", value: "Tectonic Plate Movement", icon: "🔀" },
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    id: 3,
    type: "types",
    icon: "📊",
    tag: "TYPES & MEASUREMENT",
    title: "Types & How We Measure",
    subtitle: "Classification by focal depth and the Richter Scale",
    steps: [
      { num: "1", icon: "🏔️", title: "Shallow (< 60 km)", desc: "Most destructive type — closest to surface, causes maximum ground shaking." },
      { num: "2", icon: "🌐", title: "Medium (60–300 km)", desc: "Moderate impact; tremors widely felt but damage less concentrated." },
      { num: "3", icon: "🌊", title: "Deep (300–700 km)", desc: "Less surface damage but can still trigger tsunamis if undersea." },
      { num: "4", icon: "📡", title: "Seismometer", desc: "Instrument that detects vibrations via seismic waves through the crust." },
    ],
    fact: { label: "Largest Recorded", value: "M 9.25 — Chile 1960", icon: "📈" },
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
  },
  {
    id: 4,
    type: "richter",
    icon: "📏",
    tag: "RICHTER SCALE",
    title: "Richter Scale of Magnitude",
    subtitle: "Logarithmic scale — each step is 10× stronger",
    table: [
      { mag: "< 3.0", cat: "Micro", effect: "Not felt by people; recorded on instruments" },
      { mag: "3.0–3.9", cat: "Minor", effect: "Felt by many people; no damage" },
      { mag: "4.0–4.9", cat: "Light", effect: "Felt by all; minor breakage of objects" },
      { mag: "5.0–5.9", cat: "Moderate", effect: "Some damage to weak structures" },
      { mag: "6.0–6.9", cat: "Strong", effect: "Moderate damage in populated areas" },
      { mag: "7.0–7.9", cat: "Major", effect: "Serious damage over large areas; loss of life" },
      { mag: "8.0+", cat: "Great", effect: "Severe destruction over large areas; mass casualties" },
    ],
    fact: { label: "Scale Type", value: "Logarithmic (base 10)", icon: "🔢" },
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
  },
  {
    id: 5,
    type: "hazard",
    icon: "⚠️",
    tag: "HAZARD ZONES",
    title: "Earthquake Hazard Zones",
    subtitle: "Direct and indirect hazards from seismic events",
    effects: [
      { icon: "🌍", label: "Ground Shaking", desc: "The primary direct hazard — responsible for most earthquake-related deaths and damage." },
      { icon: "🪨", label: "Soil Liquefaction", desc: "Saturated soil loses strength and behaves like liquid during shaking." },
      { icon: "🏔️", label: "Landslides & Avalanches", desc: "Slope instability triggered by strong shaking; rocks can roll considerable distances." },
      { icon: "🌊", label: "Tsunamis", desc: "Floods from tidal waves, sea surges; undersea quakes displace massive water volumes." },
      { icon: "🏗️", label: "Dam Failures", desc: "Indirect hazard — compromised dams release catastrophic downstream flooding." },
      { icon: "☢️", label: "Industrial Pollution", desc: "Damage to industrial plants causes chemical spills and environmental contamination." },
    ],
    fact: { label: "Most Damage From", value: "Strong Ground Shaking", icon: "🌍" },
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
  },
  {
    id: 6,
    type: "india",
    icon: "🇮🇳",
    tag: "INDIAN CONTEXT",
    title: "Earthquakes in India",
    subtitle: "India lies on the Alpine-Himalayan Belt — highly seismically active",
    events: [
      { year: "1819", loc: "Kutch, Gujarat", note: "M8.0 — one of India's most powerful historic quakes" },
      { year: "1897", loc: "Shillong Plateau", note: "M8.7 — catastrophic damage across Assam region" },
      { year: "1950", loc: "Arunachal Pradesh", note: "M8.5 — massive quake near the China border" },
      { year: "1993", loc: "Latur, Maharashtra", note: "M6.3 — 10,000+ lives lost due to poor construction" },
      { year: "2001", loc: "Bhuj, Gujarat", note: "M6.9 — 13,805 deaths; 1.2 million homes damaged" },
      { year: "2025", loc: "Myanmar (felt in India)", note: "M7.7 — 5,360+ fatalities; felt across NE India" },
    ],
    fact: { label: "Indian Plate Speed", value: "5 cm northward per year", icon: "📍" },
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
  },
  {
    id: 7,
    type: "zones",
    icon: "🗺️",
    tag: "SEISMIC ZONES",
    title: "India's Seismic Zone Map",
    subtitle: "Bureau of Indian Standards classifies India into 4 seismic zones",
    zones: [
      { label: "Zone II — Low Risk", desc: "Seismic disturbances up to Magnitude 4.9. Peninsular India, stable Deccan plateau.", color: "#3b82f6" },
      { label: "Zone III — Moderate Risk", desc: "Quakes up to Magnitude 6.9. Parts of Maharashtra, West Bengal, UP, and Kerala.", color: "#10b981" },
      { label: "Zone IV — High Risk", desc: "Quakes up to Magnitude 7.9. J&K, Delhi, parts of Himachal and UP-Nepal border.", color: "#f59e0b" },
      { label: "Zone V — Very High Risk", desc: "Magnitude 8+ quakes likely. NE India, J&K, Himachal Pradesh, Andaman & Nicobar.", color: "#ef4444" },
    ],
    fact: { label: "Highest Risk Zone", value: "Zone V — NE India & J&K", icon: "🚨" },
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    id: 8,
    type: "effects",
    icon: "💥",
    tag: "EFFECTS",
    title: "Typical Effects of Earthquakes",
    subtitle: "Physical, social, environmental, and infrastructural impact",
    effects: [
      { icon: "🏘️", label: "Physical Damage", desc: "Buildings collapse, roads crack, bridges fail — especially non-engineered structures." },
      { icon: "⚡", label: "Electricity & Communication", desc: "Transmission towers, transponders, transformers all collapse; blackouts ensue." },
      { icon: "💧", label: "Water Supply Failure", desc: "Water distribution networks rupture; reservoirs and fire hydrant lines fail." },
      { icon: "🚂", label: "Transport Network", desc: "Roads, bridges, railway tracks, and airport runways suffer severe damage." },
      { icon: "🏥", label: "Public Health Crisis", desc: "95% of deaths come from building collapse; epidemics follow sanitation breakdown." },
      { icon: "🔥", label: "Secondary Hazards", desc: "Fires, landslides, chemical spills, and dam failures compound primary destruction." },
    ],
    fact: { label: "Deaths from Collapse", value: "~95% of all casualties", icon: "💀" },
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
  },
  {
    id: 9,
    type: "during",
    icon: "🏃",
    tag: "DURING AN EARTHQUAKE",
    title: "What To Do During",
    subtitle: "Every second matters — act immediately and calmly",
    doList: [
      "DROP, COVER, and HOLD ON — the most effective survival action",
      "Indoors: get under a table or against an interior wall",
      "Keep away from windows, chimneys, and heavy shelves",
      "If in bed: stay in bed, cover your head with a pillow",
      "If driving: pull over away from flyovers, slopes, and electric poles",
    ],
    dontList: [
      "Don't rush outside during shaking — most injuries happen in doorways",
      "Don't use elevators",
      "Don't re-enter damaged buildings after shaking stops",
      "Don't touch downed electric wires or metal objects near them",
    ],
    fact: { label: "Best Action", value: "DROP · COVER · HOLD ON", icon: "🛡️" },
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    id: 10,
    type: "before",
    icon: "✅",
    tag: "BEFORE AN EARTHQUAKE",
    title: "How to Prepare",
    subtitle: "Preparedness begins long before the ground shakes",
    tips: [
      { icon: "📻", text: "Keep a torch light and a working transistor radio with spare batteries." },
      { icon: "📞", text: "Keep updated emergency numbers: Doctor, Fire, Police, Ambulance." },
      { icon: "🛋️", text: "Arrange your home so you can move around easily; secure heavy objects." },
      { icon: "⚡", text: "Teach all family members how to turn off electricity and gas supply." },
      { icon: "🏠", text: "Place heavy objects on the floor or lower shelves to prevent injury." },
      { icon: "📚", text: "Learn about causes and effects; practice DROP, COVER, HOLD ON drills." },
    ],
    fact: { label: "Golden Rule", value: "DROP · COVER · HOLD ON", icon: "🥇" },
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
  },
  {
    id: 11,
    type: "after",
    icon: "🔁",
    tag: "AFTER AN EARTHQUAKE",
    title: "Be Safe After",
    subtitle: "Aftershocks can collapse already-weakened structures",
    tips: [
      { icon: "📡", text: "Switch on transistor radio and obey instructions. Expect aftershocks." },
      { icon: "🔦", text: "Use a torch — do NOT turn on electric switches if wired inside." },
      { icon: "🚫", text: "Do not drink water from open containers without filtering or purification." },
      { icon: "🧯", text: "If there is a fire, try to put it out with help of people around you." },
      { icon: "🏚️", text: "Keep roads clear for relief and rescue teams; avoid damaged structures." },
      { icon: "📷", text: "Document damage; call rescue teams if people are buried under debris." },
    ],
    fact: { label: "Hidden Danger", value: "Aftershocks & Gas Leaks", icon: "⚠️" },
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    id: 12,
    type: "mitigation",
    icon: "🛡️",
    tag: "MITIGATION",
    title: "Mitigation & Safety Measures",
    subtitle: "Engineering, community, and policy approaches",
    measures: [
      { icon: "🏗️", label: "Engineered Structures", desc: "Design buildings to withstand ground shaking; avoid construction on soft soil." },
      { icon: "📋", label: "Indian Standard Codes", desc: "IS 1893 — Bureau of Indian Standards criteria for earthquake-resistant design." },
      { icon: "🏫", label: "Retrofitting", desc: "Upgrade existing lifeline buildings (hospitals, schools) with earthquake safety." },
      { icon: "📢", label: "Public Awareness", desc: "Training for architects, engineers, builders, masons, and government officials." },
      { icon: "🗺️", label: "Land Use Planning", desc: "Enforce byelaws restricting construction on fault lines and soft alluvial soils." },
      { icon: "👥", label: "Community Drills", desc: "Earthquake drills and community-based risk management programmes save lives." },
    ],
    fact: { label: "India's Standard", value: "IS 1893 (BIS)", icon: "🏢" },
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
  },
];

function EarthquakeModule({ onClose, moduleId, user }) { // 👈 Add user prop
  const [current, setCurrent] = useState(0);
  const [animDir, setAnimDir] = useState("forward");
  const [animKey, setAnimKey] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false); // Optional: for loading state
  const slideRef = useRef(null);
  const navigate = useNavigate();

  const slide = SLIDES[current];
  const progress = ((current + 1) / SLIDES.length) * 100;

  // Function to save progress to backend
  const saveProgressToBackend = async (currentProgress, completedSlides) => {
    if (!user || !user.uid) {
      console.warn("No user found, skipping progress save");
      return;
    }

    setIsSaving(true);
    try {
      // Convert completed Set to array for storage
      const completedArray = Array.from(completedSlides);
      
      const currentUser = auth.currentUser;

console.log("Firebase User:", currentUser);

const response = await axios.post(
  "http://localhost:5000/api/modules/progress",
  {
    userId: currentUser?.uid || "unknown_user",

    // save email as username
    userName: currentUser?.email || "Guest User",

    moduleId: moduleId || 1,

    progress: Math.round(currentProgress),

    completed: completedArray,

    lastSlide: current,

    timestamp: new Date().toISOString(),
  }
);

console.log("Progress saved successfully:", response.data); // Also save to localStorage as backup
      localStorage.setItem(`earthquake_progress_${user.uid}`, JSON.stringify({
        progress: Math.round(currentProgress),
        completed: completedArray,
        lastSlide: current,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error("Error saving progress:", error);
      // Save to localStorage as fallback
      localStorage.setItem(`earthquake_progress_backup_${user.uid}`, JSON.stringify({
        progress: Math.round(currentProgress),
        completed: Array.from(completedSlides),
        lastSlide: current,
        timestamp: new Date().toISOString()
      }));
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved progress when component mounts
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (user && user.uid) {
        try {
          // Try to fetch from backend first
          const response = await axios.get(`http://localhost:5000/api/modules/progress/${user.uid}/${moduleId || 1}`);
          if (response.data && response.data.progress) {
            const savedProgress = response.data;
            if (savedProgress.lastSlide && savedProgress.lastSlide < SLIDES.length) {
              setCurrent(savedProgress.lastSlide);
            }
            if (savedProgress.completed && Array.isArray(savedProgress.completed)) {
              setCompleted(new Set(savedProgress.completed));
            }
            console.log("Loaded progress from backend");
          }
        } catch (error) {
          // If backend fails, try localStorage
          console.log("Loading from localStorage backup");
          const localBackup = localStorage.getItem(`earthquake_progress_backup_${user.uid}`);
          if (localBackup) {
            const saved = JSON.parse(localBackup);
            if (saved.lastSlide && saved.lastSlide < SLIDES.length) {
              setCurrent(saved.lastSlide);
            }
            if (saved.completed && Array.isArray(saved.completed)) {
              setCompleted(new Set(saved.completed));
            }
          }
        }
      }
    };
    
    loadSavedProgress();
  }, [user, moduleId]);

  // Save progress whenever slide changes
  useEffect(() => {
    const updatedCompleted = new Set([...completed, current]);
    setCompleted(updatedCompleted);
    
    // Save to backend
    saveProgressToBackend(progress, updatedCompleted);
    
    // Also save to localStorage for quick access
    localStorage.setItem(`earthquake_progress`, Math.round(progress));
    
  }, [current]);

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      setAnimDir("forward");
      setAnimKey(k => k + 1);
      setCurrent(c => c + 1);
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setAnimDir("backward");
      setAnimKey(k => k + 1);
      setCurrent(c => c - 1);
    }
  };

  const goTo = (idx) => {
    setAnimDir(idx > current ? "forward" : "backward");
    setAnimKey(k => k + 1);
    setCurrent(idx);
  };

  const handleFinish = () => {
    // Save final progress before navigating
    saveProgressToBackend(100, new Set(Array.from({ length: SLIDES.length }, (_, i) => i)));
    navigate("/quiz-generator");
  };

  return (
    <div className="eqm-overlay">
      <div className="eqm-modal">
        {/* Header */}
        <div className="eqm-header">
          <div className="eqm-header-left">
            <span className="eqm-module-badge">🏔️ Earthquake Module</span>
            <span className="eqm-slide-count">{current + 1} / {SLIDES.length}</span>
          </div>
          <div className="eqm-header-right">
            <span className="eqm-progress-label">{Math.round(progress)}% complete</span>
            {isSaving && <span className="eqm-saving-indicator">💾 Saving...</span>}
            <button className="eqm-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="eqm-progress-track">
          <div className="eqm-progress-fill" style={{ width: `${progress}%`, background: slide.color }} />
        </div>

        {/* Slide Dots */}
        <div className="eqm-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`eqm-dot ${i === current ? "active" : ""} ${completed.has(i) ? "done" : ""}`}
              onClick={() => goTo(i)}
              style={i === current ? { background: slide.color, borderColor: slide.color } : {}}
              title={s.title}
            />
          ))}
        </div>

        {/* Slide Content */}
        <div
          key={animKey}
          className={`eqm-slide eqm-anim-${animDir}`}
          ref={slideRef}
          style={{ background: slide.bg, borderColor: slide.color + "44" }}
        >
          <div className="eqm-slide-tag" style={{ color: slide.color, borderColor: slide.color + "44", background: slide.color + "18" }}>
            {slide.tag}
          </div>
          <div className="eqm-slide-icon">{slide.icon}</div>
          <h2 className="eqm-slide-title">{slide.title}</h2>
          <p className="eqm-slide-subtitle">{slide.subtitle}</p>

          {/* INTRO */}
          {slide.type === "intro" && <p className="eqm-body-text">{slide.body}</p>}

          {/* CAUSES */}
          {slide.type === "causes" && (
            <div className="eqm-causes-grid">
              {slide.causes.map((c, i) => (
                <div key={i} className="eqm-cause-card" style={{ borderColor: slide.color + "44", animationDelay: `${i * 0.1}s` }}>
                  <span className="eqm-cause-icon">{c.icon}</span>
                  <strong className="eqm-cause-label" style={{ color: slide.color }}>{c.label}</strong>
                  <p className="eqm-cause-desc">{c.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* TYPES STEPS */}
          {slide.type === "types" && (
            <div className="eqm-steps">
              {slide.steps.map((s, i) => (
                <div key={i} className="eqm-step" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="eqm-step-body">
                    <div className="eqm-step-num" style={{ background: slide.color }}>{s.num}</div>
                    <span className="eqm-step-icon">{s.icon}</span>
                    <div>
                      <strong style={{ color: slide.color }}>{s.title}</strong>
                      <p>{s.desc}</p>
                    </div>
                  </div>
                  {i < slide.steps.length - 1 && <div className="eqm-step-arrow">↓</div>}
                </div>
              ))}
            </div>
          )}

          {/* RICHTER TABLE */}
          {slide.type === "richter" && (
            <table className="eqm-richter-table">
              <thead>
                <tr>
                  <th>Magnitude</th>
                  <th>Category</th>
                  <th>Effects</th>
                </tr>
              </thead>
              <tbody>
                {slide.table.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: slide.color, fontWeight: 600 }}>{row.mag}</td>
                    <td>{row.cat}</td>
                    <td>{row.effect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* HAZARD / EFFECTS */}
          {(slide.type === "hazard" || slide.type === "effects") && (
            <div className="eqm-effects-list">
              {slide.effects.map((e, i) => (
                <div key={i} className="eqm-effect-row" style={{ animationDelay: `${i * 0.08}s` }}>
                  <span className="eqm-effect-icon">{e.icon}</span>
                  <div>
                    <strong style={{ color: slide.color }}>{e.label}</strong>
                    <p>{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* INDIA TIMELINE */}
          {slide.type === "india" && (
            <div className="eqm-timeline">
              {slide.events.map((e, i) => (
                <div key={i} className="eqm-event" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="eqm-event-year" style={{ color: slide.color, borderColor: slide.color }}>{e.year}</div>
                  <div className="eqm-event-body">
                    <strong>{e.loc}</strong>
                    <p>{e.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ZONES */}
          {slide.type === "zones" && (
            <div className="eqm-zones-grid">
              {slide.zones.map((z, i) => (
                <div key={i} className="eqm-zone-card" style={{ borderColor: z.color + "55", animationDelay: `${i * 0.1}s` }}>
                  <strong style={{ color: z.color }}>{z.label}</strong>
                  <p>{z.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* BEFORE / AFTER TIPS */}
          {(slide.type === "before" || slide.type === "after") && (
            <div className="eqm-tips-grid">
              {slide.tips.map((t, i) => (
                <div key={i} className="eqm-tip-card" style={{ animationDelay: `${i * 0.08}s` }}>
                  <span className="eqm-tip-icon">{t.icon}</span>
                  <p>{t.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* DURING */}
          {slide.type === "during" && (
            <div className="eqm-during-cols">
              <div>
                <div className="eqm-do-header" style={{ color: "#10b981" }}>✅ DO</div>
                {slide.doList.map((item, i) => (
                  <div key={i} className="eqm-do-item" style={{ animationDelay: `${i * 0.08}s` }}>
                    <span style={{ color: "#10b981" }}>•</span> {item}
                  </div>
                ))}
              </div>
              <div>
                <div className="eqm-do-header" style={{ color: "#ef4444" }}>❌ DON'T</div>
                {slide.dontList.map((item, i) => (
                  <div key={i} className="eqm-do-item" style={{ animationDelay: `${i * 0.08}s` }}>
                    <span style={{ color: "#ef4444" }}>•</span> {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MITIGATION */}
          {slide.type === "mitigation" && (
            <div className="eqm-measures-grid">
              {slide.measures.map((m, i) => (
                <div key={i} className="eqm-measure-card" style={{ borderColor: slide.color + "44", animationDelay: `${i * 0.08}s` }}>
                  <span className="eqm-measure-icon">{m.icon}</span>
                  <strong style={{ color: slide.color }}>{m.label}</strong>
                  <p>{m.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Fact Badge */}
          {slide.fact && (
            <div className="eqm-fact-badge" style={{ borderColor: slide.color, color: slide.color, background: slide.color + "14" }}>
              <span>{slide.fact.icon}</span>
              <span>{slide.fact.label}:</span>
              <strong>{slide.fact.value}</strong>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="eqm-nav">
          <button className="eqm-nav-btn eqm-prev" onClick={goPrev} disabled={current === 0}>
            ← Previous
          </button>

          <div className="eqm-nav-center">
            {current === SLIDES.length - 1 ? (
              <button className="eqm-finish-btn" onClick={handleFinish}>
                🎓 Take the Quiz!
              </button>
            ) : (
              <span className="eqm-nav-hint">{SLIDES[current + 1]?.tag} →</span>
            )}
          </div>

          <button
            className="eqm-nav-btn eqm-next"
            onClick={goNext}
            disabled={current === SLIDES.length - 1}
            style={{ background: slide.color, borderColor: slide.color }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default EarthquakeModule;