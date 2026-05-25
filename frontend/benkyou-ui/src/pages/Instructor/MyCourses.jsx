import DashboardLayout from "../../components/shared/DashboardLayout";
import { INST_THEME, getNav, INST_STYLES as s } from "./instructorConfig";
import { useApiData } from "../../hooks/useApiData";
import { getCourses } from "../../services/courseService";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { useNavigate } from "react-router-dom";

const COURSE_COLORS = ["#185fa5", "#7c3aed", "#0d9488", "#9333ea", "#ea580c"];

export default function MyCourses() {
  const { user: authUser } = useAuth();
  const { data: courses, isLoading } = useApiData(getCourses);
  const navigate = useNavigate();
  const { tenantPath } = useTenant();

  const displayCourses = courses || [];

  const totalStudents = displayCourses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
  const totalSections = displayCourses.reduce((sum, c) => sum + (c.sectionCount || 0), 0);

  const stats = [
    { label: "My courses", value: displayCourses.length.toString(), sub: `${displayCourses.filter(c => c.isPublished).length} published`, subColor: "#10b981" },
    { label: "Total students", value: totalStudents.toString(), sub: "Across all courses", subColor: "#7a8ba3" },
    { label: "Total sections", value: totalSections.toString(), sub: "Content modules", subColor: "#185fa5" },
    { label: "Ongoing", value: displayCourses.filter(c => c.status === "Ongoing").length.toString(), sub: "In progress", subColor: "#3b82f6" },
  ];

  return (
    <DashboardLayout 
      theme={INST_THEME} 
      role="Instructor" 
      navGroups={getNav("My Courses")} 
      userName={authUser?.name} 
      headerTitle="My Courses" 
      headerSub="View and manage your assigned courses"
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
          <h2 style={s.cardTitle}>All my courses</h2>
          <span style={{ fontSize: 13, color: "#5a7a9a" }}>Courses are created and assigned by your Admin</span>
        </div>
        
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>Loading courses...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {displayCourses.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "#5a7a9a" }}>No courses assigned to you yet. Your admin will assign courses.</div>
            ) : (
              displayCourses.map((c, i) => {
                const color = COURSE_COLORS[i % COURSE_COLORS.length];
                const initials = c.title?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || "C";
                return (
                  <div key={c.courseID} style={{ background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}>
                    <div style={{ height: 3, background: color }} />
                    <div style={{ padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: "#e8edf4", marginBottom: 2 }}>{c.title}</div>
                            <span style={{ background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 6, fontSize: 11, color: "#6b85a3" }}>
                              {c.categoryName || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                        <Badge status={c.status} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16, padding: "12px 0", borderTop: "1px solid rgba(30,58,95,0.4)", borderBottom: "1px solid rgba(30,58,95,0.4)" }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#e8edf4" }}>{c.enrolledCount || 0}</div>
                          <div style={{ fontSize: 11, color: "#5a7a9a" }}>students</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#e8edf4" }}>{c.sectionCount || 0}</div>
                          <div style={{ fontSize: 11, color: "#5a7a9a" }}>sections</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: c.isPublished ? "#10b981" : "#f59e0b" }}>{c.isPublished ? "✓" : "—"}</div>
                          <div style={{ fontSize: 11, color: "#5a7a9a" }}>{c.isPublished ? "published" : "draft"}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 12, color: "#5a7a9a" }}>
                          Updated {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                        <button
                          onClick={() => navigate(tenantPath(`/instructor/courses/${c.courseID}/edit`))}
                          style={{ ...s.primaryBtn, fontSize: 12, padding: "6px 14px" }}
                          className="btn-hover-dl"
                        >
                          Manage Content
                        </button>
                      </div>
                    </div>
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

function Badge({ status }) {
  const colors = {
    Published: { bg: "rgba(16,185,129,0.12)", c: "#10b981", b: "rgba(16,185,129,0.25)" },
    Draft: { bg: "rgba(245,158,11,0.12)", c: "#f59e0b", b: "rgba(245,158,11,0.25)" },
    Ongoing: { bg: "rgba(59,130,246,0.12)", c: "#3b82f6", b: "rgba(59,130,246,0.25)" },
    Finished: { bg: "rgba(107,114,128,0.12)", c: "#6b7280", b: "rgba(107,114,128,0.25)" },
  };
  const d = colors[status] || colors.Draft;
  return <span style={{ background: d.bg, color: d.c, border: `1px solid ${d.b}`, padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>{status}</span>;
}
