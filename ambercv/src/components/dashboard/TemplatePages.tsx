import React, { useState, useEffect } from "react";
import { ref, onValue, push, update, remove } from "firebase/database";
import { db } from "../../firebase";

interface Template {
    id: string;
    name: string;
    description: string;
    sections: string[];
    createdAt: number;
}

const DEFAULT_SECTIONS = ["Personal Info", "Work Experience", "Education", "Skills", "References"];

const IconLayout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>;
const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconPlus = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;

const TemplatesPage: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Template | null>(null);
    const [form, setForm] = useState({ name: "", description: "", sections: DEFAULT_SECTIONS });
    const [newSection, setNewSection] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onValue(ref(db, "templates"), snap => {
            const data = snap.val() || {};
            const list: Template[] = Object.entries(data).map(([id, val]) => ({ id, ...(val as any) }));
            setTemplates(list.sort((a, b) => b.createdAt - a.createdAt));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: "", description: "", sections: [...DEFAULT_SECTIONS] });
        setShowForm(true);
    };

    const openEdit = (t: Template) => {
        setEditing(t);
        setForm({ name: t.name, description: t.description, sections: [...t.sections] });
        setShowForm(true);
    };

    const handleAddSection = () => {
        const s = newSection.trim();
        if (!s || form.sections.includes(s)) return;
        setForm(f => ({ ...f, sections: [...f.sections, s] }));
        setNewSection("");
    };

    const handleRemoveSection = (idx: number) => {
        setForm(f => ({ ...f, sections: f.sections.filter((_, i) => i !== idx) }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        const payload = { name: form.name.trim(), description: form.description.trim(), sections: form.sections, createdAt: Date.now() };
        if (editing) {
            await update(ref(db, `templates/${editing.id}`), payload);
        } else {
            await push(ref(db, "templates"), payload);
        }
        setSaving(false);
        setShowForm(false);
    };

    const handleDelete = async (id: string) => {
        await remove(ref(db, `templates/${id}`));
        setDeleteConfirm(null);
    };

    return (
        <div className="fade-up">
            <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                    <h1 className="page-title">CV Templates</h1>
                    <p className="page-subtitle">Create and manage reusable CV templates for your team</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <IconPlus /> New Template
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 60 }}><span className="spinner" /></div>
            ) : templates.length === 0 ? (
                <div className="empty-state card">
                    <div style={{ color: "var(--text-3)", opacity: 0.5, marginBottom: 12, display: "flex", justifyContent: "center" }}><IconLayout /></div>
                    <h3>No templates yet</h3>
                    <p>Create a template to standardise CV structure across your team.</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>Create first template</button>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }} className="fade-up-1">
                    {templates.map(t => (
                        <div key={t.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: "var(--green-glow)", border: "1px solid #4ade8030",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, color: "var(--green)",
                                    }}>
                                        <IconLayout />
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 3 }}>{t.name}</div>
                                        {t.description && <div style={{ fontSize: 12, color: "var(--text-3)" }}>{t.description}</div>}
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                                    <button className="btn-icon" onClick={() => openEdit(t)} title="Edit"><IconEdit /></button>
                                    <button className="btn-icon" style={{ color: "var(--red)" }} onClick={() => setDeleteConfirm(t.id)} title="Delete"><IconTrash /></button>
                                </div>
                            </div>

                            <div className="divider" style={{ margin: 0 }} />

                            <div>
                                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--text-3)", marginBottom: 8, fontFamily: "var(--font-head)", fontWeight: 600 }}>
                                    Sections ({t.sections.length})
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {t.sections.map((s, i) => <span key={i} className="tag">{s}</span>)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editing ? "Edit Template" : "New Template"}</h3>
                            <button className="btn-icon" onClick={() => setShowForm(false)}><IconClose /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Template Name *</label>
                                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Professional CV" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of when to use this template..." rows={2} />
                            </div>
                            <div className="form-group">
                                <label>Sections</label>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                                    {form.sections.map((s, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px" }}>
                                            <span style={{ fontSize: 11, color: "var(--text-3)", width: 20, textAlign: "center", fontFamily: "var(--font-head)", fontWeight: 700 }}>{i + 1}</span>
                                            <span style={{ flex: 1, fontSize: 14, color: "var(--text)" }}>{s}</span>
                                            <button onClick={() => handleRemoveSection(i)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 2, display: "flex" }}>
                                                <IconClose />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <input type="text" value={newSection} onChange={e => setNewSection(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddSection()} placeholder="Add a section..." style={{ flex: 1 }} />
                                    <button className="btn btn-secondary" onClick={handleAddSection}>Add</button>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
                                    {saving ? "Saving…" : editing ? "Save Changes" : "Create Template"}
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
                        <div className="modal-header">
                            <h3 className="modal-title">Delete Template?</h3>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 20 }}>This action cannot be undone. Any CVs using this template will keep their existing structure.</p>
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplatesPage;