import React, { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { OP_THEME, getNav, OP_STYLES as s } from "./operatorConfig";
import { useApiData } from "../../hooks/useApiData";
import { getEnrollmentRequests, approveEnrollmentRequest, rejectEnrollmentRequest } from "../../services/enrollmentService";
import { getClassSections } from "../../services/classSectionService";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/shared/UI/Modal";
import Button from "../../components/shared/UI/Button";

export default function OperatorEnrollmentRequests() {
  const { user: authUser } = useAuth();
  const { data: requests, isLoading, reload } = useApiData(getEnrollmentRequests);
  
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Approval Modal States for Section Selection
  const [activeApprovalRequest, setActiveApprovalRequest] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [loadingSections, setLoadingSections] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    if (!requests) return [];
    if (statusFilter === "All") return requests;
    if (statusFilter === "Pending") return requests.filter(r => r.status === "Pending" || r.status === "0");
    if (statusFilter === "Approved") return requests.filter(r => r.status === "Approved" || r.status === "1");
    if (statusFilter === "Rejected") return requests.filter(r => r.status === "Rejected" || r.status === "2");
    return requests;
  }, [requests, statusFilter]);

  // Client-side pagination
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleFilterChange = (tab) => {
    setStatusFilter(tab);
    setRejectingId(null);
    setCurrentPage(1);
  };

  const openApprovalModal = async (req) => {
    setActiveApprovalRequest(req);
    setSelectedSectionId("");
    setSections([]);
    setLoadingSections(true);
    try {
      const data = await getClassSections(req.courseID);
      setSections(data || []);
    } catch (err) {
      console.error("Failed to load sections", err);
    } finally {
      setLoadingSections(false);
    }
  };

  const handleApproveSubmit = async () => {
    if (!activeApprovalRequest) return;
    setIsSubmitting(true);
    try {
      await approveEnrollmentRequest(
        activeApprovalRequest.id, 
        selectedSectionId ? parseInt(selectedSectionId) : null
      );
      setActiveApprovalRequest(null);
      reload();
    } catch (err) {
      alert(err.message || "Failed to approve request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async (id) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    setIsSubmitting(true);
    try {
      await rejectEnrollmentRequest(id, rejectionReason);
      setRejectingId(null);
      setRejectionReason("");
      reload();
    } catch (err) {
      alert(err.message || "Failed to reject request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allRequests = requests || [];

  return (
    <DashboardLayout 
      theme={OP_THEME} 
      role="Operator" 
      navGroups={getNav("Enrollment Requests")} 
      userName={authUser?.name} 
      headerTitle="Enrollment Requests" 
      headerSub="Approve or reject student course enrollment requests with section cohorts."
    >
      <div style={s.statsGrid}>
        {[
          { label: "Total Requests", value: allRequests.length.toString(), sub: "All time received", subColor: "#5b9bd5" },
          { label: "Pending Review", value: allRequests.filter(r => r.status === "Pending" || r.status === "0").length.toString(), sub: "Awaiting action", subColor: "#f59e0b" },
          { label: "Total Approved", value: allRequests.filter(r => r.status === "Approved" || r.status === "1").length.toString(), sub: "Enrolled", subColor: "#10b981" },
          { label: "Total Rejected", value: allRequests.filter(r => r.status === "Rejected" || r.status === "2").length.toString(), sub: "Declined", subColor: "#ef4444" },
        ].map((stat, i) => (
          <div key={i} style={s.card}>
            <div style={s.statLabel}>{stat.label}</div>
            <div style={s.statValue}>{stat.value}</div>
            <div style={{ fontSize: 12, color: stat.subColor, fontWeight: 500 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Review list</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["Pending", "Approved", "Rejected", "All"].map((tab) => (
              <button 
                key={tab} 
                onClick={() => handleFilterChange(tab)} 
                style={{ 
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", 
                  background: statusFilter === tab ? "#185fa5" : "transparent", 
                  color: statusFilter === tab ? "#fff" : "#7a8ba3", 
                  border: statusFilter === tab ? "1px solid #185fa5" : "1px solid #1e3a5f" 
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#5a7a9a" }}>Loading requests...</div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>STUDENT</th>
                    <th style={s.th}>COURSE</th>
                    <th style={s.th}>REQUESTED DATE</th>
                    <th style={s.th}>STATUS</th>
                    <th style={s.th}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, color: "#5a7a9a" }}>No enrollment requests found.</td></tr>
                  ) : (
                    paginatedRequests.map((r, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <img 
                              src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${r.studentEmail}`} 
                              alt={r.studentName} 
                              style={{ width: 32, height: 32, borderRadius: "50%", background: "#111c2e", border: "1px solid #1e3a5f" }} 
                            />
                            <span style={{ fontWeight: 500, color: "#e8edf4" }}>{r.studentName}</span>
                          </div>
                        </td>
                        <td style={s.td}>
                          <div style={{ fontWeight: 500, color: "#e8edf4" }}>{r.courseTitle}</div>
                        </td>
                        <td style={s.td}><span style={{ color: "#7a8ba3", fontSize: 13 }}>{new Date(r.requestedAt).toLocaleDateString()}</span></td>
                        <td style={s.td}><RequestBadge status={r.status} /></td>
                        <td style={s.td}>
                          {(r.status === "Pending" || r.status === "0") && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {rejectingId === r.id ? (
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <input 
                                    type="text" 
                                    placeholder="Reason for rejection"
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                    style={{ ...s.input, width: 180, padding: "4px 8px", fontSize: 12 }}
                                  />
                                  <button 
                                    onClick={() => handleRejectSubmit(r.id)}
                                    disabled={isSubmitting}
                                    style={{ ...s.primaryBtn, background: "#ef4444", padding: "4px 10px", borderRadius: 4, fontSize: 12 }}
                                  >
                                    Submit
                                  </button>
                                  <button 
                                    onClick={() => setRejectingId(null)}
                                    style={{ ...s.outlineBtn, padding: "4px 10px", borderRadius: 4, fontSize: 12 }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button 
                                    onClick={() => openApprovalModal(r)}
                                    disabled={isSubmitting}
                                    style={{ ...s.primaryBtn, padding: "4px 10px", borderRadius: 4, fontSize: 12 }}
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => { setRejectingId(r.id); setRejectionReason(""); }}
                                    disabled={isSubmitting}
                                    style={{ ...s.outlineBtn, padding: "4px 10px", borderRadius: 4, fontSize: 12, color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {(r.status === "Approved" || r.status === "1") && (
                            <div style={{ fontSize: 12, color: "#7a8ba3" }}>
                              Processed {r.reviewedAt && new Date(r.reviewedAt).toLocaleDateString()}
                            </div>
                          )}

                          {(r.status === "Rejected" || r.status === "2") && (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: 12, color: "#7a8ba3" }}>
                                Processed {r.reviewedAt && new Date(r.reviewedAt).toLocaleDateString()}
                              </span>
                              {r.rejectionReason && (
                                <span style={{ fontSize: 11, color: "#ef4444", fontStyle: "italic", marginTop: 2 }}>
                                  Reason: "{r.rejectionReason}"
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderTop: "1px solid #1e3a5f", flexWrap: "wrap", gap: 12 }}>
                <span style={{ fontSize: 13, color: "#7a8ba3" }}>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} requests
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    style={{
                      padding: "6px 12px", borderRadius: 4, background: "#111c2e", color: currentPage === 1 ? "#3a5378" : "#fff",
                      border: "1px solid #1e3a5f", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: "6px 12px", color: "#e8edf4", fontSize: 13 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    style={{
                      padding: "6px 12px", borderRadius: 4, background: "#111c2e", color: currentPage === totalPages ? "#3a5378" : "#fff",
                      border: "1px solid #1e3a5f", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Approval & Section Assignment Modal */}
      <Modal
        isOpen={!!activeApprovalRequest}
        onClose={() => setActiveApprovalRequest(null)}
        title="Approve Enrollment Request"
        footer={
          <>
            <Button variant="outline" onClick={() => setActiveApprovalRequest(null)}>Cancel</Button>
            <Button onClick={handleApproveSubmit} isLoading={isSubmitting}>Confirm & Approve</Button>
          </>
        }
      >
        {activeApprovalRequest && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#0b1019", padding: 16, borderRadius: 10, border: "1px solid #1e3a5f" }}>
              <div style={{ fontSize: 12, color: "#7a8ba3", marginBottom: 4 }}>STUDENT</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e8edf4", marginBottom: 12 }}>
                {activeApprovalRequest.studentName} ({activeApprovalRequest.studentEmail})
              </div>
              <div style={{ fontSize: 12, color: "#7a8ba3", marginBottom: 4 }}>COURSE TO ENROLL</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e8edf4" }}>
                {activeApprovalRequest.courseTitle}
              </div>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Assign Class Section (Optional)</label>
              {loadingSections ? (
                <div style={{ fontSize: 13, color: "#7a8ba3" }}>Loading class sections...</div>
              ) : (
                <select
                  value={selectedSectionId}
                  onChange={e => setSelectedSectionId(e.target.value)}
                  style={s.select}
                >
                  <option value="">-- No Section Assigned (Unassigned) --</option>
                  {sections.map(sec => (
                    <option key={sec.classSectionID} value={sec.classSectionID}>
                      {sec.name} (Capacity: {sec.enrolledCount}/{sec.capacity})
                    </option>
                  ))}
                </select>
              )}
              <span style={{ fontSize: 11, color: "#5a7a9a", marginTop: 4, display: "block" }}>
                Optionally segment this student into a cohort section immediately upon approval.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

function RequestBadge({ status }) {
  const map = { 
    Pending: { bg: "rgba(245,158,11,0.12)", c: "#f59e0b", b: "rgba(245,158,11,0.25)" },
    "0": { bg: "rgba(245,158,11,0.12)", c: "#f59e0b", b: "rgba(245,158,11,0.25)" },
    Approved: { bg: "rgba(16,185,129,0.12)", c: "#10b981", b: "rgba(16,185,129,0.25)" }, 
    "1": { bg: "rgba(16,185,129,0.12)", c: "#10b981", b: "rgba(16,185,129,0.25)" }, 
    Rejected: { bg: "rgba(239,68,68,0.12)", c: "#ef4444", b: "rgba(239,68,68,0.25)" },
    "2": { bg: "rgba(239,68,68,0.12)", c: "#ef4444", b: "rgba(239,68,68,0.25)" }
  };
  const d = map[status] || map.Pending;
  const label = (status === "0" || status === "Pending") ? "Pending" : (status === "1" || status === "Approved") ? "Approved" : "Rejected";
  return <span style={{ background: d.bg, color: d.c, border: `1px solid ${d.b}`, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{label}</span>;
}
