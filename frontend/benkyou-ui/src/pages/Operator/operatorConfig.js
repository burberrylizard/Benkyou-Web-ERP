/**
 * Shared Operator theme + nav builder.
 * Dark navy theme matching the Benkyou LMS design system (similar to instructor).
 */
export const OP_THEME = {
  sidebar: "#0b1929",
  primary: "#185fa5",
  accent: "#5b9bd5",
  navLabel: "#4a7aa8",
  header: "#0f2035",
};

const ALL_ITEMS = [
  { group: "Overview", label: "Dashboard", path: "/operator/dashboard" },
  { group: "Students", label: "Manage Students", path: "/operator/students" },
  { group: "Students", label: "Import Students", path: "/operator/students/import" },
  { group: "Enrollment", label: "Batch Enroll", path: "/operator/batch-enroll" },
  { group: "Enrollment", label: "Class Sections", path: "/operator/sections" },
  { group: "Enrollment", label: "Course Rosters", path: "/operator/rosters" },
  { group: "Enrollment", label: "Enrollment History", path: "/operator/batch-enroll/history" },
  { group: "Enrollment", label: "Enrollments", path: "/operator/enrollments" },
  { group: "Enrollment", label: "Enrollment Requests", path: "/operator/enrollment-requests" },
  { group: "Reports", label: "Enrollment Report", path: "/operator/reports" },
];

export function getNav(activeLabel) {
  const groups = {};
  ALL_ITEMS.forEach((item) => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push({ label: item.label, path: item.path, active: item.label === activeLabel });
  });
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

/* ── Dark Theme Styles ── */
export const OP_STYLES = {
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 },
  card: { background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 14, padding: 24 },
  statLabel: { fontSize: 12, color: "#7a8ba3", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" },
  statValue: { fontSize: 32, fontWeight: 700, color: "#e8edf4", marginBottom: 4, letterSpacing: "-0.02em" },
  tableCard: { background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 14, padding: 24, marginBottom: 24 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cardTitle: { fontSize: 17, fontWeight: 600, color: "#e8edf4" },
  primaryBtn: { background: "#185fa5", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" },
  outlineBtn: { background: "transparent", color: "#8ea4bd", border: "1px solid #2a4060", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" },
  twoCol: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24, marginBottom: 24 },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: { fontSize: 11, color: "#5a7a9a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", paddingBottom: 14, borderBottom: "1px solid #1e3a5f" },
  tr: { borderBottom: "1px solid rgba(30,58,95,0.5)" },
  td: { padding: "14px 0", fontSize: 14, color: "#a0b4cb" },
  badge: (bg, color, border) => ({ background: bg, color, border: `1px solid ${border}`, padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600 }),
  input: { background: "#0a1220", border: "1px solid #1e3a5f", color: "#fff", padding: "8px 12px", borderRadius: 6, fontSize: 14, outline: "none", width: "100%" },
  select: { background: "#0a1220", border: "1px solid #1e3a5f", color: "#fff", padding: "8px 12px", borderRadius: 6, fontSize: 14, outline: "none", width: "100%", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" },
  modalContent: { background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 14, width: "100%", maxWidth: 500, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" },
  formGroup: { marginBottom: 20 },
  label: { display: "block", fontSize: 12, fontWeight: 500, color: "#7a8ba3", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }
};
