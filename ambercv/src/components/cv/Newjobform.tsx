import React, { useState, useEffect, useRef } from "react";
import { ref, push, onValue } from "firebase/database";
import { db } from "../../firebase";
import toast from "react-hot-toast";

interface Employee {
    id: string;
    name: string;
}

interface Template {
    id: string;
    name: string;
    sections: string[];
}

interface NewJobFormProps {
    onNavigate: (page: string, id?: string) => void;
}

const MAX_PDF_MB = 7;

const NewJobForm: React.FC<NewJobFormProps> = ({ onNavigate }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [saving, setSaving] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfError, setPdfError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        candidateName: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        assignedTo: "",
        templateId: "",
        notes: "",
        priority: "normal" as "low" | "normal" | "high",
    });

    const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

    useEffect(() => {
        const u1 = onValue(ref(db, "users"), snap => {
            const data = snap.val() || {};
            const list: Employee[] = Object.entries(data)
                .map(([id, v]) => ({ id, ...(v as any) }))
                .filter((u: any) => u.role === "employee");
            setEmployees(list);
        });
        const u2 = onValue(ref(db, "templates"), snap => {
            const data = snap.val() || {};
            const list: Template[] = Object.entries(data).map(([id, v]) => ({ id, ...(v as any) }));
            setTemplates(list);
        });
        return () => { u1(); u2(); };
    }, []);

    const handleField = (field: keyof typeof form) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
        setErrors(err => ({ ...err, [field]: undefined }));
    };

    // ── PDF handling ──────────────────────────────────────────────────────────

    const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setPdfError("");
        if (!file) return;

        if (file.type !== "application/pdf") {
            setPdfError("Only PDF files are accepted.");
            return;
        }
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > MAX_PDF_MB) {
            setPdfError(`PDF is too large (${sizeMB.toFixed(1)} MB). Maximum is ${MAX_PDF_MB} MB.`);
            return;
        }
        setPdfFile(file);
    };

    const handlePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        // Simulate input change
        const dt = new DataTransfer();
        dt.items.add(file);
        if (fileInputRef.current) {
            fileInputRef.current.files = dt.files;
            handlePdfSelect({ target: fileInputRef.current } as any);
        } else {
            setPdfFile(file);
        }
    };

    // Convert file to Base64 string with simulated progress
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    setUploadProgress(Math.round((e.loaded / e.total) * 90));
                }
            };
            reader.onload = () => {
                setUploadProgress(100);
                const base64 = (reader.result as string).split(",")[1]; // strip data:...;base64,
                resolve(base64);
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    };

    // ── Validation ────────────────────────────────────────────────────────────

    const validate = (): boolean => {
        const errs: typeof errors = {};
        if (!form.candidateName.trim()) errs.candidateName = "Candidate name is required";
        if (!form.position.trim()) errs.position = "Position is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        setUploadProgress(0);

        try {
            let pdfBase64: string | null = null;
            let pdfName: string | null = null;
            let pdfSize: number | null = null;

            if (pdfFile) {
                toast.loading("Encoding PDF…", { id: "pdf-upload" });
                pdfBase64 = await fileToBase64(pdfFile);
                pdfName = pdfFile.name;
                pdfSize = pdfFile.size;
                toast.success("PDF ready", { id: "pdf-upload" });
            }

            const selectedTemplate = templates.find(t => t.id === form.templateId);
            const selectedEmployee = employees.find(e => e.id === form.assignedTo);

            const payload = {
                candidateName: form.candidateName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                position: form.position.trim(),
                department: form.department.trim(),
                assignedTo: form.assignedTo || null,
                assignedToName: selectedEmployee?.name || "",
                templateId: form.templateId || null,
                templateName: selectedTemplate?.name || "",
                notes: form.notes.trim(),
                priority: form.priority,
                status: form.assignedTo ? "in-progress" : "pending",
                progress: 0,
                createdAt: Date.now(),
                // PDF stored as Base64 in Realtime Database
                pdfBase64: pdfBase64,
                pdfName: pdfName,
                pdfSize: pdfSize,
                sections: selectedTemplate
                    ? selectedTemplate.sections.map(s => ({ title: s, completed: false, notes: "" }))
                    : [],
            };

            const newRef = await push(ref(db, "cvs"), payload);
            toast.success("CV added successfully!");
            onNavigate("job-detail", newRef.key!);
        } catch (err) {
            toast.error("Failed to save CV. Please try again.");
        } finally {
            setSaving(false);
            setUploadProgress(0);
        }
    };

    const priorityColors: Record<string, string> = {
        low: "#9dbfa0", normal: "var(--blue)", high: "var(--red)",
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="fade-up" style={{ maxWidth: 720 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <button className="btn-icon" onClick={() => onNavigate("jobs")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                </button>
                <div>
                    <h1 className="page-title">Add New CV</h1>
                    <p className="page-subtitle">Enter candidate details and attach their CV document</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>

                {/* ── Candidate Info ── */}
                <div className="card fade-up-1" style={{ marginBottom: 16 }}>
                    <div className="section-title" style={{ marginBottom: 18 }}>👤 Candidate Information</div>
                    <div className="form-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Full Name *</label>
                            <input
                                type="text"
                                value={form.candidateName}
                                onChange={handleField("candidateName")}
                                placeholder="e.g. John Doe"
                                style={errors.candidateName ? { borderColor: "var(--red)" } : {}}
                            />
                            {errors.candidateName && <span style={{ fontSize: 12, color: "var(--red)", marginTop: 4, display: "block" }}>{errors.candidateName}</span>}
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Email Address</label>
                            <input type="email" value={form.email} onChange={handleField("email")} placeholder="candidate@email.com" />
                        </div>
                    </div>
                    <div className="form-row" style={{ marginTop: 16 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Phone Number</label>
                            <input type="text" value={form.phone} onChange={handleField("phone")} placeholder="+27 00 000 0000" />
                        </div>
                        <div />
                    </div>
                </div>

                {/* ── Role Info ── */}
                <div className="card fade-up-2" style={{ marginBottom: 16 }}>
                    <div className="section-title" style={{ marginBottom: 18 }}>💼 Role Details</div>
                    <div className="form-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Position Applied For *</label>
                            <input
                                type="text"
                                value={form.position}
                                onChange={handleField("position")}
                                placeholder="e.g. Senior Developer"
                                style={errors.position ? { borderColor: "var(--red)" } : {}}
                            />
                            {errors.position && <span style={{ fontSize: 12, color: "var(--red)", marginTop: 4, display: "block" }}>{errors.position}</span>}
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Department</label>
                            <input type="text" value={form.department} onChange={handleField("department")} placeholder="e.g. Engineering" />
                        </div>
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <label>Priority</label>
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            {(["low", "normal", "high"] as const).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                                    style={{
                                        padding: "8px 18px", borderRadius: 8, cursor: "pointer",
                                        border: `1px solid ${form.priority === p ? priorityColors[p] : "var(--border)"}`,
                                        background: form.priority === p ? `${priorityColors[p]}20` : "var(--bg-3)",
                                        color: form.priority === p ? priorityColors[p] : "var(--text-3)",
                                        fontWeight: 600, fontSize: 13, textTransform: "capitalize",
                                        fontFamily: "var(--font-body)", transition: "all 0.15s ease",
                                    }}
                                >{p}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── PDF Upload ── */}
                <div className="card fade-up-3" style={{ marginBottom: 16 }}>
                    <div className="section-title" style={{ marginBottom: 6 }}>📄 CV Document (PDF)</div>
                    <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>
                        Upload the candidate's CV as a PDF. Max {MAX_PDF_MB} MB. Stored securely in the database.
                    </p>

                    {!pdfFile ? (
                        <div
                            onDragOver={e => e.preventDefault()}
                            onDrop={handlePdfDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: "2px dashed var(--border-2)",
                                borderRadius: 12,
                                padding: "36px 24px",
                                textAlign: "center",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                background: "var(--bg-3)",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--green)")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-2)")}
                        >
                            <div style={{ fontSize: 32, marginBottom: 10 }}>📎</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>
                                Drop PDF here or click to browse
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-3)" }}>PDF only · Max {MAX_PDF_MB} MB</div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                onChange={handlePdfSelect}
                                style={{ display: "none" }}
                            />
                        </div>
                    ) : (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 14,
                            background: "var(--green-glow)", border: "1px solid #4ade8030",
                            borderRadius: 12, padding: "14px 18px",
                        }}>
                            <div style={{ fontSize: 28 }}>📄</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {pdfFile.name}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                                    {formatSize(pdfFile.size)}
                                </div>
                                {saving && uploadProgress > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>Encoding… {uploadProgress}%</div>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                className="btn-icon"
                                onClick={() => { setPdfFile(null); setPdfError(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {pdfError && (
                        <div style={{ marginTop: 10, fontSize: 13, color: "var(--red)" }}>⚠️ {pdfError}</div>
                    )}
                </div>

                {/* ── Assignment & Template ── */}
                <div className="card fade-up-3" style={{ marginBottom: 16 }}>
                    <div className="section-title" style={{ marginBottom: 18 }}>⚙️ Assignment & Template</div>
                    <div className="form-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Assign to Employee</label>
                            <select value={form.assignedTo} onChange={handleField("assignedTo")}>
                                <option value="">— Leave unassigned —</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>CV Template</label>
                            <select value={form.templateId} onChange={handleField("templateId")}>
                                <option value="">— No template —</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            {form.templateId && (
                                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>
                                    Sections: {templates.find(t => t.id === form.templateId)?.sections.join(" · ")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Notes ── */}
                <div className="card fade-up-4" style={{ marginBottom: 24 }}>
                    <div className="section-title" style={{ marginBottom: 14 }}>📝 Initial Notes</div>
                    <textarea
                        value={form.notes}
                        onChange={handleField("notes")}
                        placeholder="Any initial notes about this candidate or the recruitment process…"
                        rows={4}
                    />
                </div>

                {/* ── Actions ── */}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }} className="fade-up-4">
                    <button type="button" className="btn btn-ghost" onClick={() => onNavigate("jobs")}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving || !!pdfError}>
                        {saving
                            ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</>
                            : "Add CV →"
                        }
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewJobForm;