import DashboardLayout from "../../components/shared/DashboardLayout";
import { INST_THEME, getNav, INST_STYLES as s } from "./instructorConfig";
import { useApiData } from "../../hooks/useApiData";
import { getEnrollments } from "../../services/enrollmentService";
import { useAuth } from "../../context/AuthContext";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#f97316", "#a855f7"];

export default function StudentProgress() {
  const { user: authUser } = useAuth();
  const { data: enrollments, isLoading, error } = useApiData(getEnrollments, [], []);

  if (isLoading) return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("Class Progress")} headerTitle="Class Progress" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>Loading progress...</div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("Class Progress")} headerTitle="Class Progress" headerSub="Error">
      <div style={{ textAlign: "center", padding: 50, color: "#ef4444" }}>
        Error loading data: {error.message}
      </div>
    </DashboardLayout>
  );

  const stats = [
    { label: "Total students", value: enrollments.length.toString(), sub: "Across all courses", subColor: "#7a8ba3" },
    { label: "Active", value: enrollments.filter(e => e.status === "Active").length.toString(), sub: "Currently learning", subColor: "#10b981" },
    { label: "Completed", value: enrollments.filter(e => e.status === "Completed").length.toString(), sub: "Finished courses", subColor: "#10b981" },
    { label: "Dropped", value: enrollments.filter(e => e.status === "Dropped").length.toString(), sub: "Needs attention", subColor: "#f59e0b" },
  ];

  return (
    <DashboardLayout 
      theme={INST_THEME} 
      role="Instructor" 
      navGroups={getNav("Class Progress")} 
      userName={authUser?.name} 
      headerTitle="Class Progress" 
      headerSub="Track how your students are performing"
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
          <h2 style={s.cardTitle}>Enrollment Progress</h2>
          <button style={s.outlineBtn} className="btn-hover-dl">Export report</button>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>STUDENT</th>
              <th style={s.th}>COURSE</th>
              <th style={s.th}>PROGRESS</th>
              <th style={s.th}>ENROLLED AT</th>
              <th style={s.th}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, color: "#5a7a9a" }}>No students enrolled in your courses yet.</td></tr>
            ) : (
              enrollments.map((e, i) => {
                const color = COLORS[i % COLORS.length];
                const initials = e.studentName?.split(' ').map(n => n[0]).join('') || "S";
                return (
                  <tr key={e.enrollmentID} style={s.tr}>
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ ...s.tinyAvatar, background: color }}>{initials}</div>
                        <div>
                          <div style={{ fontWeight: 500, color: "#e8edf4" }}>{e.studentName}</div>
                          <div style={{ fontSize: 12, color: "#5a7a9a" }}>{e.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>{e.courseTitle}</td>
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, ...s.progressBg }}>
                          <div style={{ ...s.progressFill, background: e.status === "Completed" ? "#10b981" : "#185fa5", width: `${Math.round(e.progressPercent || e.ProgressPercent || 0)}%` }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#8ea4bd" }}>{Math.round(e.progressPercent || e.ProgressPercent || 0)}%</span>
                      </div>
                    </td>
                    <td style={s.td}><span style={{ color: "#5a7a9a", fontSize: 13 }}>{new Date(e.enrolledAt).toLocaleDateString()}</span></td>
                    <td style={s.td}><ProgressBadge status={e.status} /></td>
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

function ProgressBadge({ status }) {
  const map = { 
    Active: { bg: "rgba(16,185,129,0.12)", c: "#10b981", b: "rgba(16,185,129,0.25)" }, 
    Completed: { bg: "rgba(59,130,246,0.12)", c: "#3b82f6", b: "rgba(59,130,246,0.25)" }, 
    Dropped: { bg: "rgba(239,68,68,0.12)", c: "#ef4444", b: "rgba(239,68,68,0.25)" } 
  };
  const d = map[status] || map.Active;
  return <span style={{ background: d.bg, color: d.c, border: `1px solid ${d.b}`, padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{status}</span>;
}
