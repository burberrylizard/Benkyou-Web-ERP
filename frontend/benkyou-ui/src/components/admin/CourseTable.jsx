import React from "react";
import Badge from "./Badge";

const COURSES = [
  { title: "Web Development 101", enrolled: 48, max: 50, status: "Published" },
  { title: "Intro to Python", enrolled: 36, max: 50, status: "Published" },
  { title: "Database Design", enrolled: 22, max: 40, status: "Published" },
  { title: "UI/UX Fundamentals", enrolled: 0, max: 30, status: "Draft" },
];

export default function CoursesTable() {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>Courses</h2>
        <button style={styles.primaryBtn} className="btn-hover">+ New course</button>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>TITLE</th>
            <th style={styles.th}>ENROLLED</th>
            <th style={styles.th}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {COURSES.map((c, i) => (
            <tr key={i} style={styles.tr}>
              <td style={{...styles.td, fontWeight: 500, color: "#111827"}}>{c.title}</td>
              <td style={styles.td}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>{c.enrolled} students</span>
                  <div style={styles.progressBarBg}>
                    <div style={{...styles.progressBarFill, width: `${(c.enrolled / c.max) * 100}%`}} />
                  </div>
                </div>
              </td>
              <td style={styles.td}><Badge type="status" value={c.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 600, color: "#111827" },
  primaryBtn: { background: "#185fa5", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: { fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: 16, borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "14px 0", fontSize: 14, color: "#374151" },
  progressBarBg: { width: "80%", height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", background: "#185fa5", borderRadius: 3 }
};