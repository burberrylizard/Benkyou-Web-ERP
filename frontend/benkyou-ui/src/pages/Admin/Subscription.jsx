import DashboardLayout from "../../components/shared/DashboardLayout";
import { ADMIN_THEME, getNav, ADMIN_STYLES as s } from "./adminConfig";
import { useApiData } from "../../hooks/useApiData";
import { getPlans, getCurrentSubscription } from "../../services/subscriptionService";
import { createCheckoutSession } from "../../services/paymentService";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

import { useNavigate } from "react-router-dom";
import { useTenant } from "../../context/TenantContext";

const STATUS_COLORS = {
  active: { bg: "#ecfdf5", color: "#059669", label: "Active" },
  past_due: { bg: "#fef3c7", color: "#b45309", label: "Past Due" },
  canceled: { bg: "#fef2f2", color: "#dc2626", label: "Canceled" },
  cancelled: { bg: "#fef2f2", color: "#dc2626", label: "Canceled" },
  incomplete: { bg: "#fff7ed", color: "#c2410c", label: "Incomplete" },
  trialing: { bg: "#eff6ff", color: "#2563eb", label: "Trialing" },
};

export default function Subscription() {
  const { user: authUser } = useAuth();
  const { tenantCode } = useTenant();
  const navigate = useNavigate();
  const { data: plans, isLoading: loadingPlans } = useApiData(getPlans);
  const { data: currentSub, isLoading: loadingSub } = useApiData(getCurrentSubscription);
  const [isUpdating, setIsUpdating] = useState(false);

  if (loadingPlans || loadingSub) return (
    <DashboardLayout theme={ADMIN_THEME} role="Admin" navGroups={getNav("Subscription")} headerTitle="Subscription" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50 }}>Loading subscription details...</div>
    </DashboardLayout>
  );

  const subStatus = (currentSub?.status || "incomplete").toLowerCase();
  const statusInfo = STATUS_COLORS[subStatus] || STATUS_COLORS.incomplete;

  const handleUpgrade = async (planId) => {
    if (planId === currentSub?.planID) return;
    setIsUpdating(true);
    try {
      const { url } = await createCheckoutSession(planId, "Monthly");
      if (url) {
        if (url.includes('mock-checkout-success')) {
          sessionStorage.setItem('mockCheckoutUrl', url);
          navigate(`/${tenantCode}/admin/mock-payment`);
        } else {
          window.location.href = url;
        }
      }
    } catch (err) {
      alert(err.message || "Failed to initiate checkout");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DashboardLayout 
      theme={ADMIN_THEME} 
      role="Admin" 
      navGroups={getNav("Subscription")} 
      userName={authUser?.name} 
      headerTitle="Subscription" 
      headerSub="Manage your organization plan"
    >
      {/* Current Plan Card */}
      <div style={{ ...s.card, marginBottom: 32, border: "2px solid #185fa5", background: "linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#185fa5", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>CURRENT PLAN</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{currentSub?.plan?.name || "Free Trial"}</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ 
                background: statusInfo.bg, 
                color: statusInfo.color, 
                padding: "5px 14px", 
                borderRadius: 20, 
                fontSize: 12, 
                fontWeight: 600 
              }}>
                {statusInfo.label}
              </span>
              {currentSub?.stripeSubscriptionId && (
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Stripe ID: {currentSub.stripeSubscriptionId.slice(0, 20)}...
                </span>
              )}
            </div>
            {subStatus === "past_due" && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef3c7", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
                ⚠️ Your payment is past due. Please update your payment method to avoid service interruption.
              </div>
            )}
            {(subStatus === "canceled" || subStatus === "cancelled") && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef2f2", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>
                ❌ Your subscription has been canceled. Upgrade to restore full access.
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#111827" }}>
              ₱{currentSub?.plan?.priceMonthly || 0}
              <span style={{ fontSize: 16, fontWeight: 400, color: "#6b7280" }}>/mo</span>
            </div>
            {currentSub?.endDate && (
              <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>
                Next billing: {new Date(currentSub.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <h2 style={{ fontSize: 20, marginBottom: 24, color: "#111827" }}>Available Plans</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        {plans?.map((plan) => {
          const isCurrent = plan.planID === currentSub?.planID;
          return (
            <div key={plan.planID} style={{ 
              ...s.card, 
              border: isCurrent ? "2px solid #10b981" : "1px solid #e5e7eb", 
              position: "relative",
              transition: "box-shadow 0.2s, transform 0.2s",
            }}>
              {isCurrent && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#10b981", color: "#fff", padding: "3px 14px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                  CURRENT PLAN
                </div>
              )}
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#111827" }}>{plan.name}</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 20, color: "#111827" }}>
                ₱{plan.priceMonthly}
                <span style={{ fontSize: 14, fontWeight: 400, color: "#6b7280" }}>/mo</span>
              </div>
              
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0", display: "flex", flexDirection: "column", gap: 12 }}>
                {plan.maxUsers != null && <li style={{ display: "flex", gap: 8, fontSize: 14, color: "#374151" }}><CheckIcon /> {plan.maxUsers} Users</li>}
                {plan.maxCourses != null && <li style={{ display: "flex", gap: 8, fontSize: 14, color: "#374151" }}><CheckIcon /> {plan.maxCourses} Courses</li>}
                {plan.maxStorageGB != null && <li style={{ display: "flex", gap: 8, fontSize: 14, color: "#374151" }}><CheckIcon /> {plan.maxStorageGB}GB Storage</li>}
              </ul>

              <button 
                onClick={() => handleUpgrade(plan.planID)}
                disabled={isUpdating || isCurrent}
                style={{ 
                  ...s.primaryBtn, 
                  width: "100%", 
                  padding: "10px 16px",
                  background: isCurrent ? "#e5e7eb" : "#185fa5",
                  color: isCurrent ? "#9ca3af" : "#fff",
                  cursor: isCurrent ? "default" : "pointer",
                  borderRadius: 8,
                  transition: "background 0.2s",
                }}
              >
                {isCurrent ? "Current Plan" : isUpdating ? "Processing..." : "Upgrade Plan"}
              </button>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

function CheckIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
}
