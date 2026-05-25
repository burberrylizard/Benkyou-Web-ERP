import DashboardLayout from "../../components/shared/DashboardLayout";
import { ADMIN_THEME, getNav, ADMIN_STYLES as s } from "./adminConfig";
import { useApiData } from "../../hooks/useApiData";
import { getAuditLogs } from "../../services/auditLogService";
import { useAuth } from "../../context/AuthContext";

export default function AuditLogs() {
  const { user: authUser } = useAuth();
  const { data: logs, isLoading, error } = useApiData(getAuditLogs);

  if (isLoading) return (
    <DashboardLayout theme={ADMIN_THEME} role="Admin" navGroups={getNav("Audit Logs")} headerTitle="Audit Logs" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50 }}>Loading logs...</div>
    </DashboardLayout>
  );

  if (error || !logs) return (
    <DashboardLayout theme={ADMIN_THEME} role="Admin" navGroups={getNav("Audit Logs")} headerTitle="Audit Logs" headerSub="Error">
      <div style={{ padding: 24, background: "#fee2e2", color: "#b91c1c", borderRadius: 8, margin: 24 }}>
        Error loading audit logs: {error?.message || "No logs received"}
      </div>
    </DashboardLayout>
  );

  const displayLogs = logs || [];

  return (
    <DashboardLayout 
      theme={ADMIN_THEME} 
      role="Admin" 
      navGroups={getNav("Audit Logs")} 
      userName={authUser?.name} 
      headerTitle="Audit Logs" 
      headerSub="Track all administrative actions"
    >
      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Recent Activities</h2>
          <button style={s.outlineBtn} onClick={() => window.print()}>Export Log</button>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>TIMESTAMP</th>
              <th style={s.th}>USER</th>
              <th style={s.th}>ACTION</th>
              <th style={s.th}>ENTITY</th>
              <th style={s.th}>IP ADDRESS</th>
            </tr>
          </thead>
          <tbody>
            {displayLogs.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No activity logs found.</td></tr>
            ) : (
              displayLogs.map((log) => (
                <tr key={log.auditLogID} style={s.tr}>
                  <td style={s.td}><span style={{ color: "#6b7280", fontSize: 13 }}>{new Date(log.createdAt).toLocaleString()}</span></td>
                  <td style={{ ...s.td, fontWeight: 500, color: "#111827" }}>{log.userEmail}</td>
                  <td style={s.td}>
                    <span style={{ 
                      background: log.action.toLowerCase().includes("suspicious") || log.action.toLowerCase().includes("locked")
                        ? "#fee2e2"
                        : log.action.includes("Delete") 
                        ? "#fef2f2" 
                        : "#eff6ff", 
                      color: log.action.toLowerCase().includes("suspicious") || log.action.toLowerCase().includes("locked")
                        ? "#ef4444"
                        : log.action.includes("Delete") 
                        ? "#dc2626" 
                        : "#1d4ed8", 
                      border: log.action.toLowerCase().includes("suspicious") || log.action.toLowerCase().includes("locked")
                        ? "1px solid #fca5a5"
                        : "none",
                      padding: "4px 8px", 
                      borderRadius: 6, 
                      fontSize: 12, 
                      fontWeight: 600 
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={s.td}>{log.entityType} ({log.entityID})</td>
                  <td style={s.td}><span style={{ fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>{log.ipAddress}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
