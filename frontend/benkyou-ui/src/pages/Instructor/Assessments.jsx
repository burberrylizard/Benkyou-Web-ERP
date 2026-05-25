import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { INST_THEME, getNav, INST_STYLES as s } from "./instructorConfig";
import { useApiData } from "../../hooks/useApiData";
import { getAssessments, createAssessment, deleteAssessment } from "../../services/assessmentService";
import { getCourses } from "../../services/courseService";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";

export default function Assessments() {
  const { user: authUser } = useAuth();
  const { tenantPath } = useTenant();
  const navigate = useNavigate();
  const { data: assessments, isLoading, reload } = useApiData(getAssessments);
  const { data: courses } = useApiData(getCourses);
  const [filter, setFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", courseId: "", type: "Quiz" });
  const [creating, setCreating] = useState(false);

  const list = assessments || [];
  const filtered = filter === "All" ? list : list.filter(a => {
    const status = a.status || a.Status;
    if (filter === "Published") return status === "Published";
    if (filter === "Draft") return status === "Draft";
    return true;
  });

  const handleCreate = async () => {
    if (!createForm.title || !createForm.courseId) return;
    setCreating(true);
    try {
      const result = await createAssessment(createForm);
      setShowCreate(false);
      setCreateForm({ title: "", courseId: "", type: "Quiz" });
      reload();
      const newId = result?.assessmentID || result?.assessmentId;
      navigate(tenantPath(`/instructor/assessments/${newId}/builder`));
    } catch (err) { alert(err.message || "Failed to create assessment"); }
    finally { setCreating(false); }
  };

  const handleDelete = async (aid) => {
    if (!confirm("Are you sure you want to delete this assessment? This will permanently delete all questions and student attempts for it.")) return;
    try {
      await deleteAssessment(aid);
      reload();
    } catch (err) { alert(err.message || "Failed to delete assessment"); }
  };

  const stats = [
    { label: "Total assessments", value: list.length.toString(), sub: "Across all courses", subColor: "#7a8ba3" },
    { label: "Published", value: list.filter(a => (a.status || a.Status) === "Published").length.toString(), sub: "Live & active", subColor: "#10b981" },
    { label: "Draft", value: list.filter(a => (a.status || a.Status) === "Draft").length.toString(), sub: "In progress", subColor: "#f59e0b" },
    { label: "Avg pass mark", value: list.length > 0 ? (list.reduce((sum, a) => sum + (a.passingScore || 0), 0) / list.length).toFixed(0) + "%" : "0%", sub: "Target average", subColor: "#7a8ba3" },
  ];

  if (isLoading) return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("Assessments")} headerTitle="Assessments" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>Loading assessments...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout
      theme={INST_THEME} role="Instructor" navGroups={getNav("Assessments")}
      userName={authUser?.name} headerTitle="Assessment builder" headerSub="Create and manage assessments"
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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["All", "Published", "Draft"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ background: filter === f ? "#185fa5" : "transparent", color: filter === f ? "#fff" : "#6b85a3", border: filter === f ? "none" : "1px solid #2a4060", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                {f}
              </button>
            ))}
            <button onClick={() => setShowCreate(true)} style={{ ...s.primaryBtn, marginLeft: 8 }}>+ Create assessment</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>No assessments found.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((a, i) => {
              const aid = a.assessmentID || a.assessmentId;
              return (
                <div key={aid} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(30,58,95,0.4)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"][i % 4]}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📝</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e8edf4", marginBottom: 2 }}>{a.title}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#6b85a3" }}>{a.courseTitle}</span>
                      <span style={{ fontSize: 12, color: "#5a7a9a" }}>Pass: {a.passingScore}%</span>
                      <span style={{ fontSize: 12, color: "#5a7a9a" }}>Attempts: {a.maxAttempts}</span>
                      {a.dueDate && <span style={{ fontSize: 11, color: "#f59e0b" }}>Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <StatusBadge status={a.status || a.Status} />
                    <button onClick={() => navigate(tenantPath(`/instructor/assessments/${aid}/builder`))}
                      style={{ background: "transparent", color: "#5b9bd5", border: "1px solid #2a4060", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(aid)}
                      style={{ background: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={mOv} onClick={() => setShowCreate(false)}>
          <div style={mMd} onClick={e => e.stopPropagation()}>
            <div style={mHd}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#e8edf4" }}>Create Assessment</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#5a7a9a" }}>✕</button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={fLabel}>TITLE</div>
                <input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Chapter 1 Quiz" style={fInput} />
              </div>
              <div>
                <div style={fLabel}>COURSE</div>
                <select value={createForm.courseId} onChange={e => setCreateForm({ ...createForm, courseId: e.target.value })} style={fInput}>
                  <option value="">Select course</option>
                  {(courses || []).map(c => {
                    const cid = c.courseID || c.courseId;
                    return <option key={cid} value={cid}>{c.title}</option>;
                  })}
                </select>
              </div>
              <div>
                <div style={fLabel}>TYPE</div>
                <select value={createForm.type} onChange={e => setCreateForm({ ...createForm, type: e.target.value })} style={fInput}>
                  <option>Quiz</option>
                  <option>Exam</option>
                  <option>Essay</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid #1e3a5f" }}>
              <button onClick={() => setShowCreate(false)} style={s.outlineBtn}>Cancel</button>
              <button onClick={handleCreate} disabled={creating} style={s.primaryBtn}>{creating ? "Creating..." : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatusBadge({ status }) {
  const map = {
    Published: { bg: "rgba(16,185,129,0.12)", c: "#10b981", b: "rgba(16,185,129,0.25)" },
    Draft: { bg: "rgba(245,158,11,0.12)", c: "#f59e0b", b: "rgba(245,158,11,0.25)" },
  };
  const d = map[status] || map.Draft;
  return <span style={{ background: d.bg, color: d.c, border: `1px solid ${d.b}`, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>{status}</span>;
}

const mOv = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const mMd = { background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 16, width: "100%", maxWidth: 480 };
const mHd = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #1e3a5f" };
const fLabel = { fontSize: 11, fontWeight: 600, color: "#5a7a9a", letterSpacing: "0.05em", marginBottom: 6, textTransform: "uppercase" };
const fInput = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #2a4060", outline: "none", fontSize: 14, background: "#0d1a2b", color: "#e8edf4" };
