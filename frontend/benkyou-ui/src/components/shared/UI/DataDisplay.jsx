import React from "react";

export function Input({ label, error, className = "", ...props }) {
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px",
    width: "100%"
  };

  const labelStyle = {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text-muted)"
  };

  const inputStyle = {
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    border: `1px solid ${error ? "var(--danger)" : "var(--border-light)"}`,
    fontSize: "14px",
    background: "var(--bg-card)",
    color: "var(--text-main)",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s"
  };

  const errorStyle = {
    fontSize: "12px",
    color: "var(--danger)",
    marginTop: "2px"
  };

  return (
    <div style={containerStyle} className={className}>
      {label && <label style={labelStyle}>{label}</label>}
      <input 
        style={inputStyle} 
        onFocus={e => e.target.style.borderColor = "var(--primary)"}
        onBlur={e => e.target.style.borderColor = error ? "var(--danger)" : "var(--border-light)"}
        {...props} 
      />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}

export function Badge({ children, variant = "info", className = "" }) {
  const variants = {
    info: { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6" },
    success: { bg: "rgba(16, 185, 129, 0.1)", text: "#10b981" },
    warning: { bg: "rgba(245, 158, 11, 0.1)", text: "#f59e0b" },
    danger: { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444" },
    secondary: { bg: "rgba(100, 116, 139, 0.1)", text: "#64748b" }
  };

  const v = variants[variant] || variants.info;

  const style = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 10px",
    borderRadius: "var(--radius-full)",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: v.bg,
    color: v.text,
    whiteSpace: "nowrap"
  };

  return (
    <span style={style} className={className}>
      {children}
    </span>
  );
}
