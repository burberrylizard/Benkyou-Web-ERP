import DashboardLayout from "../../components/shared/DashboardLayout";
import { ADMIN_THEME, getNav } from "./adminConfig";
import { Link } from "react-router-dom";

export default function SubscriptionCancel() {
    return (
        <DashboardLayout theme={ADMIN_THEME} role="Admin" navGroups={getNav("Subscription")} headerTitle="Payment Cancelled" headerSub="No charges were made">
            <div style={{ textAlign: "center", padding: "100px 20px" }}>
                <div style={{ fontSize: 60, marginBottom: 20 }}>❌</div>
                <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Payment Cancelled</h1>
                <p style={{ fontSize: 18, color: "#6b7280", marginBottom: 32 }}>The checkout process was cancelled. You can try again whenever you're ready.</p>
                <Link to="/admin/subscription" style={{ background: "#185fa5", color: "#fff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>Back to Subscriptions</Link>
            </div>
        </DashboardLayout>
    );
}
