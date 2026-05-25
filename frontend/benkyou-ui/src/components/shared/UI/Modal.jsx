import React, { useEffect } from "react";
import Button from "./Button";

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  size = "md",
  showClose = true
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "400px",
    md: "600px",
    lg: "800px",
    xl: "1000px"
  };

  const backdropStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.2s ease-out"
  };

  const modalStyle = {
    background: "var(--bg-card)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    width: "90%",
    maxWidth: sizes[size],
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    animation: "slideUp 0.3s ease-out",
    position: "relative"
  };

  const headerStyle = {
    padding: "20px 24px",
    borderBottom: "1px solid var(--border-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  };

  const bodyStyle = {
    padding: "24px",
    overflowY: "auto",
    flex: 1
  };

  const footerStyle = {
    padding: "16px 24px",
    borderTop: "1px solid var(--border-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px"
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { 
          from { transform: translateY(20px); opacity: 0; } 
          to { transform: translateY(0); opacity: 1; } 
        }
      `}</style>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>{title}</h3>
          {showClose && (
            <Button variant="ghost" size="sm" onClick={onClose} style={{ padding: "8px" }}>
              ✕
            </Button>
          )}
        </div>
        <div style={bodyStyle}>
          {children}
        </div>
        {footer && (
          <div style={footerStyle}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
