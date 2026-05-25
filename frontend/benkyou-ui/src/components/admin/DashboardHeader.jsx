import React from "react";

export default function DashboardHeader() {
  return (
    <header style={styles.header}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111827", marginBottom: 4 }}>Admin dashboard</h1>
        <p style={{ fontSize: 14, color: "#6b7280" }}>DLSU · May 2026</p>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <button style={styles.iconBtn}>
          🔔
          <span style={styles.notificationDot} />
        </button>
        <div style={styles.avatarWrap}>CJ</div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "32px 40px 24px",
    background: "#f4f5f7",
    borderBottom: "1px solid #e5e7eb",
    zIndex: 10
  },
  iconBtn: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#4b5563",
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 6,
    height: 6,
    background: "#ef4444",
    borderRadius: "50%"
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer"
  }
};