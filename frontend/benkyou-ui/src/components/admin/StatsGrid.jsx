import React from "react";

const STATS = [
  { label: "Total users", value: "284", sub: "+12 this week", subColor: "#10b981" },
  { label: "Active courses", value: "36", sub: "3 drafts", subColor: "#6b7280" },
  { label: "Enrollments", value: "1,204", sub: "88% active", subColor: "#10b981" },
  { label: "Avg completion", value: "67%", sub: "+4% vs last month", subColor: "#10b981" },
];

export default function StatsGrid() {
  return (
    <div style={styles.statsGrid}>
      {STATS.map((stat, idx) => (
        <div key={idx} style={styles.card}>
          <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginBottom: 8 }}>{stat.label}</div>
          <div style={{ fontSize: 32, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{stat.value}</div>
          <div style={{ fontSize: 12, color: stat.subColor, fontWeight: 500 }}>{stat.sub}</div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 20,
    marginBottom: 24
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  }
};