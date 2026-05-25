import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { OP_THEME, getNav, OP_STYLES as s } from "./operatorConfig";
import { getCourses, getCourseRoster } from "../../services/courseService";
import { getClassSections } from "../../services/classSectionService";
import { unenrollStudent } from "../../services/enrollmentService";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/shared/Pagination";

export default function OperatorRosters() {
  const { user: authUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [sections, setSections] = useState([]);
  const [roster, setRoster] = useState({ instructors: [], students: [] });
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoadingCourses(true);
        const data = await getCourses();
        setCourses(data || []);
        if (data && data.length > 0) {
          setSelectedCourseId(data[0].courseID.toString());
        }
      } catch (err) {
        console.error("Failed to load courses", err);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadRosterAndSections(parseInt(selectedCourseId));
    } else {
      setRoster({ instructors: [], students: [] });
      setSections([]);
    }
    setSearchQuery("");
    setSectionFilter("All");
    setCurrentPage(1);
  }, [selectedCourseId]);

  const loadRosterAndSections = async (courseId) => {
    try {
      setLoadingRoster(true);
      const [rosterData, sectionsData] = await Promise.all([
        getCourseRoster(courseId),
        getClassSections(courseId)
      ]);
      setRoster(rosterData || { instructors: [], students: [] });
      setSections(sectionsData || []);
    } catch (err) {
      console.error("Failed to load roster or sections", err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleUnenroll = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove "${studentName}" from this course? This will clear all their progress.`)) {
      return;
    }
    try {
      await unenrollStudent(parseInt(selectedCourseId), studentId);
      alert("Student removed from course successfully.");
      await loadRosterAndSections(parseInt(selectedCourseId));
    } catch (err) {
      alert(`Failed to unenroll student: ${err.message || err}`);
    }
  };

  // Filter students based on search query and section selection
  const filteredStudents = useMemo(() => {
    let list = roster.students || [];
    if (sectionFilter !== "All") {
      list = list.filter(s => s.classSectionName === sectionFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [roster.students, searchQuery, sectionFilter]);

  // Paginated students
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const totalStudents = filteredStudents.length;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSectionFilterChange = (e) => {
    setSectionFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout
      theme={OP_THEME}
      role="Operator"
      navGroups={getNav("Course Rosters")}
      userName={authUser?.name}
      headerTitle="Course Rosters & Directory"
      headerSub="View enrolled students, manage class cohorts, see active instructors, and remove students if needed."
    >
      {/* Course Selector Header */}
      <div style={{ ...s.card, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: "#e8edf4", fontSize: 16 }}>Select Course to View</h3>
          <span style={{ fontSize: 12, color: "#7a8ba3" }}>Roster updates and segmentations adapt instantly</span>
        </div>
        <div style={{ minWidth: 260 }}>
          {loadingCourses ? (
            <span style={{ fontSize: 12, color: "#7a8ba3" }}>Loading courses...</span>
          ) : (
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              style={s.select}
            >
              <option value="">-- Select Course --</option>
              {courses.map(c => (
                <option key={c.courseID} value={c.courseID}>{c.title}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {selectedCourseId ? (
        <div style={s.twoCol}>
          {/* Main Roster Card */}
          <div style={{ ...s.tableCard, flex: 3 }}>
            <div style={s.cardHeader}>
              <h3 style={s.cardTitle}>Enrolled Students ({filteredStudents.length})</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="🔍 Search name or email..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{ ...s.input, width: 200, padding: "6px 12px", fontSize: 13 }}
                />
                <select
                  value={sectionFilter}
                  onChange={handleSectionFilterChange}
                  style={{ ...s.select, padding: "6px 12px", fontSize: 13 }}
                >
                  <option value="All">All Sections</option>
                  <option value="Unassigned">Unassigned</option>
                  {sections.map(sec => (
                    <option key={sec.classSectionID} value={sec.name}>{sec.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingRoster ? (
              <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>Loading roster...</div>
            ) : paginatedStudents.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>No students found matching filters.</div>
            ) : (
              <div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>STUDENT</th>
                      <th style={s.th}>SECTION</th>
                      <th style={{ ...s.th, textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((stud) => (
                      <tr key={stud.studentID} style={s.tr}>
                        <td style={s.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <img
                              src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${stud.email}`}
                              alt={stud.name}
                              style={{ width: 32, height: 32, borderRadius: "50%", background: "#111c2e", border: "1px solid #1e3a5f" }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, color: "#e8edf4" }}>{stud.name}</div>
                              <div style={{ fontSize: 11, color: "#7a8ba3" }}>{stud.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={s.td}>
                          <span style={{
                            background: stud.classSectionName !== "Unassigned" ? "rgba(91,155,213,0.12)" : "rgba(122,139,163,0.12)",
                            color: stud.classSectionName !== "Unassigned" ? "#5b9bd5" : "#7a8ba3",
                            border: stud.classSectionName !== "Unassigned" ? "1px solid rgba(91,155,213,0.25)" : "1px solid rgba(122,139,163,0.25)",
                            padding: "4px 10px",
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 500
                          }}>
                            {stud.classSectionName || "Unassigned"}
                          </span>
                        </td>
                        <td style={{ ...s.td, textAlign: "right" }}>
                          <button
                            onClick={() => handleUnenroll(stud.studentID, stud.name)}
                            style={{
                              background: "rgba(239,68,68,0.15)",
                              color: "#ef4444",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            🗑 Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination component */}
                <Pagination
                  totalItems={totalStudents}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onChange={setCurrentPage}
                />
              </div>
            )}
          </div>

          {/* Right Card: Teaching Staff */}
          <div style={{ ...s.card, flex: 1.2, height: "fit-content" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#e8edf4" }}>Teaching Staff</h3>
            <p style={{ color: "#7a8ba3", fontSize: 12, marginBottom: 20 }}>
              Instructors currently assigned to sections under this course.
            </p>

            {loadingRoster ? (
              <div style={{ color: "#5a7a9a", fontSize: 13 }}>Loading instructors...</div>
            ) : roster.instructors.length === 0 ? (
              <div style={{ color: "#7a8ba3", fontSize: 13, fontStyle: "italic" }}>
                No instructors assigned to any sections yet. Assign them inside the Class Sections panel.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {roster.instructors.map((inst, index) => (
                  <div 
                    key={`${inst.instructorID}-${index}`}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 12, 
                      padding: 12, 
                      borderRadius: 8, 
                      background: "#111c2e", 
                      border: "1px solid #1e3a5f" 
                    }}
                  >
                    <img
                      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${inst.email}`}
                      alt={inst.name}
                      style={{ width: 36, height: 36, borderRadius: "50%", background: "#0b132b", border: "1px solid #1e3a5f" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#e8edf4", fontSize: 13, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {inst.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#7a8ba3", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {inst.email}
                      </div>
                      <div style={{ 
                        marginTop: 4, 
                        display: "inline-block", 
                        fontSize: 10, 
                        background: "rgba(91,155,213,0.15)", 
                        color: "#5b9bd5", 
                        padding: "2px 6px", 
                        borderRadius: 4, 
                        fontWeight: 600 
                      }}>
                        🧑‍🏫 {inst.classSectionName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ ...s.card, padding: 60, textAlign: "center", color: "#5a7a9a" }}>
          Select a course from the header dropdown to view its roster, section divisions, and teaching staff.
        </div>
      )}
    </DashboardLayout>
  );
}
