import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { ADMIN_THEME, getNav, ADMIN_STYLES as s } from "./adminConfig";
import { useApiData } from "../../hooks/useApiData";
import { getUsers, createUser, updateUser, deactivateUser, unlockUser, adminChangePassword } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/shared/UI/Modal";
import Button from "../../components/shared/UI/Button";

export default function Users() {
  const { user: authUser } = useAuth();
  const { data: users, isLoading, reload } = useApiData(getUsers);
  const [filter, setFilter] = useState("All");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4500);
  };

  const handleUnlock = async (id) => {
    try {
      await unlockUser(id);
      showToast("Account unlocked successfully");
      reload();
    } catch (err) {
      alert("Failed to unlock account: " + err.message);
    }
  };
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "Instructor", password: "", confirmPassword: "", yearEnrolled: "", yearLevel: "", program: "" });
  const [error, setError] = useState("");
  
  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

  const displayUsers = (users || []).map(u => ({
    ...u,
    role: u.role === 1 || u.role === "1" ? "Admin" :
          u.role === 2 || u.role === "2" ? "Instructor" :
          u.role === 3 || u.role === "3" ? "Student" :
          u.role === 5 || u.role === "5" ? "Operator" : u.role,
    _isLocked: u.isLockedOut || (u.failedLoginAttempts >= 5) || (u.lockoutEnd && new Date(u.lockoutEnd) > new Date())
  }));
  const filtered = filter === "All" ? displayUsers : displayUsers.filter((u) => u.role === filter);

  const stats = [
    { label: "Total users", value: displayUsers.length.toString(), sub: `${displayUsers.filter((u) => u.isActive).length} active`, subColor: "#10b981" },
    { label: "Instructors", value: displayUsers.filter((u) => u.role === "Instructor").length.toString(), sub: "Teaching staff", subColor: "#6b7280" },
    { label: "Students", value: displayUsers.filter((u) => u.role === "Student").length.toString(), sub: "Enrolled learners", subColor: "#6b7280" },
    { label: "Locked", value: displayUsers.filter((u) => u._isLocked).length.toString(), sub: displayUsers.filter((u) => u._isLocked).length > 0 ? "Needs attention" : "All clear", subColor: displayUsers.filter((u) => u._isLocked).length > 0 ? "#ef4444" : "#10b981" },
  ];

  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    if (user) {
      setForm({ 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        role: user.role, 
        password: "", 
        confirmPassword: "",
        yearEnrolled: user.yearEnrolled || "",
        yearLevel: user.yearLevel || "",
        program: user.program || ""
      });
    } else {
      setForm({ firstName: "", lastName: "", email: "", role: "Instructor", password: "", confirmPassword: "", yearEnrolled: "", yearLevel: "", program: "" });
    }
    setError("");
    setNewPassword("");
    setConfirmNewPw("");
    setPwError("");
    setPwSuccess("");
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole) => {
    setForm(prev => ({
      ...prev,
      role: newRole,
      yearEnrolled: "",
      yearLevel: "",
      program: ""
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedUser && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, form);
      } else {
        await createUser(form);
      }
      setIsModalOpen(false);
      reload();
    } catch (err) {
      setError(err.message || "An error occurred while saving user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess("");
    if (!newPassword || newPassword.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPw) {
      setPwError("Passwords do not match.");
      return;
    }
    setIsChangingPw(true);
    try {
      await adminChangePassword(selectedUser.id, newPassword);
      setPwSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmNewPw("");
    } catch (err) {
      setPwError(err.message || "Failed to change password.");
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Are you sure you want to toggle this user's status?")) return;
    try {
      await deactivateUser(id);
      reload();
    } catch (err) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  return (
    <DashboardLayout 
      theme={ADMIN_THEME} 
      role="Admin" 
      navGroups={getNav("Users")} 
      userName={authUser?.name} 
      headerTitle="Users" 
      headerSub="Manage instructors and students"
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
          <h2 style={s.cardTitle}>All users</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["All", "Instructor", "Student", "Operator"].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setFilter(tab)} 
                style={{ 
                  padding: "6px 14px", 
                  borderRadius: 20, 
                  fontSize: 13, 
                  fontWeight: 500, 
                  cursor: "pointer", 
                  background: filter === tab ? "#185fa5" : "transparent", 
                  color: filter === tab ? "#fff" : "#6b7280", 
                  border: filter === tab ? "1px solid #185fa5" : "1px solid #e5e7eb" 
                }}
              >
                {tab}
              </button>
            ))}
            <button onClick={() => handleOpenModal()} style={{ ...s.primaryBtn, marginLeft: 8 }} className="btn-hover-dl">+ Add user</button>
          </div>
        </div>
        
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading users...</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>USER</th>
                <th style={s.th}>ROLE</th>
                <th style={s.th}>PROGRAM</th>
                <th style={s.th}>YEAR LEVEL</th>
                <th style={s.th}>STATUS</th>
                <th style={s.th}>JOINED</th>
                <th style={s.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ ...s.td, textAlign: "center", padding: 40, color: "#9ca3af" }}>No users found</td>
                </tr>
              ) : (
                filtered.map((u, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ ...s.tinyAvatar, background: "#185fa5", color: "#fff" }}>
                          {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: "#111827" }}>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize: 12, color: "#9ca3af" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}><RoleBadge role={u.role} /></td>
                    <td style={s.td}><span style={{ color: "#4b5563", fontWeight: 500 }}>{u.role === "Student" ? (u.program || "—") : ""}</span></td>
                    <td style={s.td}><span style={{ color: "#4b5563", fontWeight: 500 }}>{u.role === "Student" ? (u.yearLevel || "—") : ""}</span></td>
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusBadge status={u.isActive ? "Active" : "Inactive"} />
                        {u._isLocked && (
                          <span
                            title={u.lockoutEnd ? `Locked until ${new Date(u.lockoutEnd).toLocaleString()} | Failed attempts: ${u.failedLoginAttempts || 0}` : `Locked | Failed attempts: ${u.failedLoginAttempts || 0}`}
                            style={{ background: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, cursor: "help", position: "relative" }}
                          >
                            🔒 Locked
                            {u.lockoutEnd && (
                              <span style={{ fontSize: 10, opacity: 0.8, marginLeft: 2 }}>
                                until {new Date(u.lockoutEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={s.td}><span style={{ color: "#6b7280" }}>{new Date(u.createdAt).toLocaleDateString()}</span></td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleOpenModal(u)} style={s.actionBtn}>Edit</button>
                        <button onClick={() => handleDeactivate(u.id)} style={{...s.actionBtn, color: u.isActive ? "#ef4444" : "#10b981"}}>{u.isActive ? "Disable" : "Enable"}</button>
                        {u._isLocked && (
                          <button onClick={() => handleUnlock(u.id)} style={{...s.actionBtn, color: "#7c3aed"}}>Unlock Account</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedUser ? "Edit user" : "Add new user"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={isSubmitting}>{selectedUser ? "Update user" : "Create user"}</Button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {selectedUser?._isLocked && (
            <div style={{
              background: "#fee2e2",
              color: "#ef4444",
              border: "1px solid #fca5a5",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8
            }}>
              <span>🔒 This user account is currently locked.</span>
              <button type="button" onClick={() => { handleUnlock(selectedUser.id); setIsModalOpen(false); }} style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                Unlock Now
              </button>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={f.group}>
              <label style={f.label}>FIRST NAME</label>
              <input style={f.input} value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} required />
            </div>
            <div style={f.group}>
              <label style={f.label}>LAST NAME</label>
              <input style={f.input} value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} required />
            </div>
          </div>
          <div style={f.group}>
            <label style={f.label}>EMAIL ADDRESS</label>
            <input style={f.input} type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
          </div>
          {!selectedUser && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={f.group}>
                <label style={f.label}>INITIAL PASSWORD</label>
                <input style={f.input} type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
              </div>
              <div style={f.group}>
                <label style={f.label}>CONFIRM PASSWORD</label>
                <input style={f.input} type="password" value={form.confirmPassword} onChange={(e) => setForm({...form, confirmPassword: e.target.value})} required />
              </div>
            </div>
          )}
          <div style={f.group}>
            <label style={f.label}>USER ROLE</label>
            <select style={f.input} value={form.role} onChange={(e) => handleRoleChange(e.target.value)}>
              <option value="Instructor">Instructor</option>
              <option value="Admin">Admin</option>
              <option value="Operator">Operator</option>
            </select>
          </div>
          {form.role === "Student" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={f.group}>
                  <label style={f.label}>YEAR ENROLLED</label>
                  <input style={f.input} type="number" value={form.yearEnrolled} onChange={(e) => setForm({...form, yearEnrolled: e.target.value})} />
                </div>
                <div style={f.group}>
                  <label style={f.label}>YEAR LEVEL</label>
                  <select style={f.input} value={form.yearLevel} onChange={(e) => setForm({...form, yearLevel: e.target.value})}>
                    <option value="">Select Year Level</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>
              <div style={f.group}>
                <label style={f.label}>PROGRAM</label>
                <input style={f.input} type="text" placeholder="e.g. BSIT, BSCS, BSED" value={form.program} onChange={(e) => setForm({...form, program: e.target.value})} />
              </div>
            </>
          )}
          {error && <div style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{error}</div>}
        </form>

        {/* Change Password Section — only for edit mode */}
        {selectedUser && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 12 }}>🔒 Change Password</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={f.group}>
                <label style={f.label}>NEW PASSWORD</label>
                <input style={f.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
              </div>
              <div style={f.group}>
                <label style={f.label}>CONFIRM PASSWORD</label>
                <input style={f.input} type="password" value={confirmNewPw} onChange={e => setConfirmNewPw(e.target.value)} placeholder="Re-enter password" />
              </div>
            </div>
            {pwError && <div style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{pwError}</div>}
            {pwSuccess && <div style={{ color: "#10b981", fontSize: 13, marginTop: 8 }}>{pwSuccess}</div>}
            <button 
              onClick={handleChangePassword} 
              disabled={isChangingPw}
              style={{ ...s.primaryBtn, marginTop: 12, background: "#7c3aed", fontSize: 13, padding: "8px 16px" }}
            >
              {isChangingPw ? "Updating..." : "Update Password"}
            </button>
          </div>
        )}
      </Modal>

      {toastMessage && (
        <>
          <style>{`
            @keyframes slideIn {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          <div style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "rgba(16, 185, 129, 0.95)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 8,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            zIndex: 9999,
            fontWeight: 500,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            animation: "slideIn 0.3s ease"
          }}>
            ✅ {toastMessage}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

const f = {
  group: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.05em" },
  input: { padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontSize: 14 }
};

function RoleBadge({ role }) {
  const c = { 
    Instructor: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" }, 
    Student: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" }, 
    Admin: { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
    Operator: { bg: "#f3e8ff", color: "#6b21a8", border: "#e9d5ff" }
  };
  const d = c[role] || c.Student;
  return <span style={{ background: d.bg, color: d.color, border: `1px solid ${d.border}`, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{role}</span>;
}

function StatusBadge({ status }) {
  const a = status === "Active";
  return <span style={{ background: a ? "#ecfdf5" : "#fef3c7", color: a ? "#047857" : "#b45309", border: `1px solid ${a ? "#a7f3d0" : "#fde68a"}`, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{status}</span>;
}
