// src/components/emergency/SOSModal.js
// ✅ FIXED: Uses MySQL REST API, correct API endpoint, fires sosAlertSent event

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, MapPin, Search, X, Loader2, Send,
} from 'lucide-react';
import { useAuth }      from '../../contexts/AuthContext';
import MapComponent     from './MapComponent';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function SOSModal({ onClose }) {
  const { user } = useAuth();
  const [location,        setLocation]        = useState({ lat: null, lng: null, address: '' });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [sending,         setSending]         = useState(false);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [message,         setMessage]         = useState('');
  const [emergencyLevel,  setEmergencyLevel]  = useState('high');

  const getCurrentLocation = useCallback(() => {
    setLoadingLocation(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude, address: '' });
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          setLocation(prev => ({
            ...prev,
            address: data.display_name || `${latitude}, ${longitude}`,
          }));
        } catch {
          setLocation(prev => ({
            ...prev,
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          }));
        }
        setLoadingLocation(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLoadingLocation(false);
      }
    );
  }, []);

  useEffect(() => { getCurrentLocation(); }, [getCurrentLocation]);

  const handleLocationSelect = (lat, lng, address) => {
    setLocation({ lat, lng, address });
  };

  const handleSendAlert = async () => {
    if (!location.lat || !location.lng) {
      alert('Please select a location first');
      return;
    }
    if (!user) {
      alert('You must be logged in to send an SOS alert');
      return;
    }
    setSending(true);
    try {
      const userId   = user.uid  || user.id;
      const userName = user.name || user.display_name || user.email || 'Unknown';

      const res = await fetch(`${API}/api/drills/sos`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id:        String(userId),
          admin_name:      userName,
          title:           `EMERGENCY SOS - ${emergencyLevel.toUpperCase()} ALERT`,
          message:         message || 'Immediate assistance required at this location',
          location_name:   location.address,
          latitude:        location.lat,
          longitude:       location.lng,
          emergency_level: emergencyLevel,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      // Dispatch event so GlobalEmergencyPopup and useSOSAlerts react instantly
      window.dispatchEvent(new CustomEvent('sosAlertSent', { detail: data }));
      setTimeout(() => onClose(), 800);
    } catch (err) {
      alert('Failed to send SOS alert: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-gray-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl
          border border-red-500/30 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4
          flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center
              justify-center animate-pulse">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">⚠ Confirm Emergency Alert</h2>
              <p className="text-white/80 text-sm">This action will notify all emergency contacts</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Warning */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-300 text-sm font-medium mb-2">
              You are about to send an emergency SOS alert. This will immediately notify:
            </p>
            <ul className="text-red-200/80 text-sm space-y-1 ml-4">
              <li>• School administrators</li>
              <li>• Emergency response team</li>
              <li>• All students</li>
              <li>• Local authorities</li>
            </ul>
          </div>

          {/* Emergency Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Emergency Level
            </label>
            <select
              value={emergencyLevel}
              onChange={e => setEmergencyLevel(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700
                rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="critical">⚠ CRITICAL - Life Threatening</option>
              <option value="high">🔴 HIGH - Immediate Danger</option>
              <option value="medium">🟡 MEDIUM - Urgent Attention</option>
              <option value="low">🔵 LOW - Caution Advised</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe the emergency situation..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl
                text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Emergency Location
              </label>
              <button
                onClick={getCurrentLocation}
                disabled={loadingLocation}
                className="flex items-center gap-2 text-sm text-blue-400
                  hover:text-blue-300 transition"
              >
                <MapPin className="w-4 h-4" />
                {loadingLocation ? 'Detecting...' : 'Use My Location'}
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search for a location..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700
                  rounded-xl text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="h-64 rounded-xl overflow-hidden border border-gray-700">
              <MapComponent
                lat={location.lat}
                lng={location.lng}
                onSelect={handleLocationSelect}
                searchQuery={searchQuery}
              />
            </div>
            {location.address && (
              <div className="mt-3 p-3 bg-gray-800 rounded-xl border border-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-300 break-words">{location.address}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Coordinates: {location.lat?.toFixed(6)}, {location.lng?.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700
                rounded-xl text-gray-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSendAlert}
              disabled={sending || !location.lat}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2
                bg-gradient-to-r from-red-600 to-red-500
                hover:from-red-500 hover:to-red-600
                rounded-xl text-white font-semibold transition disabled:opacity-50"
            >
              {sending
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                : <><Send className="w-5 h-5" /> Send SOS Alert</>
              }
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}