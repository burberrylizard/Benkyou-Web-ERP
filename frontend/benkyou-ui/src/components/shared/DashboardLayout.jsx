import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../../context/TenantContext";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/session";

/**
 * Reusable dashboard layout for every role.
 */
export default function DashboardLayout({
  theme,
  role,
  navGroups,
  userName,
  userInitials,
  headerTitle,
  headerSub,
  children,
}) {
  const navigate = useNavigate();
  const { tenantPath } = useTenant();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const displayName = user?.name || userName;
  const displayInitials = userInitials || getInitials(displayName || user?.email);

  // Determine if this layout uses dark mode based on header presence
  const isDark = !!theme.header;

  const bgPage = isDark ? "#0a1220" : "#f4f5f7";
  const bgHeader = isDark ? theme.header : "#f4f5f7";

  return (
    <div style={{ ...s.layout, background: bgPage }}>
      {/* ── GLOBAL CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${bgPage}; color: ${isDark ? "#c0cfe0" : "#111827"}; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? "#1e3a5f" : "#cbd5e1"}; border-radius: 4px; }
        .nav-item-dl:hover:not(.active-dl) { background: rgba(255,255,255,0.06) !important; color: #fff !important; }
        .btn-hover-dl:hover { opacity: 0.9; transform: translateY(-1px); }
        .notif-item-dl:hover { background: ${isDark ? "#1a2d45" : "#f9fafb"}; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{ 
        ...s.sidebar, 
        background: theme.sidebar,
        width: isCollapsed ? 72 : 260,
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden"
      }}>
        <div style={s.sidebarTop}>
          {/* Logo & Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between", marginBottom: 32, paddingLeft: isCollapsed ? 0 : 16 }}>
            {!isCollapsed && (
              <div style={{ fontSize: 22, fontWeight: 600, color: "#fff" }}>
                ben<span style={{ color: theme.accent }}>kyou</span>
              </div>
            )}
            {isCollapsed && (
              <div style={{ fontSize: 22, fontWeight: 700, color: theme.accent }}>
                b
              </div>
            )}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                borderRadius: 6,
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 12,
                outline: "none"
              }}
            >
              {isCollapsed ? "☰" : "◀"}
            </button>
          </div>

          {/* Nav groups */}
          {navGroups.map((group) => (
            <div key={group.label} style={s.navGroup}>
              {!isCollapsed ? (
                <div style={{ ...s.navLabel, color: theme.navLabel }}>
                  {group.label}
                </div>
              ) : (
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
              )}
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className={`nav-item-dl ${item.active ? "active-dl" : ""}`}
                  onClick={() => item.path && navigate(tenantPath(item.path))}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    padding: isCollapsed ? "10px" : "10px 16px",
                    borderRadius: 6,
                    marginBottom: 2,
                    background: item.active
                      ? "rgba(255,255,255,0.08)"
                      : "transparent",
                    color: item.active ? "#fff" : "rgba(255,255,255,0.55)",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: item.active ? 500 : 400,
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: item.active ? "#fff" : "transparent",
                      marginRight: isCollapsed ? 0 : 12,
                    }}
                  />
                  {!isCollapsed && item.label}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom avatar area */}
        <div style={{ 
          ...s.sidebarBottom, 
          justifyContent: isCollapsed ? "center" : "flex-start",
          padding: isCollapsed ? "12px" : "20px",
          position: "relative"
        }}>
          <div 
            style={{ ...s.avatarWrap, background: theme.primary, flexShrink: 0 }}
            title={displayName}
          >
            {displayInitials}
          </div>
          {!isCollapsed ? (
            <>
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 12, color: theme.accent, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{role}</div>
              </div>
              <button 
                onClick={signOut}
                style={{ 
                  background: "transparent", 
                  border: "1px solid rgba(255,255,255,0.15)", 
                  color: "rgba(255,255,255,0.7)", 
                  borderRadius: 4, 
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: 12
                }}>
                Logout
              </button>
            </>
          ) : (
            <button 
              onClick={signOut}
              title="Logout"
              style={{ 
                position: "absolute",
                bottom: "56px",
                background: "rgba(239,68,68,0.15)", 
                border: "none", 
                color: "#ef4444", 
                borderRadius: "50%", 
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 12
              }}>
              ❌
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ ...s.main, background: bgPage }}>
        {/* Header */}
        <header style={{ 
          ...s.header, 
          background: bgHeader,
          borderBottom: isDark ? "1px solid #1e3a5f" : "1px solid #e5e7eb",
        }}>
          <div>
            <h1 style={{ ...s.headerTitle, color: isDark ? "#e8edf4" : "#111827" }}>{headerTitle}</h1>
            <p style={{ ...s.headerSub, color: isDark ? "#6b85a3" : "#6b7280" }}>{headerSub}</p>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", position: "relative" }}>
            <div style={{ ...s.avatarSmall, background: theme.primary }}>
              {displayInitials}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div style={s.contentScroll}>{children}</div>
      </main>
    </div>
  );
}

/* ── STYLES ── */
const s = {
  layout: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
  },
  sidebar: {
    width: 260,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  sidebarTop: { padding: "32px 16px", overflowY: "auto" },
  logo: {
    fontSize: 22,
    fontWeight: 600,
    color: "#fff",
    paddingLeft: 16,
    marginBottom: 40,
  },
  navGroup: { marginBottom: 24 },
  navLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.05em",
    marginBottom: 8,
    paddingLeft: 22,
    textTransform: "uppercase",
  },
  sidebarBottom: {
    padding: 20,
    background: "rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "28px 40px 22px",
    zIndex: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: 600, marginBottom: 4 },
  headerSub: { fontSize: 14 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  notifDot: {
    position: "absolute",
    top: -5,
    right: -5,
    background: "#ef4444",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    width: 18,
    height: 18,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #0a1220",
  },
  notifDropdown: {
    position: "absolute",
    top: "calc(100% + 12px)",
    right: 0,
    width: 320,
    borderRadius: 12,
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
    zIndex: 100,
    overflow: "hidden",
  },
  notifHeader: {
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
  },
  notifList: {
    maxHeight: 360,
    overflowY: "auto",
  },
  emptyNotif: {
    padding: "40px 20px",
    textAlign: "center",
    fontSize: 14,
  },
  notifItem: {
    padding: "16px 20px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
  },
  contentScroll: { padding: "32px 40px", overflowY: "auto", flex: 1 },
};
