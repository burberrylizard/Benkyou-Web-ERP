import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { OP_THEME, getNav, OP_STYLES as s } from "./operatorConfig";
import { useApiData } from "../../hooks/useApiData";
import { getOperatorStudents, getBatchHistory } from "../../services/operatorService";
import { getEnrollments } from "../../services/enrollmentService";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";

export default function OperatorDashboard() {
  const { user: authUser } = useAuth();
  const { data: students, isLoading: loadingStudents } = useApiData(getOperatorStudents);
  const { data: batchHistory, isLoading: loadingHistory } = useApiData(getBatchHistory);
  const { data: enrollments, isLoading: loadingEnrollments } = useApiData(getEnrollments);
  const navigate = useNavigate();
  const { tenantPath } = useTenant();

  const studentList = students || [];
  const historyList = batchHistory || [];
  const enrollmentList = enrollments || [];

  const totalStudents = studentList.length;
  const activeStudents = studentList.filter(s => s.isActive).length;
  const totalEnrollments = enrollmentList.length;

  // Program Breakdown logic
  const programCounts = studentList.reduce((acc, current) => {
    const prog = current.program || "Unassigned";
    acc[prog] = (acc[prog] || 0) + 1;
    return acc;
  }, {});

  const topPrograms = Object.entries(programCounts)
    .map(([program, count]) => ({ program, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const stats = [
    { 
      label: "Total Students", 
      value: totalStudents.toString(), 
      sub: "Registered in tenant", 
      subColor: "#5b9bd5" 
    },
    { 
      label: "Active Students", 
      value: activeStudents.toString(), 
      sub: `${totalStudents - activeStudents} inactive students`, 
      subColor: activeStudents > 0 ? "#10b981" : "#7a8ba3" 
    },
    { 
      label: "Course Enrollments", 
      value: totalEnrollments.toString(), 
      sub: "Active student courses", 
      subColor: "#185fa5" 
    },
    { 
      label: "Primary Program", 
      value: topPrograms[0]?.program || "None", 
      sub: topPrograms[0] ? `${topPrograms[0].count} students enrolled` : "No programs", 
      subColor: "#f59e0b" 
    },
  ];

  return (
    <DashboardLayout 
      theme={OP_THEME} 
      role="Operator" 
      navGroups={getNav("Dashboard")} 
      userName={authUser?.name} 
      headerTitle="Operator Dashboard" 
      headerSub={`${authUser?.email || "Operator"} · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
    >
      {/* Stats Grid */}
      <div style={s.statsGrid}>
        {stats.map((stat, i) => (
          <div key={i} style={s.card}>
            <div style={s.statLabel}>{stat.label}</div>
            <div style={s.statValue}>{stat.value}</div>
            <div style={{ fontSize: 12, color: stat.subColor, fontWeight: 500 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={s.twoCol}>
        {/* Recent Batch Enrollments Log summary card */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Recent Batch Enrollments</h2>
            <button 
              style={s.outlineBtn} 
              className="btn-hover-dl"
              onClick={() => navigate(tenantPath("/operator/batch-enroll/history"))}
            >
              View History
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loadingHistory ? (
              <div style={{ padding: 20, textAlign: "center", color: "#5a7a9a" }}>Loading batch history...</div>
            ) : historyList.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#5a7a9a" }}>No recent batch enrollments</div>
            ) : (
              historyList.slice(0, 5).map((log, i) => {
                const colors = ["#185fa5", "#7c3aed", "#0d9488", "#9333ea"];
                const initials = log.enrolledByName?.split(' ').map(n => n[0]).join('').slice(0, 2) || "OP";
                return (
                  <div 
                    key={log.id || i} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 12, 
                      padding: "12px 14px", 
                      borderRadius: 10, 
                      background: "rgba(255,255,255,0.02)", 
                      border: "1px solid rgba(30,58,95,0.4)" 
                    }}
                  >
                    <div style={{ 
                       width: 38, 
                       height: 38, 
                       borderRadius: "50%", 
                       background: colors[i % colors.length], 
                       display: "flex", 
                       alignItems: "center", 
                       justifyContent: "center", 
                       fontSize: 13, 
                       fontWeight: 600, 
                       color: "#fff", 
                       flexShrink: 0 
                     }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                          fontSize: 14, 
                          fontWeight: 600, 
                          color: "#e8edf4", 
                          marginBottom: 2, 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap" 
                        }}>
                        {log.courseTitle}
                      </div>
                      <div style={{ fontSize: 11, color: "#7a8ba3" }}>
                        Enrolled {log.studentsEnrolled} students · {log.filterProgram || "Any"} · {log.filterYearLevel || "Any"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 11, color: "#5a7a9a" }}>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Program Enrollment Breakdown Card */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Student Programs</h2>
            <button 
              style={s.outlineBtn} 
              className="btn-hover-dl" 
              onClick={() => navigate(tenantPath("/operator/students"))}
            >
              Manage Students
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loadingStudents ? (
              <div style={{ padding: 20, textAlign: "center", color: "#5a7a9a" }}>Loading program distribution...</div>
            ) : Object.keys(programCounts).length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#5a7a9a" }}>No student data available</div>
            ) : (
              Object.entries(programCounts).map(([prog, count], i) => {
                const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                return (
                  <div key={prog} style={{ padding: "10px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 500, color: "#a0b4cb" }}>
                      <span>{prog}</span>
                      <span style={{ color: "#e8edf4", fontWeight: 600 }}>{count} ({percentage}%)</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(30,58,95,0.4)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ 
                        height: "100%", 
                        background: i === 0 ? "#185fa5" : i === 1 ? "#5b9bd5" : "#f59e0b", 
                        width: `${percentage}%`,
                        borderRadius: 3 
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
