import React, { useState } from "react";

interface SignupPageProps {
    onSignup?: (name: string, email: string, password: string) => Promise<void>;
    onGoToLogin?: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignup, onGoToLogin }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!name.trim()) { setError("Please enter your full name."); return; }
        if (!email.trim()) { setError("Please enter your email."); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
        if (password !== confirm) { setError("Passwords do not match."); return; }

        setLoading(true);
        try {
            await onSignup?.(name.trim(), email.trim(), password);
        } catch (err: any) {
            if (err.code === "auth/email-already-in-use") {
                setError("An account with this email already exists.");
            } else if (err.code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else if (err.code === "auth/weak-password") {
                setError("Password is too weak. Use at least 6 characters.");
            } else {
                setError(err.message || "Sign up failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const strength = password.length === 0 ? 0
        : password.length < 6 ? 1
            : password.length < 10 ? 2
                : /[^a-zA-Z0-9]/.test(password) ? 4 : 3;

    const strengthColor = ["transparent", "#f87171", "#fbbf24", "#60a5fa", "#4ade80"][strength];
    const strengthLabel = ["", "Too short", "Weak", "Good", "Strong"][strength];

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
          margin-bottom: 48px;
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
          font-size: 46px;
          font-weight: 800;
          line-height: 1.1;
          color: #e8f5e9;
          letter-spacing: -1.5px;
          margin-bottom: 16px;
        }

        .auth-hero-accent { color: #4ade80; }

        .auth-hero-sub {
          font-size: 15px;
          color: #5a7a5d;
          line-height: 1.65;
          max-width: 360px;
          margin-bottom: 36px;
        }

        .auth-steps { display: flex; flex-direction: column; gap: 18px; }

        .auth-step { display: flex; align-items: flex-start; gap: 14px; }

        .auth-step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1a241a;
          border: 1px solid #4ade8040;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #4ade80;
          font-family: 'Syne', sans-serif;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .auth-step-title { font-size: 14px; font-weight: 600; color: #e8f5e9; margin-bottom: 2px; }
        .auth-step-sub   { font-size: 12px; color: #5a7a5d; }

        /* ── Right form ── */
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

        .auth-mobile-logo {
          display: none;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
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
          margin-bottom: 16px;
        }

        .auth-field { margin-bottom: 14px; }

        .auth-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #9dbfa0;
          margin-bottom: 6px;
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
          font-size: 16px;
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

        .auth-strength {
          display: flex;
          gap: 4px;
          margin-top: 7px;
          align-items: center;
        }

        .auth-strength-bar {
          flex: 1;
          height: 3px;
          border-radius: 100px;
          background: #2a3d2b;
          transition: background 0.2s ease;
        }

        .auth-strength-label {
          font-size: 11px;
          margin-left: 6px;
          white-space: nowrap;
          font-weight: 600;
        }

        .auth-confirm-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
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
          .auth-left  { display: none; }
          .auth-right {
            flex: 1 1 100%;
            padding: 40px 20px 48px;
            align-items: flex-start;
          }
          .auth-mobile-logo { display: flex; }
          .auth-form-card   { max-width: 100%; }
          .auth-form-title  { font-size: 24px; }
        }

        @media (max-width: 400px) {
          .auth-right      { padding: 28px 16px 40px; }
          .auth-form-title { font-size: 21px; }
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
                            Join your<br />recruitment<br /><span className="auth-hero-accent">team.</span>
                        </h1>
                        <p className="auth-hero-sub">Create your account to start tracking CVs and collaborating with your team.</p>

                        <div className="auth-steps">
                            {[
                                { n: "1", title: "Create account", sub: "Sign up with your work email" },
                                { n: "2", title: "Get assigned", sub: "Admin assigns CVs to you" },
                                { n: "3", title: "Track & update", sub: "Update progress in real-time" },
                            ].map(s => (
                                <div key={s.n} className="auth-step">
                                    <div className="auth-step-num">{s.n}</div>
                                    <div>
                                        <div className="auth-step-title">{s.title}</div>
                                        <div className="auth-step-sub">{s.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="auth-right">
                    <div className="auth-form-card">

                        {/* Mobile logo */}
                        <div className="auth-mobile-logo">
                            <div className="auth-logo-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                        stroke="#0a0f0d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <span className="auth-logo-text">TrackCV</span>
                        </div>

                        <h2 className="auth-form-title">Create account</h2>
                        <p className="auth-form-sub">Fill in your details to get started</p>

                        <form onSubmit={handleSubmit} noValidate>
                            {error && <div className="auth-error">{error}</div>}

                            {/* Name */}
                            <div className="auth-field">
                                <label className="auth-label">Full Name</label>
                                <div className="auth-input-wrap">
                                    <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                                    </svg>
                                    <input className="auth-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" autoComplete="name" />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="auth-field">
                                <label className="auth-label">Email Address</label>
                                <div className="auth-input-wrap">
                                    <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" />
                                        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                    <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
                                </div>
                            </div>

                            {/* Password */}
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
                                        placeholder="Min. 6 characters"
                                        style={{ paddingRight: 44 }}
                                        autoComplete="new-password"
                                    />
                                    <button type="button" className="auth-eye-btn" onClick={() => setShowPass(s => !s)}>
                                        {showPass
                                            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                                            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
                                        }
                                    </button>
                                </div>
                                {password.length > 0 && (
                                    <div className="auth-strength">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="auth-strength-bar"
                                                style={{ background: i <= strength ? strengthColor : "#2a3d2b" }} />
                                        ))}
                                        <span className="auth-strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
                                    </div>
                                )}
                            </div>

                            {/* Confirm */}
                            <div className="auth-field">
                                <label className="auth-label">Confirm Password</label>
                                <div className="auth-input-wrap">
                                    <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                    <input
                                        className="auth-input"
                                        type={showPass ? "text" : "password"}
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        placeholder="Repeat your password"
                                        style={{
                                            paddingRight: 44,
                                            borderColor: confirm && confirm !== password ? "#f87171" : undefined,
                                        }}
                                        autoComplete="new-password"
                                    />
                                    {confirm && confirm === password && (
                                        <div className="auth-confirm-icon">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading
                                    ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account…</>
                                    : "Create Account →"
                                }
                            </button>
                        </form>

                        <div className="auth-switch">
                            <span>Already have an account?</span>
                            <button className="auth-switch-btn" onClick={onGoToLogin}>Sign in</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignupPage;