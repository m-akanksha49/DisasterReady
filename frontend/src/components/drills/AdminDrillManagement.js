// src/components/drills/AdminDrillManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, AlertTriangle, Play, Edit, Trash2, Plus, 
  CheckCircle, XCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DrillModal from './DrillModal';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function AdminDrillManagement() {
  const { user } = useAuth();
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDrill, setEditingDrill] = useState(null);
  const [error, setError] = useState('');

  const fetchDrills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/drills`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDrills(data);
      setError('');
    } catch (err) {
      setError('Failed to load drills: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrills();
    const interval = setInterval(fetchDrills, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchDrills]);

  const startDrill = async (drillId) => {
    try {
      const res = await fetch(`${API}/api/drills/${drillId}/start`, { method: 'PATCH' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDrills(prev => prev.map(d => d.id === drillId ? { ...d, status: 'running' } : d));
    } catch (err) {
      alert('Failed to start drill: ' + err.message);
    }
  };

  const completeDrill = async (drillId) => {
    try {
      const res = await fetch(`${API}/api/drills/${drillId}/complete`, { method: 'PATCH' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDrills(prev => prev.map(d => d.id === drillId ? { ...d, status: 'completed' } : d));
    } catch (err) {
      alert('Failed to complete drill: ' + err.message);
    }
  };

  const deleteDrill = async (drillId) => {
    if (!window.confirm('Are you sure you want to delete this drill?')) return;
    try {
      const res = await fetch(`${API}/api/drills/${drillId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDrills(prev => prev.filter(d => d.id !== drillId));
    } catch (err) {
      alert('Failed to delete drill: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Scheduled', icon: Calendar };
      case 'running':
        return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Running', icon: Play };
      case 'completed':
        return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Completed', icon: CheckCircle };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status, icon: XCircle };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Drill Management</h2>
          <p className="text-gray-400 mt-1">Schedule and manage emergency drills</p>
        </div>
        <button
          onClick={() => { setEditingDrill(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 rounded-xl text-white font-semibold hover:from-red-500 hover:to-red-600 transition"
        >
          <Plus className="w-5 h-5" />
          Schedule Drill
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Drills</p>
          <p className="text-2xl font-bold text-white">{drills.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Scheduled</p>
          <p className="text-2xl font-bold text-blue-400">{drills.filter(d => d.status === 'scheduled').length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Running</p>
          <p className="text-2xl font-bold text-red-400">{drills.filter(d => d.status === 'running').length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-400">{drills.filter(d => d.status === 'completed').length}</p>
        </div>
      </div>

      {/* Drills List */}
      <div className="space-y-4">
        {drills.length === 0 ? (
          <div className="text-center py-16 bg-gray-800 rounded-2xl">
            <AlertTriangle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No drills scheduled yet</p>
            <p className="text-gray-500 text-sm mt-2">Click "Schedule Drill" to create your first drill</p>
          </div>
        ) : (
          drills.map((drill) => {
            const badge = getStatusBadge(drill.status);
            return (
              <motion.div
                key={drill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 p-5">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-white">{drill.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs text-white/70 bg-black/30">
                        {(drill.severity_level || 'medium').toUpperCase()}
                      </span>
                    </div>

                    {drill.description && (
                      <p className="text-white/80 text-sm">{drill.description}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-white/80">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(drill.scheduled_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Clock className="w-4 h-4" />
                        <span>{drill.scheduled_time || '—'}</span>
                      </div>
                      {drill.location_name && (
                        <div className="flex items-center gap-2 text-white/80">
                          <MapPin className="w-4 h-4" />
                          <span>{drill.location_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-white/80">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{drill.drill_type}</span>
                      </div>
                    </div>

                    {drill.instructions && (
                      <div className="bg-black/30 rounded-lg p-3">
                        <p className="text-white/90 text-sm">{drill.instructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {drill.status === 'scheduled' && (
                      <button
                        onClick={() => startDrill(drill.id)}
                        className="px-4 py-2 bg-green-600/50 hover:bg-green-600 rounded-lg text-white font-semibold transition flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Start Drill
                      </button>
                    )}

                    {drill.status === 'running' && (
                      <button
                        onClick={() => completeDrill(drill.id)}
                        className="px-4 py-2 bg-blue-600/50 hover:bg-blue-600 rounded-lg text-white font-semibold transition flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete
                      </button>
                    )}

                    <button
                      onClick={() => { setEditingDrill(drill); setShowModal(true); }}
                      className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>

                    <button
                      onClick={() => deleteDrill(drill.id)}
                      className="px-3 py-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-white transition flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <DrillModal
          drill={editingDrill}
          onClose={() => { setShowModal(false); setEditingDrill(null); }}
          onSave={() => { setShowModal(false); setEditingDrill(null); fetchDrills(); }}
        />
      )}
    </div>
  );
}