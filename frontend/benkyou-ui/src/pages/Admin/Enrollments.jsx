import { useState, useMemo } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { ADMIN_THEME, getNav, ADMIN_STYLES as s } from "./adminConfig";
import { useApiData } from "../../hooks/useApiData";
import { getEnrollments, adminEnroll } from "../../services/enrollmentService";
import { getStudents } from "../../services/userService";
import { getCourses } from "../../services/courseService";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/shared/UI/Modal";
import Button from "../../components/shared/UI/Button";

export default function Enrollments() {
  const { user: authUser } = useAuth();
  const { data: enrollments, isLoading, reload } = useApiData(getEnrollments);
  const { data: students } = useApiData(getStudents);
  const { data: courses } = useApiData(getCourses);
  
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ studentID: "", courseID: "" });

  // Get unique course titles for filter
  const courseNames = useMemo(() => {
    if (!enrollments) return [];
    const names = [...new Set(enrollments.map(e => e.courseTitle))];
    return names.sort();
  }, [enrollments]);

  // Apply both filters
  const filtered = useMemo(() => {
    if (!enrollments) return [];
    let result = enrollments;
    if (statusFilter !== "All") result = result.filter(e => e.status === statusFilter);
    if (courseFilter !== "All") result = result.filter(e => e.courseTitle === courseFilter);
    return result;
  }, [enrollments, statusFilter, courseFilter]);

  if (isLoading) return (
    <DashboardLayout theme={ADMIN_THEME} role="Admin" navGroups={getNav("Enrollments")} headerTitle="Enrollments" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50 }}>Loading enrollments...</div>
    </DashboardLayout>
  );

  const allEnrollments = enrollments || [];

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!form.studentID || !form.courseID) {
      alert("Please select both student and course");
      return;
    }
    setIsSubmitting(true);
    try {
      await adminEnroll(form.studentID, parseInt(form.courseID));
      setShowModal(false);
      setForm({ studentID: "", courseID: "" });
      reload();
    } catch (err) {
      alert(err.message || "Failed to enroll student");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout 
      theme={ADMIN_THEME} 
      role="Admin" 
      navGroups={getNav("Enrollments")} 
      userName={authUser?.name} 
      headerTitle="Enrollments" 
      headerSub="Manage student course enrollments"
    >
      <div style={s.statsGrid}>
        {[
          { label: "Total enrollments", value: allEnrollments.length.toString(), sub: `${allEnrollments.filter(e => e.status === "Active").length} active`, subColor: "#10b981" },
          { label: "Students", value: students?.length?.toString() || "0", sub: "Potential learners", subColor: "#6b7280" },
          { label: "Completed", value: allEnrollments.filter(e => e.status === "Completed").length.toString(), sub: "Finished courses", subColor: "#10b981" },
          { label: "Dropped", value: allEnrollments.filter(e => e.status === "Dropped").length.toString(), sub: "Needs follow-up", subColor: "#f59e0b" },
        ].map((stat, i) => (
          <div key={i} style={s.card}>
            <div style={s.statLabel}>{stat.label}</div>
            <div style={s.statValue}>{stat.value}</div>
            <div style={{ fontSize: 12, color: stat.subColor, fontWeight: 500 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>All enrollments</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* Status filter tabs */}
            {["All", "Active", "Completed", "Dropped"].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setStatusFilter(tab)} 
                style={{ 
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", 
                  background: statusFilter === tab ? "#185fa5" : "transparent", 
                  color: statusFilter === tab ? "#fff" : "#6b7280", 
                  border: statusFilter === tab ? "1px solid #185fa5" : "1px solid #e5e7eb" 
                }}
              >
                {tab}
              </button>
            ))}

            {/* Course filter dropdown */}
            <select 
              value={courseFilter} 
              onChange={e => setCourseFilter(e.target.value)}
              style={{ 
                padding: "6px 12px", borderRadius: 8, fontSize: 13, 
                border: "1px solid #e5e7eb", background: "#fff", color: "#374151",
                cursor: "pointer", outline: "none"
              }}
            >
              <option value="All">All courses</option>
              {courseNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <button style={{ ...s.primaryBtn, marginLeft: 4 }} className="btn-hover-dl" onClick={() => setShowModal(true)}>+ Enroll student</button>
          </div>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>STUDENT</th>
              <th style={s.th}>COURSE</th>
              <th style={s.th}>STATUS</th>
              <th style={s.th}>ENROLLED</th>
              <th style={s.th}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No enrollments found.</td></tr>
            ) : (
              filtered.map((e, i) => (
                <tr key={i} style={s.tr}>
                  <td style={s.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img 
                        src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${e.studentEmail}`} 
                        alt={e.studentName} 
                        style={{ width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9" }} 
                      />
                      <span style={{ fontWeight: 500, color: "#111827" }}>{e.studentName}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={{ fontWeight: 500, color: "#111827" }}>{e.courseTitle}</div>
                    {e.categoryName && <div style={{ fontSize: 12, color: "#94a3b8" }}>{e.categoryName}</div>}
                  </td>
                  <td style={s.td}><EnrollBadge status={e.status} /></td>
                  <td style={s.td}><span style={{ color: "#6b7280", fontSize: 13 }}>{new Date(e.enrolledAt).toLocaleDateString()}</span></td>
                  <td style={s.td}><button style={s.actionBtn}>•••</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Enroll Student"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleEnroll} isLoading={isSubmitting}>Enroll Now</Button>
          </>
        }
      >
        <form onSubmit={handleEnroll} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={f.group}>
            <label style={f.label}>SELECT STUDENT</label>
            <select style={f.input} required value={form.studentID} onChange={e => setForm({...form, studentID: e.target.value})}>
              <option value="">Select a student</option>
              {students?.map(stu => (
                <option key={stu.id} value={stu.id}>{stu.firstName} {stu.lastName} ({stu.email})</option>
              ))}
            </select>
          </div>
          <div style={f.group}>
            <label style={f.label}>SELECT COURSE</label>
            <select style={f.input} required value={form.courseID} onChange={e => setForm({...form, courseID: e.target.value})}>
              <option value="">Select a course</option>
              {courses?.map(crs => (
                <option key={crs.courseID} value={crs.courseID}>{crs.title}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

function EnrollBadge({ status }) {
  const map = { Active: { bg: "#ecfdf5", c: "#047857", b: "#a7f3d0" }, Completed: { bg: "#eff6ff", c: "#1d4ed8", b: "#bfdbfe" }, Dropped: { bg: "#fef2f2", c: "#dc2626", b: "#fecaca" } };
  const d = map[status] || map.Active;
  return <span style={{ background: d.bg, color: d.c, border: `1px solid ${d.b}`, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{status}</span>;
}

const f = {
  group: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.05em" },
  input: { padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontSize: 14 }
};
