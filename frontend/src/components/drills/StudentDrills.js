// src/components/drills/StudentDrills.js
// ✅ FIXED: Uses MySQL REST API with polling instead of broken Supabase
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, AlertTriangle, CheckCircle, Bell, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function StudentDrills() {
  const { user } = useAuth();
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(null);

  const fetchDrills = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/drills/upcoming`);
      if (res.ok) {
        const data = await res.json();
        setDrills(data);
      }
    } catch (err) {
      console.error('fetchDrills:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrills();
    const interval = setInterval(fetchDrills, 10000);
    return () => clearInterval(interval);
  }, [fetchDrills]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':   return 'from-red-600 to-red-500';
      case 'scheduled': return 'from-blue-600 to-blue-500';
      case 'completed': return 'from-green-600 to-green-500';
      default:          return 'from-gray-600 to-gray-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'running':   return 'IN PROGRESS';
      case 'scheduled': return 'UPCOMING';
      case 'completed': return 'COMPLETED';
      default:          return (status || '').toUpperCase();
    }
  };

  const timeUntil = (date, time) => {
    if (!date || !time) return 'Date TBD';
    const eventDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = eventDateTime - now;
    if (diff < 0) return 'In the past';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `In ${days}d ${hours}h`;
    if (hours > 0) return `In ${hours}h ${mins}m`;
    return `In ${mins}m`;
  };

  const getSeverityColor = (level) => {
    switch ((level || '').toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high':     return 'text-orange-400 bg-orange-500/20';
      case 'medium':   return 'text-yellow-400 bg-yellow-500/20';
      default:         return 'text-blue-400 bg-blue-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Emergency Drills</h2>
        <p className="text-gray-400 mt-1">Upcoming and active emergency drills</p>
      </div>

      {/* Running Drills — highlighted */}
      {drills.filter(d => d.status === 'running').length > 0 && (
        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-5 animate-pulse-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <h3 className="text-red-400 font-bold text-lg">DRILL IN PROGRESS</h3>
          </div>
          {drills.filter(d => d.status === 'running').map(drill => (
            <div key={drill.id} className="bg-red-500/20 rounded-xl p-4">
              <p className="text-white font-semibold text-lg">{drill.title}</p>
              <p className="text-white/80 text-sm mt-1">{drill.instructions}</p>
              {drill.location_name && (
                <div className="flex items-center gap-2 mt-2 text-white/70 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{drill.location_name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {drills.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-2xl">
          <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No upcoming drills scheduled</p>
          <p className="text-gray-500 text-sm mt-2">You'll be notified when a drill is scheduled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {drills.map((drill) => (
            <motion.div
              key={drill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-r ${getStatusColor(drill.status)} rounded-xl p-5 border border-white/20`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-white font-bold text-lg">{drill.title}</h3>
                    <span className="px-2 py-0.5 bg-black/30 rounded text-xs text-white/80 font-semibold">
                      {getStatusLabel(drill.status)}
                    </span>
                    {drill.severity_level && (
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(drill.severity_level)}`}>
                        {drill.severity_level.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {drill.description && (
                    <p className="text-white/80 text-sm">{drill.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-white/70">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {drill.scheduled_date
                          ? new Date(drill.scheduled_date + 'T00:00:00').toLocaleDateString()
                          : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{drill.scheduled_time || '—'}</span>
                    </div>
                    {drill.location_name && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{drill.location_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{drill.drill_type}</span>
                    </div>
                  </div>

                  <p className="text-white/60 text-xs">
                    {timeUntil(drill.scheduled_date, drill.scheduled_time)}
                  </p>
                </div>

                {/* Instructions toggle */}
                {drill.instructions && (
                  <button
                    onClick={() => setShowInstructions(showInstructions === drill.id ? null : drill.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30
                               rounded-lg text-white text-sm font-semibold transition flex-shrink-0"
                  >
                    Instructions
                    {showInstructions === drill.id
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showInstructions === drill.id && drill.instructions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 bg-black/30 rounded-xl p-4">
                      <p className="text-white/90 text-sm whitespace-pre-wrap">{drill.instructions}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}