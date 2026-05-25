/**
 * Shared SuperAdmin theme + nav builder.
 * Each page calls getNav("Dashboard") etc. to highlight the active item.
 */

export const SA_THEME = {
  sidebar: "#0f172a", // Slate 900 (Dark Blue)
  header: "#1e3a8a",  // Blue 900 (Professional Blue)
  primary: "#1e40af", // Blue 800
  accent: "#60a5fa",  // Blue 400
  navLabel: "#94a3b8", // Slate 400
  text: "#ffffff",
};

const ALL_ITEMS = [
  { group: "Overview", label: "Dashboard", path: "/superadmin/dashboard" },
  { group: "Platform",  label: "Organizations", path: "/superadmin/organizations" },
  { group: "Platform",  label: "Plans & Billing", path: "/superadmin/billing" },
  { group: "Platform",  label: "All Users", path: "/superadmin/users" },
  { group: "System",    label: "System Analytics", path: "/superadmin/analytics" },
  { group: "System",    label: "Audit Logs", path: "/superadmin/audit-logs" },
  { group: "System",    label: "Platform Settings", path: "/superadmin/settings" },
];

/**
 * Build nav groups with the given label marked active.
 * @param {string} activeLabel – e.g. "Dashboard", "System Analytics"
 */
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

/** Common card & table styles reused across all SA pages. */
export const SA_STYLES = {
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 24 },
  card: { background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
  statLabel: { fontSize: 13, color: "#94a3b8", fontWeight: 500, marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: 600, color: "#f8fafc", marginBottom: 4 },
  tableCard: { background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 24, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", marginBottom: 24 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 600, color: "#f1f5f9" },
  primaryBtn: { background: "#1e3a5f", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer" },
  outlineBtn: { background: "#fff", color: "#374151", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: 16, borderBottom: "1px solid #1f2937" },
  tr: { borderBottom: "1px solid #1f2937" },
  td: { padding: "14px 0", fontSize: 14, color: "#cbd5e1" },
  statusActive: { color: "#10b981", fontWeight: "700", fontSize: 13 },
  statusInactive: { color: "#ef4444", fontWeight: "700", fontSize: 13 },
  activityRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 8, border: "1px solid #1f2937" },
  actIcon: { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" },
  twoCol: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 12 },
  badge: { padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, display: "inline-block" },
};
