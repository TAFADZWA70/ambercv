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
            setError(err.message || "Invalid credentials. Please try again.");
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
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#0a0f0d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span style={styles.logoText}>TrackCV</span>
                    </div>

                    <div style={styles.heroText}>
                        <h1 style={styles.heroH1}>Recruitment<br />at your<br /><span style={styles.heroAccent}>fingertips.</span></h1>
                        <p style={styles.heroSub}>Assign CVs, track candidates, and manage your team — all in one place.</p>
                    </div>

                    <div style={styles.pillsRow}>
                        {["CV Tracking", "Team Assignment", "Progress Reports", "Templates"].map((p) => (
                            <span key={p} style={styles.pill}>{p}</span>
                        ))}
                    </div>

                    <div style={styles.statsRow}>
                        {[["1.2k", "CVs tracked"], ["98%", "Completion rate"], ["24h", "Avg turnaround"]].map(([v, l]) => (
                            <div key={l} style={styles.statBlock}>
                                <div style={styles.statVal}>{v}</div>
                                <div style={styles.statLbl}>{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* decorative grid */}
                <div style={styles.grid} aria-hidden />
            </div>

            {/* Right panel - form */}
            <div style={styles.right}>
                <div style={styles.formCard}>
                    <div style={{ marginBottom: 32 }}>
                        <h2 style={styles.formTitle}>Welcome back</h2>
                        <p style={styles.formSub}>Sign in to your account to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        {error && <div style={styles.errorBox}>{error}</div>}

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Email address</label>
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
                                    placeholder="••••••••"
                                    style={{ ...styles.input, paddingRight: 44 }}
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPass(s => !s)} style={styles.eyeBtn}>
                                    {showPass
                                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
                                    }
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} style={styles.submitBtn}>
                            {loading
                                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</>
                                : "Sign in →"
                            }
                        </button>
                    </form>

                    <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }}>
                        <span style={{ color: "#5a7a5d" }}>Don't have an account?</span>
                        <button onClick={onGoToSignup} style={{ background: "none", border: "none", color: "#4ade80", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                            Sign up
                        </button>
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
    leftInner: {
        position: "relative",
        zIndex: 1,
        maxWidth: 480,
    },
    logo: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 56,
    },
    logoIcon: {
        width: 40,
        height: 40,
        background: "#4ade80",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    logoText: {
        fontFamily: "'Syne', sans-serif",
        fontSize: 20,
        fontWeight: 800,
        color: "#e8f5e9",
        letterSpacing: -0.5,
    },
    heroText: { marginBottom: 32 },
    heroH1: {
        fontFamily: "'Syne', sans-serif",
        fontSize: 52,
        fontWeight: 800,
        lineHeight: 1.08,
        color: "#e8f5e9",
        letterSpacing: -1.5,
        marginBottom: 18,
    },
    heroAccent: { color: "#4ade80" },
    heroSub: {
        fontSize: 16,
        color: "#5a7a5d",
        lineHeight: 1.6,
        maxWidth: 380,
    },
    pillsRow: {
        display: "flex",
        flexWrap: "wrap" as const,
        gap: 8,
        marginBottom: 40,
    },
    pill: {
        padding: "6px 14px",
        background: "#1a241a",
        border: "1px solid #2a3d2b",
        borderRadius: 100,
        fontSize: 13,
        color: "#9dbfa0",
        fontWeight: 500,
    },
    statsRow: {
        display: "flex",
        gap: 32,
    },
    statBlock: {},
    statVal: {
        fontFamily: "'Syne', sans-serif",
        fontSize: 24,
        fontWeight: 800,
        color: "#4ade80",
    },
    statLbl: { fontSize: 12, color: "#5a7a5d", marginTop: 2 },

    right: {
        flex: "1 1 45%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        background: "#0a0f0d",
    },
    formCard: {
        width: "100%",
        maxWidth: 400,
    },
    formTitle: {
        fontFamily: "'Syne', sans-serif",
        fontSize: 28,
        fontWeight: 800,
        color: "#e8f5e9",
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    formSub: {
        fontSize: 14,
        color: "#5a7a5d",
    },
    errorBox: {
        background: "#7f1d1d22",
        border: "1px solid #7f1d1d55",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        color: "#f87171",
        marginBottom: 18,
    },
    formGroup: { marginBottom: 18 },
    label: {
        display: "block",
        fontSize: 13,
        fontWeight: 600,
        color: "#9dbfa0",
        marginBottom: 7,
        fontFamily: "'Syne', sans-serif",
    },
    inputWrap: { position: "relative" },
    inputIcon: {
        position: "absolute",
        left: 13,
        top: "50%",
        transform: "translateY(-50%)",
        color: "#5a7a5d",
        pointerEvents: "none" as const,
    },
    input: {
        width: "100%",
        background: "#111812",
        border: "1px solid #2a3d2b",
        borderRadius: 10,
        padding: "11px 14px 11px 42px",
        color: "#e8f5e9",
        fontSize: 14,
        outline: "none",
    },
    eyeBtn: {
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        color: "#5a7a5d",
        cursor: "pointer",
        padding: 4,
        display: "flex",
        alignItems: "center",
    },
    submitBtn: {
        width: "100%",
        padding: "12px 20px",
        background: "#4ade80",
        color: "#0a0f0d",
        border: "none",
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        marginTop: 8,
        fontFamily: "'Syne', sans-serif",
        letterSpacing: 0.2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "background 0.18s ease",
    },
    hint: {
        marginTop: 24,
        fontSize: 12,
        color: "#3a5a3d",
        textAlign: "center" as const,
    },
};

export default LoginPage;