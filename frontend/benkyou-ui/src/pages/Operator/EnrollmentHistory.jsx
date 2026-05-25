import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { OP_THEME, getNav, OP_STYLES as s } from "./operatorConfig";
import { getBatchHistory } from "../../services/operatorService";
import { getTerminology } from "../../utils/terminology";
import { getMyOrganization } from "../../services/organizationService";
import Pagination from "../../components/shared/Pagination";

export default function EnrollmentHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orgType, setOrgType] = useState("HigherEducation");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const term = getTerminology(orgType);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getBatchHistory();
      setHistory(data || []);
    } catch (err) {
      alert("Failed to load enrollment history: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMyOrganization()
      .then(org => {
        if (org && org.organizationType) setOrgType(org.organizationType);
      })
      .catch(() => {});
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => {
    return (
      item.courseTitle?.toLowerCase().includes(search.toLowerCase()) ||
      item.enrolledByName?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <DashboardLayout
      theme={OP_THEME}
      role="Operator"
      navGroups={getNav("Enrollment History")}
      headerTitle="Enrollment History Log"
      headerSub={`Audit log checklist of all batch enrollment operations completed in the tenant.`}
    >
      <div style={s.tableCard}>
        {/* Controls */}
        <div style={s.cardHeader}>
          <input
            type="text"
            placeholder="Search by course or operator name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...s.input, maxWidth: 300 }}
          />
          <button 
            style={s.outlineBtn}
            onClick={fetchHistory}
            className="btn-hover-dl"
          >
            🔄 Refresh
          </button>
        </div>

        {/* History Table */}
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>Loading historical logs...</div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>No enrollment history logs found.</div>
          ) : (
            <div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Log ID</th>
                    <th style={s.th}>Course Title</th>
                    <th style={s.th}>Cohort {term.program} Filter</th>
                    <th style={s.th}>Cohort {term.yearLevel} Filter</th>
                    <th style={s.th}>Enrolled Count</th>
                    <th style={s.th}>Enrolled By</th>
                    <th style={s.th}>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((log) => (
                    <tr key={log.id} style={s.tr}>
                      <td style={{ ...s.td, fontWeight: 600, color: "#5b9bd5" }}>#{log.id}</td>
                      <td style={{ ...s.td, color: "#e8edf4", fontWeight: 600 }}>{log.courseTitle}</td>
                      <td style={s.td}>
                        <span style={{ color: log.filterProgram ? "#a0b4cb" : "#5a7a9a" }}>
                          {log.filterProgram || `Any ${term.program}`}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ color: log.filterYearLevel ? "#a0b4cb" : "#5a7a9a" }}>
                          {log.filterYearLevel || `Any ${term.yearLevel}`}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ color: "#10b981", fontWeight: 700 }}>+{log.studentsEnrolled}</span>
                      </td>
                      <td style={s.td}>{log.enrolledByName}</td>
                      <td style={s.td}>
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                totalItems={filteredHistory.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
