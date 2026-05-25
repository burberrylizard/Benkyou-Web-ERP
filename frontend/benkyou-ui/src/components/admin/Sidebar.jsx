import React from "react";
import NavItem from "./NavItem";

export default function Sidebar() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.sidebarTop}>
        <div style={styles.logo}>
          ben<span style={{ color: "#7eb3e8" }}>kyou</span>
        </div>

        <div style={styles.navGroup}>
          <div style={styles.navLabel}>Overview</div>
          <NavItem label="Dashboard" active />
        </div>

        <div style={styles.navGroup}>
          <div style={styles.navLabel}>Management</div>
          <NavItem label="Users" />
          <NavItem label="Courses" />
          <NavItem label="Enrollments" />
          <NavItem label="Categories" />
        </div>

        <div style={styles.navGroup}>
          <div style={styles.navLabel}>Reports</div>
          <NavItem label="Analytics" />
          <NavItem label="Audit logs" />
        </div>

        <div style={styles.navGroup}>
          <div style={styles.navLabel}>Account</div>
          <NavItem label="Subscription" />
        </div>
      </div>

      <div style={styles.sidebarBottom}>
        <div style={styles.avatarWrap}>CJ</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Charlize Inday</div>
          <div style={{ fontSize: 12, color: "#7eb3e8" }}>Admin</div>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 260,
    background: "#0d2137", 
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    flexShrink: 0
  },
  sidebarTop: {
    padding: "32px 16px",
    overflowY: "auto",
  },
  logo: {
    fontSize: 22,
    fontWeight: 600,
    color: "#fff",
    paddingLeft: 16,
    marginBottom: 40
  },
  navGroup: { marginBottom: 24 },
  navLabel: {
    fontSize: 11,
    color: "#4a7aa8",
    fontWeight: 600,
    letterSpacing: "0.05em",
    marginBottom: 8,
    paddingLeft: 22,
    textTransform: "uppercase"
  },
  sidebarBottom: {
    padding: "20px",
    background: "rgba(0,0,0,0.15)",
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#185fa5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff"
  }
};