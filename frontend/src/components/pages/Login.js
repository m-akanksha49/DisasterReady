// src/components/pages/Login.jsx (Updated with AuthContext)
import React, { useState, useEffect, useRef } from "react";
import { auth } from "../../firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import "../../Auth.css";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 4,
  duration: 6 + Math.random() * 10,
  delay: Math.random() * 5,
}));

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

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [shake, setShake] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  const navigate = useNavigate();
  const { signIn } = useAuth(); // Use AuthContext

  const validate = () => {
    const e = {};
    if (!email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Minimum 6 characters";
    return e;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const e = validate();
    setErrors((prev) => ({ ...prev, [field]: e[field] }));
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleEmailLogin = async () => {
    setTouched({ email: true, password: true });
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) { triggerShake(); return; }
    setLoading(true);
    try {
      // Use Firebase Auth directly
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // GET ROLE FROM FIRESTORE
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("User role not found");
      }

      const savedRole = docSnap.data().role;

      // CHECK ROLE MATCH
      if (savedRole !== role) {
        setErrors({ general: "You are not allowed to login as this role ❌" });
        triggerShake();
        setLoading(false);
        return;
      }

      // Navigate based on REAL role
      setSuccessAnim(true);
      setTimeout(() => navigate(savedRole === "admin" ? "/admin" : "/student"), 800);
    } catch (error) {
      const msgs = {
        "auth/user-not-found": "No account found with this email",
        "auth/wrong-password": "Incorrect password",
        "auth/too-many-requests": "Too many attempts — try later",
        "auth/invalid-credential": "Invalid credentials",
      };
      setErrors({ general: msgs[error.code] || error.message || "Login failed. Please try again." });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setErrors({ general: "No role assigned to this account ❌" });
        triggerShake();
        setLoading(false);
        return;
      }

      const savedRole = docSnap.data().role;

      if (savedRole !== role) {
        setErrors({ general: "Wrong role selected ❌" });
        triggerShake();
        setLoading(false);
        return;
      }

      setSuccessAnim(true);
      setTimeout(() => navigate(savedRole === "admin" ? "/admin" : "/student"), 800);
    } catch (error) {
      const msgs = {
        "auth/popup-closed-by-user": "Sign-in popup was closed",
        "auth/unauthorized-domain": "Domain not authorized in Firebase",
      };
      setErrors({ general: msgs[error.code] || "Google sign-in failed." });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleEmailLogin();
  };

  return (
    <div className="auth-bg split-layout">
      {/* Particles */}
      <div className="particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* LEFT PANEL */}
      <div className="split-left">
        {/* Brand */}
        <div className="split-brand">
          <div className="split-brand-icon">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L28 9v14L16 30 4 23V9L16 2z" fill="url(#hexL)" />
              <path d="M16 8l6 3.5v7L16 22l-6-3.5v-7L16 8z" fill="rgba(255,255,255,0.2)" />
              <circle cx="16" cy="16" r="3" fill="white" />
              <defs>
                <linearGradient id="hexL" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
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

        {/* Hero Text */}
        <div className="split-hero">
          <h2 className="split-hero-title">
            From Awareness<br />
            to <span className="split-hero-accent">Action</span>
          </h2>
          <p className="split-hero-desc">
            Digital Disaster Education Platform preparing students, teachers,
            and administrators through interactive modules, virtual drills,
            and real-time analytics.
          </p>
        </div>

        {/* Feature Grid */}
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

      {/* RIGHT PANEL (Form) */}
      <div className="split-right">
        <div className={`auth-card split-card ${shake ? "shake" : ""} ${successAnim ? "success-pulse" : ""}`}>
          {/* Header */}
          <div className="auth-header">
            <h2 className="brand-title" style={{ fontSize: 22 }}>Welcome Back</h2>
            <p className="brand-sub">Choose your role and sign in to continue</p>
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

          {/* General Error */}
          {errors.general && (
            <div className="alert-error" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {errors.general}
            </div>
          )}

          {/* Email Field */}
          <div className={`field-group ${touched.email && errors.email ? "has-error" : touched.email && email && !errors.email ? "has-success" : ""}`}>
            <label className="field-label" htmlFor="email">
              {role === "student" ? "Student ID / Email" : "Email address"}
            </label>
            <div className="field-wrap">
              <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <input
                id="email"
                type="email"
                placeholder={role === "student" ? "Enter your student ID" : "you@school.edu"}
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
              {touched.email && !errors.email && email && (
                <svg className="field-icon-right success" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </div>
            {touched.email && errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div className={`field-group ${touched.password && errors.password ? "has-error" : touched.password && password && !errors.password ? "has-success" : ""}`}>
            <label className="field-label" htmlFor="password">Password</label>
            <div className="field-wrap">
              <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                autoComplete="current-password"
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
              <button
                type="button"
                className="toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.8 11.8 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                )}
              </button>
            </div>
            {touched.password && errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          {/* Login Button */}
          <button
            onClick={handleEmailLogin}
            disabled={loading}
            className={`btn-primary ${loading ? "loading" : ""}`}
            type="button"
          >
            {loading ? <span className="spinner" /> : "Login"}
          </button>

          {/* Forgot + Divider + Google */}
          <div className="forgot-row" style={{ marginTop: -8 }}>
            <Link to="/forgot-password" className="forgot-link">Forgot your password?</Link>
          </div>

          <div className="divider"><span>or continue with</span></div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn-google"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

          <p className="auth-footer-text">
            Don't have an account?{" "}
            <Link to="/signup" className="auth-link">Create one here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;