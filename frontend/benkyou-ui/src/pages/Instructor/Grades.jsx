import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { INST_THEME, getNav, INST_STYLES as s } from "./instructorConfig";
import { useApiData } from "../../hooks/useApiData";
import { getInstructorGrades } from "../../services/gradeService";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";

export default function InstructorGrades() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { tenantPath } = useTenant();
  const { data: grades, isLoading, error } = useApiData(getInstructorGrades, [], []);
  const [selectedCourse, setSelectedCourse] = useState("All Courses");

  if (isLoading) return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("Grade Book")} headerTitle="Grade Book" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>Loading grades...</div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("Grade Book")} headerTitle="Grade Book" headerSub="Error">
      <div style={{ textAlign: "center", padding: 50, color: "#ef4444" }}>
        Error loading data: {error.message}
      </div>
    </DashboardLayout>
  );

  const uniqueCourses = grades ? [...new Set(grades.map(g => g.courseTitle))].filter(Boolean) : [];

  const filteredGrades = selectedCourse === "All Courses" 
    ? grades 
    : grades.filter(g => g.courseTitle === selectedCourse);

  return (
    <DashboardLayout 
      theme={INST_THEME} 
      role="Instructor" 
      navGroups={getNav("Grade Book")} 
      userName={authUser?.name} 
      headerTitle="Grade Book" 
      headerSub="Review and manage student results"
    >
      <div style={s.tableCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
          <h2 style={s.cardTitle}>Student Grades</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#7a8ba3", fontWeight: 500 }}>Course:</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{
                background: "#0b1929",
                color: "#e8edf4",
                border: "1px solid #1e3a5f",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                outline: "none",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
            >
              <option value="All Courses">All Courses</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button style={s.outlineBtn} onClick={() => window.print()}>Export CSV</button>
          </div>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>STUDENT</th>
              <th style={s.th}>ASSESSMENT</th>
              <th style={s.th}>COURSE</th>
              <th style={s.th}>SCORE</th>
              <th style={s.th}>RESULT</th>
              <th style={s.th}>SUBMITTED</th>
              <th style={{ ...s.th, textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrades.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: 40, color: "#5a7a9a" }}>No student grades found.</td></tr>
            ) : (
              filteredGrades.map((g) => {
                const attemptId = g.attemptID || g.attemptId;
                return (
                  <tr key={g.assessmentResultID} style={s.tr}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 500, color: "#e8edf4" }}>{g.studentName}</div>
                      <div style={{ fontSize: 12, color: "#5a7a9a" }}>{g.studentEmail}</div>
                    </td>
                    <td style={s.td}>{g.assessmentTitle}</td>
                    <td style={s.td}>{g.courseTitle}</td>
                    <td style={s.td}><span style={{ fontWeight: 700, fontSize: 15, color: g.score >= 70 ? "#10b981" : "#ef4444" }}>{g.score}%</span></td>
                    <td style={s.td}><Badge status={g.isPassed ? "Passed" : "Failed"} /></td>
                    <td style={s.td}><span style={{ color: "#5a7a9a", fontSize: 13 }}>{new Date(g.submittedAt).toLocaleDateString()}</span></td>
                    <td style={{ ...s.td, textAlign: "right" }}>
                      {g.status === "PendingReview" ? (
                        <button
                          onClick={() => attemptId && navigate(tenantPath(`/instructor/submissions/${attemptId}`))}
                          disabled={!attemptId}
                          style={{
                            background: attemptId ? "rgba(245, 158, 11, 0.15)" : "rgba(122, 139, 163, 0.08)",
                            color: attemptId ? "#f59e0b" : "#5a7a9a",
                            border: `1px solid ${attemptId ? "rgba(245, 158, 11, 0.3)" : "rgba(122, 139, 163, 0.15)"}`,
                            padding: "6px 14px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: attemptId ? "pointer" : "not-allowed",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Grade
                        </button>
                      ) : (
                        <button
                          onClick={() => attemptId && navigate(tenantPath(`/instructor/submissions/${attemptId}`))}
                          disabled={!attemptId}
                          style={{
                            background: attemptId ? "rgba(122, 139, 163, 0.15)" : "rgba(122, 139, 163, 0.08)",
                            color: attemptId ? "#a0b4cb" : "#5a7a9a",
                            border: `1px solid ${attemptId ? "rgba(122, 139, 163, 0.3)" : "rgba(122, 139, 163, 0.15)"}`,
                            padding: "6px 14px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: attemptId ? "pointer" : "not-allowed",
                            transition: "all 0.2s ease",
                          }}
                        >
                          View
                        </button>
                      )}
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

function Badge({ status }) {
  const pass = status === "Passed";
  return <span style={{ background: pass ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: pass ? "#10b981" : "#ef4444", border: `1px solid ${pass ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{status}</span>;
}
