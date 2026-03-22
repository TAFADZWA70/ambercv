import React, { useState } from "react";

interface SidebarProps {
    activePage: string;
    onNavigate: (page: string) => void;
    role: "owner" | "employee";
    userName: string;
    onLogout?: () => void;
}

const Icon = {
    Dashboard: () => (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
    ),
    CVs: () => (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    Users: () => (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Template: () => (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
        </svg>
    ),
    Assign: () => (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
        </svg>
    ),
    Analytics: () => (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    Logout: () => (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    Menu: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0f0d" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    ),
    Close: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, role, userName, onLogout }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const isOwner = role === "owner";
    const initials = userName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

    const ownerNav = [
        { id: "dashboard", label: "Dashboard", Icon: Icon.Dashboard },
        { id: "jobs", label: "All CVs", Icon: Icon.CVs },
        { id: "assign", label: "Assign CVs", Icon: Icon.Assign },
        { id: "employees", label: "Employees", Icon: Icon.Users },
        { id: "templates", label: "Templates", Icon: Icon.Template },
        { id: "analytics", label: "Analytics", Icon: Icon.Analytics },
    ];

    const employeeNav = [
        { id: "dashboard", label: "Dashboard", Icon: Icon.Dashboard },
        { id: "jobs", label: "My CVs", Icon: Icon.CVs },
    ];

    const navItems = isOwner ? ownerNav : employeeNav;

    const handleNav = (page: string) => {
        onNavigate(page);
        setMobileOpen(false);
    };

    const handleLogout = () => {
        setMobileOpen(false);
        onLogout?.();
    };

    return (
        <>
            {/* Sidebar */}
            <aside className={`sidebar${mobileOpen ? " open" : ""}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                stroke="#0a0f0d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div>
                        <div className="sidebar-logo-text">TrackCV</div>
                        <div className="sidebar-logo-sub">Recruitment</div>
                    </div>
                    {/* Close button visible on mobile only */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        style={{
                            marginLeft: "auto",
                            background: "none",
                            border: "none",
                            color: "var(--text-3)",
                            cursor: "pointer",
                            padding: 4,
                            display: "flex",
                            alignItems: "center",
                        }}
                        aria-label="Close menu"
                    >
                        <Icon.Close />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <span className="nav-label">Navigation</span>
                    {navItems.map(({ id, label, Icon: NavIcon }) => (
                        <button
                            key={id}
                            className={`nav-item ${activePage === id ? "active" : ""}`}
                            onClick={() => handleNav(id)}
                        >
                            <NavIcon />
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-card" onClick={handleLogout} title="Sign out">
                        <div className="user-avatar">{initials}</div>
                        <div className="user-info">
                            <div className="user-name">{userName}</div>
                            <div className="user-role">{role}</div>
                        </div>
                        <Icon.Logout />
                    </div>
                </div>
            </aside>

            {/* Mobile overlay (tap to close) */}
            {mobileOpen && (
                <div
                    className="sidebar-mobile-overlay"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Floating menu button (mobile only) */}
            <button
                className="mobile-nav-btn"
                onClick={() => setMobileOpen(o => !o)}
                aria-label="Open menu"
            >
                <Icon.Menu />
            </button>
        </>
    );
};

export default Sidebar;