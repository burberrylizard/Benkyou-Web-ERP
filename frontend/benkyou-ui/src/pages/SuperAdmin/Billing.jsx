import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { SA_THEME, getNav, SA_STYLES as s } from "./saConfig";
import { useApiData } from "../../hooks/useApiData";
import { getBillingSummary } from "../../services/subscriptionService";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../api/client";

const localS = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#1e293b", padding: 30, borderRadius: 8, width: 400, border: "1px solid #334155" },
  input: { width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f8fafc", marginTop: 5, boxSizing: "border-box" },
  label: { display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginTop: 12 }
};

export default function Billing() {
  const { user: authUser } = useAuth();
  const { data, isLoading, reload } = useApiData(getBillingSummary);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) return (
    <DashboardLayout theme={SA_THEME} role="SuperAdmin" navGroups={getNav("Plans & Billing")} headerTitle="Billing" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50 }}>Loading billing data...</div>
    </DashboardLayout>
  );

  if (!data) return (
    <DashboardLayout theme={SA_THEME} role="SuperAdmin" navGroups={getNav("Plans & Billing")} headerTitle="Billing" headerSub="Error">
      <div style={{ textAlign: "center", padding: 50, color: "#dc2626" }}>Failed to load billing summary.</div>
    </DashboardLayout>
  );

  const { totalMRR, plans, recentInvoices } = data;

  const openEditModal = () => {
    if (plans && plans.length > 0) {
      setSelectedPlan({ ...plans[0] });
      setShowModal(true);
    }
  };

  const handlePlanChange = (planId) => {
    const plan = plans.find(p => p.planID.toString() === planId.toString());
    if (plan) {
      setSelectedPlan({ ...plan });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiRequest(`subscription/plans/${selectedPlan.planID}`, {
        method: "PUT",
        body: {
          name: selectedPlan.name,
          priceMonthly: Number(selectedPlan.priceMonthly),
          isActive: selectedPlan.isActive
        }
      });
      setShowModal(false);
      reload();
    } catch (err) {
      alert(err.message || "Failed to update plan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      theme={SA_THEME}
      role="SuperAdmin"
      navGroups={getNav("Plans & Billing")}
      userName={authUser?.name}
      headerTitle="Plans & Billing"
      headerSub="Manage subscription plans and revenue"
    >
      {/* Revenue Stats */}
      <div style={s.statsGrid}>
        <div style={s.card}>
          <div style={s.statLabel}>Monthly recurring revenue</div>
          <div style={s.statValue}>₱{totalMRR.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "#10b981", fontWeight: 500 }}>Global revenue</div>
        </div>
        <div style={s.card}>
          <div style={s.statLabel}>Total Organizations</div>
          <div style={s.statValue}>{plans.reduce((sum, p) => sum + p.orgCount, 0)}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Across all plans</div>
        </div>
        <div style={s.card}>
            <div style={s.statLabel}>Active Plans</div>
            <div style={s.statValue}>{plans.filter(p => p.isActive).length}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Available to tenants</div>
        </div>
      </div>

      {/* Plan Cards */}
      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Subscription plans</h2>
          <button style={s.primaryBtn} onClick={openEditModal}>Edit plans</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {plans.map((plan) => (
            <div key={plan.planID} style={{ border: "1px solid #334155", borderRadius: 12, padding: 24, background: "#1e293b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>{plan.name}</span>
                <span style={{ background: "rgba(126, 179, 232, 0.1)", color: "#a8c8e8", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}>
                  {plan.orgCount} orgs
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "#f8fafc", marginBottom: 8 }}>₱{plan.priceMonthly.toLocaleString()}</div>
              <div style={plan.isActive ? s.statusActive : s.statusInactive}>
                {plan.isActive ? "ACTIVE PLAN" : "INACTIVE PLAN"}
              </div>
              
              <div style={{ marginTop: 16 }}>
                <div style={{ height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#3b82f6", borderRadius: 3, width: `${Math.min(100, (plan.orgCount / 10) * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Plan Modal */}
      {showModal && selectedPlan && (
        <div style={localS.overlay}>
          <div style={localS.modal}>
            <h3 style={{ ...s.cardTitle, marginBottom: 20 }}>Modify Subscription Plan</h3>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={localS.label}>Select Plan to Edit</label>
                <select 
                  style={localS.input}
                  value={selectedPlan.planID}
                  onChange={(e) => handlePlanChange(e.target.value)}
                >
                  {plans.map(p => <option key={p.planID} value={p.planID}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={localS.label}>Plan Display Name</label>
                <input 
                  required
                  style={localS.input}
                  value={selectedPlan.name}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                />
              </div>
              <div>
                <label style={localS.label}>Monthly Price (₱)</label>
                <input 
                  required
                  type="number"
                  style={localS.input}
                  value={selectedPlan.priceMonthly}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, priceMonthly: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <input 
                  type="checkbox"
                  id="isActive"
                  checked={selectedPlan.isActive}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" style={{ fontSize: 13, color: "#cbd5e1", cursor: "pointer" }}>Active and available to organizations</label>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button type="button" style={s.outlineBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" disabled={isSaving} style={s.primaryBtn}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={s.twoCol}>
        <div style={{ ...s.tableCard, gridColumn: "1 / -1" }}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Recent billing activity</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentInvoices.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>No recent activity.</div>
            ) : (
                recentInvoices.map((inv, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 8, border: "1px solid #1f2937", background: "#0f172a" }}>
                    <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#f1f5f9" }}>{inv.organizationName}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{inv.planName} · {new Date(inv.date).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>₱{inv.amount.toLocaleString()}</div>
                    <span style={{ color: "#10b981", fontSize: 11, fontWeight: 700 }}>{inv.status.toUpperCase()}</span>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
