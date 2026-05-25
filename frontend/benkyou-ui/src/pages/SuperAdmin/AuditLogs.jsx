import { useState, useCallback } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { SA_THEME, getNav, SA_STYLES as s } from "./saConfig";
import { useApiData } from "../../hooks/useApiData";
import { getAuditLogs } from "../../services/auditLogService";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../api/client";

export default function AuditLogs() {
  const { user: authUser } = useAuth();
  const { data: logs, isLoading } = useApiData(getAuditLogs);
  const fetchOrgs = useCallback(() => apiRequest("organization"), []);
  const { data: orgsData } = useApiData(fetchOrgs);
  const [orgFilter, setOrgFilter] = useState("All Organizations");

  const displayLogs = (logs || []).filter(log => 
    orgFilter === "All Organizations" || log.organizationName === orgFilter
  );

  const orgs = orgsData || [];

  if (isLoading) return (
    <DashboardLayout theme={SA_THEME} role="SuperAdmin" navGroups={getNav("Audit Logs")} headerTitle="Audit Logs" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#cbd5e1" }}>Loading platform logs...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout
      theme={SA_THEME}
      role="SuperAdmin"
      navGroups={getNav("Audit Logs")}
      userName={authUser?.name}
      headerTitle="Audit Logs"
      headerSub="All system actions are logged and auditable"
    >
      {/* Stats */}
      <div style={s.statsGrid}>
        <div style={s.card}>
          <div style={s.statLabel}>Total log entries</div>
          <div style={s.statValue}>{displayLogs.length}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Recent activity</div>
        </div>
        <div style={s.card}>
          <div style={s.statLabel}>Unique Actors</div>
          <div style={{ ...s.statValue, color: "#3b82f6" }}>{[...new Set(displayLogs.map(l => l.userEmail))].length}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Active administrators</div>
        </div>
      </div>

      {/* Logs Table */}
      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Activity log</h2>
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
              {orgs.map(o => <option key={o.tenantID}>{o.name}</option>)}
            </select>
            <button style={{ ...s.outlineBtn, background: "transparent", color: "#cbd5e1", borderColor: "#334155" }} className="btn-hover-dl" onClick={() => window.print()}>Export PDF</button>
          </div>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>TIMESTAMP</th>
              <th style={s.th}>ACTOR</th>
              <th style={s.th}>ACTION</th>
              <th style={s.th}>ENTITY</th>
              <th style={s.th}>IP ADDRESS</th>
            </tr>
          </thead>
          <tbody>
            {displayLogs.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No logs found.</td></tr>
            ) : (
                displayLogs.map((log) => (
                <tr key={log.auditLogID} style={s.tr}>
                    <td style={s.td}><span style={{ fontSize: 13, color: "#94a3b8" }}>{new Date(log.createdAt).toLocaleString()}</span></td>
                    <td style={s.td}><span style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 500 }}>{log.userEmail}</span></td>
                    <td style={s.td}>
                        <span style={{ 
                            background: log.action.includes("Delete") ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)", 
                            color: log.action.includes("Delete") ? "#f87171" : "#60a5fa", 
                            padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 500 
                        }}>
                            {log.action}
                        </span>
                    </td>
                    <td style={s.td}><span style={{ fontSize: 13, color: "#94a3b8" }}>{log.entityType} ({log.entityID})</span></td>
                    <td style={s.td}><span style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{log.ipAddress}</span></td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
