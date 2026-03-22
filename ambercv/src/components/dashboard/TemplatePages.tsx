import React, { useState, useEffect, useRef } from "react";
import { ref, onValue, push, remove } from "firebase/database";
import { db } from "../../firebase";
import toast from "react-hot-toast";

interface Template {
    id: string;
    name: "CV Creation" | "CV Revamp";
    fileName: string;
    fileType: string;
    fileSize: number;
    fileBase64: string;
    uploadedAt: number;
}

const MAX_FILE_MB = 7;

const IconLayout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>;
const IconFile = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconPlus = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IconDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const IconUpload = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;

const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });

const TemplatesPage: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [selectedName, setSelectedName] = useState<"CV Creation" | "CV Revamp">("CV Creation");
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState("");
    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsub = onValue(ref(db, "templates"), snap => {
            const data = snap.val() || {};
            const list: Template[] = Object.entries(data).map(([id, val]) => ({ id, ...(val as any) }));
            setTemplates(list.sort((a, b) => b.uploadedAt - a.uploadedAt));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // ── File selection ──────────────────────────────────────────────────────

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        setFileError("");
        if (!f) return;
        const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
        if (!allowed.includes(f.type)) {
            setFileError("Only PDF or DOCX files are accepted.");
            return;
        }
        const sizeMB = f.size / (1024 * 1024);
        if (sizeMB > MAX_FILE_MB) {
            setFileError(`File is too large (${sizeMB.toFixed(1)} MB). Maximum is ${MAX_FILE_MB} MB.`);
            return;
        }
        setFile(f);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (!f) return;
        const dt = new DataTransfer();
        dt.items.add(f);
        if (fileInputRef.current) {
            fileInputRef.current.files = dt.files;
            handleFileSelect({ target: fileInputRef.current } as any);
        }
    };

    const fileToBase64 = (f: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onprogress = e => {
                if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 90));
            };
            reader.onload = () => {
                setUploadProgress(100);
                resolve((reader.result as string).split(",")[1]);
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(f);
        });

    // ── Upload ──────────────────────────────────────────────────────────────

    const handleUpload = async () => {
        if (!file) { setFileError("Please select a file."); return; }
        setSaving(true);
        setUploadProgress(0);

        try {
            toast.loading("Encoding file…", { id: "template-upload" });
            const base64 = await fileToBase64(file);
            toast.success("File ready", { id: "template-upload" });

            await push(ref(db, "templates"), {
                name: selectedName,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileBase64: base64,
                uploadedAt: Date.now(),
            });

            toast.success(`Template "${selectedName}" uploaded!`);
            setShowUpload(false);
            setFile(null);
            setUploadProgress(0);
        } catch {
            toast.error("Upload failed. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        await remove(ref(db, `templates/${id}`));
        toast.success("Template deleted");
        setDeleteConfirm(null);
    };

    const getDownloadHref = (t: Template) => {
        const mime = t.fileType || "application/octet-stream";
        return `data:${mime};base64,${t.fileBase64}`;
    };

    const getFileIcon = (fileType: string) => {
        if (fileType === "application/pdf") return { label: "PDF", color: "#f87171", bg: "#f8717120" };
        return { label: "DOCX", color: "#60a5fa", bg: "#60a5fa20" };
    };

    // Group by name
    const creationTemplates = templates.filter(t => t.name === "CV Creation");
    const revampTemplates = templates.filter(t => t.name === "CV Revamp");

    return (
        <div className="fade-up">
            <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                    <h1 className="page-title">Templates</h1>
                    <p className="page-subtitle">Upload PDF or DOCX templates for your team to reference</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowUpload(true); setFile(null); setFileError(""); }}>
                    <IconPlus /> Upload Template
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 60 }}><span className="spinner" /></div>
            ) : templates.length === 0 ? (
                <div className="empty-state card">
                    <div style={{ color: "var(--text-3)", opacity: 0.4, marginBottom: 12, display: "flex", justifyContent: "center" }}>
                        <IconLayout />
                    </div>
                    <h3>No templates uploaded yet</h3>
                    <p>Upload a PDF or DOCX template for your employees to use as a reference.</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowUpload(true)}>
                        Upload first template
                    </button>
                </div>
            ) : (
                <>
                    {/* CV Creation */}
                    {creationTemplates.length > 0 && (
                        <div className="fade-up-1" style={{ marginBottom: 28 }}>
                            <div className="section-header" style={{ marginBottom: 14 }}>
                                <span className="section-title">CV Creation</span>
                                <span className="badge badge-green">{creationTemplates.length} file{creationTemplates.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {creationTemplates.map(t => {
                                    const { label, color, bg } = getFileIcon(t.fileType);
                                    return (
                                        <div key={t.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px" }}>
                                            {/* File type badge */}
                                            <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, border: `1px solid ${color}30`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, gap: 2 }}>
                                                <span style={{ color, display: "flex" }}><IconFile /></span>
                                                <span style={{ fontSize: 9, fontWeight: 800, color, fontFamily: "var(--font-head)", letterSpacing: 0.5 }}>{label}</span>
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {t.fileName}
                                                </div>
                                                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                                                    {formatSize(t.fileSize)} &nbsp;·&nbsp; Uploaded {formatDate(t.uploadedAt)}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                                <a
                                                    href={getDownloadHref(t)}
                                                    download={t.fileName}
                                                    className="btn btn-sm btn-ghost"
                                                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                                                >
                                                    <IconDownload /> Download
                                                </a>
                                                <button className="btn-icon" style={{ color: "var(--red)" }} onClick={() => setDeleteConfirm(t.id)} title="Delete">
                                                    <IconTrash />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* CV Revamp */}
                    {revampTemplates.length > 0 && (
                        <div className="fade-up-2">
                            <div className="section-header" style={{ marginBottom: 14 }}>
                                <span className="section-title">CV Revamp</span>
                                <span className="badge badge-blue">{revampTemplates.length} file{revampTemplates.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {revampTemplates.map(t => {
                                    const { label, color, bg } = getFileIcon(t.fileType);
                                    return (
                                        <div key={t.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px" }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, border: `1px solid ${color}30`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, gap: 2 }}>
                                                <span style={{ color, display: "flex" }}><IconFile /></span>
                                                <span style={{ fontSize: 9, fontWeight: 800, color, fontFamily: "var(--font-head)", letterSpacing: 0.5 }}>{label}</span>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {t.fileName}
                                                </div>
                                                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                                                    {formatSize(t.fileSize)} &nbsp;·&nbsp; Uploaded {formatDate(t.uploadedAt)}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                                <a
                                                    href={getDownloadHref(t)}
                                                    download={t.fileName}
                                                    className="btn btn-sm btn-ghost"
                                                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                                                >
                                                    <IconDownload /> Download
                                                </a>
                                                <button className="btn-icon" style={{ color: "var(--red)" }} onClick={() => setDeleteConfirm(t.id)} title="Delete">
                                                    <IconTrash />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Upload Modal */}
            {showUpload && (
                <div className="modal-overlay" onClick={() => !saving && setShowUpload(false)}>
                    <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Upload Template</h3>
                            <button className="btn-icon" onClick={() => setShowUpload(false)} disabled={saving}><IconClose /></button>
                        </div>
                        <div className="modal-body">

                            {/* Category picker */}
                            <div className="form-group">
                                <label>Template Category *</label>
                                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                    {(["CV Creation", "CV Revamp"] as const).map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setSelectedName(opt)}
                                            style={{
                                                flex: 1,
                                                padding: "12px 16px",
                                                borderRadius: 10,
                                                border: `1px solid ${selectedName === opt ? "var(--green)" : "var(--border)"}`,
                                                background: selectedName === opt ? "var(--green-glow)" : "var(--bg-3)",
                                                color: selectedName === opt ? "var(--green)" : "var(--text-2)",
                                                fontWeight: 700,
                                                fontSize: 14,
                                                cursor: "pointer",
                                                fontFamily: "var(--font-head)",
                                                transition: "all 0.15s ease",
                                                textAlign: "center",
                                            }}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* File drop zone */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>File (PDF or DOCX, max {MAX_FILE_MB} MB) *</label>

                                {!file ? (
                                    <div
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            border: "2px dashed var(--border-2)",
                                            borderRadius: 12,
                                            padding: "36px 24px",
                                            textAlign: "center",
                                            cursor: "pointer",
                                            background: "var(--bg-3)",
                                            transition: "border-color 0.2s ease",
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--green)")}
                                        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-2)")}
                                    >
                                        <div style={{ color: "var(--text-3)", display: "flex", justifyContent: "center", marginBottom: 10 }}>
                                            <IconUpload />
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>
                                            Drop file here or click to browse
                                        </div>
                                        <div style={{ fontSize: 12, color: "var(--text-3)" }}>PDF or DOCX · Max {MAX_FILE_MB} MB</div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            onChange={handleFileSelect}
                                            style={{ display: "none" }}
                                        />
                                    </div>
                                ) : (
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 14,
                                        background: "var(--green-glow)", border: "1px solid #4ade8030",
                                        borderRadius: 12, padding: "14px 16px",
                                    }}>
                                        <div style={{ color: "var(--green)", display: "flex" }}><IconFile /></div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {file.name}
                                            </div>
                                            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{formatSize(file.size)}</div>
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
                                            disabled={saving}
                                            onClick={() => { setFile(null); setFileError(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                        >
                                            <IconClose />
                                        </button>
                                    </div>
                                )}

                                {fileError && (
                                    <div style={{ marginTop: 10, fontSize: 13, color: "var(--red)" }}>{fileError}</div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                                <button className="btn btn-ghost" onClick={() => setShowUpload(false)} disabled={saving}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleUpload} disabled={saving || !file || !!fileError}>
                                    {saving
                                        ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Uploading…</>
                                        : "Upload Template"
                                    }
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
                            <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 20 }}>
                                This will permanently remove the template file. Employees will no longer be able to download it.
                            </p>
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