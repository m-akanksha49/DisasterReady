// src/components/drills/StudentDrillsView.js (UPDATED)
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, AlertTriangle, Bell, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import StudentDrillDetail from './StudentDrillDetail';
import { useAuth } from '../../contexts/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function StudentDrillsView() {
  const { user } = useAuth();
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDrill, setExpandedDrill] = useState(null);
  const [selectedDrill, setSelectedDrill] = useState(null);

  const fetchDrills = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/drills/upcoming`);
      if (res.ok) {
        const data = await res.json();
        setDrills(data);
      }
    } catch (err) {
      console.error('fetchDrills error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrills();
    const interval = setInterval(fetchDrills, 30000);
    return () => clearInterval(interval);
  }, [fetchDrills]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'from-red-600 to-red-500';
      case 'scheduled': return 'from-blue-600 to-blue-500';
      case 'completed': return 'from-green-600 to-green-500';
      default: return 'from-gray-600 to-gray-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'running': return 'IN PROGRESS';
      case 'scheduled': return 'UPCOMING';
      case 'completed': return 'COMPLETED';
      default: return (status || '').toUpperCase();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date TBD';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getSeverityColor = (level) => {
    switch ((level || '').toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-blue-400 bg-blue-500/20';
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
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Emergency Drills</h2>
          <p className="text-gray-400 mt-1">Upcoming and ongoing emergency preparedness drills</p>
        </div>

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
                className={`bg-gradient-to-r ${getStatusColor(drill.status)} rounded-xl overflow-hidden border border-white/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
                onClick={() => setSelectedDrill(drill)}
              >
                <div className="p-5">
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
                        <p className="text-white/80 text-sm line-clamp-2">{drill.description}</p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-white/80">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(drill.scheduled_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{drill.scheduled_time}</span>
                        </div>
                        {drill.location_name && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{drill.location_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-semibold transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDrill(drill);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button 
                        className="flex items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-semibold transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDrill(expandedDrill === drill.id ? null : drill.id);
                        }}
                      >
                        Instructions
                        {expandedDrill === drill.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedDrill === drill.id && drill.instructions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-4 pt-4 border-t border-white/20"
                    >
                      <div className="bg-black/30 rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-2">Instructions</h4>
                        <p className="text-white/90 text-sm whitespace-pre-wrap">{drill.instructions}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Drill Detail Modal */}
      {selectedDrill && (
        <StudentDrillDetail
          drill={selectedDrill}
          onClose={() => setSelectedDrill(null)}
          user={user}
        />
      )}
    </>
  );
}