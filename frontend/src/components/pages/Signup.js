import React, { useState } from "react";
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "../../Auth.css";
import { db } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";
import axios from "axios";   // ← ADDED

const BASE = "http://localhost:5000";

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z" />
      </svg>
    ),
    color: "#f59e0b",
    title: "Interactive Learning",
    desc: "Modules & Quizzes",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
      </svg>
    ),
    color: "#6ee7b7",
    title: "Virtual Drills",
    desc: "Practice Scenarios",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
      </svg>
    ),
    color: "#3b82f6",
    title: "Real-time Analytics",
    desc: "Track Progress",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
    ),
    color: "#f87171",
    title: "SOS Alerts",
    desc: "Emergency Response",
  },
];

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
      { score: 1, label: "Weak",   color: "#ef4444" },
      { score: 2, label: "Fair",   color: "#f59e0b" },
      { score: 3, label: "Good",   color: "#3b82f6" },
      { score: 4, label: "Strong", color: "#10b981" },
    ];
    return levels[score - 1] || { score: 0, label: "", color: "" };
  };

  const validate = () => {
    const e = {};
    if (!email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Minimum 6 characters";
    if (!confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    const e = validate();
    setErrors((p) => ({ ...p, [field]: e[field] }));
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  // ── ONLY THIS FUNCTION WAS CHANGED ──────────────────────────
  const handleSignup = async () => {
    setTouched({ email: true, password: true, confirmPassword: true });
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) { triggerShake(); return; }
    setLoading(true);
    try {
      // 1. Firebase signup
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save role in Firestore (unchanged from your original)
      await setDoc(doc(db, "users", user.uid), {
        email:     user.email,
        role:      role,
        createdAt: new Date().toISOString(),
      });

      // 3. ✅ NEW: Also save to MySQL so admin dashboard shows real students
      await axios.post(`${BASE}/api/auth/register`, {
        firebase_uid: user.uid,
        email:        user.email,
        display_name: user.email.split("@")[0],
        role:         role,
      });

      setSuccess(true);
      setTimeout(() => navigate(role === "admin" ? "/admin" : "/student"), 1200);

    } catch (error) {
      const msgs = {
        "auth/email-already-in-use": "An account with this email already exists",
        "auth/weak-password":        "Password is too weak",
        "auth/invalid-email":        "Invalid email address",
      };
      setErrors({ general: msgs[error.code] || "Signup failed. Please try again." });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };
  // ────────────────────────────────────────────────────────────

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSignup();
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="auth-bg split-layout">
      {/* Particles */}
      <div className="particles" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left:              `${Math.random() * 100}%`,
              top:               `${Math.random() * 100}%`,
              width:             2 + Math.random() * 4,
              height:            2 + Math.random() * 4,
              animationDuration: `${6 + Math.random() * 10}s`,
              animationDelay:    `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* ── LEFT PANEL ── */}
      <div className="split-left">
        <div className="split-brand">
          <div className="split-brand-icon">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L28 9v14L16 30 4 23V9L16 2z" fill="url(#hexS)" />
              <path d="M16 8l6 3.5v7L16 22l-6-3.5v-7L16 8z" fill="rgba(255,255,255,0.2)" />
              <circle cx="16" cy="16" r="3" fill="white" />
              <defs>
                <linearGradient id="hexS" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6ee7b7" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="split-brand-name">DisasterEdu</h1>
            <p className="split-brand-tagline">From Awareness to Action</p>
          </div>
        </div>

        <div className="split-hero">
          <h2 className="split-hero-title">
            From Awareness<br />
            to <span className="split-hero-accent">Action</span>
          </h2>
          <p className="split-hero-desc">
            Join thousands of students and educators building resilience
            through interactive modules, virtual drills, and real-time
            disaster preparedness analytics.
          </p>
        </div>

        <div className="split-features">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="split-feature-card"
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              <div className="split-feature-icon" style={{ color: f.color, background: f.color + "22" }}>
                {f.icon}
              </div>
              <div>
                <p className="split-feature-title">{f.title}</p>
                <p className="split-feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL (Form) ── */}
      <div className="split-right">
        <div className={`auth-card split-card ${shake ? "shake" : ""} ${success ? "success-pulse" : ""}`}>
          <div className="auth-header">
            <h2 className="brand-title" style={{ fontSize: 22 }}>Create Account</h2>
            <p className="brand-sub">Join DisasterEdu — it's free</p>
          </div>

          {/* Role Toggle */}
          <div className="role-toggle" role="group" aria-label="Select your role">
            <button
              className={`role-btn ${role === "student" ? "active" : ""}`}
              onClick={() => setRole("student")}
              type="button"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
              </svg>
              Student
            </button>
            <button
              className={`role-btn ${role === "admin" ? "active" : ""}`}
              onClick={() => setRole("admin")}
              type="button"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              Teacher / Admin
            </button>
          </div>

          {errors.general && (
            <div className="alert-error" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {errors.general}
            </div>
          )}

          {success && (
            <div className="alert-success" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
              Account created! Redirecting…
            </div>
          )}

          {/* Email */}
          <div className={`field-group ${touched.email && errors.email ? "has-error" : touched.email && email && !errors.email ? "has-success" : ""}`}>
            <label className="field-label" htmlFor="su-email">Email address</label>
            <div className="field-wrap">
              <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <input
                id="su-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) {
                    const er = validate();
                    setErrors((p) => ({ ...p, email: er.email }));
                  }
                }}
                onBlur={() => handleBlur("email")}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="field-input"
              />
            </div>
            {touched.email && errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className={`field-group ${touched.password && errors.password ? "has-error" : touched.password && password && !errors.password ? "has-success" : ""}`}>
            <label className="field-label" htmlFor="su-password">Password</label>
            <div className="field-wrap">
              <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
              <input
                id="su-password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={password}
                autoComplete="new-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) {
                    const er = validate();
                    setErrors((p) => ({ ...p, password: er.password }));
                  }
                }}
                onBlur={() => handleBlur("password")}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="field-input"
              />
              <button type="button" className="toggle-pw" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.8 11.8 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                )}
              </button>
            </div>
            {touched.password && errors.password && <p className="field-error">{errors.password}</p>}
            {password && (
              <div className="strength-meter">
                <div className="strength-bars">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="strength-bar"
                      style={{ background: strength.score >= level ? strength.color : "rgba(255,255,255,0.1)" }}
                    />
                  ))}
                </div>
                {strength.label && (
                  <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className={`field-group ${touched.confirmPassword && errors.confirmPassword ? "has-error" : touched.confirmPassword && confirmPassword && !errors.confirmPassword ? "has-success" : ""}`}>
            <label className="field-label" htmlFor="su-confirm">Confirm password</label>
            <div className="field-wrap">
              <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              <input
                id="su-confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (touched.confirmPassword) {
                    const er = validate();
                    setErrors((p) => ({ ...p, confirmPassword: er.confirmPassword }));
                  }
                }}
                onBlur={() => handleBlur("confirmPassword")}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="field-input"
              />
              <button type="button" className="toggle-pw" onClick={() => setShowConfirm((v) => !v)}>
                {showConfirm ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.8 11.8 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                )}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="field-error">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            onClick={handleSignup}
            disabled={loading || success}
            className={`btn-primary ${loading ? "loading" : ""}`}
            type="button"
          >
            {loading ? <span className="spinner" /> : success ? "Account Created!" : "Create Account"}
          </button>

          <p className="auth-footer-text" style={{ marginTop: 16 }}>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;

