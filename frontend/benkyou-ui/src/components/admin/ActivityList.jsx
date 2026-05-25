import React from "react";

const ACTIVITIES = [
  { icon: "⏱️", title: "New enrollment — Juan dela Cruz", desc: "Enrolled in Web Development 101 · 2 hours ago", unread: true, bg: "#eff6ff", color: "#3b82f6" },
  { icon: "✅", title: "Course published — Database Design", desc: "By Ana Santos · 5 hours ago", unread: true, bg: "#ecfdf5", color: "#10b981" },
  { icon: "⭐", title: "Assessment completed — Maria Reyes graded 12 students", desc: "Midterm Exam · Web Dev 101 · Yesterday", unread: false, bg: "#fffbeb", color: "#f59e0b" },
];

export default function ActivityList() {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>Recent activity & notifications</h2>
        <button style={styles.outlineBtn} className="btn-hover">Mark all read</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ACTIVITIES.map((act, i) => (
          <div key={i} style={{ ...styles.activityRow, background: act.unread ? "#f8fafc" : "#fff" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{...styles.activityIcon, background: act.bg, color: act.color}}>{act.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{act.title}</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>{act.desc}</div>
              </div>
            </div>
            {act.unread && <div style={styles.unreadDot} />}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 600, color: "#111827" },
  outlineBtn: { background: "#fff", color: "#374151", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer" },
  activityRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: 8, border: "1px solid #f3f4f6" },
  activityIcon: { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }
};