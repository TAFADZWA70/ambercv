import React, { useState, useEffect } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "../../firebase";

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt?: number;
}

const IconUsers = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

const EmployeesPage: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [cvCounts, setCvCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState<Employee | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", email: "", role: "employee" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const u1 = onValue(ref(db, "users"), snap => {
            const data = snap.val() || {};
            const list: Employee[] = Object.entries(data).map(([id, v]) => ({ id, ...(v as any) }));
            setEmployees(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
            setLoading(false);
        });
        const u2 = onValue(ref(db, "cvs"), snap => {
            const data = snap.val() || {};
            const counts: Record<string, number> = {};
            Object.values(data).forEach((cv: any) => {
                if (cv.assignedTo) counts[cv.assignedTo] = (counts[cv.assignedTo] || 0) + 1;
            });
            setCvCounts(counts);
        });
        return () => { u1(); u2(); };
    }, []);

    const openEdit = (emp: Employee) => {
        setEditModal(emp);
        setForm({ name: emp.name, email: emp.email, role: emp.role });
    };

    const handleSave = async () => {
        if (!editModal || !form.name.trim()) return;
        setSaving(true);
        await update(ref(db, `users/${editModal.id}`), { name: form.name.trim(), email: form.email.trim(), role: form.role });
        setSaving(false);
        setEditModal(null);
    };

    const handleDelete = async (id: string) => {
        await remove(ref(db, `users/${id}`));
        setDeleteConfirm(null);
    };

    const owners = employees.filter(e => e.role === "owner");
    const staff = employees.filter(e => e.role === "employee");

    const EmployeeRow = ({ emp }: { emp: Employee }) => (
        <tr>
            <td>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: emp.role === "owner"
                            ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                            : "linear-gradient(135deg, var(--green), var(--green-dim))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "#0a0f0d",
                        fontFamily: "var(--font-head)", flexShrink: 0,
                    }}>
                        {emp.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{emp.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-3)" }}>{emp.email}</div>
                    </div>
                </div>
            </td>
            <td>
                <span className={`badge ${emp.role === "owner" ? "badge-amber" : "badge-blue"}`} style={{ textTransform: "capitalize" }}>
                    {emp.role}
                </span>
            </td>
            <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18, color: "var(--text)" }}>
                        {cvCounts[emp.id] || 0}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>assigned</span>
                </div>
            </td>
            <td>
                <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-icon" onClick={() => openEdit(emp)} title="Edit"><IconEdit /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(emp.id)}>Remove</button>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="fade-up">
            <div className="page-header">
                <h1 className="page-title">Team Members</h1>
                <p className="page-subtitle">Manage your recruitment team and their access levels</p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 60 }}><span className="spinner" /></div>
            ) : (
                <>
                    <div className="stats-grid fade-up-1" style={{ marginBottom: 28 }}>
                        <div className="stat-card"><div className="stat-value">{employees.length}</div><div className="stat-label">Total members</div></div>
                        <div className="stat-card"><div className="stat-value">{staff.length}</div><div className="stat-label">Employees</div></div>
                        <div className="stat-card"><div className="stat-value">{owners.length}</div><div className="stat-label">Admins</div></div>
                    </div>

                    {staff.length > 0 && (
                        <>
                            <div className="section-header fade-up-2"><span className="section-title">Employees ({staff.length})</span></div>
                            <div className="table-wrap fade-up-2" style={{ marginBottom: 28 }}>
                                <table>
                                    <thead><tr><th>Member</th><th>Role</th><th>Workload</th><th>Actions</th></tr></thead>
                                    <tbody>{staff.map(e => <EmployeeRow key={e.id} emp={e} />)}</tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {owners.length > 0 && (
                        <>
                            <div className="section-header fade-up-3"><span className="section-title">Admins ({owners.length})</span></div>
                            <div className="table-wrap fade-up-3">
                                <table>
                                    <thead><tr><th>Member</th><th>Role</th><th>Workload</th><th>Actions</th></tr></thead>
                                    <tbody>{owners.map(e => <EmployeeRow key={e.id} emp={e} />)}</tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {employees.length === 0 && (
                        <div className="empty-state card">
                            <div style={{ color: "var(--text-3)", opacity: 0.4, marginBottom: 12, display: "flex", justifyContent: "center" }}><IconUsers /></div>
                            <h3>No team members yet</h3>
                            <p>Users appear here once they sign up to the platform.</p>
                        </div>
                    )}
                </>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div className="modal-overlay" onClick={() => setEditModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Member</h3>
                            <button className="btn-icon" onClick={() => setEditModal(null)}><IconClose /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                                    <option value="employee">Employee</option>
                                    <option value="owner">Owner / Admin</option>
                                </select>
                            </div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
                                    {saving ? "Saving…" : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3 className="modal-title">Remove Member?</h3></div>
                        <div className="modal-body">
                            <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 20 }}>
                                This will remove the member from the database. Their user account will remain but they will lose access to this system.
                            </p>
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeesPage;