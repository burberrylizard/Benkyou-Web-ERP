import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { OP_THEME, getNav, OP_STYLES as s } from "./operatorConfig";
import { importStudents } from "../../services/operatorService";
import { getTerminology, getYearLevelsList } from "../../utils/terminology";
import { getMyOrganization } from "../../services/organizationService";

export default function ImportStudents() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [orgType, setOrgType] = useState("HigherEducation");

  useEffect(() => {
    getMyOrganization()
      .then(org => {
        if (org && org.organizationType) setOrgType(org.organizationType);
      })
      .catch(() => {});
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
 
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (uploadedFile) => {
    const ext = uploadedFile.name.split(".").pop().toLowerCase();
    if (ext !== "csv" && ext !== "xlsx") {
      alert("Only .csv and .xlsx files are supported.");
      return;
    }
    setFile(uploadedFile);
    setResult(null);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to import.");
      return;
    }

    try {
      setLoading(true);
      const res = await importStudents(file);
      setResult(res);
      setFile(null);
      alert(`Import completed! Created: ${res.created}, Skipped: ${res.skipped}`);
    } catch (err) {
      alert("Failed to import: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const term = getTerminology(orgType);
  const cohortOptions = getYearLevelsList(orgType);

  const downloadTemplate = () => {
    const headers = "FirstName,LastName,Email,Password,YearEnrolled,YearLevel,Program\n";
    const sampleYear = cohortOptions[0] || "1st Year";
    const sampleProgram = orgType === "K12" ? "STEM" : orgType === "Corporate" ? "Sales" : "BSIT";
    const sampleRow = `Juan,Dela Cruz,juan.delacruz@example.com,SecurePassword123!,2026,${sampleYear},${sampleProgram}\n`;
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + sampleRow);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `${term.student.toLowerCase()}_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout
      theme={OP_THEME}
      role="Operator"
      navGroups={getNav("Import Students")}
      headerTitle={`Bulk Import ${term.studentPlural}`}
      headerSub={`Upload ${term.student.toLowerCase()} cohorts in bulk using standard CSV or Excel sheets.`}
    >
      <div style={s.statsGrid}>
        <div style={s.card}>
          <div style={s.statLabel}>Step 1: Download Template</div>
          <div style={{ fontSize: 14, color: "#a0b4cb", margin: "10px 0 20px" }}>
            Get our pre-formatted CSV template file to ensure all columns map perfectly to {term.student.toLowerCase()} accounts.
          </div>
          <button 
            style={s.outlineBtn}
            className="btn-hover-dl"
            onClick={downloadTemplate}
          >
            Download CSV Template
          </button>
        </div>

        <div style={s.card}>
          <div style={s.statLabel}>Template Requirements</div>
          <div style={{ fontSize: 13, color: "#7a8ba3", display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            <div>• <strong>FirstName, LastName, Email, Password</strong> are mandatory.</div>
            <div>• <strong>Email</strong> must be unique and have a valid format.</div>
            <div>• <strong>Password</strong> must pass security rules (min 6 chars).</div>
            <div>• <strong>YearLevel</strong> options: {cohortOptions.map(x => `"${x}"`).join(", ")}.</div>
          </div>
        </div>
      </div>

      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Upload File (.csv, .xlsx)</h2>
        </div>

        <form onSubmit={handleImport} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "20px 0" }}>
          {/* Drag & Drop File Upload Panel */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            style={{
              width: "100%",
              maxWidth: 600,
              minHeight: 220,
              border: `2px dashed ${dragActive ? "#5b9bd5" : "#1e3a5f"}`,
              background: dragActive ? "rgba(91,155,213,0.06)" : "#0a1220",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              cursor: "pointer",
              transition: "all 0.2s",
              position: "relative"
            }}
          >
            <input
              type="file"
              id="file-upload-input"
              multiple={false}
              onChange={handleChange}
              style={{ display: "none" }}
            />
            
            <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
            
            {file ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#e8edf4", marginBottom: 6 }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 12, color: "#7a8ba3" }}>
                  {(file.size / 1024).toFixed(1)} KB · Ready to import
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 500, color: "#a0b4cb", marginBottom: 8 }}>
                  Drag & drop your file here, or{" "}
                  <span 
                    onClick={() => document.getElementById("file-upload-input").click()}
                    style={{ color: "#5b9bd5", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}
                  >
                    browse
                  </span>
                </p>
                <p style={{ fontSize: 12, color: "#5a7a9a" }}>
                  Supports CSV and Excel worksheets
                </p>
              </div>
            )}
          </div>

          {file && (
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                style={s.outlineBtn}
                onClick={() => setFile(null)}
              >
                Clear
              </button>
              <button
                type="submit"
                style={s.primaryBtn}
                className="btn-hover-dl"
                disabled={loading}
              >
                {loading ? `Importing ${term.studentPlural.toLowerCase()}...` : "Begin Upload & Import"}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* IMPORT RESULT STATS & DETAILS */}
      {result && (
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Import Summary</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid #1e3a5f", borderRadius: 8, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#7a8ba3", marginBottom: 6 }}>Created Accounts</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}>{result.created}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid #1e3a5f", borderRadius: 8, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#7a8ba3", marginBottom: 6 }}>Skipped (Existing)</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>{result.skipped}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid #1e3a5f", borderRadius: 8, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#7a8ba3", marginBottom: 6 }}>Errors / Failures</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: result.errors?.length > 0 ? "#ef4444" : "#10b981" }}>
                {result.errors?.length || 0}
              </div>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ef4444", marginBottom: 12 }}>Import Failures Breakdown:</div>
              <div style={{ maxHeight: 200, overflowY: "auto", background: "#0a1220", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: 16 }}>
                {result.errors.map((err, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#e8edf4", borderBottom: i < result.errors.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", padding: "8px 0" }}>
                    ⚠️ {err}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
