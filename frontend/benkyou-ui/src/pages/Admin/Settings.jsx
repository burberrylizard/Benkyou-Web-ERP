import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { ADMIN_THEME, getNav, ADMIN_STYLES as s } from "./adminConfig";
import { getMyOrganization, updateOrganizationType } from "../../services/organizationService";
import { getTerminology } from "../../utils/terminology";

export default function AdminSettings() {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState("HigherEducation");

  const fetchOrg = async () => {
    try {
      setLoading(true);
      const data = await getMyOrganization();
      setOrg(data);
      if (data && data.organizationType) {
        setSelectedType(data.organizationType);
      }
    } catch (err) {
      alert("Failed to load organization settings: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateOrganizationType(selectedType);
      alert("Organization settings updated successfully!");
      fetchOrg();
    } catch (err) {
      alert("Failed to update settings: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const currentTerms = getTerminology(selectedType);

  const focusOptions = [
    {
      value: "HigherEducation",
      label: "🎓 Higher Education",
      desc: "Ideal for colleges and universities. Utilizes academic terminology: 'Programs' (e.g. BSIT, BSCS) and 'Year Levels' (e.g. 1st Year, 2nd Year).",
      terms: "Programs & Year Levels"
    },
    {
      value: "K12",
      label: "🏫 K-12 School",
      desc: "Perfect for high schools, secondary, and primary schools. Utilizes grade terminology: 'Grade/Track' (e.g. Grade 10, STEM) and 'Grade Levels' (e.g. Grade 7, Grade 11).",
      terms: "Grades & Grade Levels"
    }
  ];

  return (
    <DashboardLayout
      theme={ADMIN_THEME}
      role="Admin"
      navGroups={getNav("Settings")}
      headerTitle="Organization Settings"
      headerSub="Manage institution profile, system configurations, and dynamic terminology focus."
    >
      <div style={s.twoCol}>
        {/* Main Settings Card */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>LMS Focus & Terminology</h2>
          </div>
          
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading settings...</div>
          ) : (
            <form onSubmit={handleSaveSettings}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <p style={{ fontSize: 14, color: "#4b5563", lineHeight: "1.5" }}>
                  Adjust how Benkyou refers to cohorts and student metrics across your organization. Toggling this will instantly tailor terms across dashboards, batch enrollments, rosters, and exports.
                </p>

                {focusOptions.map((opt) => {
                  const isChecked = selectedType === opt.value;
                  return (
                    <label 
                      key={opt.value}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        padding: 16,
                        border: isChecked ? "2px solid #185fa5" : "1px solid #e5e7eb",
                        background: isChecked ? "rgba(24,95,165,0.03)" : "#fff",
                        borderRadius: 10,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <input
                        type="radio"
                        name="orgType"
                        value={opt.value}
                        checked={isChecked}
                        onChange={() => setSelectedType(opt.value)}
                        style={{ marginTop: 4, cursor: "pointer" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6, lineHeight: "1.4" }}>
                          {opt.desc}
                        </div>
                        <span style={{ 
                          fontSize: 11, 
                          background: isChecked ? "rgba(24,95,165,0.12)" : "#f3f4f6", 
                          color: isChecked ? "#185fa5" : "#4b5563", 
                          padding: "2px 8px", 
                          borderRadius: 6, 
                          fontWeight: 600 
                        }}>
                          Terminology: {opt.terms}
                        </span>
                      </div>
                    </label>
                  );
                })}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <button
                    type="submit"
                    style={{ ...s.primaryBtn, padding: "10px 24px" }}
                    disabled={saving}
                  >
                    {saving ? "Saving settings..." : "Save Settings"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Institution Info Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={s.tableCard}>
            <div style={s.cardHeader}>
              <h2 style={s.cardTitle}>Institution Information</h2>
            </div>
            
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading info...</div>
            ) : org ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 14, color: "#374151" }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ color: "#6b7280" }}>Name:</span>
                  <span style={{ fontWeight: 600, color: "#111827" }}>{org.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ color: "#6b7280" }}>Institution Short Code:</span>
                  <span style={{ fontWeight: 600, color: "#185fa5" }}>{org.tenantCode}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ color: "#6b7280" }}>Primary Admin Email:</span>
                  <span style={{ fontWeight: 600, color: "#111827" }}>{org.primaryEmail}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ color: "#6b7280" }}>Status:</span>
                  <span style={{ 
                    fontWeight: 600, 
                    color: org.isActive ? "#10b981" : "#ef4444" 
                  }}>
                    {org.isActive ? "🟢 Active" : "🔴 Suspended"}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Terminology Preview Card */}
          <div style={{ ...s.tableCard, background: "rgba(24,95,165,0.01)", borderColor: "rgba(24,95,165,0.15)" }}>
            <div style={s.cardHeader}>
              <h2 style={s.cardTitle}>Dynamic Terminology Preview</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#4b5563" }}>
              <div>• Under your selected setup, students will be called <strong>{currentTerms.studentPlural}</strong> (e.g. 1 {currentTerms.student}).</div>
              <div>• Academic groupings will be referenced as <strong>{currentTerms.programPlural}</strong> (e.g. "Select target {currentTerms.program}").</div>
              <div>• Cohort levels will be referenced as <strong>{currentTerms.yearLevelPlural}</strong> (e.g. "Select {currentTerms.yearLevel}").</div>
              <div>• Educational topics will be called <strong>{currentTerms.coursePlural}</strong> (e.g. "{currentTerms.course} roster").</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
