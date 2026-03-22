import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { AuthContext, useAuthState } from "./hooks/useAuth";
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import Sidebar from "./components/shared/Sidebar";
import AdminDashboard from "./components/dashboard/Admindashboard";
import EmployeeDashboard from "./components/dashboard/Employeedashboard";
import EmployeesPage from "./components/dashboard/Employeespage";
import TemplatesPage from "./components/dashboard/TemplatePages";
import AssignPage from "./components/dashboard/Assignpage";
import AnalyticsPage from "./components/dashboard/AnalyticsPage";
import JobsList from "./components/cv/Jobslist";
import NewJobForm from "./components/cv/Newjobform";
import JobDetail from "./components/cv/JobDetail";
import "./styles/global.css";

const App = () => {
    const authState = useAuthState();
    const [activePage, setActivePage] = useState("dashboard");
    const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
    const [showSignup, setShowSignup] = useState(false);

    const handleNavigate = (page: string, jobId?: string) => {
        setActivePage(page);
        if (jobId) setSelectedJobId(jobId);
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (authState.loading) {
        return (
            <div className="app-loading">
                <div style={{
                    width: 48, height: 48, background: "#4ade80", borderRadius: 14,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                            stroke="#0a0f0d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <span className="spinner lg" style={{ marginTop: 16 }} />
            </div>
        );
    }

    // ── Not logged in: show Login or Signup ──────────────────────────────────
    if (!authState.firebaseUser || !authState.appUser) {
        return (
            <AuthContext.Provider value={authState}>
                {showSignup
                    ? <SignupPage
                        onSignup={authState.signup}
                        onGoToLogin={() => setShowSignup(false)}
                    />
                    : <LoginPage
                        onLogin={authState.login}
                        onGoToSignup={() => setShowSignup(true)}
                    />
                }
                <Toaster position="top-right" />
            </AuthContext.Provider>
        );
    }

    // ── Logged in ────────────────────────────────────────────────────────────
    const isOwner = authState.appUser.role === "owner";

    const renderPage = () => {
        if (activePage === "job-detail" && selectedJobId) {
            return <JobDetail jobId={selectedJobId} onNavigate={handleNavigate} />;
        }
        switch (activePage) {
            case "dashboard":
                return isOwner
                    ? <AdminDashboard onNavigate={handleNavigate} />
                    : <EmployeeDashboard onNavigate={handleNavigate} />;
            case "jobs":
                return <JobsList onNavigate={handleNavigate} />;
            case "new-job":
                return isOwner
                    ? <NewJobForm onNavigate={handleNavigate} />
                    : <JobsList onNavigate={handleNavigate} />;
            case "assign":
                return isOwner ? <AssignPage /> : <EmployeeDashboard onNavigate={handleNavigate} />;
            case "employees":
                return isOwner ? <EmployeesPage /> : <EmployeeDashboard onNavigate={handleNavigate} />;
            case "templates":
                return isOwner ? <TemplatesPage /> : <EmployeeDashboard onNavigate={handleNavigate} />;
            case "analytics":
                return isOwner ? <AnalyticsPage /> : <EmployeeDashboard onNavigate={handleNavigate} />;
            default:
                return isOwner
                    ? <AdminDashboard onNavigate={handleNavigate} />
                    : <EmployeeDashboard onNavigate={handleNavigate} />;
        }
    };

    return (
        <AuthContext.Provider value={authState}>
            <div className="app-layout">
                <Sidebar
                    activePage={activePage}
                    onNavigate={handleNavigate}
                    role={authState.appUser.role}
                    userName={authState.appUser.name || authState.appUser.email}
                    onLogout={authState.logout}
                />
                <main className="app-main">{renderPage()}</main>
            </div>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: "#1a241a",
                        color: "#e8f5e9",
                        border: "1px solid #2a3d2b",
                        fontFamily: "'DM Sans', sans-serif",
                    },
                }}
            />
        </AuthContext.Provider>
    );
};

export default App;