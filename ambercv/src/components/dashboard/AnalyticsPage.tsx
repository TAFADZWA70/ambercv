import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";

interface CV {
    id: string;
    candidateName: string;
    position: string;
    status: string;
    assignedTo?: string;
    assignedToName?: string;
    progress: number;
    createdAt: number;
}

interface Employee {
    id: string;
    name: string;
}

const AnalyticsPage: React.FC = () => {
    const [cvs, setCvs] = useState<CV[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const u1 = onValue(ref(db, "cvs"), snap => {
            const data = snap.val() || {};
            const list: CV[] = Object.entries(data).map(([id, v]) => ({ id, ...(v as any) }));
            setCvs(list);
            setLoading(false);
        });
        const u2 = onValue(ref(db, "users"), snap => {
            const data = snap.val() || {};
            const list: Employee[] = Object.entries(data)
                .map(([id, v]) => ({ id, ...(v as any) }))
                .filter((u: any) => u.role === "employee");
            setEmployees(list);
        });
        return () => { u1(); u2(); };
    }, []);

    const total = cvs.length;
    const byStatus = {
        pending: cvs.filter(c => c.status === "pending").length,
        "in-progress": cvs.filter(c => c.status === "in-progress").length,
        completed: cvs.filter(c => c.status === "completed").length,
        rejected: cvs.filter(c => c.status === "rejected").length,
    };

    const completionRate = total ? Math.round((byStatus.completed / total) * 100) : 0;
    const avgProgress = total ? Math.round(cvs.reduce((s, c) => s + (c.progress || 0), 0) / total) : 0;

    const empWorkload = employees.map(e => ({
        ...e,
        count: cvs.filter(c => c.assignedTo === e.id).length,
        completed: cvs.filter(c => c.assignedTo === e.id && c.status === "completed").length,
        avgProgress: (() => {
            const assigned = cvs.filter(c => c.assignedTo === e.id);
            return assigned.length ? Math.round(assigned.reduce((s, c) => s + (c.progress || 0), 0) / assigned.length) : 0;
        })(),
    })).sort((a, b) => b.count - a.count);

    const positionMap: Record<string, number> = {};
    cvs.forEach(cv => {
        if (cv.position) positionMap[cv.position] = (positionMap[cv.position] || 0) + 1;
    });
    const topPositions = Object.entries(positionMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxPos = topPositions[0]?.[1] || 1;

    const statusConfig = [
        { key: "pending", label: "Pending", color: "#9dbfa0", bg: "#9dbfa020" },
        { key: "in-progress", label: "In Progress", color: "#fbbf24", bg: "#fbbf2420" },
        { key: "completed", label: "Completed", color: "#4ade80", bg: "#4ade8020" },
        { key: "rejected", label: "Rejected", color: "#f87171", bg: "#f8717120" },
    ];

    return (
        <div className= "fade-up" >
        <div className="page-header" >
            <h1 className="page-title" > Analytics </h1>
                < p className = "page-subtitle" > Recruitment pipeline overview and team performance </p>
                    </div>

    {
        loading ? (
            <div style= {{ textAlign: "center", padding: 60 }
    }> <span className="spinner" /> </div>
      ) : (
    <>
    {/* Top stats */ }
    < div className = "stats-grid fade-up-1" >
        <div className="stat-card" >
            <div className="stat-value" > { total } </div>
                < div className = "stat-label" > Total CVs </div>
                    </div>
                    < div className = "stat-card" style = {{ "--accent-color": "#4ade80" } as React.CSSProperties}>
                        <div className="stat-value" style = {{ color: "var(--green)" }}> { completionRate } % </div>
                            < div className = "stat-label" > Completion Rate </div>
                                </div>
                                < div className = "stat-card" style = {{ "--accent-color": "#fbbf24" } as React.CSSProperties}>
                                    <div className="stat-value" style = {{ color: "var(--amber)" }}> { avgProgress } % </div>
                                        < div className = "stat-label" > Avg Progress </div>
                                            </div>
                                            < div className = "stat-card" style = {{ "--accent-color": "#60a5fa" } as React.CSSProperties}>
                                                <div className="stat-value" style = {{ color: "var(--blue)" }}> { employees.length } </div>
                                                    < div className = "stat-label" > Active Employees </div>
                                                        </div>
                                                        </div>

                                                        < div style = {{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className = "fade-up-2" >
                                                            {/* Status breakdown */ }
                                                            < div className = "card" >
                                                                <div className="section-title" style = {{ marginBottom: 20 }}> Status Breakdown </div>
                                                                    < div style = {{ display: "flex", flexDirection: "column", gap: 14 }}>
                                                                    {
                                                                        statusConfig.map(({ key, label, color, bg }) => {
                                                                            const count = byStatus[key as keyof typeof byStatus] || 0;
                                                                            const pct = total ? Math.round((count / total) * 100) : 0;
                                                                            return (
                                                                                <div key= { key } >
                                                                                <div style={ { display: "flex", justifyContent: "space-between", marginBottom: 6 } }>
                                                                                    <span style={ { fontSize: 13, color: "var(--text-2)" } }> { label } </span>
                                                                                        < span style = {{ fontSize: 13, fontWeight: 700, color, fontFamily: "var(--font-head)" }
                                                                        }>
                                                                        { count } < span style = {{ fontWeight: 400, color: "var(--text-3)" }} > ({ pct } %) </span>
                                                                        </span>
                                                                        </div>
                                                                        < div className = "progress-bar" style = {{ height: 8, background: bg }}>
                                                                            <div style={ { height: "100%", borderRadius: 100, width: `${pct}%`, background: color, transition: "width 0.6s ease" } } />
                                                                                </div>
                                                                                </div>
                  );
                })}
</div>
{ total === 0 && <div style={ { textAlign: "center", padding: "20px 0", color: "var(--text-3)", fontSize: 13 } }> No data yet </div> }
</div>

{/* Top positions */ }
<div className="card" >
    <div className="section-title" style = {{ marginBottom: 20 }}> Top Positions </div>
{
    topPositions.length === 0 ? (
        <div style= {{ textAlign: "center", padding: "20px 0", color: "var(--text-3)", fontSize: 13 }
}> No data yet </div>
              ) : (
    <div style= {{ display: "flex", flexDirection: "column", gap: 12 }}>
    {
        topPositions.map(([pos, count]) => (
            <div key= { pos } >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }} >
        <span style={ { fontSize: 13, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 } }> { pos } </span>
            < span style = {{ fontSize: 13, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-head)", flexShrink: 0 }}> { count } </span>
                </div>
                < div className = "progress-bar" style = {{ height: 6 }}>
                    <div style={ { height: "100%", borderRadius: 100, width: `${(count / maxPos) * 100}%`, background: "var(--green)", opacity: 0.7, transition: "width 0.5s ease" } } />
                        </div>
                        </div>
                  ))}
</div>
              )}
</div>
    </div>

{/* Employee performance */ }
{
    empWorkload.length > 0 && (
        <div className="card fade-up-3" style = {{ marginTop: 20 }
}>
    <div className="section-title" style = {{ marginBottom: 20 }}> Team Performance </div>
        < div className = "table-wrap" style = {{ border: "none" }}>
            <table>
            <thead>
            <tr>
            <th>Employee </th>
            < th > CVs Assigned </th>
                < th > Completed </th>
                < th > Avg Progress </th>
                    < th > Completion % </th>
                    </tr>
                    </thead>
                    <tbody>
{
    empWorkload.map(e => (
        <tr key= { e.id } >
        <td>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={
                {
                    width: 28, height: 28, borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--green), var(--green-dim))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 700, color: "#0a0f0d", fontFamily: "var(--font-head)", flexShrink: 0,
                            }
}>
    { e.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) }
    </div>
    < span style = {{ fontWeight: 600, color: "var(--text)" }}> { e.name } </span>
        </div>
        </td>
        < td style = {{ fontWeight: 600, color: "var(--text)" }}> { e.count } </td>
            <td><span className="badge badge-green">{e.completed}</span></td>
                <td>
                <div style={ { display: "flex", alignItems: "center", gap: 8 } }>
                    <div className="progress-bar" style = {{ width: 80 }}>
                        <div className="progress-fill" style = {{ width: `${e.avgProgress}%` }} />
                            </div>
                            < span style = {{ fontSize: 12, color: "var(--text-3)" }}> { e.avgProgress } % </span>
                                </div>
                                </td>
                                < td >
                                <span style={ { fontWeight: 700, color: "var(--green)", fontFamily: "var(--font-head)" } }>
                                    { e.count ? Math.round((e.completed / e.count) * 100) : 0 } %
                                    </span>
                                    </td>
                                    </tr>
                    ))}
</tbody>
    </table>
    </div>
    </div>
          )}
</>
      )}
</div>
  );
};

export default AnalyticsPage;