import React, { useState } from "react";
import Badge from "./Badge";

const USERS = [
  { initials: "MR", name: "Maria Reyes", role: "Instructor", status: "Active", since: "Jan 2024", color: "#6366f1" },
  { initials: "JD", name: "Juan dela Cruz", role: "Student", status: "Active", since: "Feb 2025", color: "#3b82f6" },
  { initials: "AS", name: "Ana Santos", role: "Instructor", status: "Active", since: "Mar 2025", color: "#f59e0b" },
  { initials: "BL", name: "Ben Lopez", role: "Student", status: "Inactive", since: "Jan 2025", color: "#8b5cf6" },
];

export default function UsersTable() {
  const [userFilter, setUserFilter] = useState("All");

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>Users</h2>
        <div style={styles.tabs}>
          {["All", "Instructor", "Student"].map(tab => (
            <button 
              key={tab}
              onClick={() => setUserFilter(tab)}
              className={`tab-btn ${userFilter === tab ? "active" : ""}`}
              style={{
                ...styles.tabBtn,
                background: userFilter === tab ? "#185fa5" : "transparent",
                color: userFilter === tab ? "#fff" : "#6b7280",
                border: userFilter === tab ? "1px solid #185fa5" : "1px solid #e5e7eb",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>NAME</th>
            <th style={styles.th}>ROLE</th>
            <th style={styles.th}>STATUS</th>
            <th style={styles.th}>SINCE</th>
          </tr>
        </thead>
        <tbody>
          {USERS.map((u, i) => (
            <tr key={i} style={styles.tr}>
              <td style={styles.td}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{...styles.tinyAvatar, background: u.color}}>{u.initials}</div>
                  <span style={{ fontWeight: 500, color: "#111827" }}>{u.name}</span>
                </div>
              </td>
              <td style={styles.td}><Badge type="role" value={u.role} /></td>
              <td style={styles.td}><Badge type="status" value={u.status} /></td>
              <td style={styles.td}><span style={{ color: "#6b7280" }}>{u.since}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  cardTitle: { fontSize: 18, fontWeight: 600, color: "#111827" },
  tabs: { display: "flex", gap: 8 },
  tabBtn: { padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: { fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: 16, borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "14px 0", fontSize: 14, color: "#374151" },
  tinyAvatar: { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#fff" }
};