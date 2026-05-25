import React from "react";

export default function NavItem({ label, active }) {
  return (
    <div className={`nav-item ${active ? "active" : ""}`} style={{
      display: "flex",
      alignItems: "center",
      padding: "10px 16px",
      borderRadius: 6,
      marginBottom: 2,
      background: active ? "rgba(255,255,255,0.1)" : "transparent",
      color: active ? "#fff" : "#a8c8e8",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: active ? 500 : 400,
      transition: "all 0.2s"
    }}>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: active ? "#fff" : "transparent",
        marginRight: 12
      }} />
      {label}
    </div>
  );
}