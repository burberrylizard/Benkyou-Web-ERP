import React from "react";

export function Card({ children, title, subtitle, footer, className = "", noPadding = false }) {
  const cardStyle = {
    background: "var(--bg-card)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-md)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    border: "1px solid var(--border-light)"
  };

  const headerStyle = {
    padding: "20px 24px",
    borderBottom: "1px solid var(--border-light)"
  };

  return (
    <div style={cardStyle} className={className}>
      {(title || subtitle) && (
        <div style={headerStyle}>
          {title && <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>{title}</h3>}
          {subtitle && <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>{subtitle}</p>}
        </div>
      )}
      <div style={{ padding: noPadding ? 0 : "24px", flex: 1 }}>
        {children}
      </div>
      {footer && (
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-light)", background: "rgba(0,0,0,0.02)" }}>
          {footer}
        </div>
      )}
    </div>
  );
}

export function Table({ columns, data, isLoading, emptyMessage = "No records found", pagination }) {
  const tableContainerStyle = {
    width: "100%",
    overflowX: "auto",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-light)"
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "14px"
  };

  const thStyle = {
    padding: "12px 16px",
    background: "var(--bg-body)",
    borderBottom: "2px solid var(--border-light)",
    color: "var(--text-muted)",
    fontWeight: 600,
    textTransform: "uppercase",
    fontSize: "11px",
    letterSpacing: "0.05em"
  };

  const tdStyle = {
    padding: "16px",
    borderBottom: "1px solid var(--border-light)",
    color: "var(--text-main)"
  };

  return (
    <div>
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={thStyle}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} style={{ ...tdStyle, textAlign: "center", padding: "40px" }}>
                  <div className="spinner" style={{ 
                    display: "inline-block", 
                    width: "24px", 
                    height: "24px", 
                    border: "3px solid var(--primary)", 
                    borderTopColor: "transparent", 
                    borderRadius: "50%", 
                    animation: "spin 0.8s linear infinite" 
                  }} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ ...tdStyle, textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id || i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)" }}>
                  {columns.map(col => (
                    <td key={col.key} style={tdStyle}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "0 4px" }}>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Showing {data.length} of {pagination.total} records
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button 
              disabled={pagination.page === 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid var(--border-light)", background: "var(--bg-card)", cursor: pagination.page === 1 ? "not-allowed" : "pointer" }}
            >
              Previous
            </button>
            <button 
              disabled={data.length < pagination.pageSize}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid var(--border-light)", background: "var(--bg-card)", cursor: data.length < pagination.pageSize ? "not-allowed" : "pointer" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
