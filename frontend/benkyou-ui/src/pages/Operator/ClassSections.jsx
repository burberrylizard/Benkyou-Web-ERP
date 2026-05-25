import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { OP_THEME, getNav, OP_STYLES as s } from "./operatorConfig";
import { getCourses } from "../../services/courseService";
import { 
  getClassSections, 
  createClassSection, 
  deleteClassSection, 
  updateClassSection 
} from "../../services/classSectionService";
import { getInstructors } from "../../services/userService";
import Pagination from "../../components/shared/Pagination";

export default function ClassSections() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [sections, setSections] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);

  // Form states (Dual-Mode: Create vs Edit)
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(40);
  const [instructorId, setInstructorId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editSectionId, setEditSectionId] = useState(null); // Null means Create Mode

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingCourses(true);
        const coursesData = await getCourses();
        setCourses(coursesData || []);
        if (coursesData && coursesData.length > 0) {
          setSelectedCourseId(coursesData[0].courseID.toString());
        }

        const instructorsData = await getInstructors();
        setInstructors(instructorsData || []);
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadSections(parseInt(selectedCourseId));
      resetForm();
    } else {
      setSections([]);
    }
  }, [selectedCourseId]);

  const loadSections = async (courseId) => {
    try {
      setLoadingSections(true);
      const data = await getClassSections(courseId);
      setSections(data || []);
      setCurrentPage(1); // Reset page on course switch
    } catch (err) {
      console.error("Failed to load sections", err);
    } finally {
      setLoadingSections(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCapacity(40);
    setInstructorId("");
    setEditSectionId(null);
  };

  const handleEditClick = (sec) => {
    setEditSectionId(sec.classSectionID);
    setName(sec.name);
    setCapacity(sec.capacity);
    setInstructorId(sec.instructorID || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!selectedCourseId) {
      alert("Please select a course first.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        capacity: parseInt(capacity) || 40,
        instructorId: instructorId ? instructorId : null,
      };

      if (editSectionId) {
        // Edit Mode
        await updateClassSection(editSectionId, payload);
        alert("Class section updated successfully!");
      } else {
        // Create Mode
        await createClassSection({
          courseId: parseInt(selectedCourseId),
          ...payload
        });
        alert("Class section created successfully!");
      }
      resetForm();
      await loadSections(parseInt(selectedCourseId));
    } catch (err) {
      alert(`Failed to save class section: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, sectionName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${sectionName}"? Any students assigned to this section will be marked as "Unassigned".`
      )
    ) {
      return;
    }

    try {
      await deleteClassSection(id);
      alert("Section deleted successfully.");
      if (editSectionId === id) resetForm();
      await loadSections(parseInt(selectedCourseId));
    } catch (err) {
      alert(`Failed to delete section: ${err.message || err}`);
    }
  };

  // Pagination slicing
  const totalSections = sections.length;
  const paginatedSections = sections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout
      theme={OP_THEME}
      role="Operator"
      navGroups={getNav("Class Sections")}
      headerTitle="Class Sections & Divisions"
      headerSub="Divide large cohorts into bounded course sections and assign instructors."
    >
      <div style={s.twoCol}>
        {/* Management Card */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Class Sections List</h3>
            <div style={{ minWidth: 200 }}>
              {loadingCourses ? (
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading courses...</span>
              ) : (
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  style={s.select}
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((c) => (
                    <option key={c.courseID} value={c.courseID}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            {loadingSections ? (
              <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>
                Loading sections...
              </div>
            ) : !selectedCourseId ? (
              <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>
                Select a course from the dropdown to manage sections.
              </div>
            ) : sections.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>
                No class sections exist for this course yet. Create one on the right.
              </div>
            ) : (
              <div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>SECTION NAME</th>
                      <th style={s.th}>INSTRUCTOR</th>
                      <th style={s.th}>ENROLLED / CAPACITY</th>
                      <th style={s.th}>CREATED AT</th>
                      <th style={{ ...s.th, textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSections.map((sec) => {
                      const isFull = sec.enrolledCount >= sec.capacity;
                      const isEditingThis = editSectionId === sec.classSectionID;
                      return (
                        <tr 
                          key={sec.classSectionID} 
                          style={{ 
                            ...s.tr, 
                            background: isEditingThis ? "rgba(24,95,165,0.08)" : undefined 
                          }}
                        >
                          <td style={{ ...s.td, color: "#e8edf4", fontWeight: 600 }}>
                            {sec.name}
                          </td>
                          <td style={s.td}>
                            <span style={{ 
                              color: sec.instructorID ? "#e8edf4" : "#7a8ba3", 
                              fontWeight: sec.instructorID ? 500 : 400,
                              fontSize: 13 
                            }}>
                              👤 {sec.instructorName || "Unassigned"}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span
                              style={{
                                color: isFull ? "#ef4444" : "#10b981",
                                fontWeight: 700,
                              }}
                            >
                              {sec.enrolledCount}
                            </span>{" "}
                            /{" "}
                            <span style={{ color: "#8ea4bd", fontWeight: 500 }}>
                              {sec.capacity}
                            </span>
                            {isFull && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: 10,
                                  background: "rgba(239,68,68,0.15)",
                                  color: "#ef4444",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  fontWeight: 600,
                                }}
                              >
                                FULL
                              </span>
                            )}
                          </td>
                          <td style={s.td}>
                            {new Date(sec.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ ...s.td, textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: 8 }}>
                              <button
                                onClick={() => handleEditClick(sec)}
                                style={{
                                  background: "rgba(24,95,165,0.15)",
                                  color: "#5b9bd5",
                                  border: "none",
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDelete(sec.classSectionID, sec.name)}
                                style={{
                                  background: "rgba(239,68,68,0.15)",
                                  color: "#ef4444",
                                  border: "none",
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                🗑 Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Component */}
                <Pagination
                  totalItems={totalSections}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>

        {/* Creation / Editing Card */}
        {selectedCourseId && (
          <div style={{ ...s.card, height: "fit-content" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#e8edf4" }}>
              {editSectionId ? "✏️ Edit Class Section" : "Create Class Section"}
            </h3>
            <p style={{ color: "#7a8ba3", fontSize: 12, marginBottom: 20 }}>
              {editSectionId 
                ? "Modify the selected class section name, capacity, and instructor assignments." 
                : "Establish a new section assignment block under this course with custom seat limits and instructor assignments."
              }
            </p>
            <form onSubmit={handleSubmit}>
              <div style={s.formGroup}>
                <label style={s.label}>Section Name / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Programming 101 - 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={s.input}
                  required
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Maximum Capacity Cap</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 40"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  style={s.input}
                  required
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Assigned Instructor</label>
                <select
                  value={instructorId}
                  onChange={(e) => setInstructorId(e.target.value)}
                  style={s.select}
                >
                  <option value="">-- No Assigned Instructor (Unassigned) --</option>
                  {instructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.firstName} {inst.lastName} ({inst.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {editSectionId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{ 
                      flex: 1, 
                      padding: "12px 18px", 
                      borderRadius: 6, 
                      background: "transparent", 
                      color: "#7a8ba3", 
                      border: "1px solid #1e3a5f", 
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...s.primaryBtn, flex: 2, padding: "12px 18px" }}
                >
                  {submitting 
                    ? "Saving..." 
                    : editSectionId 
                      ? "Save Changes" 
                      : "Create Section"
                  }
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
