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
        if (!email.trim()) { setError("Please enter your email address."); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
        if (password !== confirm) { setError("Passwords do not match."); return; }

        setLoading(true);
        try {
            await onSignup?.(name.trim(), email.trim(), password);
        } catch (err: any) {
            // Firebase error messages
            if (err.code === "auth/email-already-in-use") {
                setError("An account with this email already exists.");
            } else if (err.code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else if (err.code === "auth/weak-password") {
                setError("Password is too weak. Use at least 6 characters.");
            } else {
                setError(err.message || "Signup failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.root}>
            {/* Left panel */}
            <div style={styles.left}>
                <div style={styles.leftInner}>
                    <div style={styles.logo}>
                        <div style={styles.logoIcon}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                    stroke="#0a0f0d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span style={styles.logoText}>TrackCV</span>
                    </div>

                    <div style={styles.heroText}>
                        <h1 style={styles.heroH1}>Join your<br />recruitment<br /><span style={styles.heroAccent}>team.</span></h1>
                        <p style={styles.heroSub}>Create your account to start tracking CVs and collaborating with your team.</p>
                    </div>

                    <div style={styles.stepsWrap}>
                        {[
                            { n: "1", title: "Create account", sub: "Sign up with your work email" },
                            { n: "2", title: "Get assigned", sub: "Admin assigns CVs to you" },
                            { n: "3", title: "Track & update", sub: "Update progress in real-time" },
                        ].map(step => (
                            <div key={step.n} style={styles.step}>
                                <div style={styles.stepNum}>{step.n}</div>
                                <div>
                                    <div style={styles.stepTitle}>{step.title}</div>
                                    <div style={styles.stepSub}>{step.sub}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={styles.grid} aria-hidden />
            </div>

            {/* Right panel */}
            <div style={styles.right}>
                <div style={styles.formCard}>
                    <div style={{ marginBottom: 28 }}>
                        <h2 style={styles.formTitle}>Create account</h2>
                        <p style={styles.formSub}>Fill in your details to get started</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        {error && <div style={styles.errorBox}>{error}</div>}

                        {/* Name */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Full Name</label>
                            <div style={styles.inputWrap}>
                                <svg style={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                                </svg>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="John Doe"
                                    style={styles.input}
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Email Address</label>
                            <div style={styles.inputWrap}>
                                <svg style={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" />
                                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    style={styles.input}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Password</label>
                            <div style={styles.inputWrap}>
                                <svg style={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    style={{ ...styles.input, paddingRight: 44 }}
                                    autoComplete="new-password"
                                />
                                <button type="button" onClick={() => setShowPass(s => !s)} style={styles.eyeBtn}>
                                    {showPass
                                        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
                                    }
                                </button>
                            </div>
                            {/* Password strength indicator */}
                            {password.length > 0 && (
                                <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} style={{
                                            flex: 1, height: 3, borderRadius: 100,
                                            background: password.length >= i * 3
                                                ? i <= 1 ? "#f87171" : i <= 2 ? "#fbbf24" : i <= 3 ? "#60a5fa" : "#4ade80"
                                                : "#2a3d2b",
                                            transition: "background 0.2s ease",
                                        }} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Confirm Password</label>
                            <div style={styles.inputWrap}>
                                <svg style={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    placeholder="Repeat your password"
                                    style={{
                                        ...styles.input,
                                        borderColor: confirm && confirm !== password ? "#f87171" : undefined,
                                    }}
                                    autoComplete="new-password"
                                />
                                {confirm && confirm === password && (
                                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button type="submit" disabled={loading} style={styles.submitBtn}>
                            {loading
                                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account…</>
                                : "Create Account →"
                            }
                        </button>
                    </form>

                    {/* Switch to login */}
                    <div style={styles.switchRow}>
                        <span style={{ color: "#5a7a5d" }}>Already have an account?</span>
                        <button onClick={onGoToLogin} style={styles.switchBtn}>Sign in</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    root: {
        display: "flex",
        height: "100vh",
        background: "#0a0f0d",
        fontFamily: "'DM Sans', sans-serif",
        overflow: "hidden",
    },
    left: {
        flex: "1 1 55%",
        background: "linear-gradient(145deg, #0d1a0e 0%, #0f2310 50%, #0a0f0d 100%)",
        borderRight: "1px solid #2a3d2b",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: 48,
    },
    grid: {
        position: "absolute",
        inset: 0,
        backgroundImage: `
      linear-gradient(#2a3d2b22 1px, transparent 1px),
      linear-gradient(90deg, #2a3d2b22 1px, transparent 1px)
    `,
        backgroundSize: "40px 40px",
        maskImage: "radial-gradient(ellipse at 40% 50%, black 30%, transparent 80%)",
    },
    leftInner: { position: "relative", zIndex: 1, maxWidth: 480 },
    logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 48 },
    logoIcon: {
        width: 40, height: 40, background: "#4ade80", borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    logoText: {
        fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800,
        color: "#e8f5e9", letterSpacing: -0.5,
    },
    heroText: { marginBottom: 40 },
    heroH1: {
        fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800,
        lineHeight: 1.08, color: "#e8f5e9", letterSpacing: -1.5, marginBottom: 16,
    },
    heroAccent: { color: "#4ade80" },
    heroSub: { fontSize: 15, color: "#5a7a5d", lineHeight: 1.6, maxWidth: 360 },
    stepsWrap: { display: "flex", flexDirection: "column" as const, gap: 16 },
    step: { display: "flex", alignItems: "flex-start", gap: 14 },
    stepNum: {
        width: 28, height: 28, borderRadius: "50%",
        background: "#1a241a", border: "1px solid #4ade8040",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: "#4ade80",
        fontFamily: "'Syne', sans-serif", flexShrink: 0, marginTop: 1,
    },
    stepTitle: { fontSize: 14, fontWeight: 600, color: "#e8f5e9", marginBottom: 2 },
    stepSub: { fontSize: 12, color: "#5a7a5d" },

    right: {
        flex: "1 1 45%",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 32, background: "#0a0f0d", overflowY: "auto" as const,
    },
    formCard: { width: "100%", maxWidth: 400 },
    formTitle: {
        fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800,
        color: "#e8f5e9", letterSpacing: -0.5, marginBottom: 6,
    },
    formSub: { fontSize: 14, color: "#5a7a5d" },
    errorBox: {
        background: "#7f1d1d22", border: "1px solid #7f1d1d55",
        borderRadius: 10, padding: "10px 14px", fontSize: 13,
        color: "#f87171", marginBottom: 18,
    },
    formGroup: { marginBottom: 16 },
    label: {
        display: "block", fontSize: 13, fontWeight: 600,
        color: "#9dbfa0", marginBottom: 7, fontFamily: "'Syne', sans-serif",
    },
    inputWrap: { position: "relative" },
    inputIcon: {
        position: "absolute", left: 13, top: "50%",
        transform: "translateY(-50%)", color: "#5a7a5d", pointerEvents: "none" as const,
    },
    input: {
        width: "100%", background: "#111812", border: "1px solid #2a3d2b",
        borderRadius: 10, padding: "11px 14px 11px 42px",
        color: "#e8f5e9", fontSize: 14, outline: "none",
    },
    eyeBtn: {
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        background: "none", border: "none", color: "#5a7a5d", cursor: "pointer",
        padding: 4, display: "flex", alignItems: "center",
    },
    submitBtn: {
        width: "100%", padding: "12px 20px", background: "#4ade80", color: "#0a0f0d",
        border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
        cursor: "pointer", marginTop: 8, fontFamily: "'Syne', sans-serif",
        letterSpacing: 0.2, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 8, transition: "background 0.18s ease",
    },
    switchRow: {
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 6, marginTop: 20, fontSize: 13,
    },
    switchBtn: {
        background: "none", border: "none", color: "#4ade80",
        fontWeight: 600, cursor: "pointer", fontSize: 13,
        fontFamily: "'DM Sans', sans-serif",
    },
};

export default SignupPage;