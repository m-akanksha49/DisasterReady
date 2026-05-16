import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../../firebase";
import "./TsunamiModule.css";

const SLIDES = [
  {
    id: 1,
    type: "intro",
    icon: "🌊",
    tag: "DEFINITION",
    title: "What is a Tsunami?",
    subtitle: "A Japanese word meaning 'harbour wave'",
    body: "Tsunamis are powerful ocean waves triggered by undersea or coastal seismic activity, landslides, and volcanic eruptions. Whatever the cause, seawater is displaced with violent motion and swells up — ultimately surging over land with great destructive power.",
    fact: { label: "Wave Speed", value: "500 km/h", icon: "⚡" },
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    id: 2,
    type: "causes",
    icon: "🏔️",
    tag: "CAUSES",
    title: "How Tsunamis Are Triggered",
    subtitle: "Three primary geological mechanisms",
    causes: [
      { icon: "🫨", label: "Earthquake", desc: "Fault movement on the sea floor — most common cause. Both result from fault movements." },
      { icon: "🏔️", label: "Landslide", desc: "Underwater or above-sea landslides plunging into the water displace massive volumes." },
      { icon: "🌋", label: "Volcanic Eruption", desc: "A volcano near or under the sea can uplift or depress the seafloor, triggering waves." },
    ],
    fact: { label: "Historic Event", value: "1883 Krakatoa", icon: "📅" },
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    id: 3,
    type: "formation",
    icon: "🌀",
    tag: "FORMATION",
    title: "How a Tsunami Forms",
    subtitle: "From seafloor rupture to coastal surge",
    steps: [
      { num: "1", icon: "💥", title: "Seafloor Rupture", desc: "Seafloor ruptures and pushes water upward, starting the wave." },
      { num: "2", icon: "🌊", title: "Deep Ocean Travel", desc: "Wave moves rapidly in deep ocean reaching speeds up to 500 km/h." },
      { num: "3", icon: "📉", title: "Approaching Land", desc: "Speed slows to ~45 km/h near shore but wave is squeezed upward." },
      { num: "4", icon: "🏚️", title: "Coastal Impact", desc: "Wave heads inland destroying everything in its path." },
    ],
    fact: { label: "Wave Height", value: "3–40 m high", icon: "📏" },
    color: "#6ee7b7",
    bg: "rgba(110,231,183,0.08)",
  },
  {
    id: 4,
    type: "warning",
    icon: "🚨",
    tag: "WARNING SIGNS",
    title: "Natural Warning Signs",
    subtitle: "Tsunami is NOT a single wave — it's a wave train of 10 or more",
    signs: [
      { icon: "🌍", label: "Ground Shaking", desc: "Strong earthquake felt near the coast" },
      { icon: "🔉", label: "Loud Roar", desc: "Unusual loud roar from the ocean" },
      { icon: "🌊", label: "Unusual Wave Behaviour", desc: "Sudden rise or wall of water" },
      { icon: "🏖️", label: "Ocean Drains", desc: "Sudden draining of water showing the ocean floor" },
    ],
    fact: { label: "Warning Time", value: "Minutes to Hours", icon: "⏱️" },
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
  },
  {
    id: 5,
    type: "india",
    icon: "🇮🇳",
    tag: "INDIAN CONTEXT",
    title: "Tsunamis in India",
    subtitle: "The entire Indian coastal belt is prone to tsunamis",
    events: [
      { year: "1881", loc: "Car Nicobar", note: "M7.9 earthquake — 1m waves at Chennai" },
      { year: "1883", loc: "Krakatoa (Indonesia)", note: "2m waves recorded at Chennai" },
      { year: "1945", loc: "Karachi (100km south)", note: "M8.5 earthquake — 12m wave at Kandla" },
      { year: "2004", loc: "Banda Aceh, Indonesia", note: "M9.0 — 10m waves, 10,000+ lives lost in India" },
    ],
    fact: { label: "Coastal Length Hit in 2004", value: "2,260 km", icon: "📍" },
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
  },
  {
    id: 6,
    type: "effects",
    icon: "⚠️",
    tag: "EFFECTS",
    title: "Typical Effects of Tsunamis",
    subtitle: "Physical, environmental, and human impact",
    effects: [
      { icon: "🏘️", label: "Physical Damage", desc: "Buildings, roads, bridges, ports — everything in the path is demolished." },
      { icon: "🌿", label: "Environmental Damage", desc: "Toxic chemical release, debris generation, ecosystem destruction." },
      { icon: "💧", label: "Water Contamination", desc: "Saltwater contaminates wells and groundwater; sewage pipes break." },
      { icon: "🌾", label: "Crop Destruction", desc: "Standing crops damaged; land rendered infertile by saltwater." },
      { icon: "🏥", label: "Public Health", desc: "Deaths from drowning dominate; injuries from debris and contamination follow." },
    ],
    fact: { label: "Primary Cause of Death", value: "Drowning", icon: "💀" },
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
  },
  {
    id: 7,
    type: "before",
    icon: "✅",
    tag: "BEFORE A TSUNAMI",
    title: "How to Prepare",
    subtitle: "Preparedness saves lives",
    tips: [
      { icon: "🗺️", text: "Learn evacuation routes and practice them with your family." },
      { icon: "📻", text: "Sign up for community warning systems (EAS and NOAA Weather Radio)." },
      { icon: "⛰️", text: "Know shelters 100 feet or more above sea level, or at least 1 mile inland." },
      { icon: "📞", text: "Create a family emergency communication plan with an out-of-state contact." },
      { icon: "🛡️", text: "Consider flood and earthquake insurance for coastal properties." },
      { icon: "📖", text: "Know natural signs of tsunami: earthquake, loud ocean roar, draining water." },
    ],
    fact: { label: "Safe Shelter Elevation", value: "100 ft+ above sea", icon: "🏔️" },
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
  },
  {
    id: 8,
    type: "during",
    icon: "🏃",
    tag: "DURING A TSUNAMI",
    title: "Survive the Event",
    subtitle: "Every second counts — act immediately",
    doList: [
      "Drop, Cover, Hold On if there's an earthquake first",
      "Move immediately to high ground — don't wait for official warnings",
      "Follow marked evacuation routes (wave with arrow = higher ground)",
      "If in water, grab something that floats (raft, trunk, door)",
      "If in a boat at harbor, head out to sea",
    ],
    dontList: [
      "Don't use elevators",
      "Don't return to shore to see the wave",
      "Don't wait for official warnings if you feel an earthquake",
      "Don't assume the first wave is the last — there's a wave train",
    ],
    fact: { label: "First Wave?", value: "May NOT be largest", icon: "⚠️" },
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    id: 9,
    type: "after",
    icon: "🔁",
    tag: "AFTER A TSUNAMI",
    title: "Be Safe After",
    subtitle: "Danger doesn't end when the water recedes",
    tips: [
      { icon: "📡", text: "Listen to local authorities for areas to avoid and shelter locations." },
      { icon: "⚡", text: "Beware of electrocution — downed power lines can charge floodwater." },
      { icon: "🚫", text: "Avoid wading in floodwater — deeper than it looks and full of debris." },
      { icon: "🏚️", text: "Stay away from damaged buildings, roads, and bridges." },
      { icon: "📷", text: "Document property damage with photos; contact your insurance company." },
      { icon: "📱", text: "Use text messages or social media — phone systems are often down." },
    ],
    fact: { label: "Hidden Danger", value: "Electrocution Risk", icon: "⚡" },
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    id: 10,
    type: "mitigation",
    icon: "🛡️",
    tag: "MITIGATION",
    title: "Mitigation & Safety Measures",
    subtitle: "Reducing risk before disaster strikes",
    measures: [
      { icon: "🌳", label: "Mangrove Plantation", desc: "Coastal forests act as natural barriers against wave impact." },
      { icon: "🏗️", label: "Tsunami Walls", desc: "Japan built walls up to 4.5m high in front of populated coastal areas." },
      { icon: "📡", label: "Early Warning Systems", desc: "ITEWC at INCOIS Hyderabad provides advisories for mainland and islands." },
      { icon: "🗺️", label: "Hazard Mapping", desc: "Identify vulnerable zones and pre-plan evacuation routes." },
      { icon: "🏠", label: "Elevated Construction", desc: "Build homes higher than typical wave heights (most are under 3m)." },
      { icon: "🚧", label: "Breakwaters & Seawalls", desc: "Redirect or cushion incoming water before it reaches populated zones." },
    ],
    fact: { label: "India's Warning Centre", value: "ITEWC, Hyderabad", icon: "🏢" },
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
  },
];

function TsunamiModule({ onClose, moduleId = 5 }) {
  const [current, setCurrent] = useState(0);
  const [animDir, setAnimDir] = useState("forward");
  const [animKey, setAnimKey] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const slideRef = useRef(null);
  const navigate = useNavigate();

  const slide = SLIDES[current];
  const progress = ((current + 1) / SLIDES.length) * 100;

  // Function to save progress to backend
  const saveProgressToBackend = async (currentProgress, completedSlides) => {
    const user = auth.currentUser;
    if (!user || !user.uid) {
      console.warn("No user found, skipping progress save");
      return;
    }

    setIsSaving(true);
    try {
      const completedArray = Array.from(completedSlides);
      
      const response = await axios.post(
        "http://localhost:5000/api/modules/progress",
        {
          userId: user.uid,
          userName: user.email || "Guest User",
          moduleId: moduleId || 5,
          progress: Math.round(currentProgress),
          completed: completedArray,
          lastSlide: current,
          timestamp: new Date().toISOString(),
        }
      );

      console.log("Progress saved successfully:", response.data);
      
      // Save to localStorage as backup
      localStorage.setItem(`tsunami_progress_${user.uid}`, JSON.stringify({
        progress: Math.round(currentProgress),
        completed: completedArray,
        lastSlide: current,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error("Error saving progress:", error);
      // Save to localStorage as fallback
      localStorage.setItem(`tsunami_progress_backup_${user.uid}`, JSON.stringify({
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
      const user = auth.currentUser;
      if (user && user.uid) {
        try {
          // Try to fetch from backend first
          const response = await axios.get(`http://localhost:5000/api/modules/progress/${user.uid}/${moduleId}`);
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
          const localBackup = localStorage.getItem(`tsunami_progress_backup_${user.uid}`);
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
  }, [moduleId]);

  // Save progress whenever slide changes
  useEffect(() => {
    const updatedCompleted = new Set([...completed, current]);
    setCompleted(updatedCompleted);
    
    // Save to backend
    saveProgressToBackend(progress, updatedCompleted);
    
    // Also save to localStorage for quick access
    localStorage.setItem(`tsunami_progress`, Math.round(progress));
    
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
    <div className="tsm-overlay">
      <div className="tsm-modal">
        {/* Header */}
        <div className="tsm-header">
          <div className="tsm-header-left">
            <span className="tsm-module-badge">🌊 Tsunami Module</span>
            <span className="tsm-slide-count">{current + 1} / {SLIDES.length}</span>
          </div>
          <div className="tsm-header-right">
            <span className="tsm-progress-label">{Math.round(progress)}% complete</span>
            {isSaving && <span className="tsm-saving-indicator">💾 Saving...</span>}
            <button className="tsm-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="tsm-progress-track">
          <div className="tsm-progress-fill" style={{ width: `${progress}%`, background: slide.color }} />
        </div>

        {/* Slide Dots */}
        <div className="tsm-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`tsm-dot ${i === current ? "active" : ""} ${completed.has(i) ? "done" : ""}`}
              onClick={() => goTo(i)}
              style={i === current ? { background: slide.color, borderColor: slide.color } : {}}
              title={s.title}
            />
          ))}
        </div>

        {/* Slide Content */}
        <div
          key={animKey}
          className={`tsm-slide tsm-anim-${animDir}`}
          ref={slideRef}
          style={{ background: slide.bg, borderColor: slide.color + "44" }}
        >
          <div className="tsm-slide-tag" style={{ color: slide.color, borderColor: slide.color + "44", background: slide.color + "18" }}>
            {slide.tag}
          </div>
          <div className="tsm-slide-icon">{slide.icon}</div>
          <h2 className="tsm-slide-title">{slide.title}</h2>
          <p className="tsm-slide-subtitle">{slide.subtitle}</p>

          {/* INTRO */}
          {slide.type === "intro" && (
            <p className="tsm-body-text">{slide.body}</p>
          )}

          {/* CAUSES */}
          {slide.type === "causes" && (
            <div className="tsm-causes-grid">
              {slide.causes.map((c, i) => (
                <div key={i} className="tsm-cause-card" style={{ borderColor: slide.color + "44", animationDelay: `${i * 0.1}s` }}>
                  <span className="tsm-cause-icon">{c.icon}</span>
                  <strong className="tsm-cause-label" style={{ color: slide.color }}>{c.label}</strong>
                  <p className="tsm-cause-desc">{c.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* FORMATION STEPS */}
          {slide.type === "formation" && (
            <div className="tsm-steps">
              {slide.steps.map((s, i) => (
                <div key={i} className="tsm-step" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="tsm-step-num" style={{ background: slide.color }}>{s.num}</div>
                  <div className="tsm-step-body">
                    <span className="tsm-step-icon">{s.icon}</span>
                    <div>
                      <strong style={{ color: slide.color }}>{s.title}</strong>
                      <p>{s.desc}</p>
                    </div>
                  </div>
                  {i < slide.steps.length - 1 && <div className="tsm-step-arrow">↓</div>}
                </div>
              ))}
            </div>
          )}

          {/* WARNING SIGNS */}
          {slide.type === "warning" && (
            <div className="tsm-signs-grid">
              {slide.signs.map((s, i) => (
                <div key={i} className="tsm-sign-card" style={{ borderColor: slide.color + "55", animationDelay: `${i * 0.1}s` }}>
                  <span className="tsm-sign-icon">{s.icon}</span>
                  <strong style={{ color: slide.color }}>{s.label}</strong>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* INDIA EVENTS */}
          {slide.type === "india" && (
            <div className="tsm-timeline">
              {slide.events.map((e, i) => (
                <div key={i} className="tsm-event" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="tsm-event-year" style={{ color: slide.color, borderColor: slide.color }}>{e.year}</div>
                  <div className="tsm-event-body">
                    <strong>{e.loc}</strong>
                    <p>{e.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EFFECTS */}
          {slide.type === "effects" && (
            <div className="tsm-effects-list">
              {slide.effects.map((e, i) => (
                <div key={i} className="tsm-effect-row" style={{ animationDelay: `${i * 0.08}s` }}>
                  <span className="tsm-effect-icon">{e.icon}</span>
                  <div>
                    <strong style={{ color: slide.color }}>{e.label}</strong>
                    <p>{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BEFORE/AFTER TIPS */}
          {(slide.type === "before" || slide.type === "after") && (
            <div className="tsm-tips-grid">
              {slide.tips.map((t, i) => (
                <div key={i} className="tsm-tip-card" style={{ animationDelay: `${i * 0.08}s` }}>
                  <span className="tsm-tip-icon">{t.icon}</span>
                  <p>{t.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* DURING */}
          {slide.type === "during" && (
            <div className="tsm-during-cols">
              <div className="tsm-do-col">
                <div className="tsm-do-header" style={{ color: "#10b981" }}>✅ DO</div>
                {slide.doList.map((item, i) => (
                  <div key={i} className="tsm-do-item" style={{ animationDelay: `${i * 0.08}s` }}>
                    <span style={{ color: "#10b981" }}>•</span> {item}
                  </div>
                ))}
              </div>
              <div className="tsm-dont-col">
                <div className="tsm-do-header" style={{ color: "#ef4444" }}>❌ DON'T</div>
                {slide.dontList.map((item, i) => (
                  <div key={i} className="tsm-do-item" style={{ animationDelay: `${i * 0.08}s` }}>
                    <span style={{ color: "#ef4444" }}>•</span> {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MITIGATION */}
          {slide.type === "mitigation" && (
            <div className="tsm-measures-grid">
              {slide.measures.map((m, i) => (
                <div key={i} className="tsm-measure-card" style={{ borderColor: slide.color + "44", animationDelay: `${i * 0.08}s` }}>
                  <span className="tsm-measure-icon">{m.icon}</span>
                  <strong style={{ color: slide.color }}>{m.label}</strong>
                  <p>{m.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Fact Badge */}
          {slide.fact && (
            <div className="tsm-fact-badge" style={{ borderColor: slide.color, color: slide.color, background: slide.color + "14" }}>
              <span>{slide.fact.icon}</span>
              <span>{slide.fact.label}:</span>
              <strong>{slide.fact.value}</strong>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="tsm-nav">
          <button
            className="tsm-nav-btn tsm-prev"
            onClick={goPrev}
            disabled={current === 0}
          >
            ← Previous
          </button>

          <div className="tsm-nav-center">
            {current === SLIDES.length - 1 ? (
              <button
                className="tsm-finish-btn"
                onClick={handleFinish}
              >
                🎓 Take the Quiz!
              </button>
            ) : (
              <span className="tsm-nav-hint">
                {SLIDES[current + 1]?.tag}  →
              </span>
            )}
          </div>

          <button
            className="tsm-nav-btn tsm-next"
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

export default TsunamiModule;