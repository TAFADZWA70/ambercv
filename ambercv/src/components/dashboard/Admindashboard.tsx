import React, { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../../firebase";

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
}

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AdminDashboardProps {
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
    const [cvs, setCvs] = useState<CV[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignModal, setAssignModal] = useState<{ cv: CV } | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState("");

    useEffect(() => {
        const cvsRef = ref(db, "cvs");
        const unsub1 = onValue(cvsRef, snap => {
            const data = snap.val() || {};
            const list: CV[] = Object.entries(data).map(([id, val]) => ({ id, ...(val as any) }));
            setCvs(list.sort((a, b) => b.createdAt - a.createdAt));
            setLoading(false);
        });

        const empRef = ref(db, "users");
        const unsub2 = onValue(empRef, snap => {
            const data = snap.val() || {};
            const list: Employee[] = Object.entries(data)
                .map(([id, val]) => ({ id, ...(val as any) }))
                .filter((u: any) => u.role === "employee");
            setEmployees(list);
        });

        return () => { unsub1(); unsub2(); };
    }, []);

    const stats = {
        total: cvs.length,
        inProgress: cvs.filter(c => c.status === "in-progress").length,
        completed: cvs.filter(c => c.status === "completed").length,
        unassigned: cvs.filter(c => !c.assignedTo).length,
    };

    const handleAssign = async () => {
        if (!assignModal || !selectedEmployee) return;
        const emp = employees.find(e => e.id === selectedEmployee);
        await update(ref(db, `cvs/${assignModal.cv.id}`), {
            assignedTo: selectedEmployee,
            assignedToName: emp?.name || "",
            status: "in-progress",
        });
        setAssignModal(null);
        setSelectedEmployee("");
    };

    const recent = cvs.slice(0, 8);

    return (
        <div className="fade-up">
            <div className="page-header">
                <h1 className="page-title">Admin Dashboard</h1>
                <p className="page-subtitle">Overview of all recruitment activity</p>
            </div>

            {/* Stats */}
            <div className="stats-grid fade-up-1">
                <div className="stat-card" style={{ "--accent-color": "#4ade80" } as React.CSSProperties}>
                    <div className="stat-icon" style={{ background: "#4ade8025" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total CVs</div>
                    <div className="stat-delta">↑ All time</div>
                </div>
                <div className="stat-card" style={{ "--accent-color": "#fbbf24" } as React.CSSProperties}>
                    <div className="stat-icon" style={{ background: "#fbbf2425" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div className="stat-value">{stats.inProgress}</div>
                    <div className="stat-label">In Progress</div>
                    <div className="stat-delta" style={{ color: "#fbbf24" }}>Active</div>
                </div>
                <div className="stat-card" style={{ "--accent-color": "#60a5fa" } as React.CSSProperties}>
                    <div className="stat-icon" style={{ background: "#60a5fa25" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div className="stat-value">{stats.completed}</div>
                    <div className="stat-label">Completed</div>
                    <div className="stat-delta" style={{ color: "#60a5fa" }}>Done</div>
                </div>
                <div className="stat-card" style={{ "--accent-color": "#f87171" } as React.CSSProperties}>
                    <div className="stat-icon" style={{ background: "#f8717125" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <div className="stat-value">{stats.unassigned}</div>
                    <div className="stat-label">Unassigned</div>
                    <div className="stat-delta" style={{ color: "#f87171" }}>Needs action</div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="section-header fade-up-2">
                <span className="section-title">Quick Actions</span>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }} className="fade-up-2">
                <button className="btn btn-primary" onClick={() => onNavigate("new-job")}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Add New CV
                </button>
                <button className="btn btn-secondary" onClick={() => onNavigate("assign")}>
                    Assign CVs
                </button>
                <button className="btn btn-secondary" onClick={() => onNavigate("templates")}>
                    Manage Templates
                </button>
                <button className="btn btn-secondary" onClick={() => onNavigate("employees")}>
                    Manage Employees
                </button>
            </div>

            {/* Recent CVs table */}
            <div className="section-header fade-up-3">
                <span className="section-title">Recent CVs</span>
                <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("jobs")}>View all</button>
            </div>

            <div className="fade-up-3">
                {loading ? (
                    <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>
                ) : recent.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3>No CVs yet</h3>
                        <p>Add your first CV to get started</p>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Position</th>
                                    <th>Assigned To</th>
                                    <th>Progress</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map(cv => (
                                    <tr key={cv.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{cv.candidateName}</div>
                                        </td>
                                        <td>{cv.position}</td>
                                        <td>
                                            {cv.assignedToName
                                                ? <span style={{ color: "var(--text)" }}>{cv.assignedToName}</span>
                                                : <button className="btn btn-sm btn-ghost" onClick={() => { setAssignModal({ cv }); setSelectedEmployee(""); }}>
                                                    + Assign
                                                </button>
                                            }
                                        </td>
                                        <td style={{ minWidth: 120 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div className="progress-bar" style={{ flex: 1 }}>
                                                    <div className="progress-fill" style={{ width: `${cv.progress || 0}%` }} />
                                                </div>
                                                <span style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap" }}>{cv.progress || 0}%</span>
                                            </div>
                                        </td>
                                        <td><span className={statusBadge[cv.status]}>{statusLabel[cv.status]}</span></td>
                                        <td>
                                            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate("job-detail", cv.id)}>View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Assign Modal */}
            {assignModal && (
                <div className="modal-overlay" onClick={() => setAssignModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Assign CV</h3>
                            <button className="btn-icon" onClick={() => setAssignModal(null)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 18 }}>
                                Assign <strong style={{ color: "var(--text)" }}>{assignModal.cv.candidateName}</strong>'s CV to an employee.
                            </p>
                            <div className="form-group">
                                <label>Select Employee</label>
                                <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                                    <option value="">— Choose employee —</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                                <button className="btn btn-ghost" onClick={() => setAssignModal(null)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedEmployee}>Assign →</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;