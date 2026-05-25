import React from "react";

export default function Badge({ type, value }) {
  let bg = "#f3f4f6", color = "#374151", border = "transparent";
  
  if (type === "role") {
    if (value === "Instructor") { bg = "#eff6ff"; color = "#1d4ed8"; border = "#bfdbfe"; }
    if (value === "Student") { bg = "#ecfdf5"; color = "#047857"; border = "#a7f3d0"; }
  } else if (type === "status") {
    if (value === "Active" || value === "Published") { bg = "#ecfdf5"; color = "#047857"; border = "#a7f3d0"; }
    if (value === "Inactive" || value === "Draft") { bg = "#fef3c7"; color = "#b45309"; border = "#fde68a"; }
  }

  return (
    <span style={{
      background: bg,
      color: color,
      border: `1px solid ${border}`,
      padding: "4px 10px",
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 500
    }}>
      {value}
    </span>
  );
}