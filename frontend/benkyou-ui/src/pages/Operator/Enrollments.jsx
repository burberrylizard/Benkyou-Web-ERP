import React, { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { OP_THEME, getNav, OP_STYLES as s } from "./operatorConfig";
import { useApiData } from "../../hooks/useApiData";
import { getEnrollments, adminEnroll } from "../../services/enrollmentService";
import { getStudents } from "../../services/userService";
import { getCourses } from "../../services/courseService";
import { getClassSections } from "../../services/classSectionService";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/shared/UI/Modal";
import Button from "../../components/shared/UI/Button";

export default function OperatorEnrollments() {
  const { user: authUser } = useAuth();
  const { data: enrollments, isLoading, reload } = useApiData(getEnrollments);
  const { data: students } = useApiData(getStudents);
  const { data: courses } = useApiData(getCourses);
  
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ studentID: "", courseID: "", classSectionID: "" });
  const [sections, setSections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch sections when course ID changes in the enrollment form
  useEffect(() => {
    if (form.courseID) {
      getClassSections(parseInt(form.courseID))
        .then(res => setSections(res || []))
        .catch(err => {
          console.error(err);
          setSections([]);
        });
    } else {
      setSections([]);
    }
  }, [form.courseID]);

  const courseNames = useMemo(() => {
    if (!enrollments) return [];
    const names = [...new Set(enrollments.map(e => e.courseTitle))];
    return names.sort();
  }, [enrollments]);

  const filtered = useMemo(() => {
    if (!enrollments) return [];
    let result = enrollments;
    if (statusFilter !== "All") result = result.filter(e => e.status === statusFilter);
    if (courseFilter !== "All") result = result.filter(e => e.courseTitle === courseFilter);
    return result;
  }, [enrollments, statusFilter, courseFilter]);

  // Client-side pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleStatusFilterChange = (tab) => {
    setStatusFilter(tab);
    setCurrentPage(1);
  };

  const handleCourseFilterChange = (val) => {
    setCourseFilter(val);
    setCurrentPage(1);
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!form.studentID || !form.courseID) {
      alert("Please select both student and course");
      return;
    }
    setIsSubmitting(true);
    try {
      await adminEnroll(
        form.studentID, 
        parseInt(form.courseID), 
        form.classSectionID ? parseInt(form.classSectionID) : null
      );
      setShowModal(false);
      setForm({ studentID: "", courseID: "", classSectionID: "" });
      reload();
    } catch (err) {
      alert(err.message || "Failed to enroll student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allEnrollments = enrollments || [];

  return (
    <DashboardLayout 
      theme={OP_THEME} 
      role="Operator" 
      navGroups={getNav("Enrollments")} 
      userName={authUser?.name} 
      headerTitle="Enrollments" 
      headerSub="Manage student course enrollments"
    >
      <div style={s.statsGrid}>
        {[
          { label: "Total enrollments", value: allEnrollments.length.toString(), sub: `${allEnrollments.filter(e => e.status === "Active").length} active`, subColor: "#10b981" },
          { label: "Students", value: students?.length?.toString() || "0", sub: "Potential learners", subColor: "#5b9bd5" },
          { label: "Completed", value: allEnrollments.filter(e => e.status === "Completed").length.toString(), sub: "Finished courses", subColor: "#10b981" },
          { label: "Dropped", value: allEnrollments.filter(e => e.status === "Dropped").length.toString(), sub: "Needs follow-up", subColor: "#ef4444" },
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
            {["All", "Active", "Completed", "Dropped"].map((tab) => (
              <button 
                key={tab} 
                onClick={() => handleStatusFilterChange(tab)} 
                style={{ 
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", 
                  background: statusFilter === tab ? "#185fa5" : "transparent", 
                  color: statusFilter === tab ? "#fff" : "#7a8ba3", 
                  border: statusFilter === tab ? "1px solid #185fa5" : "1px solid #1e3a5f" 
                }}
              >
                {tab}
              </button>
            ))}

            <select 
              value={courseFilter} 
              onChange={e => handleCourseFilterChange(e.target.value)}
              style={s.select}
            >
              <option value="All">All courses</option>
              {courseNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <button style={{ ...s.primaryBtn, marginLeft: 4 }} className="btn-hover-dl" onClick={() => setShowModal(true)}>+ Enroll student</button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>Loading enrollments...</div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>STUDENT</th>
                    <th style={s.th}>COURSE</th>
                    <th style={s.th}>SECTION</th>
                    <th style={s.th}>STATUS</th>
                    <th style={s.th}>ENROLLED</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, color: "#5a7a9a" }}>No enrollments found.</td></tr>
                  ) : (
                    paginatedData.map((e, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <img 
                              src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${e.studentEmail}`} 
                              alt={e.studentName} 
                              style={{ width: 32, height: 32, borderRadius: "50%", background: "#111c2e", border: "1px solid #1e3a5f" }} 
                            />
                            <span style={{ fontWeight: 500, color: "#e8edf4" }}>{e.studentName}</span>
                          </div>
                        </td>
                        <td style={s.td}>
                          <div style={{ fontWeight: 500, color: "#e8edf4" }}>{e.courseTitle}</div>
                          {e.categoryName && <div style={{ fontSize: 12, color: "#5a7a9a" }}>{e.categoryName}</div>}
                        </td>
                        <td style={s.td}>
                          <span style={{ 
                            background: e.classSectionName && e.classSectionName !== "Unassigned" ? "rgba(91,155,213,0.12)" : "rgba(122,139,163,0.12)", 
                            color: e.classSectionName && e.classSectionName !== "Unassigned" ? "#5b9bd5" : "#7a8ba3", 
                            border: e.classSectionName && e.classSectionName !== "Unassigned" ? "1px solid rgba(91,155,213,0.25)" : "1px solid rgba(122,139,163,0.25)", 
                            padding: "4px 10px", 
                            borderRadius: 12, 
                            fontSize: 12, 
                            fontWeight: 500 
                          }}>
                            {e.classSectionName || "Unassigned"}
                          </span>
                        </td>
                        <td style={s.td}><EnrollBadge status={e.status} /></td>
                        <td style={s.td}><span style={{ color: "#7a8ba3", fontSize: 13 }}>{new Date(e.enrolledAt).toLocaleDateString()}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderTop: "1px solid #1e3a5f", flexWrap: "wrap", gap: 12 }}>
                <span style={{ fontSize: 13, color: "#7a8ba3" }}>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} enrollments
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    style={{
                      padding: "6px 12px", borderRadius: 4, background: "#111c2e", color: currentPage === 1 ? "#3a5378" : "#fff",
                      border: "1px solid #1e3a5f", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: "6px 12px", color: "#e8edf4", fontSize: 13 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    style={{
                      padding: "6px 12px", borderRadius: 4, background: "#111c2e", color: currentPage === totalPages ? "#3a5378" : "#fff",
                      border: "1px solid #1e3a5f", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
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
          <div style={s.formGroup}>
            <label style={s.label}>SELECT STUDENT</label>
            <select style={s.input} required value={form.studentID} onChange={e => setForm({...form, studentID: e.target.value})}>
              <option value="">Select a student</option>
              {students?.map(stu => (
                <option key={stu.id} value={stu.id}>{stu.firstName} {stu.lastName} ({stu.email})</option>
              ))}
            </select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>SELECT COURSE</label>
            <select style={s.input} required value={form.courseID} onChange={e => setForm({...form, courseID: e.target.value, classSectionID: ""})}>
              <option value="">Select a course</option>
              {courses?.map(crs => (
                <option key={crs.courseID} value={crs.courseID}>{crs.title}</option>
              ))}
            </select>
          </div>
          {form.courseID && (
            <div style={s.formGroup}>
              <label style={s.label}>SELECT SECTION (OPTIONAL)</label>
              <select style={s.input} value={form.classSectionID} onChange={e => setForm({...form, classSectionID: e.target.value})}>
                <option value="">No Section Assigned (Unassigned)</option>
                {sections.map(sec => (
                  <option key={sec.classSectionID} value={sec.classSectionID}>{sec.name} (Cap: {sec.enrolledCount}/{sec.capacity})</option>
                ))}
              </select>
            </div>
          )}
        </form>
      </Modal>
    </DashboardLayout>
  );
}

function EnrollBadge({ status }) {
  const map = { 
    Active: { bg: "rgba(16,185,129,0.12)", c: "#10b981", b: "rgba(16,185,129,0.25)" }, 
    Completed: { bg: "rgba(59,130,246,0.12)", c: "#3b82f6", b: "rgba(59,130,246,0.25)" }, 
    Dropped: { bg: "rgba(239,68,68,0.12)", c: "#ef4444", b: "rgba(239,68,68,0.25)" } 
  };
  const d = map[status] || map.Active;
  return <span style={{ background: d.bg, color: d.c, border: `1px solid ${d.b}`, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{status}</span>;
}
