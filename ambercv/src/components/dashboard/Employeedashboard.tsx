import React, { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";

interface CV {
    id: string;
    candidateName: string;
    position: string;
    status: "pending" | "in-progress" | "completed" | "rejected";
    assignedTo: string;
    progress: number;
    createdAt: number;
    notes?: string;
}

interface Template {
    id: string;
    name: string;
    description: string;
    sections: string[];
    createdAt: number;
}

interface EmployeeDashboardProps {
    onNavigate: (page: string, id?: string) => void;
}

const statusBadge: Record<string, string> = {
    pending: "badge badge-gray",
    "in-progress": "badge badge-amber",
    completed: "badge badge-green",
    rejected: "badge badge-red",
};

const statusLabel: Record<string, string> = {
    pending: "Pending",
    "in-progress": "In Progress",
    completed: "Completed",
    rejected: "Rejected",
};

// Icon components — no emojis
const IconFile = ({ color = "currentColor" }: { color?: string }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
const IconClock = ({ color = "currentColor" }: { color?: string }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const IconCheck = ({ color = "currentColor" }: { color?: string }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconBar = ({ color = "currentColor" }: { color?: string }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconLayout = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>;
const IconInbox = () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>;

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onNavigate }) => {
    const { appUser } = useAuth();
    const [cvs, setCvs] = useState<CV[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [progressModal, setProgressModal] = useState<CV | null>(null);
    const [newProgress, setNewProgress] = useState(0);
    const [newNote, setNewNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [templateModal, setTemplateModal] = useState<Template | null>(null);

    useEffect(() => {
        if (!appUser?.uid) return;

        const u1 = onValue(ref(db, "cvs"), snap => {
            const data = snap.val() || {};
            const list: CV[] = Object.entries(data)
                .map(([id, val]) => ({ id, ...(val as any) }))
                .filter((cv: any) => cv.assignedTo === appUser.uid)
                .sort((a: any, b: any) => b.createdAt - a.createdAt);
            setCvs(list);
            setLoading(false);
        });

        const u2 = onValue(ref(db, "templates"), snap => {
            const data = snap.val() || {};
            const list: Template[] = Object.entries(data)
                .map(([id, val]) => ({ id, ...(val as any) }))
                .sort((a: any, b: any) => b.createdAt - a.createdAt);
            setTemplates(list);
        });

        return () => { u1(); u2(); };
    }, [appUser]);

    const stats = {
        total: cvs.length,
        inProgress: cvs.filter(c => c.status === "in-progress").length,
        completed: cvs.filter(c => c.status === "completed").length,
        avgProgress: cvs.length
            ? Math.round(cvs.reduce((s, c) => s + (c.progress || 0), 0) / cvs.length)
            : 0,
    };

    const openProgress = (cv: CV) => {
        setProgressModal(cv);
        setNewProgress(cv.progress || 0);
        setNewNote(cv.notes || "");
    };

    const handleSaveProgress = async () => {
        if (!progressModal) return;
        setSaving(true);
        const status = newProgress === 100 ? "completed" : "in-progress";
        await update(ref(db, `cvs/${progressModal.id}`), {
            progress: newProgress,
            notes: newNote,
            status,
        });
        setSaving(false);
        setProgressModal(null);
    };

    return (
        <div className="fade-up">
            <div className="page-header">
                <h1 className="page-title">My Dashboard</h1>
                <p className="page-subtitle">Welcome back, {appUser?.name || "Employee"}</p>
            </div>

            {/* Stats */}
            <div className="stats-grid fade-up-1">
                {[
                    { color: "#4ade80", bg: "#4ade8025", Icon: () => <IconFile color="#4ade80" />, value: stats.total, label: "Assigned CVs" },
                    { color: "#fbbf24", bg: "#fbbf2425", Icon: () => <IconClock color="#fbbf24" />, value: stats.inProgress, label: "In Progress" },
                    { color: "#60a5fa", bg: "#60a5fa25", Icon: () => <IconCheck color="#60a5fa" />, value: stats.completed, label: "Completed" },
                    { color: "#a78bfa", bg: "#a78bfa25", Icon: () => <IconBar color="#a78bfa" />, value: `${stats.avgProgress}%`, label: "Avg Progress" },
                ].map(({ color, bg, Icon, value, label }) => (
                    <div key={label} className="stat-card" style={{ "--accent-color": color } as React.CSSProperties}>
                        <div className="stat-icon" style={{ background: bg, opacity: 1 }}>
                            <Icon />
                        </div>
                        <div className="stat-value">{value}</div>
                        <div className="stat-label">{label}</div>
                    </div>
                ))}
            </div>

            {/* My Assigned CVs */}
            <div className="section-header fade-up-2">
                <span className="section-title">My Assigned CVs</span>
                <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("jobs")}>View all</button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 48 }}><span className="spinner" /></div>
            ) : cvs.length === 0 ? (
                <div className="empty-state card fade-up-2">
                    <div style={{ color: "var(--text-3)", marginBottom: 12, opacity: 0.5 }}><IconInbox /></div>
                    <h3>No CVs assigned yet</h3>
                    <p>Your manager will assign CVs to you shortly.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="fade-up-2">
                    {cvs.map(cv => (
                        <div key={cv.id} className="card" style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 24px" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                                    <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 15 }}>{cv.candidateName}</span>
                                    <span className={statusBadge[cv.status]}>{statusLabel[cv.status]}</span>
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>{cv.position}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div className="progress-bar" style={{ flex: 1, maxWidth: 260 }}>
                                        <div className="progress-fill" style={{ width: `${cv.progress || 0}%` }} />
                                    </div>
                                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{cv.progress || 0}%</span>
                                </div>
                                {cv.notes && (
                                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8, fontStyle: "italic" }}>
                                        {cv.notes}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                <button className="btn btn-sm btn-ghost" onClick={() => onNavigate("job-detail", cv.id)}>Details</button>
                                <button className="btn btn-sm btn-primary" onClick={() => openProgress(cv)}>Update</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Templates from owner */}
            <div className="section-header fade-up-3" style={{ marginTop: 36 }}>
                <span className="section-title">CV Templates</span>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>Uploaded by your manager</span>
            </div>

            {templates.length === 0 ? (
                <div className="card fade-up-3" style={{ padding: "28px 24px", textAlign: "center" }}>
                    <div style={{ color: "var(--text-3)", marginBottom: 8, display: "flex", justifyContent: "center" }}><IconLayout /></div>
                    <p style={{ fontSize: 13, color: "var(--text-3)" }}>No templates have been created yet.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }} className="fade-up-3">
                    {templates.map(t => (
                        <div key={t.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }}
                            onClick={() => setTemplateModal(t)}>
                            {/* Header */}
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: "var(--green-glow)", border: "1px solid #4ade8030",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0, color: "var(--green)",
                                }}>
                                    <IconLayout />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 3 }}>{t.name}</div>
                                    {t.description && (
                                        <div style={{ fontSize: 12, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</div>
                                    )}
                                </div>
                            </div>

                            <div className="divider" style={{ margin: 0 }} />

                            {/* Sections preview */}
                            <div>
                                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--text-3)", marginBottom: 8, fontFamily: "var(--font-head)", fontWeight: 600 }}>
                                    {t.sections.length} Section{t.sections.length !== 1 ? "s" : ""}
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                    {t.sections.slice(0, 4).map((s, i) => (
                                        <span key={i} className="tag" style={{ fontSize: 11 }}>{s}</span>
                                    ))}
                                    {t.sections.length > 4 && (
                                        <span className="tag" style={{ fontSize: 11, color: "var(--text-3)" }}>+{t.sections.length - 4} more</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 500, marginTop: 2 }}>
                                View details →
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Progress Modal */}
            {progressModal && (
                <div className="modal-overlay" onClick={() => setProgressModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Update Progress</h3>
                            <button className="btn-icon" onClick={() => setProgressModal(null)}><IconClose /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 20 }}>{progressModal.candidateName}</p>
                            <div className="form-group">
                                <label>Progress: {newProgress}%</label>
                                <input
                                    type="range" min={0} max={100} step={5}
                                    value={newProgress}
                                    onChange={e => setNewProgress(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--green)", cursor: "pointer" }}
                                />
                                <div className="progress-bar" style={{ marginTop: 10 }}>
                                    <div className="progress-fill" style={{ width: `${newProgress}%` }} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notes / Update</label>
                                <textarea
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                    placeholder="Add any notes about the progress of this CV..."
                                    rows={3}
                                />
                            </div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button className="btn btn-ghost" onClick={() => setProgressModal(null)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSaveProgress} disabled={saving}>
                                    {saving ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : "Save Progress"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Template detail modal */}
            {templateModal && (
                <div className="modal-overlay" onClick={() => setTemplateModal(null)}>
                    <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{templateModal.name}</h3>
                            <button className="btn-icon" onClick={() => setTemplateModal(null)}><IconClose /></button>
                        </div>
                        <div className="modal-body">
                            {templateModal.description && (
                                <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 20, lineHeight: 1.6 }}>{templateModal.description}</p>
                            )}
                            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--text-3)", marginBottom: 12, fontFamily: "var(--font-head)", fontWeight: 600 }}>
                                All Sections ({templateModal.sections.length})
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {templateModal.sections.map((s, i) => (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "10px 14px",
                                        background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 8,
                                    }}>
                                        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-head)", fontWeight: 700, width: 20, textAlign: "center" }}>{i + 1}</span>
                                        <span style={{ fontSize: 14, color: "var(--text-2)" }}>{s}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                                <button className="btn btn-ghost" onClick={() => setTemplateModal(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;