import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { STU_THEME, getNav, STU_STYLES as s } from "./studentConfig";
import { useApiData } from "../../hooks/useApiData";
import { getDashboardSummary } from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";

export default function StudentDashboard() {
  const { user: authUser } = useAuth();
  const { data, isLoading } = useApiData(getDashboardSummary);
  const navigate = useNavigate();
  const { tenantPath } = useTenant();

  const firstName = authUser?.name?.split(' ')[0] || "Student";

  const stats = [
    { label: "Enrolled courses", value: data?.stats?.totalCourses?.toString() || "0", sub: "Active courses", subColor: "#10b981" },
    { label: "Active enrollments", value: data?.stats?.activeEnrollments?.toString() || "0", sub: "In progress", subColor: "#3b82f6" },
    { label: "Completed", value: data?.stats?.completedEnrollments?.toString() || "0", sub: "Finished courses", subColor: "#10b981" },
    { label: "Assessments", value: data?.stats?.totalAssessments?.toString() || "0", sub: "Quizzes available", subColor: "#7a8ba3" },
  ];

  const myCourses = data?.recentCourses || [];

  return (
    <DashboardLayout 
      theme={STU_THEME} 
      role="Student" 
      navGroups={getNav("Dashboard")} 
      userName={authUser?.name} 
      headerTitle={`Welcome back, ${firstName}!`}
      headerSub={`${data?.organization?.name || "Organization"} · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
    >
      {/* Stats Grid */}
      <div style={s.statsGrid}>
        {stats.map((stat, i) => (
          <div key={i} style={s.card}>
            <div style={s.statLabel}>{stat.label}</div>
            <div style={s.statValue}>{stat.value}</div>
            <div style={{ fontSize: 12, color: stat.subColor, fontWeight: 500 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* My Courses */}
      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>My courses</h2>
          <button 
            style={s.outlineBtn} 
            className="btn-hover-dl"
            onClick={() => navigate(tenantPath("/student/courses"))}
          >View all</button>
        </div>
        
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>Loading courses...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myCourses.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>You are not enrolled in any courses yet.</div>
            ) : (
              myCourses.map((c, i) => {
                const initials = c.title?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || "C";
                const colors = ["#185fa5", "#7c3aed", "#0d9488"];
                const accentColor = colors[i % colors.length];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(30,58,95,0.4)" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e8edf4", marginBottom: 2 }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: "#6b85a3" }}>
                        {c.categoryName || "Course"} · {c.enrollmentCount || 0} enrolled
                      </div>
                    </div>
                    <button 
                      style={{ ...s.primaryBtn, padding: "6px 16px", fontSize: 12 }} 
                      className="btn-hover-dl"
                      onClick={() => navigate(tenantPath(`/student/courses/${c.courseID}/learn`))}
                    >Continue</button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
