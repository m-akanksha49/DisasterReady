// src/components/drills/DrillModal.js   ← REPLACE entire file
// ✅ FIX: Time input auto-close bug fixed by removing backdrop-click on inner form inputs
//    + MySQL returns TIME as HH:MM:SS, we normalise to HH:MM for the input
import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Calendar, Clock, MapPin, AlertTriangle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const DRILL_TYPES = [
  "Fire Evacuation","Earthquake","Medical Emergency",
  "Flood","Active Threat","Chemical Hazard","Tornado","Lockdown",
];
const SEVERITY = ["low","medium","high","critical"];

// MySQL TIME columns return "HH:MM:SS" — normalise to "HH:MM" for <input type="time">
function toHHMM(t) {
  if (!t) return "10:00";
  return String(t).slice(0, 5);
}

export default function DrillModal({ onClose, drill, onSave }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [formData, setFormData] = useState({
    title:          drill?.title          || "",
    description:    drill?.description    || "",
    drill_type:     drill?.drill_type     || DRILL_TYPES[0],
    severity_level: drill?.severity_level || "medium",
    location_name:  drill?.location_name  || "",
    instructions:   drill?.instructions   || "",
    scheduled_date: drill?.scheduled_date || new Date().toISOString().split("T")[0],
    scheduled_time: toHHMM(drill?.scheduled_time) || "10:00",
  });

  const set = (field) => (e) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!user) { setError("You must be logged in."); return; }
    const userId = user.uid || user.id;
    if (!userId) { setError("User session expired. Please log out and back in."); return; }
    if (!formData.title.trim()) { setError("Title is required."); return; }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        created_by:     String(userId),
        // Send HH:MM only — backend strips seconds anyway
        scheduled_time: formData.scheduled_time.slice(0, 5),
      };

      const url    = drill ? `${API}/api/drills/${drill.id}` : `${API}/api/drills`;
      const method = drill ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      onSave();
    } catch (err) {
      setError(err.message || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ FIX: backdrop onClick only fires when clicking EXACTLY the backdrop element
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{   scale: 0.95, opacity: 0, y: 20  }}
        // ✅ FIX: stop ALL mouse events from bubbling to the backdrop
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto
                   shadow-2xl border border-gray-700"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4
                        flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white">
              {drill ? "Edit Drill" : "Schedule New Drill"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Drill Title *</label>
            <input
              type="text" required
              value={formData.title}
              onChange={set("title")}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g., Quarterly Fire Evacuation Drill"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={set("description")}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Describe the drill objectives..."
            />
          </div>

          {/* Type + Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Drill Type *</label>
              <select
                required
                value={formData.drill_type}
                onChange={set("drill_type")}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white
                           focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {DRILL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Severity Level</label>
              <select
                value={formData.severity_level}
                onChange={set("severity_level")}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white
                           focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {SEVERITY.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
              {/* ✅ FIX: Removed the overlapping Clock icon that was triggering the picker
                  and causing the modal backdrop mousedown to fire */}
              <input
                type="date"
                required
                value={formData.scheduled_date}
                onChange={set("scheduled_date")}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white
                           focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time *</label>
              {/* ✅ FIX: No positioning wrapper / icon — native time picker works cleanly */}
              <input
                type="time"
                required
                value={formData.scheduled_time}
                onChange={set("scheduled_time")}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white
                           focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={formData.location_name}
                onChange={set("location_name")}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white
                           placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Main Building – Assembly Point A"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Instructions</label>
            <textarea
              rows={4}
              value={formData.instructions}
              onChange={set("instructions")}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Step-by-step instructions for participants..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500
                         hover:from-red-500 hover:to-red-600 rounded-xl text-white font-bold
                         transition disabled:opacity-50"
            >
              {loading ? "Saving…" : (drill ? "Update Drill" : "Schedule Drill")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}