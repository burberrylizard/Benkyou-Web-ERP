import DashboardLayout from "../../components/shared/DashboardLayout";
import { ADMIN_THEME, getNav } from "./adminConfig";
import { Link } from "react-router-dom";

export default function SubscriptionSuccess() {
    return (
        <DashboardLayout theme={ADMIN_THEME} role="Admin" navGroups={getNav("Subscription")} headerTitle="Payment Successful" headerSub="Thank you for your purchase">
            <div style={{ textAlign: "center", padding: "100px 20px" }}>
                <div style={{ fontSize: 60, marginBottom: 20 }}>✅</div>
                <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Payment Successful!</h1>
                <p style={{ fontSize: 18, color: "#6b7280", marginBottom: 32 }}>Your subscription has been updated. It may take a moment for the status to reflect in your dashboard.</p>
                <Link to="/admin/dashboard" style={{ background: "#185fa5", color: "#fff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>Go to Dashboard</Link>
            </div>
        </DashboardLayout>
    );
}
