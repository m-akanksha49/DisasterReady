// src/components/emergency/StudentSOSSection.js
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell, Shield, Clock, MapPin, User, CheckCircle, ExternalLink, Navigation, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AcknowledgmentModal from './AcknowledgmentModal';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function StudentAlertCard({ alert, onAcknowledge, isAcknowledging, user }) {
  const [showAckModal, setShowAckModal] = useState(false);
  
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const getPriorityColor = (level) => {
    switch (level) {
      case 'critical': return { border: '#dc2626', bg: 'rgba(220,38,38,0.1)', glow: '0 0 10px rgba(220,38,38,0.3)' };
      case 'high': return { border: '#ef4444', bg: 'rgba(239,68,68,0.1)', glow: 'none' };
      case 'medium': return { border: '#f97316', bg: 'rgba(249,115,22,0.1)', glow: 'none' };
      default: return { border: '#eab308', bg: 'rgba(234,179,8,0.1)', glow: 'none' };
    }
  };

  const priority = getPriorityColor(alert.emergency_level);
  const hasUserAcknowledged = alert.acknowledgments?.some(ack => ack.user_id === (user?.uid || user?.id));
  const userAcknowledgment = alert.acknowledgments?.find(ack => ack.user_id === (user?.uid || user?.id));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gray-800 rounded-xl p-4 shadow-lg relative overflow-hidden"
        style={{ 
          borderLeft: `4px solid ${priority.border}`,
          boxShadow: priority.glow
        }}
      >
        {alert.status === 'active' && (
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          </div>
        )}
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className={`w-5 h-5 ${alert.emergency_level === 'critical' ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div>
                <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 mr-2">
                  {alert.emergency_level.toUpperCase()}
                </span>
                <h3 className="font-bold text-white inline">{alert.title}</h3>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                alert.status === 'active' ? 'bg-red-500/20 text-red-300 animate-pulse' :
                alert.status === 'acknowledged' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-green-500/20 text-green-300'
              }`}>
                {alert.status.toUpperCase()}
              </span>
            </div>
            
            <p className="text-gray-300 text-sm mb-3">{alert.message}</p>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{alert.admin_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatRelativeTime(alert.created_at)}</span>
              </div>
              {alert.location_name && (
                <div className="flex items-center gap-1 col-span-2">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{alert.location_name}</span>
                </div>
              )}
            </div>

            {/* Show acknowledgment count */}
            {alert.acknowledgment_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                <Users className="w-3 h-3" />
                <span>{alert.acknowledgment_count} people have responded</span>
              </div>
            )}
            
            {/* Show user's acknowledgment if they have responded */}
            {hasUserAcknowledged && userAcknowledgment && (
              <div className="bg-green-500/10 rounded-lg p-2 mb-3 border border-green-500/20">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">You responded: {userAcknowledgment.safety_status}</span>
                  <span className="text-gray-500 ml-auto">{formatRelativeTime(userAcknowledgment.acknowledged_at)}</span>
                </div>
                {userAcknowledgment.location && (
                  <p className="text-gray-400 text-xs mt-1 truncate">📍 {userAcknowledgment.location}</p>
                )}
              </div>
            )}
            
            {!hasUserAcknowledged && alert.status !== 'resolved' && (
              <button
                onClick={() => setShowAckModal(true)}
                disabled={isAcknowledging === alert.id}
                className="w-full px-3 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 rounded-lg text-white font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                {isAcknowledging === alert.id ? 'Sending...' : 'Acknowledge & Report Safety'}
              </button>
            )}
            
            {hasUserAcknowledged && alert.status === 'resolved' && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>This alert has been resolved</span>
              </div>
            )}
            
            {alert.latitude && (
              <button
                onClick={() => window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, '_blank')}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                View on Map
              </button>
            )}
          </div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {showAckModal && (
          <AcknowledgmentModal
            alert={alert}
            onClose={() => setShowAckModal(false)}
            onAcknowledge={onAcknowledge}
            isAcknowledging={isAcknowledging === alert.id}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function StudentSOSSection() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acknowledging, setAcknowledging] = useState(null);
  const [filter, setFilter] = useState('active');

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/drills/sos/alerts`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAlerts(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    const onSosSent = () => fetchAlerts();
    window.addEventListener('sosAlertSent', onSosSent);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('sosAlertSent', onSosSent);
    };
  }, [fetchAlerts]);

  const handleAcknowledge = async (alertId, data) => {
    if (!user) return;
    setAcknowledging(alertId);
    
    try {
      const userId = user.uid || user.id;
      const res = await fetch(`${API}/api/drills/sos/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: String(userId),
          user_name: data.user_name || user.displayName || user.email,
          safety_status: data.safety_status,
          location: data.location,
          contact_number: data.contact_number,
          notes: data.notes
        }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to acknowledge');
      }
      
      const updatedAlert = await res.json();
      setAlerts(prev => prev.map(a => a.id === alertId ? updatedAlert : a));
      
      // Play acknowledgment sound
      const audio = new Audio('/acknowledgment.mp3');
      audio.play().catch(console.log);
    } catch (err) {
      console.error('Acknowledge error:', err);
      alert('Failed to acknowledge: ' + err.message);
    } finally {
      setAcknowledging(null);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return alert.status !== 'resolved';
    if (filter === 'my') {
      return alert.acknowledgments?.some(ack => ack.user_id === (user?.uid || user?.id));
    }
    return true;
  });

  const stats = {
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.emergency_level === 'critical' && a.status !== 'resolved').length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-800 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-400 mb-2">Failed to load alerts</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button
          onClick={fetchAlerts}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-r from-red-600/20 to-red-500/20 rounded-xl p-3 border border-red-500/30">
          <p className="text-red-300 text-xs">Active Alerts</p>
          <p className="text-2xl font-bold text-white">{stats.active}</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 rounded-xl p-3 border border-yellow-500/30">
          <p className="text-yellow-300 text-xs">Acknowledged</p>
          <p className="text-2xl font-bold text-white">{stats.acknowledged}</p>
        </div>
        <div className="bg-gradient-to-r from-green-600/20 to-green-500/20 rounded-xl p-3 border border-green-500/30">
          <p className="text-green-300 text-xs">Resolved</p>
          <p className="text-2xl font-bold text-white">{stats.resolved}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 rounded-xl p-3 border border-purple-500/30">
          <p className="text-purple-300 text-xs">Critical</p>
          <p className="text-2xl font-bold text-white">{stats.critical}</p>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            filter === 'active' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Active Alerts
          {stats.active > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
              {stats.active}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            filter === 'all' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All Alerts
        </button>
        <button
          onClick={() => setFilter('my')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            filter === 'my' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          My Responses
        </button>
      </div>
      
      {/* Alerts List */}
      <AnimatePresence>
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No {filter === 'active' ? 'active ' : ''}emergency alerts</p>
            <p className="text-gray-500 text-sm mt-1">Stay safe!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map(alert => (
              <StudentAlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={handleAcknowledge}
                isAcknowledging={acknowledging}
                user={user}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}