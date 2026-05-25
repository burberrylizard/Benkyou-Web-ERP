import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { SA_THEME, getNav, SA_STYLES as s } from "./saConfig";
import { apiRequest } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const SETTINGS_GROUPS = [
  {
    title: "General",
    icon: "⚙️",
    settings: [
      { label: "Platform name", value: "Benkyou", type: "text" },
      { label: "Support email", value: "support@benkyou.ph", type: "text" },
      { label: "Default timezone", value: "Asia/Manila", type: "select" },
      { label: "Default language", value: "English", type: "select" },
    ],
  },
  {
    title: "Registration",
    icon: "📝",
    settings: [
      { label: "Allow public registration", value: true, type: "toggle" },
      { label: "Require admin approval for new orgs", value: false, type: "toggle" },
      { label: "Default plan for new organizations", value: "Free", type: "select" },
      { label: "Trial period (days)", value: "14", type: "number" },
    ],
  },
  {
    title: "Notifications",
    icon: "🔔",
    settings: [
      { label: "Email notifications enabled", value: true, type: "toggle" },
      { label: "Notify on new org registration", value: true, type: "toggle" },
      { label: "Notify on payment failures", value: true, type: "toggle" },
      { label: "Weekly system digest", value: false, type: "toggle" },
    ],
  },
];

export default function Settings() {
  const { user: authUser } = useAuth();
  
  const [confirmAction, setConfirmAction] = useState(null); // 'reset-analytics' | 'purge-logs' | null
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const handleDangerAction = async (e) => {
    e.preventDefault();
    setIsExecuting(true);
    try {
      const res = await apiRequest("settings/danger-action", {
        method: "POST",
        body: {
          action: confirmAction,
          password: confirmPassword
        }
      });
      alert(res.message || "Operation executed successfully!");
      setConfirmAction(null);
      setConfirmPassword("");
    } catch (err) {
      alert(err.message || "Failed to confirm. Please check your password.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <DashboardLayout
      theme={SA_THEME}
      role="SuperAdmin"
      navGroups={getNav("Platform Settings")}
      userName={authUser?.name}
      headerTitle="Platform Settings"
      headerSub="Configure system-wide preferences"
    >
      {SETTINGS_GROUPS.map((group) => (
        <div key={group.title} style={s.tableCard}>
          <div style={s.cardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{group.icon}</span>
              <h2 style={s.cardTitle}>{group.title}</h2>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {group.settings.map((setting, i) => (
              <div key={i} style={localS.settingRow}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#f1f5f9" }}>{setting.label}</div>
                </div>
                <div>
                  {setting.type === "toggle" ? (
                    <ToggleSwitch checked={setting.value} />
                  ) : setting.type === "select" ? (
                    <div style={localS.selectWrap}>
                      <span style={{ fontSize: 14, color: "#cbd5e1" }}>{setting.value}</span>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>▼</span>
                    </div>
                  ) : (
                    <div style={localS.valueWrap}>
                      <span style={{ fontSize: 14, color: "#cbd5e1" }}>{setting.value}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Danger Zone */}
      <div style={{ ...s.tableCard, border: "1px solid rgba(239, 68, 68, 0.3)" }}>
        <div style={s.cardHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <h2 style={{ ...s.cardTitle, color: "#f87171" }}>Danger zone</h2>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 8, border: "1px solid rgba(239, 68, 68, 0.1)", background: "rgba(239, 68, 68, 0.05)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#f1f5f9" }}>Reset platform analytics</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>Clear all usage metrics and start fresh. This cannot be undone.</div>
            </div>
            <button style={localS.dangerBtn} onClick={() => setConfirmAction("reset-analytics")}>Reset analytics</button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 8, border: "1px solid rgba(239, 68, 68, 0.1)", background: "rgba(239, 68, 68, 0.05)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#f1f5f9" }}>Purge audit logs</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>Delete all audit log entries older than 90 days.</div>
            </div>
            <button style={localS.dangerBtn} onClick={() => setConfirmAction("purge-logs")}>Purge logs</button>
          </div>
        </div>
      </div>

      {/* Password Confirmation Modal */}
      {confirmAction && (
        <div style={localS.overlay}>
          <div style={localS.modal}>
            <h3 style={{ ...s.cardTitle, color: "#f87171", marginBottom: 12 }}>Confirm Danger Zone Action</h3>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20, lineHeight: 1.5 }}>
              You are about to execute: <strong style={{ color: "#f1f5f9" }}>{confirmAction === "reset-analytics" ? "Reset platform analytics" : "Purge audit logs"}</strong>.
              This action requires your SuperAdmin password to authorize.
            </p>
            <form onSubmit={handleDangerAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={localS.label}>SuperAdmin Password</label>
                <input 
                  required
                  type="password"
                  style={localS.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter password to authorize..."
                />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                <button type="button" style={s.outlineBtn} onClick={() => { setConfirmAction(null); setConfirmPassword(""); }}>Cancel</button>
                <button type="submit" disabled={isExecuting} style={{ ...s.primaryBtn, background: "#dc2626", borderColor: "#dc2626" }}>
                  {isExecuting ? "Executing..." : "Confirm Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button style={{ ...s.primaryBtn, padding: "12px 32px", fontSize: 15 }} className="btn-hover-dl" onClick={() => alert("Settings saved successfully")}>
          Save all changes
        </button>
      </div>
    </DashboardLayout>
  );
}

function ToggleSwitch({ checked }) {
  return (
    <div style={{
      width: 44, height: 24, borderRadius: 12,
      background: checked ? "#1e3a5f" : "#334155",
      position: "relative", cursor: "pointer",
      transition: "background 0.2s",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3,
        left: checked ? 23 : 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 0.2s",
      }} />
    </div>
  );
}

const localS = {
  settingRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 0", borderBottom: "1px solid #1f2937",
  },
  selectWrap: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 14px", background: "#0f172a", border: "1px solid #334155",
    borderRadius: 8, cursor: "pointer", minWidth: 140,
  },
  valueWrap: {
    padding: "8px 14px", background: "#0f172a", border: "1px solid #334155",
    borderRadius: 8, minWidth: 80, textAlign: "center",
  },
  dangerBtn: {
    background: "transparent", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)",
    padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500,
    cursor: "pointer", flexShrink: 0,
  },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#1e293b", padding: 30, borderRadius: 8, width: 400, border: "1px solid #334155" },
  input: { width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f8fafc", marginTop: 5, boxSizing: "border-box" },
  label: { display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600 }
};
