import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";

interface CV {
    id: string;
    candidateName: string;
    position: string;
    status: "pending" | "in-progress" | "completed" | "rejected";
    assignedTo?: string;
    assignedToName?: string;
    progress: number;
    createdAt: number;
    templateId?: string;
    templateName?: string;
}

interface JobsListProps {
    onNavigate: (page: string, id?: string) => void;
}

const STATUS_OPTIONS = ["all", "pending", "in-progress", "completed", "rejected"] as const;
type StatusFilter = typeof STATUS_OPTIONS[number];

const badgeClass: Record<string, string> = {
    pending: "badge badge-gray",
    "in-progress": "badge badge-amber",
    completed: "badge badge-green",
    rejected: "badge badge-red",
};

const badgeLabel: Record<string, string> = {
    pending: "Pending",
    "in-progress": "In Progress",
    completed: "Completed",
    rejected: "Rejected",
};

const PAGE_SIZE = 10;

const JobsList: React.FC<JobsListProps> = ({ onNavigate }) => {
    const { appUser } = useAuth();
    const isOwner = appUser?.role === "owner";

    const [cvs, setCvs] = useState<CV[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [page, setPage] = useState(1);

    useEffect(() => {
        const cvsRef = ref(db, "cvs");
        const unsub = onValue(cvsRef, snap => {
            const data = snap.val() || {};
            let list: CV[] = Object.entries(data).map(([id, val]) => ({
                id,
                ...(val as Omit<CV, "id">),
            }));

            // Employees only see their own CVs
            if (!isOwner && appUser?.uid) {
                list = list.filter(cv => cv.assignedTo === appUser.uid);
            }

            list.sort((a, b) => b.createdAt - a.createdAt);
            setCvs(list);
            setLoading(false);
        });
        return () => unsub();
    }, [isOwner, appUser]);

    // Reset to page 1 when filters change
    useEffect(() => { setPage(1); }, [search, status]);

    const filtered = cvs.filter(cv => {
        const q = search.toLowerCase();
        const matchSearch =
            cv.candidateName.toLowerCase().includes(q) ||
            cv.position.toLowerCase().includes(q) ||
            (cv.assignedToName || "").toLowerCase().includes(q);
        const matchStatus = status === "all" || cv.status === status;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const formatDate = (ts: number) =>
        new Date(ts).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });

    return (
        <div className="fade-up">
            {/* Header */}
            <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                    <h1 className="page-title">{isOwner ? "All CVs" : "My CVs"}</h1>
                    <p className="page-subtitle">
                        {isOwner
                            ? `${cvs.length} total candidates in the pipeline`
                            : `${cvs.length} CV${cvs.length !== 1 ? "s" : ""} assigned to you`}
                    </p>
                </div>
                {isOwner && (
                    <button className="btn btn-primary" onClick={() => onNavigate("new-job")}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add CV
                    </button>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }} className="fade-up-1">
                {/* Search */}
                <div style={{ position: "relative", flex: "1 1 240px" }}>
                    <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }}
                        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search candidate, position, employee…"
                        style={{ paddingLeft: 36, width: "100%" }}
                    />
                </div>

                {/* Status pills */}
                {STATUS_OPTIONS.map(s => (
                    <button
                        key={s}
                        className={`btn btn-sm ${status === s ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setStatus(s)}
                        style={{ textTransform: s === "all" ? "capitalize" : "none" }}
                    >
                        {s === "all" ? "All" : badgeLabel[s]}
                    </button>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 60 }}><span className="spinner" /></div>
            ) : paginated.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-state-icon">📋</div>
                    <h3>{search || status !== "all" ? "No results found" : "No CVs yet"}</h3>
                    <p>{search || status !== "all" ? "Try adjusting your search or filter." : "Add your first CV to start tracking."}</p>
                    {isOwner && !search && status === "all" && (
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate("new-job")}>
                            Add first CV
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="table-wrap fade-up-2">
                        <table>
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Position</th>
                                    {isOwner && <th>Assigned To</th>}
                                    <th>Template</th>
                                    <th>Progress</th>
                                    <th>Status</th>
                                    <th>Added</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(cv => (
                                    <tr key={cv.id} style={{ cursor: "pointer" }} onClick={() => onNavigate("job-detail", cv.id)}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: "var(--text)" }}>{cv.candidateName}</div>
                                        </td>
                                        <td>{cv.position}</td>
                                        {isOwner && (
                                            <td>
                                                {cv.assignedToName
                                                    ? <span style={{ color: "var(--text)" }}>{cv.assignedToName}</span>
                                                    : <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>Unassigned</span>
                                                }
                                            </td>
                                        )}
                                        <td>
                                            {cv.templateName
                                                ? <span className="tag">{cv.templateName}</span>
                                                : <span style={{ color: "var(--text-3)" }}>—</span>
                                            }
                                        </td>
                                        <td style={{ minWidth: 120 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div className="progress-bar" style={{ flex: 1 }}>
                                                    <div className="progress-fill" style={{ width: `${cv.progress || 0}%` }} />
                                                </div>
                                                <span style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap" }}>
                                                    {cv.progress || 0}%
                                                </span>
                                            </div>
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <span className={badgeClass[cv.status]}>{badgeLabel[cv.status]}</span>
                                        </td>
                                        <td style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap" }}>
                                            {formatDate(cv.createdAt)}
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate("job-detail", cv.id)}>
                                                View →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }} className="fade-up-3">
                            <span style={{ fontSize: 13, color: "var(--text-3)" }}>
                                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                            </span>
                            <div style={{ display: "flex", gap: 6 }}>
                                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`}
                                        onClick={() => setPage(p)}
                                        style={{ minWidth: 36 }}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default JobsList;