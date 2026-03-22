import React, { useState, useEffect } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

interface Section {
    title: string;
    completed: boolean;
    notes: string;
}

interface CV {
    id: string;
    candidateName: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    status: "pending" | "in-progress" | "completed" | "rejected";
    assignedTo?: string;
    assignedToName?: string;
    templateId?: string;
    templateName?: string;
    progress: number;
    notes: string;
    priority: "low" | "normal" | "high";
    sections: Section[];
    createdAt: number;
    pdfBase64?: string;
    pdfName?: string;
    pdfSize?: number;
}

interface Employee {
    id: string;
    name: string;
}

interface JobDetailProps {
    jobId: string;
    onNavigate: (page: string, id?: string) => void;
}

const badgeClass: Record<string, string> = {
    pending: "badge badge-gray",
    "in-progress": "badge badge-amber",
    completed: "badge badge-green",
    rejected: "badge badge-red",
};

const priorityColor: Record<string, string> = {
    low: "#9dbfa0", normal: "var(--blue)", high: "var(--red)",
};

const JobDetail: React.FC<JobDetailProps> = ({ jobId, onNavigate }) => {
    const { appUser } = useAuth();
    const isOwner = appUser?.role === "owner";

    const [cv, setCv] = useState<CV | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);

    // Local editable state
    const [sections, setSections] = useState<Section[]>([]);
    const [generalNote, setGeneralNote] = useState("");
    const [editingNote, setEditingNote] = useState(false);
    const [assignTo, setAssignTo] = useState("");
    const [status, setStatus] = useState<CV["status"]>("pending");

    useEffect(() => {
        const unsub = onValue(ref(db, `cvs/${jobId}`), snap => {
            if (!snap.exists()) { setLoading(false); return; }
            const data: CV = { id: jobId, ...snap.val() };
            setCv(data);
            setSections(data.sections || []);
            setGeneralNote(data.notes || "");
            setAssignTo(data.assignedTo || "");
            setStatus(data.status);
            setLoading(false);
        });

        const u2 = onValue(ref(db, "users"), snap => {
            const data = snap.val() || {};
            const list: Employee[] = Object.entries(data)
                .map(([id, v]) => ({ id, ...(v as any) }))
                .filter((u: any) => u.role === "employee");
            setEmployees(list);
        });

        return () => { unsub(); u2(); };
    }, [jobId]);

    // Compute progress from sections
    const computeProgress = (secs: Section[]) =>
        secs.length === 0 ? 0 : Math.round((secs.filter(s => s.completed).length / secs.length) * 100);

    const handleToggleSection = async (idx: number) => {
        const updated = sections.map((s, i) =>
            i === idx ? { ...s, completed: !s.completed } : s
        );
        setSections(updated);
        const progress = computeProgress(updated);
        const newStatus: CV["status"] =
            progress === 100 ? "completed"
                : progress > 0 ? "in-progress"
                    : "pending";
        setStatus(newStatus);

        await update(ref(db, `cvs/${jobId}`), { sections: updated, progress, status: newStatus });
        toast.success("Progress updated");
    };

    const handleSectionNote = (idx: number, note: string) => {
        setSections(s => s.map((sec, i) => i === idx ? { ...sec, notes: note } : sec));
    };

    const handleSaveSectionNote = async (_idx: number) => {
        await update(ref(db, `cvs/${jobId}`), { sections });
        toast.success("Note saved");
    };

    const handleSaveGeneralNote = async () => {
        setSaving(true);
        await update(ref(db, `cvs/${jobId}`), { notes: generalNote });
        setSaving(false);
        setEditingNote(false);
        toast.success("Note saved");
    };

    const handleReassign = async () => {
        const emp = employees.find(e => e.id === assignTo);
        await update(ref(db, `cvs/${jobId}`), {
            assignedTo: assignTo || null,
            assignedToName: emp?.name || "",
            status: assignTo ? (status === "pending" ? "in-progress" : status) : "pending",
        });
        toast.success(assignTo ? `Reassigned to ${emp?.name}` : "Unassigned");
    };

    const handleStatusChange = async (newStatus: CV["status"]) => {
        setStatus(newStatus);
        await update(ref(db, `cvs/${jobId}`), { status: newStatus });
        toast.success("Status updated");
    };

    const handleDelete = async () => {
        await remove(ref(db, `cvs/${jobId}`));
        toast.success("CV deleted");
        onNavigate("jobs");
    };

    if (loading) return <div style={{ textAlign: "center", padding: 80 }}><span className="spinner lg" /></div>;
    if (!cv) return (
        <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>CV not found</h3>
            <p>It may have been deleted.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate("jobs")}>Back to CVs</button>
        </div>
    );

    const progress = computeProgress(sections);

    return (
        <div className="fade-up" style={{ maxWidth: 800 }}>
            {/* Back + header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button className="btn-icon" onClick={() => onNavigate("jobs")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                        </svg>
                    </button>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <h1 className="page-title" style={{ fontSize: 22 }}>{cv.candidateName}</h1>
                            <span className={badgeClass[status]}>{status.replace("-", " ")}</span>
                            {cv.priority && cv.priority !== "normal" && (
                                <span className="badge" style={{ background: `${priorityColor[cv.priority]}20`, color: priorityColor[cv.priority], border: `1px solid ${priorityColor[cv.priority]}40`, textTransform: "capitalize" }}>
                                    {cv.priority} priority
                                </span>
                            )}
                        </div>
                        <p className="page-subtitle">{cv.position}{cv.department ? ` · ${cv.department}` : ""}</p>
                    </div>
                </div>
                {isOwner && (
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteModal(true)}>Delete</button>
                    </div>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
                {/* Left column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Overall Progress */}
                    <div className="card fade-up-1">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <span className="section-title">Overall Progress</span>
                            <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 24, color: "var(--green)" }}>{progress}%</span>
                        </div>
                        <div className="progress-bar" style={{ height: 10 }}>
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                        {sections.length === 0 && (
                            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10 }}>No template sections. Progress tracked manually.</p>
                        )}
                    </div>

                    {/* Sections checklist */}
                    {sections.length > 0 && (
                        <div className="card fade-up-2">
                            <div className="section-title" style={{ marginBottom: 16 }}>
                                CV Sections
                                {cv.templateName && <span className="tag" style={{ marginLeft: 8, fontSize: 11 }}>{cv.templateName}</span>}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {sections.map((sec, idx) => (
                                    <div key={idx} style={{
                                        background: sec.completed ? "var(--green-glow)" : "var(--bg-3)",
                                        border: `1px solid ${sec.completed ? "#4ade8030" : "var(--border)"}`,
                                        borderRadius: 10,
                                        padding: "12px 14px",
                                        transition: "all 0.2s ease",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            {/* Checkbox */}
                                            <button
                                                onClick={() => handleToggleSection(idx)}
                                                style={{
                                                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                                    background: sec.completed ? "var(--green)" : "transparent",
                                                    border: `2px solid ${sec.completed ? "var(--green)" : "var(--border-2)"}`,
                                                    cursor: "pointer",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    transition: "all 0.15s ease",
                                                }}
                                            >
                                                {sec.completed && (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0f0d" strokeWidth="3" strokeLinecap="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </button>
                                            <span style={{
                                                flex: 1,
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: sec.completed ? "var(--text)" : "var(--text-2)",
                                                textDecoration: sec.completed ? "line-through" : "none",
                                                textDecorationColor: "var(--text-3)",
                                            }}>
                                                {sec.title}
                                            </span>
                                            <span style={{ fontSize: 11, color: sec.completed ? "var(--green)" : "var(--text-3)" }}>
                                                {sec.completed ? "Done" : "Pending"}
                                            </span>
                                        </div>
                                        {/* Section note */}
                                        <div style={{ marginTop: 8, paddingLeft: 32 }}>
                                            <input
                                                type="text"
                                                value={sec.notes}
                                                onChange={e => handleSectionNote(idx, e.target.value)}
                                                onBlur={() => handleSaveSectionNote(idx)}
                                                placeholder="Add a note for this section…"
                                                style={{ fontSize: 12, padding: "6px 10px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-2)", width: "100%", outline: "none" }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* General Notes */}
                    <div className="card fade-up-3">
                        <div className="section-header" style={{ marginBottom: 14 }}>
                            <span className="section-title">General Notes</span>
                            {!editingNote
                                ? <button className="btn btn-sm btn-ghost" onClick={() => setEditingNote(true)}>Edit</button>
                                : <div style={{ display: "flex", gap: 6 }}>
                                    <button className="btn btn-sm btn-ghost" onClick={() => { setEditingNote(false); setGeneralNote(cv.notes || ""); }}>Cancel</button>
                                    <button className="btn btn-sm btn-primary" onClick={handleSaveGeneralNote} disabled={saving}>
                                        {saving ? "Saving…" : "Save"}
                                    </button>
                                </div>
                            }
                        </div>
                        {editingNote
                            ? <textarea value={generalNote} onChange={e => setGeneralNote(e.target.value)} rows={5} placeholder="Add notes about this candidate…" />
                            : <p style={{ fontSize: 14, color: generalNote ? "var(--text-2)" : "var(--text-3)", lineHeight: 1.7, fontStyle: generalNote ? "normal" : "italic" }}>
                                {generalNote || "No notes yet. Click Edit to add notes."}
                            </p>
                        }
                    </div>

                    {/* PDF Document */}
                    {cv.pdfBase64 && (
                        <div className="card fade-up-4">
                            <div className="section-title" style={{ marginBottom: 14 }}>📄 CV Document</div>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 14,
                                background: "var(--bg-3)", border: "1px solid var(--border)",
                                borderRadius: 10, padding: "14px 16px", marginBottom: 14,
                            }}>
                                <div style={{ fontSize: 28 }}>📄</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {cv.pdfName || "CV Document.pdf"}
                                    </div>
                                    {cv.pdfSize && (
                                        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                                            {cv.pdfSize < 1024 * 1024
                                                ? `${(cv.pdfSize / 1024).toFixed(0)} KB`
                                                : `${(cv.pdfSize / (1024 * 1024)).toFixed(1)} MB`}
                                        </div>
                                    )}
                                </div>
                                <a
                                    href={`data:application/pdf;base64,${cv.pdfBase64}`}
                                    download={cv.pdfName || "cv.pdf"}
                                    className="btn btn-sm btn-primary"
                                    style={{ textDecoration: "none" }}
                                >
                                    ↓ Download
                                </a>
                            </div>
                            {/* Inline PDF preview */}
                            <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                                <iframe
                                    src={`data:application/pdf;base64,${cv.pdfBase64}`}
                                    width="100%"
                                    height="500px"
                                    style={{ display: "block", border: "none", background: "#fff" }}
                                    title="CV Document Preview"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Candidate Info */}
                    <div className="card fade-up-1">
                        <div className="section-title" style={{ marginBottom: 14 }}>Candidate</div>
                        {[
                            { label: "Email", val: cv.email, icon: "✉️" },
                            { label: "Phone", val: cv.phone, icon: "📞" },
                            { label: "Added", val: new Date(cv.createdAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }), icon: "📅" },
                        ].map(({ label, val, icon }) => val ? (
                            <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                                <span style={{ fontSize: 14 }}>{icon}</span>
                                <div>
                                    <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 }}>{label}</div>
                                    <div style={{ fontSize: 13, color: "var(--text-2)" }}>{val}</div>
                                </div>
                            </div>
                        ) : null)}
                    </div>

                    {/* Status control (owner only) */}
                    {isOwner && (
                        <div className="card fade-up-2">
                            <div className="section-title" style={{ marginBottom: 14 }}>Status</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {(["pending", "in-progress", "completed", "rejected"] as CV["status"][]).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        style={{
                                            padding: "9px 14px",
                                            borderRadius: 8,
                                            border: `1px solid ${status === s ? "var(--green)" : "var(--border)"}`,
                                            background: status === s ? "var(--green-glow)" : "var(--bg-3)",
                                            color: status === s ? "var(--green)" : "var(--text-2)",
                                            fontSize: 13,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            textAlign: "left",
                                            fontFamily: "var(--font-body)",
                                            transition: "all 0.15s ease",
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {s.replace("-", " ")}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assignment (owner only) */}
                    {isOwner && (
                        <div className="card fade-up-3">
                            <div className="section-title" style={{ marginBottom: 14 }}>Assignment</div>
                            {cv.assignedToName && (
                                <div style={{ fontSize: 13, color: "var(--green)", marginBottom: 10, fontWeight: 600 }}>
                                    Currently: {cv.assignedToName}
                                </div>
                            )}
                            <select value={assignTo} onChange={e => setAssignTo(e.target.value)} style={{ marginBottom: 10 }}>
                                <option value="">— Unassigned —</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleReassign}>
                                {assignTo ? "Assign / Reassign" : "Remove Assignment"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {deleteModal && (
                <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
                    <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Delete CV?</h3>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 20 }}>
                                Are you sure you want to permanently delete <strong style={{ color: "var(--text)" }}>{cv.candidateName}</strong>'s CV? This cannot be undone.
                            </p>
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button className="btn btn-ghost" onClick={() => setDeleteModal(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDetail;