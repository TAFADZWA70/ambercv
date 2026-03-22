import React, { useState } from "react";

interface LoginPageProps {
    onLogin?: (email: string, password: string) => Promise<void>;
    onGoToSignup?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGoToSignup }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) { setError("Please fill in all fields."); return; }
        setError("");
        setLoading(true);
        try {
            await onLogin?.(email, password);
        } catch (err: any) {
            if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
                setError("Incorrect email or password.");
            } else if (err.code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else {
                setError(err.message || "Sign in failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        .auth-root {
          min-height: 100vh;
          background: #0a0f0d;
          display: flex;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Left decorative panel (desktop only) ── */
        .auth-left {
          flex: 1 1 52%;
          background: linear-gradient(145deg, #0d1a0e 0%, #0f2310 60%, #0a0f0d 100%);
          border-right: 1px solid #2a3d2b;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          overflow: hidden;
        }

        .auth-left-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(#2a3d2b22 1px, transparent 1px),
            linear-gradient(90deg, #2a3d2b22 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse at 40% 50%, black 30%, transparent 80%);
        }

        .auth-left-inner {
          position: relative;
          z-index: 1;
          max-width: 460px;
          width: 100%;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 56px;
        }

        .auth-logo-icon {
          width: 42px;
          height: 42px;
          background: #4ade80;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .auth-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #e8f5e9;
          letter-spacing: -0.5px;
        }

        .auth-hero-h1 {
          font-family: 'Syne', sans-serif;
          font-size: 50px;
          font-weight: 800;
          line-height: 1.08;
          color: #e8f5e9;
          letter-spacing: -1.5px;
          margin-bottom: 18px;
        }

        .auth-hero-accent { color: #4ade80; }

        .auth-hero-sub {
          font-size: 15px;
          color: #5a7a5d;
          line-height: 1.65;
          max-width: 360px;
          margin-bottom: 32px;
        }

        .auth-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 40px;
        }

        .auth-pill {
          padding: 6px 14px;
          background: #1a241a;
          border: 1px solid #2a3d2b;
          border-radius: 100px;
          font-size: 13px;
          color: #9dbfa0;
          font-weight: 500;
        }

        .auth-stats {
          display: flex;
          gap: 32px;
        }

        .auth-stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #4ade80;
        }

        .auth-stat-lbl {
          font-size: 12px;
          color: #5a7a5d;
          margin-top: 2px;
        }

        /* ── Right form panel ── */
        .auth-right {
          flex: 1 1 48%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          background: #0a0f0d;
          overflow-y: auto;
        }

        .auth-form-card {
          width: 100%;
          max-width: 400px;
        }

        /* Mobile logo (shown only on mobile) */
        .auth-mobile-logo {
          display: none;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
        }

        .auth-form-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #e8f5e9;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }

        .auth-form-sub {
          font-size: 14px;
          color: #5a7a5d;
          margin-bottom: 28px;
        }

        .auth-error {
          background: #7f1d1d22;
          border: 1px solid #7f1d1d55;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #f87171;
          margin-bottom: 18px;
        }

        .auth-field { margin-bottom: 16px; }

        .auth-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #9dbfa0;
          margin-bottom: 7px;
          font-family: 'Syne', sans-serif;
        }

        .auth-input-wrap { position: relative; }

        .auth-input-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #5a7a5d;
          pointer-events: none;
        }

        .auth-input {
          width: 100%;
          background: #111812;
          border: 1px solid #2a3d2b;
          border-radius: 10px;
          padding: 12px 14px 12px 42px;
          color: #e8f5e9;
          font-size: 16px; /* 16px prevents iOS zoom */
          outline: none;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s ease;
          box-sizing: border-box;
        }

        .auth-input:focus { border-color: #4ade80; box-shadow: 0 0 0 3px #4ade8018; }

        .auth-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #5a7a5d;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .auth-submit-btn {
          width: 100%;
          padding: 13px 20px;
          background: #4ade80;
          color: #0a0f0d;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
          font-family: 'Syne', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .auth-submit-btn:hover:not(:disabled) {
          background: #22c55e;
          transform: translateY(-1px);
        }

        .auth-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .auth-switch {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 22px;
          font-size: 13px;
          color: #5a7a5d;
        }

        .auth-switch-btn {
          background: none;
          border: none;
          color: #4ade80;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .auth-left   { display: none; }
          .auth-right  {
            flex: 1 1 100%;
            padding: 32px 20px 40px;
            align-items: flex-start;
            padding-top: 48px;
          }
          .auth-mobile-logo { display: flex; }
          .auth-form-card   { max-width: 100%; }
          .auth-form-title  { font-size: 24px; }
        }

        @media (max-width: 400px) {
          .auth-right  { padding: 28px 16px 36px; }
          .auth-form-title { font-size: 22px; }
        }
      `}</style>

            <div className="auth-root">
                {/* Left panel */}
                <div className="auth-left">
                    <div className="auth-left-grid" aria-hidden />
                    <div className="auth-left-inner">
                        <div className="auth-logo">
                            <div className="auth-logo-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                        stroke="#0a0f0d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <span className="auth-logo-text">TrackCV</span>
                        </div>

                        <h1 className="auth-hero-h1">
                            Recruitment<br />at your<br /><span className="auth-hero-accent">fingertips.</span>
                        </h1>
                        <p className="auth-hero-sub">Assign CVs, track candidates, and manage your team — all in one place.</p>

                        <div className="auth-pills">
                            {["CV Tracking", "Team Assignment", "Progress Reports", "Templates"].map(p => (
                                <span key={p} className="auth-pill">{p}</span>
                            ))}
                        </div>

                        <div className="auth-stats">
                            {[["1.2k", "CVs tracked"], ["98%", "Completion rate"], ["24h", "Avg turnaround"]].map(([v, l]) => (
                                <div key={l}>
                                    <div className="auth-stat-val">{v}</div>
                                    <div className="auth-stat-lbl">{l}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="auth-right">
                    <div className="auth-form-card">

                        {/* Logo shown only on mobile */}
                        <div className="auth-mobile-logo">
                            <div className="auth-logo-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                        stroke="#0a0f0d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <span className="auth-logo-text">TrackCV</span>
                        </div>

                        <h2 className="auth-form-title">Welcome back</h2>
                        <p className="auth-form-sub">Sign in to your account to continue</p>

                        <form onSubmit={handleSubmit} noValidate>
                            {error && <div className="auth-error">{error}</div>}

                            <div className="auth-field">
                                <label className="auth-label">Email address</label>
                                <div className="auth-input-wrap">
                                    <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" />
                                        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                    <input
                                        className="auth-input"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@company.com"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="auth-field">
                                <label className="auth-label">Password</label>
                                <div className="auth-input-wrap">
                                    <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                    <input
                                        className="auth-input"
                                        type={showPass ? "text" : "password"}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{ paddingRight: 44 }}
                                        autoComplete="current-password"
                                    />
                                    <button type="button" className="auth-eye-btn" onClick={() => setShowPass(s => !s)}>
                                        {showPass
                                            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
                                        }
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading
                                    ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</>
                                    : "Sign in →"
                                }
                            </button>
                        </form>

                        <div className="auth-switch">
                            <span>Don't have an account?</span>
                            <button className="auth-switch-btn" onClick={onGoToSignup}>Sign up</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;