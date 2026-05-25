import DashboardLayout from "../../components/shared/DashboardLayout";
import { SA_THEME, getNav, SA_STYLES as s } from "./saConfig";
import { useApiData } from "../../hooks/useApiData";
import { getPlatformAnalytics } from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

const chartTooltipStyle = {
  contentStyle: { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 13, color: "#f8fafc" },
  itemStyle: { color: "#cbd5e1" },
  labelStyle: { color: "#94a3b8", fontWeight: 600 },
};

export default function Analytics() {
  const { user: authUser } = useAuth();
  const { data, isLoading } = useApiData(getPlatformAnalytics);

  if (isLoading) return (
    <DashboardLayout theme={SA_THEME} role="SuperAdmin" navGroups={getNav("System Analytics")} headerTitle="Analytics" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#94a3b8" }}>Loading platform metrics...</div>
    </DashboardLayout>
  );

  if (!data || !data.stats) return (
    <DashboardLayout theme={SA_THEME} role="SuperAdmin" navGroups={getNav("System Analytics")} headerTitle="Analytics" headerSub="Error">
      <div style={{ textAlign: "center", padding: 50, color: "#dc2626" }}>Failed to load analytics data.</div>
    </DashboardLayout>
  );

  const { userGrowth = [], orgGrowth = [], roleDist = [], contentStats = [], topOrgs = [] } = data;

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
      navGroups={getNav("System Analytics")}
      userName={authUser?.name}
      headerTitle="System Analytics"
      headerSub="Platform-wide metrics and insights"
    >
      {/* Content Stats */}
      <div style={s.statsGrid}>
        {contentStats.map((c, i) => (
          <div key={i} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={s.statLabel}>{c.label}</div>
                <div style={s.statValue}>{c.value}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: c.bg || "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {c.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Growth Charts */}
      <div style={s.twoCol}>
        {/* User Growth Area Chart */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <div>
              <h2 style={s.cardTitle}>User Registration Trend</h2>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>New users per month (last 6 months)</p>
            </div>
          </div>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={userGrowth} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradUserGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradUserGrowth)" name="New Users" dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>No registration data yet</div>
          )}
        </div>

        {/* Organization Growth Area Chart */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <div>
              <h2 style={s.cardTitle}>Organization Growth</h2>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>New institutions per month</p>
            </div>
          </div>
          {orgGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={orgGrowth} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradOrgGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="orgs" stroke="#10b981" strokeWidth={2.5} fill="url(#gradOrgGrowth)" name="New Orgs" dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>No organization data yet</div>
          )}
        </div>
      </div>

      {/* Role Distribution + Top Orgs */}
      <div style={s.twoCol}>
        {/* Role Distribution Pie Chart */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <div>
              <h2 style={s.cardTitle}>Role Distribution</h2>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Breakdown of users by role</p>
            </div>
          </div>
          {roleDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={roleDist.map(r => ({ name: r.role, value: r.count }))} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                  {roleDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 13, color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>No user data</div>
          )}
        </div>

        {/* Top Organizations */}
        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Top Organizations by Activity</h2>
          </div>
          {topOrgs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topOrgs.map((org, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10, border: "1px solid #1f2937", background: "#0f172a", transition: "border-color 0.2s" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: COLORS[i % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 14, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{org.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{org.users} users · {org.courses} courses</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#3b82f6" }}>{org.users}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>users</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>{org.courses}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>courses</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>No organization data</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
