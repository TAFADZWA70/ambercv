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
    draft?: string;
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

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onNavigate }) => {
    const { appUser } = useAuth();
    const [cvs, setCvs] = useState<CV[]>([]);
    const [loading, setLoading] = useState(true);
    const [progressModal, setProgressModal] = useState<CV | null>(null);
    const [newProgress, setNewProgress] = useState(0);
    const [newNote, setNewNote] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!appUser?.uid) return;
        const cvsRef = ref(db, "cvs");
        const unsub = onValue(cvsRef, snap => {
            const data = snap.val() || {};
            const list: CV[] = Object.entries(data)
                .map(([id, val]) => ({ id, ...(val as any) }))
                .filter((cv: any) => cv.assignedTo === appUser.uid)
                .sort((a: any, b: any) => b.createdAt - a.createdAt);
            setCvs(list);
            setLoading(false);
        });
        return () => unsub();
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
                <p className="page-subtitle">Welcome back, {appUser?.name || "Employee"} 👋</p>
            </div>

            {/* Stats */}
            <div className="stats-grid fade-up-1">
                <div className="stat-card" style={{ "--accent-color": "#4ade80" } as React.CSSProperties}>
                    <div className="stat-icon" style={{ background: "#4ade8025" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8z" /></svg>
                    </div>
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Assigned CVs</div>
                </div>
                <div className="stat-card" style={{ "--accent-color": "#fbbf24" } as React.CSSProperties}>
                    <div className="stat-icon" style={{ background: "#fbbf2425" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div className="stat-value">{stats.inProgress}</div>
                    <div className="stat-label">In Progress</div>
                </div>
                <div className="stat-card" style={{ "--accent-color": "#60a5fa" } as React.CSSProperties}>
                    <div className="stat-icon" style={{ background: "#60a5fa25" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div className="stat-value">{stats.completed}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card" style={{ "--accent-color": "#a78bfa" } as React.CSSProperties}>
                    <div className="stat-icon" style={{ background: "#a78bfa25" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                    </div>
                    <div className="stat-value">{stats.avgProgress}%</div>
                    <div className="stat-label">Avg Progress</div>
                </div>
            </div>

            {/* CV List */}
            <div className="section-header fade-up-2">
                <span className="section-title">My Assigned CVs</span>
                <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("jobs")}>View all</button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 48 }}><span className="spinner" /></div>
            ) : cvs.length === 0 ? (
                <div className="empty-state fade-up-2">
                    <div className="empty-state-icon">📭</div>
                    <h3>No CVs assigned yet</h3>
                    <p>Your manager will assign CVs to you shortly.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="fade-up-2">
                    {cvs.map(cv => (
                        <div key={cv.id} className="card" style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 24px" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
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
                                        Note: {cv.notes}
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

            {/* Progress Modal */}
            {progressModal && (
                <div className="modal-overlay" onClick={() => setProgressModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Update Progress</h3>
                            <button className="btn-icon" onClick={() => setProgressModal(null)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 20 }}>{progressModal.candidateName}</p>

                            <div className="form-group">
                                <label>Progress: {newProgress}%</label>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
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
        </div>
    );
};

export default EmployeeDashboard;