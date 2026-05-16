import React, { useState } from "react";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link } from "react-router-dom";
import "../Auth.css";  

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 4,
  duration: 6 + Math.random() * 10,
  delay: Math.random() * 5,
}));

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [shake, setShake] = useState(false);

  const validate = () => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
    return "";
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async () => {
    setTouched(true);
    const err = validate();
    if (err) { setError(err); triggerShake(); return; }
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (e) {
      const msgs = {
        "auth/user-not-found": "No account found with this email address",
        "auth/invalid-email": "Invalid email address",
        "auth/too-many-requests": "Too many attempts — please try again later",
      };
      setError(msgs[e.code] || "Something went wrong. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
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

      {/* ── LEFT PANEL ── */}
      <div className="split-left">
        <div className="split-brand">
          <div className="split-brand-icon">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L28 9v14L16 30 4 23V9L16 2z" fill="url(#hexFP)" />
              <path d="M16 8l6 3.5v7L16 22l-6-3.5v-7L16 8z" fill="rgba(255,255,255,0.2)" />
              <circle cx="16" cy="16" r="3" fill="white" />
              <defs>
                <linearGradient id="hexFP" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
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
            Reset Your<br />
            <span className="split-hero-accent">Password</span>
          </h2>
          <p className="split-hero-desc">
            No worries — it happens to everyone. Enter your registered email
            and we'll send you a secure link to create a new password.
          </p>
        </div>

        {/* Steps */}
        <div className="fp-steps">
          {[
            { num: "1", title: "Enter your email", desc: "Provide the email linked to your account", color: "#6ee7b7" },
            { num: "2", title: "Check your inbox", desc: "We'll send a secure reset link instantly", color: "#3b82f6" },
            { num: "3", title: "Set new password", desc: "Click the link and choose a strong password", color: "#8b5cf6" },
          ].map((step) => (
            <div key={step.num} className="fp-step-card" style={{ animationDelay: `${parseInt(step.num) * 0.12}s` }}>
              <div className="fp-step-num" style={{ background: step.color + "22", color: step.color, border: `1px solid ${step.color}44` }}>
                {step.num}
              </div>
              <div>
                <p className="fp-step-title">{step.title}</p>
                <p className="fp-step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="split-right">
        <div className={`auth-card split-card ${shake ? "shake" : ""} ${sent ? "success-pulse" : ""}`}>

          {!sent ? (
            <>
              {/* Header */}
              <div className="auth-header">
                <div className="fp-icon-wrap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="url(#mailGrad)" />
                    <defs>
                      <linearGradient id="mailGrad" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6ee7b7" />
                        <stop offset="1" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h2 className="brand-title" style={{ fontSize: 22 }}>Forgot Password?</h2>
                <p className="brand-sub">Enter your email to receive a reset link</p>
              </div>

              {/* Error */}
              {error && (
                <div className="alert-error" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Email field */}
              <div className={`field-group ${touched && error ? "has-error" : touched && email && !error ? "has-success" : ""}`}>
                <label className="field-label" htmlFor="fp-email">Email address</label>
                <div className="field-wrap">
                  <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="you@school.edu"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (touched) setError(validate());
                    }}
                    onBlur={() => { setTouched(true); setError(validate()); }}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    className="field-input"
                  />
                  {touched && !error && email && (
                    <svg className="field-icon-right success" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                </div>
                {touched && error && <p className="field-error">{error}</p>}
              </div>

              {/* Info note */}
              <div className="fp-info-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                The reset link will expire in <strong>15 minutes</strong>. Check your spam folder if you don't see it.
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`btn-primary ${loading ? "loading" : ""}`}
                type="button"
              >
                {loading ? <span className="spinner" /> : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                    Send Reset Link
                  </>
                )}
              </button>

              <p className="auth-footer-text">
                Remember your password?{" "}
                <Link to="/login" className="auth-link">Back to Login</Link>
              </p>
            </>
          ) : (
            /* ── SUCCESS STATE ── */
            <div className="fp-success-state">
              <div className="fp-success-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="11" stroke="url(#successCircle)" strokeWidth="1.5" />
                  <path d="M7 13l3.5 3.5L17 9" stroke="url(#successCheck)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="successCircle" x1="1" y1="1" x2="23" y2="23" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6ee7b7" /><stop offset="1" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="successCheck" x1="7" y1="9" x2="17" y2="17" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6ee7b7" /><stop offset="1" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <h2 className="brand-title" style={{ fontSize: 22, marginBottom: 8 }}>Email Sent!</h2>
              <p className="fp-success-desc">
                We've sent a password reset link to
              </p>
              <div className="fp-email-chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                {email}
              </div>

              <div className="fp-success-steps">
                {[
                  "Open your email inbox",
                  "Click the reset link in the email",
                  "Choose a strong new password",
                  "Log in with your new password",
                ].map((step, i) => (
                  <div key={i} className="fp-success-step" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
                    <div className="fp-success-step-num">{i + 1}</div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <div className="fp-info-note" style={{ marginBottom: 24 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                Didn't receive it? Check your <strong>spam/junk</strong> folder or{" "}
                <button
                  className="fp-resend-btn"
                  onClick={() => { setSent(false); setError(""); setTouched(false); }}
                >
                  try again
                </button>
              </div>

              <Link to="/login" className="btn-primary" style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
