// src/components/emergency/AcknowledgeModal.js
// ✅ FIXED: Proper async handling, correct API endpoint, error display

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CheckCircle, AlertTriangle, User, Phone, MapPin,
  MessageSquare, Shield, Heart, HelpCircle, Loader2,
} from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SAFETY_OPTIONS = [
  {
    value: "safe",
    label: "I'm Safe",
    desc:  "No injuries, in a secure location",
    icon:  CheckCircle,
    color: "from-green-600 to-green-500",
    ring:  "ring-green-500",
    bg:    "bg-green-500/20",
    text:  "text-green-400",
  },
  {
    value: "injured",
    label: "Injured",
    desc:  "I have injuries but can communicate",
    icon:  Heart,
    color: "from-orange-600 to-orange-500",
    ring:  "ring-orange-500",
    bg:    "bg-orange-500/20",
    text:  "text-orange-400",
  },
  {
    value: "need_help",
    label: "Need Immediate Help",
    desc:  "I need assistance urgently",
    icon:  HelpCircle,
    color: "from-red-600 to-red-500",
    ring:  "ring-red-500",
    bg:    "bg-red-500/20",
    text:  "text-red-400",
  },
  {
    value: "trapped",
    label: "Trapped",
    desc:  "I cannot move / am stuck",
    icon:  AlertTriangle,
    color: "from-red-800 to-red-700",
    ring:  "ring-red-700",
    bg:    "bg-red-800/20",
    text:  "text-red-300",
  },
];

export default function AcknowledgeModal({ alert, user, onClose, onSuccess }) {
  const [step,         setStep]         = useState(1); // 1 = safety status, 2 = details
  const [safetyStatus, setSafetyStatus] = useState("");
  const [fullName,     setFullName]     = useState(user?.name || user?.display_name || "");
  const [location,     setLocation]     = useState("");
  const [contact,      setContact]      = useState("");
  const [notes,        setNotes]        = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState("");

  const handleSubmit = async () => {
    if (!safetyStatus)    { setSubmitError("Please select your safety status."); return; }
    if (!fullName.trim()) { setSubmitError("Please enter your full name."); return; }
    setSubmitError("");
    setSubmitting(true);
    try {
      const userId = user?.uid || user?.id || "anonymous";
      const res = await fetch(`${API}/api/drills/sos/${alert.id}/acknowledge`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:            String(userId),
          user_name:          fullName.trim(),
          safety_status:      safetyStatus,
          responder_location: location.trim() || null,
          contact_number:     contact.trim()  || null,
          notes:              notes.trim()    || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      onSuccess(data.alert);
    } catch (err) {
      setSubmitError(err.message || "Failed to send response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selected = SAFETY_OPTIONS.find(o => o.value === safetyStatus);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4
        bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        onClick={e => e.stopPropagation()}
        className="bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl
          border border-red-500/30 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-red-600 px-6 py-4
          flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full
              flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Emergency Response</h2>
              <p className="text-white/70 text-xs truncate max-w-[240px]">
                {alert.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 px-6 pt-4">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300
                ${step >= s ? "bg-red-500" : "bg-gray-700"}`}
            />
          ))}
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Safety Status */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <p className="text-white font-semibold text-base mb-1">
                    What is your current status?
                  </p>
                  <p className="text-gray-400 text-sm">
                    Select the option that best describes your situation.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SAFETY_OPTIONS.map(opt => {
                    const Icon       = opt.icon;
                    const isSelected = safetyStatus === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setSafetyStatus(opt.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200
                          ${isSelected
                            ? `${opt.bg} ${opt.ring} ring-2 border-transparent`
                            : "border-gray-700 bg-gray-800 hover:border-gray-600"
                          }`}
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${opt.color}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className={`font-semibold text-sm
                            ${isSelected ? opt.text : "text-white"}`}>
                            {opt.label}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs ml-9">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {submitError && step === 1 && (
                  <p className="text-red-400 text-sm">{submitError}</p>
                )}

                <button
                  onClick={() => {
                    if (!safetyStatus) {
                      setSubmitError("Please select your safety status.");
                      return;
                    }
                    setSubmitError("");
                    setStep(2);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500
                    hover:from-red-500 hover:to-red-600 rounded-xl text-white
                    font-bold transition"
                >
                  Continue →
                </button>
              </motion.div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Status summary */}
                {selected && (
                  <div className={`flex items-center gap-3 p-3 rounded-xl
                    ${selected.bg} border border-white/10`}>
                    <selected.icon className={`w-5 h-5 ${selected.text}`} />
                    <div>
                      <p className={`font-semibold text-sm ${selected.text}`}>
                        {selected.label}
                      </p>
                      <p className="text-gray-400 text-xs">{selected.desc}</p>
                    </div>
                    <button
                      onClick={() => { setStep(1); setSubmitError(""); }}
                      className="ml-auto text-gray-500 hover:text-gray-300 text-xs underline"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700
                        rounded-xl text-white placeholder-gray-500
                        focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Your Current Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Building, floor, room..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700
                        rounded-xl text-white placeholder-gray-500
                        focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="tel"
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700
                        rounded-xl text-white placeholder-gray-500
                        focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Additional Notes
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Any additional details about your situation..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700
                        rounded-xl text-white placeholder-gray-500
                        focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {submitError && (
                  <p className="text-red-400 text-sm">{submitError}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setStep(1); setSubmitError(""); }}
                    className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700
                      rounded-xl text-gray-300 font-semibold transition"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5
                      bg-gradient-to-r from-red-600 to-red-500
                      hover:from-red-500 hover:to-red-600
                      rounded-xl text-white font-bold transition disabled:opacity-50"
                  >
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                      : <><CheckCircle className="w-4 h-4" /> Send Response</>
                    }
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}