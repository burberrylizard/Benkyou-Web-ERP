import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { OP_THEME, getNav, OP_STYLES as s } from "./operatorConfig";
import { getCourses } from "../../services/courseService";
import { getClassSections } from "../../services/classSectionService";
import { getOperatorStudents, getBatchEnrollPreview, batchEnroll } from "../../services/operatorService";
import { useTenant } from "../../context/TenantContext";
import { getTerminology, getYearLevelsList } from "../../utils/terminology";
import { getMyOrganization } from "../../services/organizationService";
import Pagination from "../../components/shared/Pagination";

export default function BatchEnroll() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [orgType, setOrgType] = useState("HigherEducation");
  
  const term = getTerminology(orgType);

  // Selection states
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedProgram, setSelectedProgram] = useState(`Any ${term.program}`);
  const [selectedYearLevel, setSelectedYearLevel] = useState(`Any ${term.yearLevel}`);
  
  const [sections, setSections] = useState([]);

  // Preview state
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [enrollResult, setEnrollResult] = useState(null);

  // Excluded student IDs state
  const [excludedStudentIds, setExcludedStudentIds] = useState(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const { tenantPath } = useTenant();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingInitial(true);
        const [orgData, coursesData, studentsData] = await Promise.all([
          getMyOrganization().catch(() => null),
          getCourses(),
          getOperatorStudents()
        ]);
        if (orgData && orgData.organizationType) {
          setOrgType(orgData.organizationType);
          const activeTerm = getTerminology(orgData.organizationType);
          setSelectedProgram(`Any ${activeTerm.program}`);
          setSelectedYearLevel(`Any ${activeTerm.yearLevel}`);
        }
        setCourses(coursesData || []);
        setStudents(studentsData || []);
      } catch (err) {
        alert("Failed to load initial data: " + (err.message || err));
      } finally {
        setLoadingInitial(false);
      }
    };
    loadInitialData();
  }, []);

  // Fetch sections when target course changes
  useEffect(() => {
    if (selectedCourse) {
      getClassSections(parseInt(selectedCourse))
        .then(res => setSections(res || []))
        .catch(err => {
          console.error("Failed to load sections", err);
          setSections([]);
        });
    } else {
      setSections([]);
    }
    setSelectedSection("");
  }, [selectedCourse]);

  // Reset exclusions when preview parameters change
  useEffect(() => {
    setExcludedStudentIds(new Set());
  }, [selectedCourse, selectedProgram, selectedYearLevel]);

  const toggleStudentExclusion = (studentId) => {
    setExcludedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const eligibleStudents = preview?.students?.filter(s => !s.isAlreadyEnrolled) || [];
  const allEligibleAreChecked = eligibleStudents.length > 0 && eligibleStudents.every(s => !excludedStudentIds.has(s.id));

  const handleToggleSelectAll = () => {
    if (allEligibleAreChecked) {
      // Exclude all eligible students
      const newExclusions = new Set(excludedStudentIds);
      eligibleStudents.forEach(s => newExclusions.add(s.id));
      setExcludedStudentIds(newExclusions);
    } else {
      // Include all eligible students (remove them from exclusions)
      const newExclusions = new Set(excludedStudentIds);
      eligibleStudents.forEach(s => newExclusions.delete(s.id));
      setExcludedStudentIds(newExclusions);
    }
  };

  // Fetch preview when options change
  useEffect(() => {
    if (!selectedCourse) {
      setPreview(null);
      return;
    }

    const fetchPreviewData = async () => {
      try {
        setLoadingPreview(true);
        const programFilter = selectedProgram.startsWith("Any ") ? "" : selectedProgram;
        const yearLevelFilter = selectedYearLevel.startsWith("Any ") ? "" : selectedYearLevel;
        const data = await getBatchEnrollPreview(
          selectedCourse,
          programFilter,
          yearLevelFilter
        );
        setPreview(data);
        setCurrentPage(1); // Reset page on query criteria switch
      } catch (err) {
        console.error("Preview failed:", err);
      } finally {
        setLoadingPreview(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchPreviewData();
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [selectedCourse, selectedProgram, selectedYearLevel]);

  const handleBatchEnroll = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      alert("Please select a target course.");
      return;
    }

    if (!preview || preview.willBeEnrolled === 0) {
      alert(`There are no new ${term.studentPlural.toLowerCase()} in this cohort to enroll.`);
      return;
    }

    const actualWillBeEnrolledCount = Math.max(0, preview.willBeEnrolled - excludedStudentIds.size);
    if (actualWillBeEnrolledCount === 0) {
      alert(`Please select at least one ${term.student.toLowerCase()} to enroll.`);
      return;
    }

    const targetCourseObj = courses.find(c => c.courseID.toString() === selectedCourse.toString());
    const targetSectionObj = sections.find(s => s.classSectionID.toString() === selectedSection.toString());
    const sectionText = targetSectionObj ? ` (assigned to Section "${targetSectionObj.name}")` : "";
    const confirmMsg = `You are about to batch enroll ${actualWillBeEnrolledCount} ${term.studentPlural.toLowerCase()} into "${targetCourseObj?.title || "selected course"}"${sectionText}.\n\nAre you sure you want to proceed?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      setSubmitting(true);
      const programFilter = selectedProgram.startsWith("Any ") ? "" : selectedProgram;
      const yearLevelFilter = selectedYearLevel.startsWith("Any ") ? "" : selectedYearLevel;
      const res = await batchEnroll(
        parseInt(selectedCourse),
        programFilter,
        yearLevelFilter,
        selectedSection ? parseInt(selectedSection) : null,
        Array.from(excludedStudentIds)
      );
      setEnrollResult(res);
      alert(`Successfully enrolled ${res.enrolled} ${term.studentPlural.toLowerCase()}!`);
    } catch (err) {
      alert("Failed to execute batch enrollment: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const distinctPrograms = [`Any ${term.program}`, ...new Set(students.map(s => s.program).filter(Boolean))];
  const distinctYearLevels = [`Any ${term.yearLevel}`, ...getYearLevelsList(orgType)];

  // Slice preview students list for pagination
  const previewStudents = preview?.students || [];
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return previewStudents.slice(start, start + itemsPerPage);
  }, [previewStudents, currentPage]);

  return (
    <DashboardLayout
      theme={OP_THEME}
      role="Operator"
      navGroups={getNav("Batch Enroll")}
      headerTitle="Batch Enrollment"
      headerSub={`Enroll ${term.student.toLowerCase()} cohorts into courses matching ${term.program.toLowerCase()} and ${term.yearLevel.toLowerCase()} criteria.`}
    >
      <div style={s.twoCol}>
        {/* ENROLLMENT CRITERIA FORM CARD */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Enrollment Criteria</h2>
          </div>

          {loadingInitial ? (
            <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>Loading parameters...</div>
          ) : (
            <form onSubmit={handleBatchEnroll}>
              <div style={s.formGroup}>
                <label style={s.label}>1. Select Target Course *</label>
                <select
                  required
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setEnrollResult(null);
                  }}
                  style={s.select}
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map(c => (
                    <option key={c.courseID} value={c.courseID}>{c.title}</option>
                  ))}
                </select>
              </div>

              {selectedCourse && (
                <div style={s.formGroup}>
                  <label style={s.label}>2. Select Class Section (Optional)</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setEnrollResult(null);
                    }}
                    style={s.select}
                  >
                    <option value="">-- No Section Assigned (Unassigned) --</option>
                    {sections.map(sec => (
                      <option key={sec.classSectionID} value={sec.classSectionID}>
                        {sec.name} (Capacity: {sec.enrolledCount}/{sec.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={s.formGroup}>
                <label style={s.label}>3. Filter by {term.program}</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => {
                    setSelectedProgram(e.target.value);
                    setEnrollResult(null);
                  }}
                  style={s.select}
                >
                  {distinctPrograms.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>4. Filter by {term.yearLevel}</label>
                <select
                  value={selectedYearLevel}
                  onChange={(e) => {
                    setSelectedYearLevel(e.target.value);
                    setEnrollResult(null);
                  }}
                  style={s.select}
                >
                  {distinctYearLevels.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {preview && preview.willBeEnrolled > 0 && (
                <button
                  type="submit"
                  style={{ ...s.primaryBtn, width: "100%", padding: "12px 18px", marginTop: 12 }}
                  className="btn-hover-dl"
                  disabled={submitting}
                >
                  {submitting ? "Processing enrollments..." : `Enroll ${Math.max(0, preview.willBeEnrolled - excludedStudentIds.size)} ${term.studentPlural} Now`}
                </button>
              )}
            </form>
          )}
        </div>

        {/* LIVE PREVIEW & RESULT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={s.tableCard}>
            <div style={s.cardHeader}>
              <h2 style={s.cardTitle}>Cohort Live Preview</h2>
              {loadingPreview && <span style={{ fontSize: 12, color: "#5b9bd5" }}>Calculating...</span>}
            </div>

            {!selectedCourse ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#5a7a9a", fontSize: 14 }}>
                Please select a target course in the form to see matching student statistics.
              </div>
            ) : loadingPreview && !preview ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#5a7a9a" }}>Calculating cohort size...</div>
            ) : preview ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(30,58,95,0.4)" }}>
                  <span style={{ color: "#7a8ba3", fontSize: 14 }}>Total matching active {term.studentPlural.toLowerCase()}:</span>
                  <span style={{ color: "#e8edf4", fontWeight: 700, fontSize: 16 }}>{preview.matchingStudents}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(30,58,95,0.4)" }}>
                  <span style={{ color: "#7a8ba3", fontSize: 14 }}>Already enrolled in course:</span>
                  <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 16 }}>-{preview.alreadyEnrolled}</span>
                </div>
                 <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(30,58,95,0.4)" }}>
                  <span style={{ color: "#7a8ba3", fontSize: 14 }}>New enrollments to create:</span>
                  <span style={{ color: "#10b981", fontWeight: 700, fontSize: 20 }}>{Math.max(0, preview.willBeEnrolled - excludedStudentIds.size)}</span>
                </div>

                {preview.willBeEnrolled === 0 && (
                  <div style={{ padding: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, fontSize: 12, color: "#f59e0b", marginTop: 8 }}>
                    ⚠️ All matching {term.studentPlural.toLowerCase()} in this program and year level are already enrolled in this course.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* BATCH ENROLL CONFIRMATION DIALOG */}
          {enrollResult && (
            <div style={{ ...s.tableCard, borderColor: "#10b981", background: "rgba(16,185,129,0.02)" }}>
              <div style={s.cardHeader}>
                <h2 style={{ ...s.cardTitle, color: "#10b981" }}>Success Confirmation</h2>
              </div>
              <div style={{ fontSize: 14, color: "#a0b4cb", display: "flex", flexDirection: "column", gap: 12 }}>
                <div>Course Name: <strong>{enrollResult.courseTitle}</strong></div>
                <div>Enrolled {term.studentPlural}: <strong style={{ color: "#10b981" }}>{enrollResult.enrolled}</strong></div>
                <div>Skipped (Already Enrolled): <strong style={{ color: "#f59e0b" }}>{enrollResult.skipped}</strong></div>
                <button
                  style={{ ...s.outlineBtn, marginTop: 12, width: "100%" }}
                  onClick={() => navigate(tenantPath("/operator/batch-enroll/history"))}
                >
                  View Historical Logs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cohort Student List Preview Table */}
      {preview && preview.students && preview.students.length > 0 && (
        <div style={{ ...s.tableCard, marginTop: 24 }}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Cohort {term.student} Roster ({preview.students.length})</h2>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, width: 40, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      disabled={eligibleStudents.length === 0}
                      checked={allEligibleAreChecked}
                      onChange={handleToggleSelectAll}
                      style={{ cursor: "pointer", width: 16, height: 16 }}
                    />
                  </th>
                  <th style={s.th}>{term.student} ID</th>
                  <th style={s.th}>{term.student} Info</th>
                  <th style={s.th}>{term.program}</th>
                  <th style={s.th}>{term.yearLevel}</th>
                  <th style={s.th}>Enrollment Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student) => {
                  const isEligible = !student.isAlreadyEnrolled;
                  const isChecked = isEligible ? !excludedStudentIds.has(student.id) : false;
                  return (
                    <tr key={student.id} style={s.tr}>
                      <td style={{ ...s.td, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          disabled={!isEligible}
                          checked={isEligible ? isChecked : true}
                          onChange={() => isEligible && toggleStudentExclusion(student.id)}
                          style={{ cursor: isEligible ? "pointer" : "not-allowed", width: 15, height: 15 }}
                        />
                      </td>
                      <td style={{ ...s.td, fontWeight: 700, color: "#5b9bd5" }}>{student.studentNumber}</td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 600, color: "#e8edf4" }}>{student.fullName}</div>
                        <div style={{ fontSize: 12, color: "#7a8ba3" }}>{student.email}</div>
                      </td>
                      <td style={s.td}>{student.program || "—"}</td>
                      <td style={s.td}>{student.yearLevel || "—"}</td>
                      <td style={s.td}>
                        <span 
                          style={s.badge(
                            student.isAlreadyEnrolled ? "rgba(245, 158, 11, 0.08)" : (excludedStudentIds.has(student.id) ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)"),
                            student.isAlreadyEnrolled ? "#f59e0b" : (excludedStudentIds.has(student.id) ? "#ef4444" : "#10b981"),
                            student.isAlreadyEnrolled ? "rgba(245, 158, 11, 0.2)" : (excludedStudentIds.has(student.id) ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)")
                          )}
                        >
                          {student.isAlreadyEnrolled ? "Already Enrolled" : (excludedStudentIds.has(student.id) ? "Excluded" : "Will Be Enrolled")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div style={{ marginTop: 16 }}>
            <Pagination
              totalItems={previewStudents.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
