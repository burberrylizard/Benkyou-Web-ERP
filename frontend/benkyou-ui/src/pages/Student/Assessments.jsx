import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { STU_THEME, getNav, STU_STYLES as s } from "./studentConfig";
import { useApiData } from "../../hooks/useApiData";
import { getAssessments } from "../../services/assessmentService";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import Pagination from "../../components/shared/Pagination";

export default function Assessments() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { tenantPath } = useTenant();
  const { data: assessments, isLoading } = useApiData(getAssessments);
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (isLoading) return (
    <DashboardLayout theme={STU_THEME} role="Student" navGroups={getNav("Quizzes")} headerTitle="Assessments" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>Loading assessments...</div>
    </DashboardLayout>
  );

  const list = assessments || [];
  const filtered = filter === "All" ? list : list.filter(a => (a.isActive ? "Active" : "Closed") === filter);

  const completedList = list.filter(a => a.hasSubmitted);
  const activeList = list.filter(a => a.isActive && (!a.dueDate || new Date(a.dueDate) >= new Date()) && !a.hasSubmitted);
  const bestScores = completedList.map(a => a.bestScore || 0);
  const bestScoreVal = bestScores.length > 0 ? `${Math.max(...bestScores)}%` : "—";

  const stats = [
    { label: "Total assessments", value: list.length.toString(), sub: "This semester", subColor: "#7a8ba3" },
    { label: "Active", value: activeList.length.toString(), sub: "Needs attention", subColor: "#f59e0b" },
    { label: "Completed", value: completedList.length.toString(), sub: "Finished tasks", subColor: "#10b981" },
    { label: "Best score", value: bestScoreVal, sub: bestScores.length > 0 ? "Top score" : "No attempts yet", subColor: "#7a8ba3" },
  ];

  return (
    <DashboardLayout 
      theme={STU_THEME} 
      role="Student" 
      navGroups={getNav("Quizzes")} 
      userName={authUser?.name} 
      headerTitle="Assessments" 
      headerSub="View your quizzes, exams, and assignments"
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
          <h2 style={s.cardTitle}>All assessments</h2>
          <div style={{ display: "flex", gap: 6 }}>
            {["All", "Active", "Closed"].map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setCurrentPage(1); }}
                style={{
                  background: filter === f ? "#185fa5" : "transparent",
                  color: filter === f ? "#fff" : "#6b85a3",
                  border: filter === f ? "none" : "1px solid #2a4060",
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >{f}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>No assessments found for your courses.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((a, i) => {
              const isClosed = !a.isActive || (a.dueDate && new Date(a.dueDate) < new Date());
              const currentStatus = a.hasSubmitted ? "Completed" : isClosed ? "Closed" : "Active";
              return (
                <div key={i} style={{ 
                  display: "flex", alignItems: "center", gap: 16, padding: 16, 
                  borderRadius: 12, background: "rgba(255,255,255,0.02)", 
                  border: "1px solid rgba(30,58,95,0.4)", transition: "all 0.2s" 
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: a.type === "Quiz" ? "rgba(59,130,246,0.15)" : "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {a.type === "Quiz" ? "📝" : a.type === "Exam" ? "📋" : "📄"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e8edf4", marginBottom: 4 }}>{a.title}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#6b85a3" }}>{a.courseTitle}</span>
                      <TypeBadge type={a.type} />
                      <span style={{ fontSize: 12, color: "#5a7a9a" }}>Pass: {a.passingScore}%</span>
                      {a.dueDate && (
                        <span style={{ fontSize: 12, color: isClosed ? "#ef4444" : "#8ea4bd" }}>
                          Due: {new Date(a.dueDate).toLocaleDateString()} {new Date(a.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      )}
                      {a.hasSubmitted && (
                        <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>
                          Score: {a.bestScore}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <StatusBadge status={currentStatus} />
                    {(currentStatus === "Active") ? (
                      <button
                        onClick={() => navigate(tenantPath(`/student/assessments/${a.assessmentID}/take`))}
                        style={{ ...s.primaryBtn, padding: "8px 20px", fontSize: 12 }}
                        className="btn-hover-dl"
                      >
                        Start Quiz
                      </button>
                    ) : (
                      <button style={{ ...s.outlineBtn, cursor: "not-allowed", opacity: 0.5, padding: "8px 20px", fontSize: 12 }} disabled>
                        {currentStatus}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 12 }}>
              <Pagination
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function TypeBadge({ type }) {
  const colors = { Quiz: "#3b82f6", Exam: "#8b5cf6", Lab: "#f59e0b", Homework: "#6b7280", Project: "#10b981" };
  const c = colors[type] || "#6b7280";
  return <span style={{ background: `${c}18`, color: c, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{type}</span>;
}

function StatusBadge({ status }) {
  const map = {
    Active: { bg: "rgba(16,185,129,0.12)", c: "#10b981", b: "rgba(16,185,129,0.25)" },
    Completed: { bg: "rgba(59,130,246,0.12)", c: "#3b82f6", b: "rgba(59,130,246,0.25)" },
    Closed: { bg: "rgba(239,68,68,0.12)", c: "#ef4444", b: "rgba(239,68,68,0.25)" },
  };
  const d = map[status] || map.Closed;
  return <span style={{ background: d.bg, color: d.c, border: `1px solid ${d.b}`, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>{status}</span>;
}
