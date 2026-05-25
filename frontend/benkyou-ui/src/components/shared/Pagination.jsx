import React from "react";

export default function Pagination({
  totalItems,
  itemsPerPage = 10,
  currentPage,
  onChange,
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        backgroundColor: "var(--bg-card)",
        borderTop: "1px solid var(--border-light)",
        borderBottomLeftRadius: "var(--radius-lg)",
        borderBottomRightRadius: "var(--radius-lg)",
        marginTop: "-1px", // Connect nicely with tables
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      {/* Information string */}
      <span
        style={{
          fontSize: "13px",
          color: "var(--text-muted)",
        }}
      >
        Showing <strong style={{ color: "var(--text-heading)" }}>{startItem}</strong> to{" "}
        <strong style={{ color: "var(--text-heading)" }}>{endItem}</strong> of{" "}
        <strong style={{ color: "var(--text-heading)" }}>{totalItems}</strong> entries
      </span>

      {/* Pagination Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {/* Previous Button */}
        <button
          onClick={() => onChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 12px",
            fontSize: "13px",
            fontWeight: 500,
            color: currentPage === 1 ? "var(--text-muted)" : "var(--text-main)",
            backgroundColor: "transparent",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-md)",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            opacity: currentPage === 1 ? 0.5 : 1,
            transition: "all 0.2s ease-in-out",
          }}
          onMouseEnter={(e) => {
            if (currentPage !== 1) {
              e.currentTarget.style.backgroundColor = "var(--border-light)";
              e.currentTarget.style.color = "var(--text-heading)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 1) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-main)";
            }
          }}
        >
          &larr; Prev
        </button>

        {/* Page Buttons */}
        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--text-white)" : "var(--text-main)",
                backgroundColor: isActive ? "var(--primary)" : "transparent",
                border: isActive ? "1px solid var(--primary)" : "1px solid var(--border-light)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                boxShadow: isActive ? "var(--shadow-sm)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "var(--border-light)";
                  e.currentTarget.style.color = "var(--text-heading)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-main)";
                }
              }}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => onChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 12px",
            fontSize: "13px",
            fontWeight: 500,
            color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-main)",
            backgroundColor: "transparent",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-md)",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            opacity: currentPage === totalPages ? 0.5 : 1,
            transition: "all 0.2s ease-in-out",
          }}
          onMouseEnter={(e) => {
            if (currentPage !== totalPages) {
              e.currentTarget.style.backgroundColor = "var(--border-light)";
              e.currentTarget.style.color = "var(--text-heading)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== totalPages) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-main)";
            }
          }}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
