import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import signInWithGoogle from "../lib/signInWithGoogle";
import "./styles/LoginPage.css";

const DNAIcon = () => (
  <svg width="42" height="50" viewBox="0 0 42 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 4 C9 4 33 11 33 26 C33 41 9 48 9 48" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M33 4 C33 4 9 11 9 26 C9 41 33 48 33 48" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <line x1="12" y1="14" x2="30" y2="18" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" opacity="0.7"/>
    <line x1="10.5" y1="23" x2="31.5" y2="23" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" opacity="0.9"/>
    <line x1="12" y1="32" x2="30" y2="36" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" opacity="0.7"/>
    <circle cx="9"  cy="4"  r="2.5" fill="#4ade80"/>
    <circle cx="33" cy="4"  r="2.5" fill="#22c55e"/>
    <circle cx="9"  cy="48" r="2.5" fill="#4ade80"/>
    <circle cx="33" cy="48" r="2.5" fill="#22c55e"/>
    <circle cx="21" cy="26" r="3"   fill="#4ade80" opacity="0.4"/>
  </svg>
);

const GoogleIcon = () => (
  <svg className="google-icon" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/join-room");
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page">
        <div className="card">

          {/* Brand header */}
          <div className="header">
            <DNAIcon />
            <div className="divider-v" />
            <div>
              <div className="brand-name">Code sync</div>
              <div className="brand-tagline">Realtime collaboration</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats">
            {[
              { val: "40+",    label: "Languages" },
              { val: "<50ms",  label: "Latency" },
              { val: "∞",      label: "Rooms" },
            ].map(s => (
              <div className="stat" key={s.label}>
                <div className="stat-val">{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="pills">
            {["Live cursors", "Shared output", "Private rooms", "No setup"].map(f => (
              <span className="pill" key={f}>
                <span className="pill-dot" />{f}
              </span>
            ))}
          </div>

          <p className="field-label">Sign in to start collaborating</p>

          <button
            className={`google-btn${loading ? " loading" : ""}`}
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : <GoogleIcon />}
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          <div className="card-foot">no account needed · free forever</div>
        </div>

        <div className="page-foot">
          Built with 🧡 by <a href="#">Alok Negi</a>
        </div>
      </div>
    </>
  );
}