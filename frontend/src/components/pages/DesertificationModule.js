import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../../firebase";
import "./DesertificationModule.css";

const SLIDES = [
  {
    id: 1,
    type: "intro",
    icon: "🏜️",
    tag: "DEFINITION",
    title: "What is Desertification?",
    subtitle: "Also known as Land Degradation",
    body: "Desertification is the process by which fertile land becomes desert. It is a type of land degradation in which a relatively dry area of land becomes increasingly arid, typically losing its bodies of water as well as vegetation and wildlife. It means irreversible decline in the biological potential of the land — the soil loses its productivity and becomes infertile. Onset type: Gradual — occurs over a significant period of time with proper indications well before the area desertifies.",
    fact: { label: "India's Affected Land", value: "82.18 Mha undergoing desertification", icon: "📊" },
    color: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
  },
  {
    id: 2,
    type: "warning",
    icon: "🔔",
    tag: "ONSET & WARNING",
    title: "Warning Signs & Onset Type",
    subtitle: "No specific warning systems — but early indicators exist",
    signs: [
      { icon: "🌧️", label: "Scarce Rainfall", desc: "Prolonged periods of reduced or deficit rainfall signal onset of desertification." },
      { icon: "💧", label: "Surface Water Drying", desc: "Rivers, ponds, and lakes begin to dry up as the region loses water retention." },
      { icon: "🕳️", label: "Groundwater Decline", desc: "Declination of groundwater levels is a key slow-onset indicator." },
      { icon: "🌾", label: "Vegetation Loss", desc: "Progressive loss of plant cover, degraded grasslands and scrublands." },
    ],
    fact: { label: "Onset Speed", value: "Gradual — years to decades", icon: "⏳" },
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    id: 3,
    type: "causes",
    icon: "⚙️",
    tag: "CAUSES",
    title: "Major Causes of Desertification",
    subtitle: "Human and natural factors combining to destroy fertile land",
    causes: [
      { icon: "🐄", label: "Overgrazing", desc: "Excessive animal grazing prevents plant regrowth, destroying biome vegetation." },
      { icon: "🪓", label: "Deforestation", desc: "Tree removal for settlements destroys the foundation of dryland biomes." },
      { icon: "🌾", label: "Poor Farming", desc: "Unsustainable farming strips soil nutrients, causing progressive land degradation." },
      { icon: "🌡️", label: "Climate Change", desc: "Warmer temperatures and frequent droughts accelerate the desertification process." },
      { icon: "🏙️", label: "Urbanization", desc: "Development kills plant life and introduces chemicals that harm the ground." },
      { icon: "⛏️", label: "Mining", desc: "Extracting natural resources strips soil of nutrients and kills vegetation." },
    ],
    fact: { label: "Biggest Cause in India", value: "Water Erosion (10.98%)", icon: "💧" },
    color: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
  },
  {
    id: 4,
    type: "india_causes",
    icon: "🇮🇳",
    tag: "INDIA — CAUSES",
    title: "Major Causes in India",
    subtitle: "ISRO's Desertification & Land Degradation Atlas 2016",
    effects: [
      { icon: "💧", label: "Water Erosion — 10.98%", desc: "Loss of soil cover mainly due to rainfall and surface runoff; seen in both hot and cold desert areas." },
      { icon: "💨", label: "Wind Erosion — 5.55%", desc: "Spread of sand; removes nutrient-rich topsoil even up to the Himalayan altitudes." },
      { icon: "🌿", label: "Vegetation Degradation — 8.91%", desc: "Deforestation, shifting cultivation, and degradation in grazing and grassland areas." },
      { icon: "🧂", label: "Salinity — 1.12%", desc: "Soil salinity in cultivated, irrigated lands; can occur naturally or be human-induced." },
      { icon: "🏗️", label: "Human Settlement — 0.69%", desc: "Mining, urbanisation, and other human developmental activities." },
      { icon: "🌊", label: "Others — 2.07%", desc: "Water logging, frost shattering, mass movement, barren and rocky land types." },
    ],
    fact: { label: "Total Degraded Area", value: "120.40 Mha across India", icon: "📍" },
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
  },
  {
    id: 5,
    type: "stats",
    icon: "📊",
    tag: "INDIAN CONTEXT",
    title: "Desertification in India",
    subtitle: "Scale and severity across Indian states",
    stats: [
      { value: "32%", label: "of India's land is degraded (UNCCD)", color: "#ef4444" },
      { value: "81.4 Mha", label: "area affected by desertification", color: "#fb923c" },
      { value: "105.19 Mha", label: "of total geographical area degraded", color: "#f59e0b" },
    ],
    effects: [
      { icon: "🏜️", label: "Rajasthan", desc: "Worst affected — 204.25 lakh ha degraded; mostly water and wind erosion." },
      { icon: "🌾", label: "Andhra Pradesh", desc: "91.94 lakh ha total degraded; water erosion (88.64) is the dominant cause." },
      { icon: "🪨", label: "Gujarat", desc: "31.29 lakh ha degraded; significant saline soil issues (15.59 lakh ha)." },
    ],
    fact: { label: "Most Affected State", value: "Rajasthan", icon: "🏜️" },
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    id: 6,
    type: "hazard",
    icon: "⚠️",
    tag: "HAZARD ZONES",
    title: "Desertification Hazard Zones",
    subtitle: "Types and categories of land degradation",
    causes: [
      { icon: "💧", label: "Soil Erosion", desc: "Water and wind erode topsoil, permanently reducing agricultural productivity." },
      { icon: "🌿", label: "Land Degradation", desc: "Progressive deterioration of land quality through multiple combined processes." },
      { icon: "🌾", label: "Loss of Soil Fertility", desc: "Nutrients stripped from soil make farming impossible without expensive intervention." },
      { icon: "🏜️", label: "Arid Zones", desc: "Hot deserts (Rajasthan) and cold deserts (J&K, Himachal) are highest-risk." },
      { icon: "🌊", label: "Semi-Arid Zones", desc: "Maharashtra, Karnataka, AP — moderate-risk zones prone to periodic drought." },
      { icon: "🌱", label: "Sub-Humid Dry", desc: "Parts of UP, MP, Bihar — at risk from overuse of agricultural land." },
    ],
    fact: { label: "India's High-Risk Region", value: "Rajasthan, UP, MP, Maharashtra", icon: "🚨" },
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
  },
  {
    id: 7,
    type: "effects",
    icon: "💥",
    tag: "EFFECTS",
    title: "Effects of Desertification",
    subtitle: "Environmental, social, economic, and human impact",
    effects: [
      { icon: "🌾", label: "Infertile Soil", desc: "Soil loses all biological potential — farming becomes nearly impossible without costly technology." },
      { icon: "🌿", label: "Vegetation Destroyed", desc: "Plant life and biodiversity is damaged or completely wiped out across vast areas." },
      { icon: "💧", label: "Polluted Water", desc: "Without vegetation, water quality worsens; sources become contaminated." },
      { icon: "🍽️", label: "Famine & Poverty", desc: "Food scarcity leads to hunger, poverty, and economic collapse in affected regions." },
      { icon: "🌊", label: "Flooding Risk", desc: "Without plant life, rainfall causes flooding — nothing stops water from spreading." },
      { icon: "🐦", label: "Extinctions", desc: "Habitat destruction causes mass migration and species extinction in degraded zones." },
    ],
    fact: { label: "Global Impact", value: "250 million people affected worldwide", icon: "🌍" },
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
  },
  {
    id: 8,
    type: "unccd",
    icon: "🌐",
    tag: "UNCCD",
    title: "United Nations Convention to Combat Desertification",
    subtitle: "The international framework for tackling land degradation",
    effects: [
      { icon: "📋", label: "UNCCD Framework", desc: "The UN Convention to Combat Desertification coordinates global action on land degradation and drought." },
      { icon: "🎯", label: "Land Degradation Neutrality", desc: "Goal: ensure the amount of degraded land remains stable or improves by 2030." },
      { icon: "🤝", label: "India's Commitment", desc: "India committed to restore 26 million hectares of degraded land by 2030." },
      { icon: "💰", label: "Financial Mechanisms", desc: "Global Environment Facility (GEF) provides funding to developing countries for land restoration." },
      { icon: "🔬", label: "Research & Monitoring", desc: "ISRO's Land Degradation Atlas maps and monitors India's desertification on a periodic basis." },
      { icon: "🌱", label: "Great Green Wall", desc: "An African initiative to restore 100M hectares across the Sahel — a model for India." },
    ],
    fact: { label: "India's 2030 Goal", value: "Restore 26 million hectares", icon: "🎯" },
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    id: 9,
    type: "during",
    icon: "✅",
    tag: "DO'S & DON'TS",
    title: "What To Do & Avoid",
    subtitle: "Before, during, and after desertification — sustainable land practices",
    doList: [
      "Agroforestry: integrate trees into farming to improve soil and reduce erosion",
      "Rainwater Harvesting: collect and store rainwater for later agricultural use",
      "Sustainable Grazing: rotational grazing to prevent overgrazing and allow recovery",
      "Conservation Agriculture: no-till farming and cover cropping to protect topsoil",
      "Reforestation: plant drought-resistant native species to restore degraded land",
    ],
    dontList: [
      "Avoid cutting trees or clearing vegetation unnecessarily (deforestation)",
      "Prevent livestock from overgrazing a single area",
      "Avoid monoculture farming and overuse of chemical fertilizers",
      "Don't waste water through inefficient irrigation practices",
      "Don't ignore early warning signs like declining groundwater or drying surface water",
    ],
    fact: { label: "Best Practice", value: "Sustainable Land Management", icon: "🌱" },
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
  },
  {
    id: 10,
    type: "mitigation",
    icon: "🛡️",
    tag: "MITIGATION",
    title: "Combating Desertification",
    subtitle: "Sustainable land management, water conservation & policy",
    measures: [
      { icon: "🌳", label: "Reforestation", desc: "Plant drought-resistant species to restore degraded land and improve soil quality." },
      { icon: "💧", label: "Drip Irrigation", desc: "Use efficient irrigation to minimise water waste in arid and semi-arid zones." },
      { icon: "🌾", label: "Soil Erosion Control", desc: "Terracing, contour plowing, and windbreaks prevent topsoil from being washed away." },
      { icon: "🐄", label: "Sustainable Grazing", desc: "Rotational grazing practices prevent overgrazing and allow vegetation to recover." },
      { icon: "📢", label: "Community Empowerment", desc: "Educate local communities on sustainable land and water management practices." },
      { icon: "📋", label: "Policy Enforcement", desc: "Implement land-use regulations; restrict deforestation, overgrazing, and mining." },
    ],
    fact: { label: "India's Strategy", value: "UNCCD Land Degradation Neutrality", icon: "🏢" },
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
  },
];

function DesertificationModule({ onClose, moduleId = 7 }) {
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
          moduleId: moduleId || 7,
          progress: Math.round(currentProgress),
          completed: completedArray,
          lastSlide: current,
          timestamp: new Date().toISOString(),
        }
      );

      console.log("Progress saved successfully:", response.data);
      
      // Save to localStorage as backup
      localStorage.setItem(`desert_progress_${user.uid}`, JSON.stringify({
        progress: Math.round(currentProgress),
        completed: completedArray,
        lastSlide: current,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error("Error saving progress:", error);
      // Save to localStorage as fallback
      localStorage.setItem(`desert_progress_backup_${user.uid}`, JSON.stringify({
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
          const localBackup = localStorage.getItem(`desert_progress_backup_${user.uid}`);
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
    localStorage.setItem(`desert_progress`, Math.round(progress));
    
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
    <div className="dsm-overlay">
      <div className="dsm-modal">
        {/* Header */}
        <div className="dsm-header">
          <div className="dsm-header-left">
            <span className="dsm-module-badge">🏜️ Desertification Module</span>
            <span className="dsm-slide-count">{current + 1} / {SLIDES.length}</span>
          </div>
          <div className="dsm-header-right">
            <span className="dsm-progress-label">{Math.round(progress)}% complete</span>
            {isSaving && <span className="dsm-saving-indicator">💾 Saving...</span>}
            <button className="dsm-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="dsm-progress-track">
          <div className="dsm-progress-fill" style={{ width: `${progress}%`, background: slide.color }} />
        </div>

        {/* Slide Dots */}
        <div className="dsm-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`dsm-dot ${i === current ? "active" : ""} ${completed.has(i) ? "done" : ""}`}
              onClick={() => goTo(i)}
              style={i === current ? { background: slide.color, borderColor: slide.color } : {}}
              title={s.title}
            />
          ))}
        </div>

        {/* Slide Content */}
        <div
          key={animKey}
          className={`dsm-slide dsm-anim-${animDir}`}
          ref={slideRef}
          style={{ background: slide.bg, borderColor: slide.color + "44" }}
        >
          <div className="dsm-slide-tag" style={{ color: slide.color, borderColor: slide.color + "44", background: slide.color + "18" }}>
            {slide.tag}
          </div>
          <div className="dsm-slide-icon">{slide.icon}</div>
          <h2 className="dsm-slide-title">{slide.title}</h2>
          <p className="dsm-slide-subtitle">{slide.subtitle}</p>

          {/* INTRO */}
          {slide.type === "intro" && <p className="dsm-body-text">{slide.body}</p>}

          {/* WARNING SIGNS */}
          {slide.type === "warning" && (
            <div className="dsm-causes-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {slide.signs.map((s, i) => (
                <div key={i} className="dsm-cause-card" style={{ borderColor: slide.color + "44", animationDelay: `${i * 0.1}s` }}>
                  <span className="dsm-cause-icon">{s.icon}</span>
                  <strong className="dsm-cause-label" style={{ color: slide.color }}>{s.label}</strong>
                  <p className="dsm-cause-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* CAUSES */}
          {(slide.type === "causes" || slide.type === "hazard") && (
            <div className="dsm-causes-grid">
              {slide.causes.map((c, i) => (
                <div key={i} className="dsm-cause-card" style={{ borderColor: slide.color + "44", animationDelay: `${i * 0.1}s` }}>
                  <span className="dsm-cause-icon">{c.icon}</span>
                  <strong className="dsm-cause-label" style={{ color: slide.color }}>{c.label}</strong>
                  <p className="dsm-cause-desc">{c.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* EFFECTS LIST (india_causes, effects, unccd) */}
          {(slide.type === "india_causes" || slide.type === "effects" || slide.type === "unccd") && (
            <div className="dsm-effects-list">
              {slide.effects.map((e, i) => (
                <div key={i} className="dsm-effect-row" style={{ animationDelay: `${i * 0.08}s` }}>
                  <span className="dsm-effect-icon">{e.icon}</span>
                  <div>
                    <strong style={{ color: slide.color }}>{e.label}</strong>
                    <p>{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STATS */}
          {slide.type === "stats" && (
            <>
              <div className="dsm-stats-row">
                {slide.stats.map((s, i) => (
                  <div key={i} className="dsm-stat-card" style={{ borderColor: s.color + "44", animationDelay: `${i * 0.1}s` }}>
                    <span className="dsm-stat-value" style={{ color: s.color }}>{s.value}</span>
                    <span className="dsm-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="dsm-effects-list">
                {slide.effects.map((e, i) => (
                  <div key={i} className="dsm-effect-row" style={{ animationDelay: `${i * 0.08}s` }}>
                    <span className="dsm-effect-icon">{e.icon}</span>
                    <div>
                      <strong style={{ color: slide.color }}>{e.label}</strong>
                      <p>{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* DURING / DO & DONT */}
          {slide.type === "during" && (
            <div className="dsm-during-cols">
              <div>
                <div className="dsm-do-header" style={{ color: "#10b981" }}>✅ DO</div>
                {slide.doList.map((item, i) => (
                  <div key={i} className="dsm-do-item" style={{ animationDelay: `${i * 0.08}s` }}>
                    <span style={{ color: "#10b981" }}>•</span> {item}
                  </div>
                ))}
              </div>
              <div>
                <div className="dsm-do-header" style={{ color: "#ef4444" }}>❌ DON'T</div>
                {slide.dontList.map((item, i) => (
                  <div key={i} className="dsm-do-item" style={{ animationDelay: `${i * 0.08}s` }}>
                    <span style={{ color: "#ef4444" }}>•</span> {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MITIGATION */}
          {slide.type === "mitigation" && (
            <div className="dsm-measures-grid">
              {slide.measures.map((m, i) => (
                <div key={i} className="dsm-measure-card" style={{ borderColor: slide.color + "44", animationDelay: `${i * 0.08}s` }}>
                  <span className="dsm-measure-icon">{m.icon}</span>
                  <strong style={{ color: slide.color }}>{m.label}</strong>
                  <p>{m.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Fact Badge */}
          {slide.fact && (
            <div className="dsm-fact-badge" style={{ borderColor: slide.color, color: slide.color, background: slide.color + "14" }}>
              <span>{slide.fact.icon}</span>
              <span>{slide.fact.label}:</span>
              <strong>{slide.fact.value}</strong>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="dsm-nav">
          <button className="dsm-nav-btn dsm-prev" onClick={goPrev} disabled={current === 0}>
            ← Previous
          </button>

          <div className="dsm-nav-center">
            {current === SLIDES.length - 1 ? (
              <button className="dsm-finish-btn" onClick={handleFinish}>
                🎓 Take the Quiz!
              </button>
            ) : (
              <span className="dsm-nav-hint">{SLIDES[current + 1]?.tag} →</span>
            )}
          </div>

          <button
            className="dsm-nav-btn dsm-next"
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

export default DesertificationModule;