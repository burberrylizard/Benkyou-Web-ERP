import DashboardLayout from "../../components/shared/DashboardLayout";
import { SA_THEME, getNav, SA_STYLES as s } from "./saConfig";
import { useApiData } from "../../hooks/useApiData";
import { getPlatformAnalytics } from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

const chartTooltipStyle = {
  contentStyle: { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 13, color: "#f8fafc" },
  itemStyle: { color: "#cbd5e1" },
  labelStyle: { color: "#94a3b8", fontWeight: 600 },
};

export default function SuperAdminDashboard() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useApiData(getPlatformAnalytics);

  if (isLoading) return (
    <DashboardLayout theme={SA_THEME} role="SuperAdmin" navGroups={getNav("Dashboard")} headerTitle="System Overview" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#94a3b8" }}>Loading system data...</div>
    </DashboardLayout>
  );

  if (!data || !data.stats) return (
    <DashboardLayout theme={SA_THEME} role="SuperAdmin" navGroups={getNav("Dashboard")} headerTitle="System Overview" headerSub="Error">
      <div style={{ textAlign: "center", padding: 50, color: "#dc2626" }}>Failed to load dashboard data.</div>
    </DashboardLayout>
  );

  const stats = [
    { label: "Total Organizations", value: data.stats.totalOrganizations.toString(), sub: `${data.stats.activeOrganizations} active`, subColor: "#10b981", icon: "🏢" },
    { label: "Total Users", value: data.stats.totalUsers.toLocaleString(), sub: "Across all tenants", subColor: "#64748b", icon: "👥" },
    { label: "Active Subscriptions", value: (data.stats.activeSubscriptions ?? 0).toString(), sub: `${data.stats.incompleteSubscriptions ?? 0} incomplete`, subColor: "#f59e0b", icon: "💳" },
    { label: "Total Courses", value: data.stats.totalCourses.toString(), sub: `${data.stats.totalEnrollments} enrollments`, subColor: "#3b82f6", icon: "📚" },
  ];

  // Subscription breakdown for pie chart
  const subscriptionData = [
    { name: "Active", value: data.stats.activeSubscriptions ?? 0 },
    { name: "Incomplete", value: data.stats.incompleteSubscriptions ?? 0 },
    { name: "Canceled", value: data.stats.canceledSubscriptions ?? 0 },
    { name: "Past Due", value: data.stats.pastDueSubscriptions ?? 0 },
  ].filter(d => d.value > 0);

  const subColors = { Active: "#10b981", Incomplete: "#f59e0b", Canceled: "#ef4444", "Past Due": "#f97316" };

  // User growth for area chart
  const userGrowth = data.userGrowth || [];
  const orgGrowth = data.orgGrowth || [];

  // Merge growth data for combined chart
  const growthData = userGrowth.map((u, i) => ({
    month: u.month,
    users: u.users,
    orgs: orgGrowth[i]?.orgs ?? 0,
  }));

  return (
    <DashboardLayout 
      theme={SA_THEME} 
      role="SuperAdmin" 
      navGroups={getNav("Dashboard")} 
      userName={authUser?.name} 
      headerTitle="System Overview" 
      headerSub={`Platform Health: ${data.stats.activeOrganizations > 0 ? "Normal" : "Warning"}`}
    >
      {/* Stats Grid */}
      <div style={s.statsGrid}>
        {stats.map((stat, i) => (
          <div key={i} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={s.statLabel}>{stat.label}</div>
                <div style={s.statValue}>{stat.value}</div>
                <div style={{ fontSize: 12, color: stat.subColor, fontWeight: 500, marginTop: 4 }}>{stat.sub}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={s.twoCol}>
        {/* Growth Chart */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <div>
              <h2 style={s.cardTitle}>Growth Trends</h2>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Users & organizations over time</p>
            </div>
          </div>
          {growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={growthData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOrgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fill="url(#gradUsers)" name="Users" />
                <Area type="monotone" dataKey="orgs" stroke="#10b981" strokeWidth={2} fill="url(#gradOrgs)" name="Organizations" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No growth data yet</div>
          )}
        </div>

        {/* Subscription Breakdown */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <div>
              <h2 style={s.cardTitle}>Subscription Status</h2>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Breakdown of tenant subscriptions</p>
            </div>
          </div>
          {subscriptionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={subscriptionData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {subscriptionData.map((entry, i) => (
                    <Cell key={i} fill={subColors[entry.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No subscription data</div>
          )}
        </div>
      </div>

      {/* Role Distribution Bar Chart */}
      {data.roleDist && data.roleDist.length > 0 && (
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <div>
              <h2 style={s.cardTitle}>User Role Distribution</h2>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Breakdown across all tenants</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.roleDist} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="role" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="count" name="Users" radius={[6, 6, 0, 0]}>
                {data.roleDist.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Organizations Table */}
      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Recent Organizations</h2>
          <button style={s.outlineBtn} onClick={() => navigate("/superadmin/organizations")}>View all</button>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>NAME</th>
              <th style={s.th}>CODE</th>
              <th style={s.th}>PRIMARY EMAIL</th>
              <th style={s.th}>STATUS</th>
              <th style={s.th}>CREATED AT</th>
            </tr>
          </thead>
          <tbody>
            {data.recentOrganizations.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No organizations found.</td></tr>
            ) : (
              data.recentOrganizations.map((org) => (
                <tr key={org.tenantID} style={s.tr}>
                  <td style={{ ...s.td, fontWeight: 500, color: "#f1f5f9" }}>{org.name}</td>
                  <td style={s.td}><code style={{ background: "#334155", color: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>{org.tenantCode}</code></td>
                  <td style={s.td}>{org.primaryEmail}</td>
                  <td style={s.td}>
                    <span style={org.isActive ? s.statusActive : s.statusInactive}>
                      {org.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td style={s.td}>{new Date(org.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
