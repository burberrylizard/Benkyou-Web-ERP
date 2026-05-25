import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { OP_THEME, getNav, OP_STYLES as s } from "./operatorConfig";
import { 
  getOperatorStudents, 
  createStudent, 
  activateStudent, 
  deactivateStudent, 
  resetStudentPassword 
} from "../../services/operatorService";
import { getTerminology, getYearLevelsList } from "../../utils/terminology";
import { getMyOrganization } from "../../services/organizationService";
import Pagination from "../../components/shared/Pagination";

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [yearLevelFilter, setYearLevelFilter] = useState("");
  const [orgType, setOrgType] = useState("HigherEducation");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Add form fields
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    yearEnrolled: new Date().getFullYear(),
    yearLevel: "1st Year",
    program: "",
  });

  // Reset password form fields
  const [resetPasswordVal, setResetPasswordVal] = useState("");

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const [orgData, studentData] = await Promise.all([
        getMyOrganization().catch(() => null),
        getOperatorStudents()
      ]);
      if (orgData && orgData.organizationType) {
        setOrgType(orgData.organizationType);
        setNewStudent(prev => ({ 
          ...prev, 
          yearLevel: getYearLevelsList(orgData.organizationType)[0] 
        }));
      }
      setStudents(studentData || []);
    } catch (err) {
      alert("Failed to load students: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleToggleStatus = async (student) => {
    const confirmMsg = student.isActive 
      ? `Are you sure you want to deactivate ${student.fullName}?`
      : `Are you sure you want to activate ${student.fullName}?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      if (student.isActive) {
        await deactivateStudent(student.id);
      } else {
        await activateStudent(student.id);
      }
      fetchStudents();
    } catch (err) {
      alert("Failed to toggle status: " + (err.message || err));
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.email || !newStudent.password) {
      alert("Please fill in all required fields (First Name, Last Name, Email, Password).");
      return;
    }

    try {
      await createStudent({
        ...newStudent,
        yearEnrolled: newStudent.yearEnrolled ? parseInt(newStudent.yearEnrolled) : null,
      });
      setShowAddModal(false);
      setNewStudent({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        yearEnrolled: new Date().getFullYear(),
        yearLevel: getYearLevelsList(orgType)[0],
        program: "",
      });
      fetchStudents();
      alert("Student created successfully!");
    } catch (err) {
      alert("Failed to create student: " + (err.message || err));
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPasswordVal || resetPasswordVal.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      await resetStudentPassword(selectedStudent.id, resetPasswordVal);
      setShowResetModal(false);
      setResetPasswordVal("");
      setSelectedStudent(null);
      alert("Password reset successfully!");
    } catch (err) {
      alert("Failed to reset password: " + (err.message || err));
    }
  };

  const term = getTerminology(orgType);
  const distinctYearLevels = getYearLevelsList(orgType);

  // Extract distinct programs for filters
  const distinctPrograms = [...new Set(students.map(s => s.program).filter(Boolean))];

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.fullName?.toLowerCase().includes(search.toLowerCase()) || 
      student.email?.toLowerCase().includes(search.toLowerCase()) ||
      student.studentNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesProgram = !programFilter || student.program === programFilter;
    const matchesYearLevel = !yearLevelFilter || student.yearLevel === yearLevelFilter;
    return matchesSearch && matchesProgram && matchesYearLevel;
  });

  return (
    <DashboardLayout
      theme={OP_THEME}
      role="Operator"
      navGroups={getNav(`Manage ${term.studentPlural}`)}
      headerTitle={`Manage ${term.studentPlural}`}
      headerSub={`Manual creation, toggling account active state, and password resets.`}
    >
      <div style={s.tableCard}>
        {/* Table Controls */}
        <div style={{ ...s.cardHeader, gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 280, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder={`Search by name, email, or ID...`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ ...s.input, maxWidth: 260 }}
            />
            <select
              value={programFilter}
              onChange={(e) => { setProgramFilter(e.target.value); setCurrentPage(1); }}
              style={{ ...s.select, maxWidth: 160 }}
            >
              <option value="">All {term.programPlural}</option>
              {distinctPrograms.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={yearLevelFilter}
              onChange={(e) => { setYearLevelFilter(e.target.value); setCurrentPage(1); }}
              style={{ ...s.select, maxWidth: 160 }}
            >
              <option value="">All {term.yearLevelPlural}</option>
              {distinctYearLevels.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button 
            style={s.primaryBtn} 
            className="btn-hover-dl"
            onClick={() => setShowAddModal(true)}
          >
            + Add {term.student}
          </button>
        </div>

        {/* Student Table */}
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>Loading...</div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>No records found matching filters.</div>
          ) : (
            <div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>{term.student} ID</th>
                    <th style={s.th}>{term.student} Info</th>
                    <th style={s.th}>{term.program}</th>
                    <th style={s.th}>{term.yearLevel}</th>
                    <th style={s.th}>Year Enrolled</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((student) => (
                    <tr key={student.id} style={s.tr}>
                      <td style={{ ...s.td, fontWeight: 700, color: "#5b9bd5" }}>{student.studentNumber || "—"}</td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 600, color: "#e8edf4" }}>{student.fullName}</div>
                        <div style={{ fontSize: 12, color: "#7a8ba3" }}>{student.email}</div>
                      </td>
                      <td style={s.td}>{student.program || "—"}</td>
                      <td style={s.td}>{student.yearLevel || "—"}</td>
                      <td style={s.td}>{student.yearEnrolled || "—"}</td>
                      <td style={s.td}>
                        <span 
                          style={s.badge(
                            student.isActive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            student.isActive ? "#10b981" : "#ef4444",
                            student.isActive ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"
                          )}
                        >
                          {student.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            style={{
                              ...s.outlineBtn,
                              padding: "6px 12px",
                              fontSize: 12,
                              borderColor: student.isActive ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)",
                              color: student.isActive ? "#ef4444" : "#10b981"
                            }}
                            onClick={() => handleToggleStatus(student)}
                          >
                            {student.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            style={{ ...s.outlineBtn, padding: "6px 12px", fontSize: 12 }}
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowResetModal(true);
                            }}
                          >
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                totalItems={filteredStudents.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#e8edf4" }}>Add New {term.student}</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: "transparent", border: "none", color: "#7a8ba3", fontSize: 20, cursor: "pointer" }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateStudent}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={s.formGroup}>
                  <label style={s.label}>First Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                    style={s.input}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                    style={s.input}
                  />
                </div>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  style={s.input}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  style={s.input}
                  placeholder="Min 6 characters, mixed case"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={s.formGroup}>
                  <label style={s.label}>Year Enrolled</label>
                  <input
                    type="number"
                    value={newStudent.yearEnrolled}
                    onChange={(e) => setNewStudent({ ...newStudent, yearEnrolled: e.target.value })}
                    style={s.input}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>{term.yearLevel}</label>
                  <select
                    value={newStudent.yearLevel}
                    onChange={(e) => setNewStudent({ ...newStudent, yearLevel: e.target.value })}
                    style={s.select}
                  >
                    {distinctYearLevels.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>{term.program} / Group (e.g. BSIT)</label>
                <input
                  type="text"
                  placeholder={`e.g. BSIT, STEM, Sales, Team A`}
                  value={newStudent.program}
                  onChange={(e) => setNewStudent({ ...newStudent, program: e.target.value.toUpperCase() })}
                  style={s.input}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                <button 
                  type="button" 
                  style={s.outlineBtn} 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={s.primaryBtn}
                  className="btn-hover-dl"
                >
                  Create {term.student}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && selectedStudent && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#e8edf4" }}>Reset Password</h3>
              <button 
                onClick={() => {
                  setShowResetModal(false);
                  setSelectedStudent(null);
                }}
                style={{ background: "transparent", border: "none", color: "#7a8ba3", fontSize: 20, cursor: "pointer" }}
              >
                &times;
              </button>
            </div>
            
            <p style={{ fontSize: 14, color: "#a0b4cb", marginBottom: 20 }}>
              Set a new temporary password for <strong>{selectedStudent.fullName}</strong> ({selectedStudent.email}).
            </p>

            <form onSubmit={handleResetPassword}>
              <div style={s.formGroup}>
                <label style={s.label}>New Password *</label>
                <input
                  type="password"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  style={s.input}
                  placeholder="Min 6 characters, mixed case"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                <button 
                  type="button" 
                  style={s.outlineBtn} 
                  onClick={() => {
                    setShowResetModal(false);
                    setSelectedStudent(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={s.primaryBtn}
                  className="btn-hover-dl"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
