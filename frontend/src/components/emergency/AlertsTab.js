// src/components/emergency/AlertsTab.js
// ✅ FIXED: Uses useSOSAlerts hook, shared timeUtils, proper loading/error/empty states

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle, Clock, User, MapPin,
  ExternalLink, Shield, Bell, RefreshCw, Users,
  Activity, Phone, MessageSquare, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { useSOSAlerts }        from "../../hooks/useSOSAlerts";
import AcknowledgeModal        from "./AcknowledgeModal";
import { useAuth }             from "../../contexts/AuthContext";
import { formatRelativeTime, formatAbsoluteTime } from "../../utils/timeUtils";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ─── Priority colours ────────────────────────────────────────────────────────
const LEVEL_STYLES = {
  critical: {
    card:  "from-red-950/80 to-red-900/60 border-red-600/70",
    badge: "bg-red-700 text-white",
    label: "CRITICAL",
    pulse: "bg-red-500",
    glow:  "shadow-red-900/50",
  },
  high: {
    card:  "from-red-900/70 to-red-800/50 border-red-500/60",
    badge: "bg-red-600 text-white",
    label: "HIGH",
    pulse: "bg-red-400",
    glow:  "shadow-red-800/40",
  },
  medium: {
    card:  "from-orange-900/60 to-orange-800/40 border-orange-500/50",
    badge: "bg-orange-600 text-white",
    label: "MEDIUM",
    pulse: "bg-orange-400",
    glow:  "shadow-orange-800/30",
  },
  low: {
    card:  "from-yellow-900/50 to-yellow-800/30 border-yellow-500/40",
    badge: "bg-yellow-600 text-black",
    label: "LOW",
    pulse: "bg-yellow-400",
    glow:  "shadow-yellow-800/20",
  },
};

const SAFETY_STYLES = {
  safe:      { color: "text-green-400",  bg: "bg-green-500/20",  label: "Safe"       },
  injured:   { color: "text-orange-400", bg: "bg-orange-500/20", label: "Injured"    },
  need_help: { color: "text-red-400",    bg: "bg-red-500/20",    label: "Needs Help" },
  trapped:   { color: "text-red-300",    bg: "bg-red-800/30",    label: "Trapped"    },
};

const FILTER_TABS = ["All", "Active", "Acknowledged", "Resolved", "Critical"];

// ─────────────────────────────────────────────────────────────────────────────
export default function AlertsTab({ embedded = false }) {
  const { user } = useAuth();
  const {
    alerts, loading, error, fetchAlerts,
    updateAlertLocally, resolveAlertLocally,
  } = useSOSAlerts();

  const [filterTab,    setFilterTab]    = useState("All");
  const [sortBy,       setSortBy]       = useState("latest");
  const [expandedId,   setExpandedId]   = useState(null);
  const [ackModalAlert, setAckModalAlert] = useState(null);
  const [resolving,    setResolving]    = useState(null);

  const isAdmin = user?.role === "admin" || user?.role === "teacher";

  // ── Filtering & sorting ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let arr = [...alerts];
    switch (filterTab) {
      case "Active":       arr = arr.filter(a => a.status === "active");       break;
      case "Acknowledged": arr = arr.filter(a => a.status === "acknowledged"); break;
      case "Resolved":     arr = arr.filter(a => a.status === "resolved");     break;
      case "Critical":     arr = arr.filter(a => a.emergency_level === "critical"); break;
      default: break;
    }
    if (sortBy === "priority") {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      arr.sort((a, b) => (order[a.emergency_level] ?? 9) - (order[b.emergency_level] ?? 9));
    }
    return arr;
  }, [alerts, filterTab, sortBy]);

  // ── Counts for tabs ───────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    All:          alerts.length,
    Active:       alerts.filter(a => a.status === "active").length,
    Acknowledged: alerts.filter(a => a.status === "acknowledged").length,
    Resolved:     alerts.filter(a => a.status === "resolved").length,
    Critical:     alerts.filter(a => a.emergency_level === "critical").length,
  }), [alerts]);

  // ── Resolve alert ─────────────────────────────────────────────────────────
  const handleResolve = async (alertId) => {
    if (!window.confirm("Mark this alert as resolved?")) return;
    setResolving(alertId);
    try {
      const userId = user?.uid || user?.id || "";
      const res = await fetch(`${API}/api/drills/sos/${alertId}/resolve`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ resolved_by: String(userId) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      resolveAlertLocally(alertId);
    } catch (err) {
      alert("Failed to resolve: " + err.message);
    } finally {
      setResolving(null);
    }
  };

  // ── Check if current user already acknowledged ────────────────────────────
  const userAckFor = (a) => {
    const uid = user?.uid || user?.id;
    return (a.acknowledgments || []).find(ac => String(ac.user_id) === String(uid));
  };

  // ─── Skeleton loader ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="bg-gray-800/50 rounded-2xl p-5 animate-pulse border border-gray-700/50"
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
                <div className="h-3 bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      {!embedded && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Alerts"  value={alerts.length}       color="gray"  />
          <StatCard label="Active"        value={counts.Active}        color="red"   blink={counts.Active > 0} />
          <StatCard label="Acknowledged"  value={counts.Acknowledged}  color="blue"  />
          <StatCard label="Resolved"      value={counts.Resolved}      color="green" />
        </div>
      )}

      {/* ── Filter tabs + sort ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                ${filterTab === tab
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
            >
              {tab}
              {counts[tab] > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
                  ${filterTab === tab ? "bg-white/20" : "bg-gray-700"}`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg
              text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="latest">Latest First</option>
            <option value="priority">Highest Priority</option>
          </select>
          <button
            onClick={fetchAlerts}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg
              text-gray-400 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4
          flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm flex-1">
            Could not load alerts: {error}
          </p>
          <button
            onClick={fetchAlerts}
            className="text-red-400 hover:text-red-300 text-sm underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!error && filtered.length === 0 && (
        <div className="text-center py-16 bg-gray-800/30 rounded-2xl
          border border-dashed border-gray-700">
          <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-300 font-semibold text-lg">
            No {filterTab !== "All" ? filterTab.toLowerCase() : ""} alerts
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filterTab === "Active"
              ? "All clear — no active emergencies."
              : "Nothing to show here."}
          </p>
        </div>
      )}

      {/* ── Alert cards ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {filtered.map(alert => {
            const lvl      = LEVEL_STYLES[alert.emergency_level] || LEVEL_STYLES.medium;
            const myAck    = userAckFor(alert);
            const isActive = alert.status === "active";
            const isOpen   = expandedId === alert.id;

            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className={`relative rounded-2xl border bg-gradient-to-br
                  ${lvl.card} shadow-xl ${lvl.glow} overflow-hidden
                  ${isActive ? "ring-2 ring-red-500/40" : ""}`}
                >
                  {/* Pulsing top bar for active alerts */}
                  {isActive && (
                    <div className="h-1 bg-gradient-to-r from-red-600 via-red-400 to-red-600
                      animate-pulse absolute top-0 inset-x-0" />
                  )}

                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Left icon */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          {isActive
                            ? (
                              <div className="w-10 h-10 rounded-full bg-red-600/30
                                flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                                <span className={`absolute -top-1 -right-1 w-3 h-3
                                  ${lvl.pulse} rounded-full animate-ping`} />
                                <span className={`absolute -top-1 -right-1 w-3 h-3
                                  ${lvl.pulse} rounded-full`} />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-green-600/20
                                flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              </div>
                            )
                          }
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs
                            font-black tracking-wider ${lvl.badge}`}>
                            {lvl.label}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                            ${alert.status === "active"
                              ? "bg-red-500/20 text-red-300"
                              : alert.status === "acknowledged"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-green-500/20 text-green-300"
                            }`}>
                            {(alert.status || "active").toUpperCase()}
                          </span>
                          {(alert.ack_count || 0) > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5
                              bg-white/10 rounded-full text-xs text-gray-300">
                              <Users className="w-3 h-3" />
                              {alert.ack_count} responded
                            </span>
                          )}
                        </div>

                        <h3 className="text-white font-bold text-base leading-tight mb-1">
                          {alert.title}
                        </h3>
                        {alert.message && (
                          <p className="text-white/80 text-sm mb-3 leading-relaxed">
                            {alert.message}
                          </p>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {alert.admin_name || "System"}
                          </span>
                          <span
                            className="flex items-center gap-1"
                            title={formatAbsoluteTime(alert.created_at)}
                          >
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(alert.created_at)}
                          </span>
                          {alert.location_name && (
                            <span className="flex items-center gap-1 max-w-[220px] truncate">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {alert.location_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                        {/* My acknowledgment badge */}
                        {myAck && (
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold
                            flex items-center gap-1
                            ${SAFETY_STYLES[myAck.safety_status]?.bg || "bg-white/10"}
                            ${SAFETY_STYLES[myAck.safety_status]?.color || "text-white"}`}>
                            <CheckCircle className="w-3.5 h-3.5" />
                            {SAFETY_STYLES[myAck.safety_status]?.label || "Responded"}
                          </div>
                        )}

                        {/* Acknowledge / Update button */}
                        {(isActive || alert.status === "acknowledged") && (
                          <button
                            onClick={() => setAckModalAlert(alert)}
                            className={`px-3 py-2 rounded-xl text-sm font-semibold
                              transition flex items-center gap-1.5
                              ${myAck
                                ? "bg-white/10 hover:bg-white/20 text-white/70 border border-white/20"
                                : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40"
                              }`}
                          >
                            <Shield className="w-4 h-4" />
                            {myAck ? "Update" : "Respond"}
                          </button>
                        )}

                        {/* Map link */}
                        {alert.latitude && (
                          <button
                            onClick={() => window.open(
                              `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`,
                              "_blank"
                            )}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20
                              rounded-xl text-sm text-white/70 transition
                              flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Map
                          </button>
                        )}

                        {/* Resolve (admin only) */}
                        {isAdmin && isActive && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            disabled={resolving === alert.id}
                            className="px-3 py-2 bg-green-600/30 hover:bg-green-600/60
                              rounded-xl text-sm text-green-300 transition
                              flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {resolving === alert.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <CheckCircle className="w-4 h-4" />
                            }
                            Resolve
                          </button>
                        )}

                        {/* Toggle acknowledgments list */}
                        {(alert.ack_count || 0) > 0 && (
                          <button
                            onClick={() => setExpandedId(isOpen ? null : alert.id)}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20
                              rounded-xl text-sm text-white/60 transition
                              flex items-center gap-1.5"
                          >
                            <Users className="w-4 h-4" />
                            {isOpen
                              ? <ChevronUp className="w-3 h-3" />
                              : <ChevronDown className="w-3 h-3" />
                            }
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded acknowledgments */}
                    <AnimatePresence>
                      {isOpen && (alert.acknowledgments || []).length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-4"
                        >
                          <div className="border-t border-white/10 pt-4">
                            <p className="text-white/60 text-xs uppercase tracking-wider
                              mb-3 flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5" />
                              Responses ({alert.acknowledgments.length})
                            </p>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {alert.acknowledgments.map((ack, i) => {
                                const ss = SAFETY_STYLES[ack.safety_status] || {};
                                return (
                                  <div
                                    key={i}
                                    className={`p-3 rounded-xl ${ss.bg || "bg-white/5"}
                                      border border-white/10`}
                                  >
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className={`font-semibold text-sm ${ss.color || "text-white"}`}>
                                        {ack.user_name}
                                      </span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full
                                        ${ss.bg} ${ss.color}`}>
                                        {ss.label || ack.safety_status}
                                      </span>
                                      <span className="text-white/40 text-xs ml-auto">
                                        {formatRelativeTime(ack.acknowledged_at)}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1
                                      text-xs text-white/50">
                                      {ack.responder_location && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {ack.responder_location}
                                        </span>
                                      )}
                                      {ack.contact_number && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="w-3 h-3" />
                                          {ack.contact_number}
                                        </span>
                                      )}
                                      {ack.notes && (
                                        <span className="flex items-center gap-1
                                          max-w-[280px] truncate">
                                          <MessageSquare className="w-3 h-3" />
                                          {ack.notes}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Acknowledge Modal */}
      <AnimatePresence>
        {ackModalAlert && (
          <AcknowledgeModal
            alert={ackModalAlert}
            user={user}
            onClose={() => setAckModalAlert(null)}
            onSuccess={(updatedAlert) => {
              updateAlertLocally(ackModalAlert.id, {
                user_id:        String(user?.uid || user?.id),
                user_name:      user?.name || user?.display_name || "You",
                safety_status:  "safe",
                acknowledged_at: new Date().toISOString(),
                ...(updatedAlert?.acknowledgments?.[0] || {}),
              });
              setAckModalAlert(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── StatCard sub-component ───────────────────────────────────────────────────
function StatCard({ label, value, color = "gray", blink = false }) {
  const colors = {
    gray:  "from-gray-800 to-gray-700/50 border-gray-700 text-gray-200",
    red:   "from-red-900/60 to-red-800/40 border-red-700/50 text-red-300",
    blue:  "from-blue-900/50 to-blue-800/30 border-blue-700/40 text-blue-300",
    green: "from-green-900/50 to-green-800/30 border-green-700/40 text-green-300",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border`}>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-black ${blink ? "animate-pulse" : ""} text-white`}>
        {value}
      </p>
    </div>
  );
}