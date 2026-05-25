/**
 * Shared Admin theme + nav builder.
 * Each page calls getNav("Dashboard") etc. to highlight the active item.
 */

export const ADMIN_THEME = {
  sidebar: "#0d2137",
  primary: "#185fa5",
  accent: "#a8c8e8",
  navLabel: "#4a7aa8",
};

const ALL_ITEMS = [
  { group: "Overview", label: "Dashboard", path: "/admin/dashboard" },
  { group: "Management", label: "Users", path: "/admin/users" },
  { group: "Management", label: "Courses", path: "/admin/courses" },
  { group: "Management", label: "Categories", path: "/admin/categories" },
  { group: "Reports", label: "Analytics", path: "/admin/analytics" },
  { group: "Reports", label: "Audit Logs", path: "/admin/logs" },
  { group: "Account", label: "Subscription", path: "/admin/subscription" },
  { group: "Account", label: "Settings", path: "/admin/settings" },
];

export function getNav(activeLabel) {
  const groups = {};
  ALL_ITEMS.forEach((item) => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push({
      label: item.label,
      path: item.path,
      active: item.label === activeLabel,
    });
  });
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export const ADMIN_STYLES = {
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 24 },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  statLabel: { fontSize: 13, color: "#6b7280", fontWeight: 500, marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: 600, color: "#111827", marginBottom: 4 },
  tableCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 24 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 600, color: "#111827" },
  primaryBtn: { background: "#185fa5", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer" },
  outlineBtn: { background: "#fff", color: "#374151", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: { fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: 16, borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "14px 0", fontSize: 14, color: "#374151" },
  twoCol: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24, marginBottom: 24 },
  activityRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 8, border: "1px solid #f3f4f6" },
  actIcon: { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" },
  progressBg: { width: "80%", height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", background: "#185fa5", borderRadius: 3 },
  tinyAvatar: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#fff", flexShrink: 0 },
  actionBtn: { background: "transparent", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 14, color: "#6b7280" },
};
