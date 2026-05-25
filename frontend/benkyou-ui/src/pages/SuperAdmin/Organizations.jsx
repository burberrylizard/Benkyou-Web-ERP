import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { SA_THEME, getNav, SA_STYLES as s } from "./saConfig";
import { useApiData } from "../../hooks/useApiData";
import { getOrganizations } from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../api/client";

const localS = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#1e293b", padding: 30, borderRadius: 8, width: 420, border: "1px solid #334155" },
  input: { width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f8fafc", marginTop: 5, boxSizing: "border-box" },
  label: { display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600 }
};

export default function OrganizationsManagement() {
  const { user: authUser } = useAuth();
  const { data: organizations, isLoading, reload } = useApiData(getOrganizations);
  const [showModal, setShowModal] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", tenantCode: "", primaryEmail: "", password: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [updating, setUpdating] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
        await apiRequest("organization", { method: "POST", body: newOrg });
        setShowModal(false);
        setNewOrg({ name: "", tenantCode: "", primaryEmail: "", password: "" });
        reload();
    } catch (err) {
        alert(err.message || "Failed to register organization");
    } finally {
        setIsCreating(false);
    }
  };

  const toggleStatus = async (org) => {
    setUpdating(org.tenantID);
    try {
      await apiRequest(`organization/${org.tenantID}/status`, {
        method: "PATCH",
        body: { isActive: !org.isActive }
      });
      reload();
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) return (
    <DashboardLayout theme={SA_THEME} role="SuperAdmin" navGroups={getNav("Organizations")} headerTitle="Organizations" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50 }}>Loading tenants...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout 
      theme={SA_THEME} 
      role="SuperAdmin" 
      navGroups={getNav("Organizations")} 
      userName={authUser?.name} 
      headerTitle="Organizations" 
      headerSub="Manage system tenants and access"
    >
      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>System Tenants</h2>
          <button style={s.primaryBtn} onClick={() => setShowModal(true)}>+ Register New</button>
        </div>

        {showModal && (
          <div style={localS.overlay}>
            <div style={localS.modal}>
              <h3 style={{ ...s.cardTitle, marginBottom: 20 }}>Register New Organization</h3>
              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={localS.label}>Organization Name</label>
                  <input 
                    required 
                    style={localS.input} 
                    value={newOrg.name} 
                    onChange={e => setNewOrg({...newOrg, name: e.target.value})} 
                    placeholder="e.g. University of Mindanao"
                  />
                </div>
                <div>
                  <label style={localS.label}>Tenant Code (Unique)</label>
                  <input 
                    required 
                    style={localS.input} 
                    value={newOrg.tenantCode} 
                    onChange={e => setNewOrg({...newOrg, tenantCode: e.target.value.toLowerCase().replace(/\s/g, "-")})} 
                    placeholder="e.g. um-main"
                  />
                </div>
                <div>
                  <label style={localS.label}>Primary Admin Email</label>
                  <input 
                    required 
                    type="email"
                    style={localS.input} 
                    value={newOrg.primaryEmail} 
                    onChange={e => setNewOrg({...newOrg, primaryEmail: e.target.value})} 
                    placeholder="admin@org.com"
                  />
                </div>
                <div>
                  <label style={localS.label}>Admin Password</label>
                  <input 
                    required 
                    type="password"
                    style={localS.input} 
                    value={newOrg.password} 
                    onChange={e => setNewOrg({...newOrg, password: e.target.value})} 
                    placeholder="•••••••• (Min 8 chars, 1 digit, 1 spec)"
                  />
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                  <button type="button" style={s.outlineBtn} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={isCreating} style={s.primaryBtn}>
                    {isCreating ? "Registering..." : "Register Organization"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>NAME</th>
              <th style={s.th}>CODE</th>
              <th style={s.th}>EMAIL</th>
              <th style={s.th}>CREATED AT</th>
              <th style={s.th}>STATUS</th>
              <th style={s.th}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {(organizations || []).map((org) => (
              <tr key={org.tenantID} style={s.tr}>
                <td style={{ ...s.td, fontWeight: 500, color: "#f1f5f9" }}>{org.name}</td>
                <td style={s.td}><code style={{ background: "#334155", color: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>{org.tenantCode}</code></td>
                <td style={s.td}>{org.primaryEmail}</td>
                <td style={s.td}>{new Date(org.createdAt).toLocaleDateString()}</td>
                <td style={s.td}>
                  <span style={org.isActive ? s.statusActive : s.statusInactive}>
                    {org.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
                <td style={s.td}>
                  <button 
                    disabled={updating === org.tenantID}
                    onClick={() => toggleStatus(org)}
                    style={{ 
                      ...s.outlineBtn, 
                      fontSize: 12, 
                      padding: "4px 10px",
                      color: org.isActive ? "#dc2626" : "#059669",
                      borderColor: org.isActive ? "#fca5a5" : "#6ee7b7"
                    }}
                  >
                    {updating === org.tenantID ? "..." : org.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
