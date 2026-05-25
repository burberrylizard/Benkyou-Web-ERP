export const SA_THEME = {
  primary: "#1e293b", // Slate 800
  secondary: "#334155",
  accent: "#3b82f6",
  text: "#f8fafc",
  bg: "#f1f5f9",
  card: "#ffffff"
};

export const SA_STYLES = {
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 24 },
  card: { background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" },
  statLabel: { fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 700, color: "#1e293b" },
  tableCard: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 24 },
  cardHeader: { padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" },
  cardTitle: { fontSize: 16, fontWeight: 600, color: "#1e293b", margin: 0 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" },
  td: { padding: "16px 24px", fontSize: 14, color: "#334155", borderBottom: "1px solid #f1f5f9" },
  tr: { ":hover": { background: "#f8fafc" } },
  primaryBtn: { background: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, fontWeight: 500, cursor: "pointer" },
  outlineBtn: { background: "transparent", color: "#64748b", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: 6, fontWeight: 500, cursor: "pointer" },
  badge: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500 }
};

export const getNav = (active) => [
  {
    title: "System",
    items: [
      { name: "Dashboard", path: "/sa/dashboard", icon: "LayoutDashboard", active: active === "Dashboard" },
      { name: "Organizations", path: "/sa/organizations", icon: "Building2", active: active === "Organizations" },
      { name: "Subscription Plans", path: "/sa/plans", icon: "CreditCard", active: active === "Plans" },
    ]
  },
  {
    title: "Management",
    items: [
      { name: "Analytics", path: "/sa/analytics", icon: "BarChart3", active: active === "Analytics" },
      { name: "Audit Logs", path: "/sa/logs", icon: "History", active: active === "Audit Logs" },
      { name: "Settings", path: "/sa/settings", icon: "Settings", active: active === "Settings" },
    ]
  }
];
