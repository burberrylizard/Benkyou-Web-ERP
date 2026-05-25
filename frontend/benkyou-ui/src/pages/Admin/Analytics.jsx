import DashboardLayout from "../../components/shared/DashboardLayout";
import { ADMIN_THEME, getNav, ADMIN_STYLES as s } from "./adminConfig";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useApiData } from "../../hooks/useApiData";
import { getAnalytics } from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";

const COLORS = ["#185fa5", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 },
};

export default function Analytics() {
  const { user: authUser } = useAuth();
  const { data, isLoading, error } = useApiData(getAnalytics);

  if (isLoading) return (
    <DashboardLayout theme={ADMIN_THEME} role="Admin" navGroups={getNav("Analytics")} headerTitle="Analytics" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50 }}>Loading analytics...</div>
    </DashboardLayout>
  );

  if (error || !data) return (
    <DashboardLayout theme={ADMIN_THEME} role="Admin" navGroups={getNav("Analytics")} headerTitle="Analytics" headerSub="Error">
      <div style={{ padding: 24, background: "#fee2e2", color: "#b91c1c", borderRadius: 8, margin: 24 }}>
        Error loading analytics: {error?.message || "No data received"}
      </div>
    </DashboardLayout>
  );

  // The API returns lowercase keys: "month", "count" for trends; "name", "value" for categoryDist
  const trends = data?.trends || [];
  const categoryDist = data?.categoryDist || [];

  // Stats summary from trend data
  const totalEnrollments = trends.reduce((sum, t) => sum + (t.count || t.Count || 0), 0);
  const totalCategories = categoryDist.length;

  return (
    <DashboardLayout 
      theme={ADMIN_THEME} 
      role="Admin" 
      navGroups={getNav("Analytics")} 
      userName={authUser?.name} 
      headerTitle="Analytics" 
      headerSub="Enrollment trends and course insights"
    >
      {/* Summary Stats */}
      <div style={s.statsGrid}>
        <div style={s.card}>
          <div style={s.statLabel}>Enrollments (6 months)</div>
          <div style={s.statValue}>{totalEnrollments}</div>
          <div style={{ fontSize: 12, color: "#10b981", fontWeight: 500 }}>{trends.length} months tracked</div>
        </div>
        <div style={s.card}>
          <div style={s.statLabel}>Course categories</div>
          <div style={s.statValue}>{totalCategories}</div>
          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Active categories</div>
        </div>
        <div style={s.card}>
          <div style={s.statLabel}>Peak month</div>
          <div style={s.statValue}>
            {trends.length > 0 
              ? Math.max(...trends.map(t => t.count || t.Count || 0))
              : 0}
          </div>
          <div style={{ fontSize: 12, color: "#185fa5", fontWeight: 500 }}>Highest enrollment</div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 24, marginBottom: 24 }}>
        {/* Enrollment Trends */}
        <div style={{ ...s.card, height: 400 }}>
          <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 600, color: "#111827" }}>Enrollment Trends</h3>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Last 6 months</p>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={trends} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorAdminTrends" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#185fa5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#185fa5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#185fa5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAdminTrends)" name="Enrollments" dot={{ fill: "#185fa5", r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80%", color: "#9ca3af" }}>No enrollment data yet</div>
          )}
        </div>

        {/* Category Distribution */}
        <div style={{ ...s.card, height: 400 }}>
          <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 600, color: "#111827" }}>Course Distribution</h3>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>By category</p>
          {categoryDist.length > 0 ? (
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={categoryDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80%", color: "#9ca3af" }}>No course data yet</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
