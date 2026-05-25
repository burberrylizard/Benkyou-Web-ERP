import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { INST_THEME, getNav, INST_STYLES as s } from "./instructorConfig";
import { useApiData } from "../../hooks/useApiData";
import { getPendingReviewAttempts } from "../../services/assessmentService";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";

export default function Submissions() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { tenantPath } = useTenant();
  const { data: submissions, isLoading, error } = useApiData(getPendingReviewAttempts, [], []);

  if (isLoading) return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("Submissions")} headerTitle="Submissions" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>Loading submissions...</div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("Submissions")} headerTitle="Submissions" headerSub="Error">
      <div style={{ textAlign: "center", padding: 50, color: "#ef4444" }}>
        Error loading data: {error.message}
      </div>
    </DashboardLayout>
  );

  const stats = [
    { label: "Pending Reviews", value: submissions.length.toString(), sub: "Awaiting grading", subColor: "#f59e0b" },
    { label: "Role", value: authUser?.role || "Instructor", sub: "Access level", subColor: "#185fa5" },
    { label: "Organization", value: authUser?.organizationName || "Benkyou", sub: "Active", subColor: "#7a8ba3" },
  ];

  return (
    <DashboardLayout 
      theme={INST_THEME} 
      role="Instructor" 
      navGroups={getNav("Submissions")} 
      userName={authUser?.name} 
      headerTitle="Submissions" 
      headerSub="Review student submissions awaiting grading"
    >
      <div style={s.statsGrid}>
        {stats.map((stat, i) => (
          <div key={i} style={s.card}>
            <div style={s.statLabel}>{stat.label}</div>
            <div style={s.statValue}>{stat.value}</div>
            <div style={{ fontSize: 12, color: stat.subColor, fontWeight: 500 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Pending Submissions</h2>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>STUDENT</th>
              <th style={s.th}>ASSESSMENT</th>
              <th style={s.th}>ATTEMPT #</th>
              <th style={s.th}>SUBMITTED</th>
              <th style={s.th}>STATUS</th>
              <th style={{ ...s.th, textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: 40, color: "#5a7a9a" }}>No pending submissions found.</td></tr>
            ) : (
              submissions.map((sub) => {
                const attemptId = sub.studentAttemptID || sub.studentAttemptId;
                return (
                  <tr key={attemptId} style={s.tr}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 500, color: "#e8edf4" }}>{sub.studentName}</div>
                    </td>
                    <td style={{ ...s.td, fontWeight: 500, color: "#e8edf4" }}>{sub.assessmentTitle}</td>
                    <td style={s.td}><span style={{ color: "#e8edf4" }}>Attempt #{sub.attemptNumber}</span></td>
                    <td style={s.td}><span style={{ fontSize: 13, color: "#5a7a9a" }}>{new Date(sub.submittedAt).toLocaleDateString()}</span></td>
                    <td style={s.td}><SubBadge status={sub.status} /></td>
                    <td style={{ ...s.td, textAlign: "right" }}>
                      <button 
                        onClick={() => attemptId && navigate(tenantPath(`/instructor/submissions/${attemptId}`))}
                        style={{
                          background: "rgba(245, 158, 11, 0.15)",
                          color: "#f59e0b",
                          border: "1px solid rgba(245, 158, 11, 0.3)",
                          padding: "6px 14px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        Grade
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

function SubBadge({ status }) {
  const map = { 
    PendingReview: { bg: "rgba(245,158,11,0.12)", c: "#f59e0b", b: "rgba(245,158,11,0.25)" }, 
    Graded: { bg: "rgba(16,185,129,0.12)", c: "#10b981", b: "rgba(16,185,129,0.25)" } 
  };
  const d = map[status] || map.PendingReview;
  return <span style={{ background: d.bg, color: d.c, border: `1px solid ${d.b}`, padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{status === "PendingReview" ? "Pending Review" : status}</span>;
}
