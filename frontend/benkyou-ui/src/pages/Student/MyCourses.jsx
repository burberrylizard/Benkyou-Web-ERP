import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { STU_THEME, getNav, STU_STYLES as s } from "./studentConfig";
import { useApiData } from "../../hooks/useApiData";
import { getMyCourses } from "../../services/enrollmentService";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import Pagination from "../../components/shared/Pagination";

const COLORS = ["#185fa5", "#7c3aed", "#0d9488", "#ea580c", "#6366f1"];

export default function MyCourses() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { tenantPath } = useTenant();
  const { data: enrollments, isLoading } = useApiData(getMyCourses);
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const list = enrollments || [];

  const filtered = useMemo(() => {
    if (filter === "All") return list;
    if (filter === "Completed") return list.filter(e => e.status === "Completed");
    if (filter === "In Progress") return list.filter(e => e.status === "Active");
    return list;
  }, [list, filter]);

  const stats = [
    { label: "Enrolled", value: list.length.toString(), sub: "Total courses", subColor: "#10b981" },
    { label: "In Progress", value: list.filter(e => e.status === "Active").length.toString(), sub: "Active courses", subColor: "#3b82f6" },
    { label: "Completed", value: list.filter(e => e.status === "Completed").length.toString(), sub: "Finished", subColor: "#10b981" },
    { label: "Dropped", value: list.filter(e => e.status === "Dropped").length.toString(), sub: "Withdrawn", subColor: "#f59e0b" },
  ];

  if (isLoading) return (
    <DashboardLayout theme={STU_THEME} role="Student" navGroups={getNav("My Courses")} headerTitle="My Courses" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>Loading courses...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout 
      theme={STU_THEME} 
      role="Student" 
      navGroups={getNav("My Courses")} 
      userName={authUser?.name} 
      headerTitle="My Courses" 
      headerSub="Your enrolled courses"
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={s.cardTitle}>All my courses</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {["All", "In Progress", "Completed"].map(tab => (
              <button
                key={tab}
                onClick={() => { setFilter(tab); setCurrentPage(1); }}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: filter === tab ? "#185fa5" : "transparent",
                  color: filter === tab ? "#fff" : "#5a7a9a",
                  border: filter === tab ? "1px solid #185fa5" : "1px solid #2a4060",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#5a7a9a" }}>
              {filter === "All" ? "You are not enrolled in any courses yet." : `No ${filter.toLowerCase()} courses.`}
            </div>
          ) : (
            filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((enrollment, i) => {
              const color = COLORS[i % COLORS.length];
              const initials = enrollment.courseTitle?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || "C";
              const isCompleted = enrollment.status === "Completed";
              return (
                <div key={enrollment.enrollmentID} style={{ display: "flex", alignItems: "center", borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(30,58,95,0.4)", transition: "border-color 0.2s" }}>
                  <div style={{ width: 5, alignSelf: "stretch", background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center", flex: 1, minWidth: 0 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#e8edf4", marginBottom: 4, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                          <span>{enrollment.courseTitle}</span>
                          {enrollment.classSectionName && enrollment.classSectionName !== "Unassigned" && (
                            <span style={{ 
                              background: "rgba(91,155,213,0.12)", 
                              color: "#5b9bd5", 
                              border: "1px solid rgba(91,155,213,0.25)", 
                              padding: "2px 8px", 
                              borderRadius: 10, 
                              fontSize: 11, 
                              fontWeight: 600 
                            }}>
                              {enrollment.classSectionName}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: "#6b85a3" }}>
                          Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          {enrollment.completedAt && ` · Completed ${new Date(enrollment.completedAt).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <StatusBadge status={enrollment.status} />
                      <div style={{ marginTop: 12 }}>
                        {!isCompleted ? (
                          <button
                            onClick={() => navigate(tenantPath(`/student/courses/${enrollment.courseID}/learn`))}
                            style={{ ...s.primaryBtn, fontSize: 13, padding: "8px 20px" }}
                            className="btn-hover-dl"
                          >
                            Continue Learning
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(tenantPath(`/student/courses/${enrollment.courseID}/learn`))}
                            style={{ ...s.outlineBtn, fontSize: 13, padding: "8px 20px" }}
                            className="btn-hover-dl"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {filtered.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Pagination
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }) {
  const map = {
    Active: { bg: "rgba(59,130,246,0.12)", c: "#3b82f6", b: "rgba(59,130,246,0.25)", label: "In Progress" },
    Completed: { bg: "rgba(16,185,129,0.12)", c: "#10b981", b: "rgba(16,185,129,0.25)", label: "Completed" },
    Dropped: { bg: "rgba(239,68,68,0.12)", c: "#ef4444", b: "rgba(239,68,68,0.25)", label: "Dropped" },
  };
  const d = map[status] || map.Active;
  return <span style={{ background: d.bg, color: d.c, border: `1px solid ${d.b}`, padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{d.label}</span>;
}
