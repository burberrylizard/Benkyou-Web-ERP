import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { OP_THEME, getNav, OP_STYLES as s } from "./operatorConfig";
import { getEnrollmentSummary, downloadReportCsv } from "../../services/operatorService";
import { getTerminology } from "../../utils/terminology";
import { getMyOrganization } from "../../services/organizationService";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from "recharts";

export default function EnrollmentReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [orgType, setOrgType] = useState("HigherEducation");

  const term = getTerminology(orgType);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const [orgData, summaryData] = await Promise.all([
        getMyOrganization().catch(() => null),
        getEnrollmentSummary()
      ]);
      if (orgData && orgData.organizationType) {
        setOrgType(orgData.organizationType);
      }
      setReport(summaryData);
    } catch (err) {
      alert("Failed to load enrollment report data: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const blob = await downloadReportCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${term.student.toLowerCase()}_enrollment_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      alert("CSV exported successfully!");
    } catch (err) {
      alert("Failed to export CSV: " + (err.message || err));
    } finally {
      setExporting(false);
    }
  };

  const chartData = report?.enrollmentsPerCourse || [];
  const programData = report?.studentsPerProgram || [];
  const yearLevelData = report?.studentsPerYearLevel || [];
  const statusData = report?.studentStatus || { active: 0, inactive: 0 };
  const totalStudents = statusData.active + statusData.inactive;

  // Modern HSL color palette
  const COLORS = ["#185fa5", "#5b9bd5", "#7c3aed", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <DashboardLayout
      theme={OP_THEME}
      role="Operator"
      navGroups={getNav("Enrollment Report")}
      headerTitle="Enrollment Reports & Analytics"
      headerSub={`Overview of course enrollments, cohort statistics, and CSV data streaming.`}
    >
      {/* Upper action bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <button
          style={{ ...s.primaryBtn, display: "flex", alignItems: "center", gap: 8 }}
          className="btn-hover-dl"
          onClick={handleExportCsv}
          disabled={exporting}
        >
          {exporting ? "Exporting..." : `📥 Stream Full CSV Export`}
        </button>
      </div>

      {loading ? (
        <div style={{ ...s.tableCard, padding: 80, textAlign: "center", color: "#5a7a9a" }}>
          Generating report data summaries...
        </div>
      ) : !report ? (
        <div style={{ ...s.tableCard, padding: 80, textAlign: "center", color: "#5a7a9a" }}>
          No data could be generated for report.
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={s.statsGrid}>
            <div style={s.card}>
              <div style={s.statLabel}>Active {term.studentPlural}</div>
              <div style={{ ...s.statValue, color: "#10b981" }}>{statusData.active}</div>
              <div style={{ fontSize: 12, color: "#7a8ba3" }}>Currently enrolled & enabled</div>
            </div>
            <div style={s.card}>
              <div style={s.statLabel}>Inactive {term.studentPlural}</div>
              <div style={{ ...s.statValue, color: "#ef4444" }}>{statusData.inactive}</div>
              <div style={{ fontSize: 12, color: "#7a8ba3" }}>Disabled account logs</div>
            </div>
            <div style={s.card}>
              <div style={s.statLabel}>Total {term.student} Accounts</div>
              <div style={{ ...s.statValue, color: "#5b9bd5" }}>{totalStudents}</div>
              <div style={{ fontSize: 12, color: "#7a8ba3" }}>Total active + inactive {term.studentPlural.toLowerCase()}</div>
            </div>
            <div style={s.card}>
              <div style={s.statLabel}>Total Course Enrollments</div>
              <div style={{ ...s.statValue, color: "#e8edf4" }}>
                {chartData.reduce((acc, curr) => acc + curr.count, 0)}
              </div>
              <div style={{ fontSize: 12, color: "#7a8ba3" }}>Sum of course registrations</div>
            </div>
          </div>

          {/* Chart Section */}
          <div style={s.tableCard}>
            <div style={s.cardHeader}>
              <h2 style={s.cardTitle}>Course Enrollment Frequencies</h2>
            </div>
            {chartData.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>No course enrollments registered.</div>
            ) : (
              <div style={{ width: "100%", height: 350 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.2)" vertical={false} />
                    <XAxis 
                      dataKey="courseTitle" 
                      stroke="#7a8ba3" 
                      fontSize={12}
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="#7a8ba3" 
                      fontSize={12}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111c2e",
                        border: "1px solid #1e3a5f",
                        borderRadius: "8px",
                        color: "#fff",
                        fontFamily: "'DM Sans', sans-serif"
                      }}
                      itemStyle={{ color: "#5b9bd5" }}
                      labelStyle={{ color: "#e8edf4", fontWeight: 600 }}
                    />
                    <Bar 
                      dataKey="count" 
                      name={`${term.studentPlural} Enrolled`}
                      radius={[4, 4, 0, 0]}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Breakdown Tables grid */}
          <div style={s.twoCol}>
            {/* Cohorts Program table */}
            <div style={s.tableCard}>
              <div style={s.cardHeader}>
                <h2 style={s.cardTitle}>Enrollment by {term.program}</h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>{term.program}</th>
                      <th style={s.th}>Registered {term.studentPlural}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programData.map((prog, i) => (
                      <tr key={prog.program || i} style={s.tr}>
                        <td style={{ ...s.td, color: "#e8edf4", fontWeight: 600 }}>{prog.program}</td>
                        <td style={s.td}>
                          <span style={{ fontWeight: 600, color: "#5b9bd5" }}>{prog.count}</span> {term.studentPlural.toLowerCase()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cohorts Year level table */}
            <div style={s.tableCard}>
              <div style={s.cardHeader}>
                <h2 style={s.cardTitle}>Enrollment by {term.yearLevel}</h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>{term.yearLevel}</th>
                      <th style={s.th}>Registered {term.studentPlural}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearLevelData.map((y, i) => (
                      <tr key={y.yearLevel || i} style={s.tr}>
                        <td style={{ ...s.td, color: "#e8edf4", fontWeight: 600 }}>{y.yearLevel}</td>
                        <td style={s.td}>
                          <span style={{ fontWeight: 600, color: "#5b9bd5" }}>{y.count}</span> {term.studentPlural.toLowerCase()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
