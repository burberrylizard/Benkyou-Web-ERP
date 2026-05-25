import { useState, useMemo } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { ADMIN_THEME, getNav, ADMIN_STYLES as s } from "./adminConfig";
import { useApiData } from "../../hooks/useApiData";
import { getCourses, createCourse, togglePublish, toggleCourseHide } from "../../services/courseService";
import { useAuth } from "../../context/AuthContext";
import CourseModal from "../../components/shared/UI/CourseModal";
import Button from "../../components/shared/UI/Button";

export default function Courses() {
  const { user: authUser } = useAuth();
  const { data: courses, isLoading, reload } = useApiData(getCourses);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [actionLoading, setActionLoading] = useState(null);
  const [publishFeedback, setPublishFeedback] = useState({ id: null, msg: "" });

  const displayCourses = courses || [];

  // Unique categories for filter
  const categories = useMemo(() => {
    const names = [...new Set(displayCourses.map(c => c.categoryName).filter(Boolean))];
    return names.sort();
  }, [displayCourses]);

  // Filtered courses
  const filtered = categoryFilter === "All" 
    ? displayCourses 
    : displayCourses.filter(c => c.categoryName === categoryFilter);

  const handleSave = async (formData) => {
    setIsSubmitting(true);
    setError("");
    try {
      await createCourse(formData);
      setIsModalOpen(false);
      reload();
    } catch (err) {
      setError(err.message || "Failed to create course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (courseId) => {
    setActionLoading(courseId);
    setPublishFeedback({ id: null, msg: "" });
    try {
      await togglePublish(courseId);
      reload();
      setPublishFeedback({ id: courseId, msg: "✓" });
      setTimeout(() => setPublishFeedback({ id: null, msg: "" }), 2000);
    } catch (err) {
      setPublishFeedback({ id: courseId, msg: "✗ Failed" });
      setTimeout(() => setPublishFeedback({ id: null, msg: "" }), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleHide = async (courseId) => {
    setActionLoading(courseId);
    try {
      await toggleCourseHide(courseId);
      reload();
    } catch (err) {
      alert(err.message || "Failed to toggle visibility");
    } finally {
      setActionLoading(null);
    }
  };

  const stats = [
    { label: "Total courses", value: displayCourses.length.toString(), sub: `${displayCourses.filter(c => c.isPublished).length} published`, subColor: "#10b981" },
    { label: "Draft", value: displayCourses.filter(c => c.status === "Draft").length.toString(), sub: "Pending review", subColor: "#f59e0b" },
    { label: "Ongoing", value: displayCourses.filter(c => c.status === "Ongoing").length.toString(), sub: "In progress", subColor: "#3b82f6" },
    { label: "Finished", value: displayCourses.filter(c => c.status === "Finished").length.toString(), sub: "Completed", subColor: "#6b7280" },
  ];

  return (
    <DashboardLayout 
      theme={ADMIN_THEME} 
      role="Admin" 
      navGroups={getNav("Courses")} 
      userName={authUser?.name} 
      headerTitle="Courses" 
      headerSub="Manage course catalog"
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
          <h2 style={s.cardTitle}>All courses</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Category filter */}
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer", outline: "none" }}
            >
              <option value="All">All categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Button onClick={() => setIsModalOpen(true)}>+ New course</Button>
          </div>
        </div>
        
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading courses...</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>COURSE</th>
                <th style={s.th}>CATEGORY</th>
                <th style={s.th}>PUBLISHED</th>
                <th style={s.th}>VISIBILITY</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ ...s.td, textAlign: "center", padding: 40, color: "#9ca3af" }}>No courses found</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.courseID} style={s.tr}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {c.sectionCount || 0} sections · {c.enrolledCount || 0} enrolled
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: 8, fontSize: 12, color: "#475569" }}>
                        {c.categoryName}
                      </span>
                    </td>
                    {/* Publish Toggle Switch */}
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ToggleSwitch
                          checked={c.isPublished}
                          disabled={actionLoading === c.courseID}
                          onChange={() => handleTogglePublish(c.courseID)}
                        />
                        <span style={{ fontSize: 12, color: c.isPublished ? "#059669" : "#b45309", fontWeight: 500 }}>
                          {c.isPublished ? "Published" : "Unpublished"}
                        </span>
                        {publishFeedback.id === c.courseID && (
                          <span style={{ fontSize: 11, color: publishFeedback.msg === "✓" ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                            {publishFeedback.msg}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={s.td}>
                      {/* Hide toggle */}
                      <button 
                        onClick={() => handleToggleHide(c.courseID)}
                        disabled={actionLoading === c.courseID}
                        style={{ 
                          padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none",
                          background: c.isHidden ? "#fef2f2" : "#f8fafc", 
                          color: c.isHidden ? "#dc2626" : "#64748b"
                        }}
                      >
                        {c.isHidden ? "🔒 Hidden" : "👁 Visible"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Course Modal */}
      <CourseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        isSubmitting={isSubmitting}
        error={error}
      />
    </DashboardLayout>
  );
}

/* ────── Toggle Switch Component ────── */
function ToggleSwitch({ checked, disabled, onChange }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: "none",
        background: checked ? "#10b981" : "#d1d5db",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
