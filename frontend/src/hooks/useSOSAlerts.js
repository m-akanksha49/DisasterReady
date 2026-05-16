// src/hooks/useSOSAlerts.js
// Shared hook used by BOTH AdminDashboard and StudentDashboard.
// Polls every 5 s, fires DOM events for GlobalEmergencyPopup.

import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export function useSOSAlerts() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const seenIds = useRef(new Set());

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/drills/sos/alerts`);
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
      const data = await res.json();

      setAlerts(data);
      setError(null);

      // Fire DOM event for any NEW active alert not yet seen in this session
      data.forEach(alert => {
        if (alert.status === "active" && !seenIds.current.has(alert.id)) {
          seenIds.current.add(alert.id);
          window.dispatchEvent(
            new CustomEvent("newSOSAlert", { detail: alert })
          );
        }
      });
    } catch (err) {
      console.error("useSOSAlerts fetchAlerts:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); // poll every 5 s

    // React immediately when an alert is sent in the same browser session
    const onSent = () => fetchAlerts();
    window.addEventListener("sosAlertSent", onSent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("sosAlertSent", onSent);
    };
  }, [fetchAlerts]);

  // Optimistic local update after acknowledging
  const updateAlertLocally = useCallback((alertId, ackEntry) => {
    setAlerts(prev =>
      prev.map(a => {
        if (a.id !== alertId) return a;
        const acks = [...(a.acknowledgments || [])];
        const idx  = acks.findIndex(ac => ac.user_id === ackEntry.user_id);
        if (idx >= 0) acks[idx] = ackEntry;
        else          acks.unshift(ackEntry);
        return { ...a, acknowledgments: acks, ack_count: acks.length };
      })
    );
  }, []);

  const resolveAlertLocally = useCallback(alertId => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, status: "resolved" } : a))
    );
  }, []);

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    updateAlertLocally,
    resolveAlertLocally,
  };
}