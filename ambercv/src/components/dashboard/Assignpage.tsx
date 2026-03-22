import React, { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../../firebase";

interface CV {
    id: string;
    candidateName: string;
    position: string;
    status: string;
    assignedTo?: string;
    assignedToName?: string;
    progress: number;
}

interface Employee {
    id: string;
    name: string;
    email: string;
}

const AssignPage: React.FC = () => {
    const [cvs, setCvs] = useState<CV[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unassigned" | "assigned">("unassigned");
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [assignments, setAssignments] = useState<Record<string, string>>({});

    useEffect(() => {
        const unsub1 = onValue(ref(db, "cvs"), snap => {
            const data = snap.val() || {};
            const list: CV[] = Object.entries(data).map(([id, v]) => ({ id, ...(v as any) }));
            setCvs(list);
            const init: Record<string, string> = {};
            list.forEach(c => { if (c.assignedTo) init[c.id] = c.assignedTo; });
            setAssignments(init);
            setLoading(false);
        });
        const unsub2 = onValue(ref(db, "users"), snap => {
            const data = snap.val() || {};
            const list: Employee[] = Object.entries(data)
                .map(([id, v]) => ({ id, ...(v as any) }))
                .filter((u: any) => u.role === "employee");
            setEmployees(list);
        });
        return () => { unsub1(); unsub2(); };
    }, []);

    const filtered = cvs.filter(cv => {
        const matchSearch = cv.candidateName.toLowerCase().includes(search.toLowerCase()) ||
            cv.position.toLowerCase().includes(search.toLowerCase());
        if (!matchSearch) return false;
        if (filter === "unassigned") return !cv.assignedTo;
        if (filter === "assigned") return !!cv.assignedTo;
        return true;
    });

    const handleAssign = async (cvId: string, employeeId: string) => {
        setSaving(s => ({ ...s, [cvId]: true }));
        const emp = employees.find(e => e.id === employeeId);
        await update(ref(db, `cvs/${cvId}`), {
            assignedTo: employeeId || null,
            assignedToName: emp?.name || "",
            status: employeeId ? "in-progress" : "pending",
        });
        setSaving(s => ({ ...s, [cvId]: false }));
    };

    const empCounts = employees.map(e => ({
        ...e,
        count: cvs.filter(c => c.assignedTo === e.id).length,
    }));

    return (
        <div className="fade-up">
            <div className="page-header">
                <h1 className="page-title">Assign CVs</h1>
                <p className="page-subtitle">Distribute CVs across your team and track workload</p>
            </div>

            {/* Team workload summary */}
            <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }} className="fade-up-1">
                {empCounts.map(e => (
                    <div key={e.id} className="card-sm" style={{ minWidth: 160, flex: "1 1 160px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: "linear-gradient(135deg, var(--green), var(--green-dim))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontWeight: 700, color: "#0a0f0d", fontFamily: "var(--font-head)",
                            }}>
                                {e.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{e.name}</div>
                                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{e.count} CV{e.count !== 1 ? "s" : ""}</div>
                            </div>
                        </div>
                        <div className="progress-bar" style={{ marginTop: 10 }}>
                            <div className="progress-fill" style={{ width: `${Math.min((e.count / 10) * 100, 100)}%`, background: e.count > 7 ? "var(--red)" : undefined }} />
                        </div>
                    </div>
                ))}
                {empCounts.length === 0 && (
                    <div style={{ fontSize: 13, color: "var(--text-3)", padding: "12px 0" }}>No employees found. Add employees first.</div>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }} className="fade-up-2">
                <div style={{ position: "relative", flex: "1 1 220px" }}>
                    <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search candidate or position..."
                        style={{ paddingLeft: 36, width: "100%" }}
                    />
                </div>
                {(["all", "unassigned", "assigned"] as const).map(f => (
                    <button key={f} className={`btn ${filter === f ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilter(f)} style={{ textTransform: "capitalize" }}>
                        {f} {f !== "all" && <span className="nav-badge" style={{ background: f === "unassigned" ? "#f87171" : "var(--green)", marginLeft: 4 }}>
                            {f === "unassigned" ? cvs.filter(c => !c.assignedTo).length : cvs.filter(c => !!c.assignedTo).length}
                        </span>}
                    </button>
                ))}
            </div>

            {/* CV list */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 48 }}><span className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-state-icon">🔍</div>
                    <h3>No CVs found</h3>
                    <p>Try a different filter or search term.</p>
                </div>
            ) : (
                <div className="table-wrap fade-up-2">
                    <table>
                        <thead>
                            <tr>
                                <th>Candidate</th>
                                <th>Position</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th style={{ minWidth: 200 }}>Assigned Employee</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(cv => (
                                <tr key={cv.id}>
                                    <td style={{ fontWeight: 600, color: "var(--text)" }}>{cv.candidateName}</td>
                                    <td>{cv.position}</td>
                                    <td>
                                        <span className={`badge ${cv.assignedTo ? "badge-amber" : "badge-gray"}`}>
                                            {cv.assignedTo ? "Assigned" : "Unassigned"}
                                        </span>
                                    </td>
                                    <td style={{ minWidth: 100 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div className="progress-bar" style={{ flex: 1 }}>
                                                <div className="progress-fill" style={{ width: `${cv.progress || 0}%` }} />
                                            </div>
                                            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{cv.progress || 0}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <select
                                            value={assignments[cv.id] || ""}
                                            onChange={e => {
                                                setAssignments(a => ({ ...a, [cv.id]: e.target.value }));
                                                handleAssign(cv.id, e.target.value);
                                            }}
                                            style={{ width: "100%", padding: "8px 12px" }}
                                        >
                                            <option value="">— Unassigned —</option>
                                            {employees.map(e => (
                                                <option key={e.id} value={e.id}>{e.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        {saving[cv.id] && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AssignPage;