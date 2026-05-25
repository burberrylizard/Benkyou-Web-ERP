import { useApiData } from "../../hooks/useApiData";
import { getDashboardSummary, getAnalytics } from "../../services/dashboardService";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { ADMIN_THEME, getNav, ADMIN_STYLES as s } from "./adminConfig";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { useNavigate } from "react-router-dom";
import { useTenant } from "../../context/TenantContext";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { tenantPath } = useTenant();
  const { data, isLoading, error } = useApiData(getDashboardSummary);
  const { data: analyticsData } = useApiData(getAnalytics);



  if (isLoading) return (
    <DashboardLayout theme={ADMIN_THEME} role="Admin" navGroups={getNav("Dashboard")} headerTitle="Admin dashboard" headerSub="Loading data...">
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#6b7280" }}>
        <div>Loading dashboard data...</div>
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout theme={ADMIN_THEME} role="Admin" navGroups={getNav("Dashboard")} headerTitle="Admin dashboard" headerSub="Error">
      <div style={{ padding: 24, background: "#fee2e2", color: "#b91c1c", borderRadius: 8 }}>
        Error loading dashboard: {error.message}
      </div>
    </DashboardLayout>
  );

  const { stats, recentUsers, recentCourses, organization, currentUser } = data;

  const STAT_CARDS = [
    { label: "Total users", value: stats.totalUsers, sub: `${stats.activeUsers} active`, subColor: "#10b981" },
    { label: "Courses", value: stats.totalCourses, sub: `${stats.publishedCourses} published`, subColor: "#10b981" },
    { label: "Enrollments", value: stats.totalEnrollments, sub: `${stats.activeEnrollments} active`, subColor: "#3b82f6" },
    { label: "Assessments", value: stats.totalAssessments, sub: "Total active", subColor: "#6b7280" },
  ];

  // Map analytics trends to chart data — handle both key casings from API
  const trendData = analyticsData?.trends?.map(t => ({
    name: t.Month || t.month,
    students: t.Count || t.count
  })) || [];

  return (
    <DashboardLayout
      theme={ADMIN_THEME}
      role="Admin"
      navGroups={getNav("Dashboard")}
      userName={currentUser?.firstName + " " + currentUser?.lastName}
      userInitials={currentUser?.firstName[0] + currentUser?.lastName[0]}
      headerTitle="Admin dashboard"
      headerSub={`${organization?.name || "Benkyou"} · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
    >

      {/* Stats */}
      <div style={s.statsGrid}>
        {STAT_CARDS.map((stat, i) => (
          <div key={i} style={s.card}>
            <div style={s.statLabel}>{stat.label}</div>
            <div style={s.statValue}>{stat.value}</div>
            <div style={{ fontSize: 12, color: stat.subColor, fontWeight: 500 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div style={{ ...s.tableCard, marginBottom: 24, padding: "24px" }}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Student Enrollment Trends</h2>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Last 6 months</span>
        </div>
        <div style={{ width: '100%', height: 300, marginTop: 20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Users + Courses */}
      <div style={s.twoCol}>
        {/* Users Table */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Recent Users</h2>
            <button style={s.primaryBtn} className="btn-hover-dl" onClick={() => navigate(tenantPath("/admin/users"))}>View all</button>
          </div>
          <table style={s.table}>
            <thead><tr><th style={s.th}>NAME</th><th style={s.th}>ROLE</th><th style={s.th}>STATUS</th></tr></thead>
            <tbody>
              {recentUsers.map((u, i) => (
                <tr key={i} style={s.tr}>
                  <td style={s.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img 
                        src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${u.email}`} 
                        alt={u.name} 
                        style={{ width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9" }} 
                      />
                      <span style={{ fontWeight: 500, color: "#111827" }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={s.td}><RoleBadge role={u.role} /></td>
                  <td style={s.td}><StatusBadge status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Courses Table */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Recent Courses</h2>
            <button style={s.primaryBtn} className="btn-hover-dl" onClick={() => navigate(tenantPath("/admin/courses"))}>Manage</button>
          </div>
          <table style={s.table}>
            <thead><tr><th style={s.th}>TITLE</th><th style={s.th}>ENROLLED</th><th style={s.th}>STATUS</th></tr></thead>
            <tbody>
              {recentCourses.map((c, i) => (
                <tr key={i} style={s.tr}>
                  <td style={{ ...s.td, fontWeight: 500, color: "#111827" }}>{c.title}</td>
                  <td style={s.td}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 13, color: "#374151" }}>{c.enrollmentCount} students</span>
                      <div style={s.progressBg}><div style={{ ...s.progressFill, width: `${Math.min(100, (c.enrollmentCount / 50) * 100)}%` }} /></div>
                    </div>
                  </td>
                  <td style={s.td}><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </DashboardLayout>
  );
}

function RoleBadge({ role }) {
  const c = { Instructor: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" }, Student: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" } };
  const d = c[role] || c.Student;
  return <span style={{ background: d.bg, color: d.color, border: `1px solid ${d.border}`, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{role}</span>;
}
function StatusBadge({ status }) {
  const map = { Active: { bg: "#ecfdf5", c: "#047857", b: "#a7f3d0" }, Published: { bg: "#ecfdf5", c: "#047857", b: "#a7f3d0" }, Inactive: { bg: "#fef3c7", c: "#b45309", b: "#fde68a" }, Draft: { bg: "#fef3c7", c: "#b45309", b: "#fde68a" } };
  const d = map[status] || map.Active;
  return <span style={{ background: d.bg, color: d.c, border: `1px solid ${d.b}`, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{status}</span>;
}