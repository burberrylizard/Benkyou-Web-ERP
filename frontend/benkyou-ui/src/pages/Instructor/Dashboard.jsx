import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { INST_THEME, getNav, INST_STYLES as s } from "./instructorConfig";
import { useApiData } from "../../hooks/useApiData";
import { getDashboardSummary } from "../../services/dashboardService";
import { getCourses } from "../../services/courseService";
import { getEnrollments } from "../../services/enrollmentService";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";

export default function InstructorDashboard() {
  const { user: authUser } = useAuth();
  const { data, isLoading } = useApiData(getDashboardSummary);
  const { data: coursesData } = useApiData(getCourses);
  const { data: enrollmentsData } = useApiData(getEnrollments);
  const navigate = useNavigate();
  const { tenantPath } = useTenant();

  const myCourses = coursesData || [];
  const myEnrollments = enrollmentsData || [];

  const totalSections = myCourses.reduce((sum, c) => sum + (c.sectionCount || 0), 0);
  const totalEnrolled = myCourses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);

  const stats = [
    { label: "My courses", value: myCourses.length.toString(), sub: `${myCourses.filter(c => c.isPublished).length} published`, subColor: "#10b981" },
    { label: "Total students", value: totalEnrolled.toString(), sub: `${myEnrollments.filter(e => e.status === "Active").length} active`, subColor: "#10b981" },
    { label: "Total sections", value: totalSections.toString(), sub: "Lessons & modules", subColor: "#185fa5" },
    { label: "Platform status", value: "Good", sub: "All systems online", subColor: "#10b981" },
  ];

  return (
    <DashboardLayout 
      theme={INST_THEME} 
      role="Instructor" 
      navGroups={getNav("Dashboard")} 
      userName={authUser?.name} 
      headerTitle="Instructor dashboard" 
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

      <div style={s.twoCol}>
        {/* My Courses Card — real data from courses API */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>My courses</h2>
            <button 
              style={s.outlineBtn} 
              className="btn-hover-dl"
              onClick={() => navigate(tenantPath("/instructor/courses"))}
            >View all</button>
          </div>
          
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>Loading courses...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {myCourses.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>No courses assigned yet</div>
              ) : (
                myCourses.slice(0, 5).map((c, i) => {
                  const initials = c.title?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || "C";
                  const colors = ["#185fa5", "#7c3aed", "#0d9488", "#9333ea"];
                  const accentColor = colors[i % colors.length];
                  return (
                    <div 
                      key={c.courseID} 
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(30,58,95,0.4)", cursor: "pointer" }}
                      onClick={() => navigate(tenantPath(`/instructor/courses/${c.courseID}/edit`))}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#e8edf4", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, color: "#6b85a3" }}>{c.enrolledCount || 0} students · {c.sectionCount || 0} sections</span>
                          <Badge status={c.status} />
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: c.isPublished ? "#10b981" : "#f59e0b", fontWeight: 600 }}>
                          {c.isPublished ? "Published" : "Draft"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Recent Enrollments — real data */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Recent enrollments</h2>
            <button style={s.outlineBtn} className="btn-hover-dl" onClick={() => navigate(tenantPath("/instructor/analytics"))}>View all</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {myEnrollments.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>No student enrollments yet</div>
            ) : (
              myEnrollments.slice(0, 6).map((e, i) => {
                const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];
                const initials = e.studentName?.split(' ').map(n => n[0]).join('').slice(0, 2) || "S";
                return (
                  <div key={e.enrollmentID || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(30,58,95,0.4)" }}>
                    <div style={{ ...s.tinyAvatar, background: colors[i % colors.length] }}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#e8edf4" }}>{e.studentName}</div>
                      <div style={{ fontSize: 11, color: "#5a7a9a" }}>{e.courseTitle}</div>
                    </div>
                    <EnrollBadge status={e.status} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>


    </DashboardLayout>
  );
}

function Badge({ status }) {
  const map = {
    Published: { bg: "rgba(16,185,129,0.12)", c: "#10b981", b: "rgba(16,185,129,0.25)" },
    Draft: { bg: "rgba(245,158,11,0.12)", c: "#f59e0b", b: "rgba(245,158,11,0.25)" },
    Ongoing: { bg: "rgba(59,130,246,0.12)", c: "#3b82f6", b: "rgba(59,130,246,0.25)" },
    Finished: { bg: "rgba(107,114,128,0.12)", c: "#6b7280", b: "rgba(107,114,128,0.25)" },
  };
  const d = map[status] || map.Draft;
  return <span style={{ background: d.bg, color: d.c, border: `1px solid ${d.b}`, padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>{status}</span>;
}

function EnrollBadge({ status }) {
  const map = {
    Active: { bg: "rgba(16,185,129,0.12)", c: "#10b981" },
    Completed: { bg: "rgba(59,130,246,0.12)", c: "#3b82f6" },
    Dropped: { bg: "rgba(239,68,68,0.12)", c: "#ef4444" },
  };
  const d = map[status] || map.Active;
  return <span style={{ background: d.bg, color: d.c, padding: "3px 8px", borderRadius: 8, fontSize: 10, fontWeight: 600 }}>{status}</span>;
}
