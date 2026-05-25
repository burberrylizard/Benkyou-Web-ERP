import React from "react";

export default function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  className = "", 
  isLoading = false, 
  disabled = false,
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[var(--primary)] text-[var(--text-inverse)] hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)]",
    secondary: "bg-[var(--secondary)] text-[var(--text-inverse)] hover:bg-[var(--secondary-hover)] focus:ring-[var(--secondary)]",
    success: "bg-[var(--success)] text-[var(--text-inverse)] hover:opacity-90 focus:ring-[var(--success)]",
    danger: "bg-[var(--danger)] text-[var(--text-inverse)] hover:opacity-90 focus:ring-[var(--danger)]",
    outline: "border border-[var(--border-light)] bg-transparent text-[var(--text-main)] hover:bg-[var(--bg-body)] focus:ring-[var(--border-light)]",
    ghost: "bg-transparent text-[var(--text-main)] hover:bg-[var(--bg-body)] focus:ring-transparent"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-[var(--radius-sm)]",
    md: "px-4 py-2 text-sm rounded-[var(--radius-md)]",
    lg: "px-6 py-3 text-base rounded-[var(--radius-lg)]"
  };

  // Note: Since we are using Vanilla CSS, I will use inline styles for the tailwind-like classes for now
  // OR I can add these as utility classes in index.css.
  // Given the instruction to use Vanilla CSS, I'll use a mix of CSS variables and inline styles for maximum flexibility.

  const style = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 500,
    transition: "all 0.2s",
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
    opacity: disabled || isLoading ? 0.6 : 1,
    border: variant === "outline" ? "1px solid var(--border-light)" : "none",
    borderRadius: size === "sm" ? "var(--radius-sm)" : size === "lg" ? "var(--radius-lg)" : "var(--radius-md)",
    padding: size === "sm" ? "6px 12px" : size === "lg" ? "12px 24px" : "10px 20px",
    fontSize: size === "sm" ? "12px" : size === "lg" ? "16px" : "14px",
    backgroundColor: variant === "outline" || variant === "ghost" ? "transparent" : `var(--${variant})`,
    color: variant === "outline" || variant === "ghost" ? "var(--text-main)" : "var(--text-inverse)",
    gap: "8px",
    boxShadow: variant === "ghost" ? "none" : "var(--shadow-sm)",
  };

  return (
    <button 
      style={style} 
      disabled={disabled || isLoading} 
      className={`btn-${variant} ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="spinner" style={{ 
          width: "14px", 
          height: "14px", 
          border: "2px solid currentColor", 
          borderTopColor: "transparent", 
          borderRadius: "50%", 
          animation: "spin 0.6s linear infinite" 
        }} />
      )}
      {children}
    </button>
  );
}
