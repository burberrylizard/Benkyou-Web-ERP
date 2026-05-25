import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { SA_THEME, getNav, SA_STYLES as s } from "./superAdminConfig";
import { useApiData } from "../../hooks/useApiData";
import { getAllPlans, updatePlanStatus } from "../../services/subscriptionService";
import { useAuth } from "../../context/AuthContext";

export default function PlansManagement() {
  const { user: authUser } = useAuth();
  const { data: plans, isLoading, reload } = useApiData(getAllPlans);
  const [updating, setUpdating] = useState(null);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      setUpdating(id);
      await updatePlanStatus(id, !currentStatus);
      await reload();
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) return (
    <DashboardLayout theme={SA_THEME} role="SuperAdmin" navGroups={getNav("Plans")} headerTitle="Subscription Plans" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50 }}>Loading plans...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout 
      theme={SA_THEME} 
      role="SuperAdmin" 
      navGroups={getNav("Plans")} 
      userName={authUser?.name} 
      headerTitle="Subscription Plans" 
      headerSub="Manage pricing and limits"
    >
      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Platform Tiers</h2>
          <button style={s.primaryBtn}>+ Create Plan</button>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>PLAN NAME</th>
              <th style={s.th}>MONTHLY</th>
              <th style={s.th}>YEARLY</th>
              <th style={s.th}>MAX USERS</th>
              <th style={s.th}>STORAGE</th>
              <th style={s.th}>STATUS</th>
              <th style={s.th}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.planID} style={s.tr}>
                <td style={{ ...s.td, fontWeight: 500, color: "#1e293b" }}>{plan.name}</td>
                <td style={s.td}>${plan.priceMonthly}</td>
                <td style={s.td}>${plan.priceYearly}</td>
                <td style={s.td}>{plan.maxUsers}</td>
                <td style={s.td}>{plan.maxStorageGB} GB</td>
                <td style={s.td}><Badge status={plan.isActive ? "Active" : "Inactive"} /></td>
                <td style={s.td}>
                  <button 
                    disabled={updating === plan.planID}
                    onClick={() => handleToggleStatus(plan.planID, plan.isActive)}
                    style={{ 
                      ...s.outlineBtn, 
                      fontSize: 12, 
                      padding: "4px 10px",
                      color: plan.isActive ? "#dc2626" : "#059669",
                      borderColor: plan.isActive ? "#fca5a5" : "#6ee7b7"
                    }}
                  >
                    {updating === plan.planID ? "..." : plan.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

function Badge({ status }) {
  const active = status === "Active";
  return (
    <span style={{ 
      ...s.badge, 
      background: active ? "#ecfdf5" : "#fef2f2", 
      color: active ? "#059669" : "#dc2626",
      border: `1px solid ${active ? "#10b98140" : "#ef444440"}`
    }}>
      {status}
    </span>
  );
}
