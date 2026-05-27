import { useState, useCallback } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { SA_THEME, getNav, SA_STYLES as s } from "./saConfig";
import { useApiData } from "../../hooks/useApiData";
import { getUsers, toggleUserStatus, deleteUser, unlockUser } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/session";
import { apiRequest } from "../../api/client";

export default function AllUsers() {
  const { user: authUser } = useAuth();
  const { data: users, isLoading, reload } = useApiData(getUsers);
  const fetchOrgs = useCallback(() => apiRequest("organization"), []);
  const { data: orgsData } = useApiData(fetchOrgs);
  
  const [roleFilter, setRoleFilter] = useState("All");
  const [orgFilter, setOrgFilter] = useState("All Organizations");
  const [activeMenu, setActiveMenu] = useState(null);

  const ROLE_MAP = { 
    1: "Admin", "1": "Admin", "Admin": "Admin",
    2: "Instructor", "2": "Instructor", "Instructor": "Instructor",
    3: "Student", "3": "Student", "Student": "Student"
  };
  
  const displayUsers = (users || []).map(u => ({
    ...u,
    roleName: ROLE_MAP[u.role] || "Unknown",
    _isLocked: u.isLockedOut || (u.failedLoginAttempts >= 5) || (u.lockoutEnd && new Date(u.lockoutEnd) > new Date())
  }));

  const filtered = displayUsers.filter((u) => {
    const matchesRole = roleFilter === "All" || u.roleName === roleFilter;
    const matchesOrg = orgFilter === "All Organizations" || u.organizationName === orgFilter;
    return matchesRole && matchesOrg;
  });

  const handleToggleStatus = async (id) => {
    setActiveMenu(null);
    try {
      await toggleUserStatus(id);
      reload();
    } catch (err) {
      alert(err.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (id) => {
    setActiveMenu(null);
    if (confirm("Are you sure you want to permanently delete this user account?")) {
      try {
        await deleteUser(id);
        reload();
      } catch (err) {
        alert(err.message || "Failed to delete user");
      }
    }
  };

  const handleUnlock = async (id) => {
    setActiveMenu(null);
    try {
      await unlockUser(id);
      alert("Account unlocked successfully");
      reload();
    } catch (err) {
      alert(err.message || "Failed to unlock account: " + err.message);
    }
  };

  if (isLoading) return (
    <DashboardLayout theme={SA_THEME} role="SuperAdmin" navGroups={getNav("All Users")} headerTitle="All Users" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50 }}>Loading platform users...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout
      theme={SA_THEME}
      role="SuperAdmin"
      navGroups={getNav("All Users")}
      userName={authUser?.name}
      headerTitle="All Users"
      headerSub="Platform-wide user management"
    >
      {/* Stats */}
      <div style={s.statsGrid}>
        {[
          { label: "Total users", value: displayUsers.length.toString(), sub: `${displayUsers.filter((u) => u.isActive).length} active`, subColor: "#10b981" },
          { label: "Admins", value: displayUsers.filter((u) => u.roleName === "Admin").length.toString(), sub: "Across all orgs", subColor: "#94a3b8" },
          { label: "Instructors", value: displayUsers.filter((u) => u.roleName === "Instructor").length.toString(), sub: "Teaching staff", subColor: "#94a3b8" },
          { label: "Students", value: displayUsers.filter((u) => u.roleName === "Student").length.toString(), sub: "Enrolled learners", subColor: "#94a3b8" },
        ].map((stat, i) => (
          <div key={i} style={s.card}>
            <div style={s.statLabel}>{stat.label}</div>
            <div style={s.statValue}>{stat.value}</div>
            <div style={{ fontSize: 12, color: stat.subColor, fontWeight: 500 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>All platform users</h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <select 
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              style={{
                background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px",
                color: "#cbd5e1", fontSize: 13, outline: "none"
              }}
            >
              <option>All Organizations</option>
              {(orgsData || []).map(o => <option key={o.tenantID}>{o.name}</option>)}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              {["All", "Admin", "Instructor", "Student"].map((tab) => (
                <button key={tab} onClick={() => setRoleFilter(tab)} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer",
                  background: roleFilter === tab ? SA_THEME.primary : "transparent",
                  color: roleFilter === tab ? "#fff" : "#94a3b8",
                  border: roleFilter === tab ? `1px solid ${SA_THEME.primary}` : "1px solid #334155",
                }}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>USER</th>
              <th style={s.th}>ORGANIZATION</th>
              <th style={s.th}>ROLE</th>
              <th style={s.th}>STATUS</th>
              <th style={s.th}>JOINED</th>
              <th style={s.th}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No users found.</td></tr>
            ) : (
                filtered.map((u, i) => (
                <tr key={i} style={s.tr}>
                    <td style={s.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ ...localS.avatar, background: SA_THEME.primary }}>{getInitials(u.firstName + " " + u.lastName)}</div>
                        <div>
                        <div style={{ fontWeight: 500, color: "#f8fafc" }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{u.email}</div>
                        </div>
                    </div>
                    </td>
                    <td style={s.td}>{u.organizationName}</td>
                    <td style={s.td}><RoleBadge role={u.roleName} /></td>
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={u.isActive ? s.statusActive : s.statusInactive}>
                          {u.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                        {u._isLocked && (
                          <span
                            title={u.lockoutEnd ? `Locked until ${new Date(u.lockoutEnd).toLocaleString()}` : "Locked by administrator"}
                            style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, cursor: "help" }}
                          >
                            🔒 Locked
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={s.td}><span style={{ color: "#64748b" }}>{new Date(u.createdAt).toLocaleDateString()}</span></td>
                    <td style={{ ...s.td, position: "relative" }}>
                      <button 
                        style={localS.actionBtn} 
                        onClick={() => setActiveMenu(activeMenu === i ? null : i)}
                      >•••</button>
                      
                      {activeMenu === i && (
                        <div style={localS.menu}>
                          <div style={localS.menuItem} onClick={() => handleToggleStatus(u.id)}>{u.isActive ? "Deactivate" : "Activate"}</div>
                          {u._isLocked && (
                            <div style={{ ...localS.menuItem, color: "#10b981" }} onClick={() => handleUnlock(u.id)}>Unlock User</div>
                          )}
                          <div style={{ ...localS.menuItem, color: "#ef4444" }} onClick={() => handleDeleteUser(u.id)}>Delete User</div>
                        </div>
                      )}
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

function RoleBadge({ role }) {
  const c = { 
    Admin: { bg: "rgba(30, 58, 95, 0.2)", color: "#7eb3e8", border: "rgba(126, 179, 232, 0.3)" }, 
    Instructor: { bg: "rgba(139, 92, 246, 0.1)", color: "#a78bfa", border: "rgba(167, 139, 250, 0.2)" }, 
    Student: { bg: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: "rgba(52, 211, 153, 0.2)" } 
  };
  const d = c[role] || c.Student;
  return <span style={{ background: d.bg, color: d.color, border: `1px solid ${d.border}`, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{role}</span>;
}

const localS = {
  avatar: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#fff", flexShrink: 0 },
  actionBtn: { background: "transparent", border: "1px solid #334155", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 14, color: "#94a3b8" },
  menu: { position: "absolute", right: 24, top: 40, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 0", zIndex: 10, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)", minWidth: 140 },
  menuItem: { padding: "8px 16px", fontSize: 13, color: "#cbd5e1", cursor: "pointer", transition: "background 0.2s" }
};
