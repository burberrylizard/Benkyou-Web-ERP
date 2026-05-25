import DashboardLayout from "../../components/shared/DashboardLayout";
import { STU_THEME, getNav, STU_STYLES as s } from "./studentConfig";
import { useApiData } from "../../hooks/useApiData";
import { getMyGrades } from "../../services/gradeService";
import { useAuth } from "../../context/AuthContext";

export default function StudentGrades() {
  const { user: authUser } = useAuth();
  const { data: grades, isLoading } = useApiData(getMyGrades);

  if (isLoading) return (
    <DashboardLayout theme={STU_THEME} role="Student" navGroups={getNav("My Scores")} headerTitle="My Scores" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>Loading your grades...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout 
      theme={STU_THEME} 
      role="Student" 
      navGroups={getNav("My Scores")} 
      userName={authUser?.name} 
      headerTitle="My Scores" 
      headerSub="Track your academic performance"
    >
      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>My Assessment Results</h2>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>ASSESSMENT</th>
              <th style={s.th}>COURSE</th>
              <th style={s.th}>SCORE</th>
              <th style={s.th}>RESULT</th>
              <th style={s.th}>DATE</th>
            </tr>
          </thead>
          <tbody>
            {grades.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, color: "#5a7a9a" }}>No grades available yet. Keep up the good work!</td></tr>
            ) : (
              grades.map((g) => (
                <tr key={g.assessmentResultID} style={s.tr}>
                  <td style={{ ...s.td, fontWeight: 500, color: "#e8edf4" }}>{g.assessmentTitle}</td>
                  <td style={s.td}>{g.courseTitle}</td>
                  <td style={s.td}><span style={{ fontWeight: 700, fontSize: 16, color: g.score >= 70 ? "#10b981" : "#ef4444" }}>{g.score}%</span></td>
                  <td style={s.td}><Badge status={g.isPassed ? "Passed" : "Failed"} /></td>
                  <td style={s.td}><span style={{ color: "#5a7a9a" }}>{new Date(g.submittedAt).toLocaleDateString()}</span></td>
                </tr>
              ))
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
