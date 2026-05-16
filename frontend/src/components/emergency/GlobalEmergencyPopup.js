// src/components/emergency/GlobalEmergencyPopup.js
// ✅ FIXED: Uses shared timeUtils, listens to both sosAlertSent and newSOSAlert DOM events

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, X, MapPin, Clock, User, ExternalLink, Shield,
} from "lucide-react";
import { useAuth }          from "../../contexts/AuthContext";
import AcknowledgeModal     from "./AcknowledgeModal";
import { formatRelativeTime } from "../../utils/timeUtils";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const LEVEL_COLORS = {
  critical: { bar: "from-red-800 to-red-600",    badge: "bg-red-800 text-white"    },
  high:     { bar: "from-red-700 to-red-500",    badge: "bg-red-600 text-white"    },
  medium:   { bar: "from-orange-700 to-orange-500", badge: "bg-orange-600 text-white" },
  low:      { bar: "from-yellow-700 to-yellow-500", badge: "bg-yellow-600 text-black" },
};

export default function GlobalEmergencyPopup() {
  const { user } = useAuth();
  const [queue,       setQueue]       = useState([]);
  const [current,     setCurrent]     = useState(null);
  const [showPopup,   setShowPopup]   = useState(false);
  const [showAckModal, setShowAckModal] = useState(false);
  const seenIds  = useRef(new Set());
  const timerRef = useRef(null);

  // ── Dequeue: show next alert when popup is hidden ─────────────────────────
  useEffect(() => {
    if (queue.length > 0 && !showPopup) {
      const [next, ...rest] = queue;
      setQueue(rest);
      setCurrent(next);
      setShowPopup(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowPopup(false), 30_000);
    }
    return () => clearTimeout(timerRef.current);
  }, [queue, showPopup]);

  // ── Poll + listen for SOS events ──────────────────────────────────────────
  useEffect(() => {
    const checkAlerts = async () => {
      try {
        const res = await fetch(`${API}/api/drills/sos/alerts`);
        if (!res.ok) return;
        const alerts = await res.json();
        const newOnes = alerts.filter(
          a => a.status === "active" && !seenIds.current.has(a.id)
        );
        newOnes.forEach(a => seenIds.current.add(a.id));
        if (newOnes.length > 0) {
          setQueue(prev => [...prev, ...newOnes]);
        }
      } catch (_) {}
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 6_000);

    // Immediate event from same-browser SOS send
    const handleNew = (e) => {
      const a = e.detail;
      if (a && !seenIds.current.has(a.id)) {
        seenIds.current.add(a.id);
        setQueue(prev => [...prev, a]);
      }
    };

    window.addEventListener("sosAlertSent", handleNew);
    window.addEventListener("newSOSAlert",  handleNew);

    return () => {
      clearInterval(interval);
      window.removeEventListener("sosAlertSent", handleNew);
      window.removeEventListener("newSOSAlert",  handleNew);
    };
  }, []);

  const dismiss = () => {
    setShowPopup(false);
    clearTimeout(timerRef.current);
  };

  const lv = current
    ? (LEVEL_COLORS[current.emergency_level] || LEVEL_COLORS.high)
    : LEVEL_COLORS.high;

  return (
    <>
      <AnimatePresence>
        {showPopup && current && (
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)]"
          >
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl
              border-2 border-red-500/50 overflow-hidden">
              {/* Animated top bar */}
              <div className={`h-1.5 bg-gradient-to-r ${lv.bar} animate-pulse`} />

              {/* Header */}
              <div className="bg-gradient-to-r from-red-800/80 to-red-700/60
                px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-red-500/30
                      flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-300 animate-pulse" />
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3
                      bg-red-500 rounded-full animate-ping" />
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3
                      bg-red-500 rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>🚨</span>
                      <p className="text-white font-bold text-sm">EMERGENCY ALERT</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${lv.badge}`}>
                        {(current.emergency_level || "HIGH").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white/60 text-xs">Immediate action required</p>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className="text-white/50 hover:text-white transition flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <p className="text-white font-semibold text-sm leading-snug">
                  {current.title}
                </p>
                {current.message && (
                  <p className="text-white/70 text-xs leading-relaxed">
                    {current.message}
                  </p>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-white/50 text-xs">
                    <User className="w-3.5 h-3.5" />
                    <span>By: {current.admin_name || "System"}</span>
                  </div>
                  <div
                    className="flex items-center gap-2 text-white/50 text-xs"
                    title={current.created_at}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatRelativeTime(current.created_at)}</span>
                  </div>
                  {current.location_name && (
                    <div className="flex items-start gap-2 text-white/50 text-xs">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{current.location_name}</span>
                    </div>
                  )}
                </div>

                {/* Queue indicator */}
                {queue.length > 0 && (
                  <p className="text-yellow-400/70 text-xs text-center">
                    +{queue.length} more alert{queue.length > 1 ? "s" : ""} pending
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowAckModal(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2
                      bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm
                      font-bold transition"
                  >
                    <Shield className="w-4 h-4" />
                    Respond
                  </button>
                  {current.latitude && (
                    <button
                      onClick={() => window.open(
                        `https://www.google.com/maps?q=${current.latitude},${current.longitude}`,
                        "_blank"
                      )}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20
                        rounded-xl text-white/70 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={dismiss}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20
                      rounded-xl text-white/70 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full acknowledgment modal */}
      <AnimatePresence>
        {showAckModal && current && (
          <AcknowledgeModal
            alert={current}
            user={user}
            onClose={() => setShowAckModal(false)}
            onSuccess={() => {
              setShowAckModal(false);
              dismiss();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}