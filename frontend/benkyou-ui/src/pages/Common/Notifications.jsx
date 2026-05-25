import DashboardLayout from "../../components/shared/DashboardLayout";
import { useApiData } from "../../hooks/useApiData";
import { getNotifications, markAsRead } from "../../services/notificationService";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_THEME, getNav as getAdminNav } from "../Admin/adminConfig";
import { INST_THEME, getNav as getInstNav } from "../Instructor/instructorConfig";
import { STU_THEME, getNav as getStuNav } from "../Student/studentConfig";
import { SA_THEME, getNav as getSaNav } from "../SuperAdmin/superAdminConfig";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data: notifications, isLoading, reload } = useApiData(getNotifications);

  const getThemeAndNav = () => {
    switch (user?.role) {
      case "SuperAdmin": return { theme: SA_THEME, nav: getSaNav("Notifications"), role: "SuperAdmin" };
      case "Admin": return { theme: ADMIN_THEME, nav: getAdminNav("Notifications"), role: "Admin" };
      case "Instructor": return { theme: INST_THEME, nav: getInstNav("Notifications"), role: "Instructor" };
      default: return { theme: STU_THEME, nav: getStuNav("Notifications"), role: "Student" };
    }
  };

  const { theme, nav, role } = getThemeAndNav();

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      reload();
    } catch (err) {}
  };

  if (isLoading) return <div style={{ padding: 50, textAlign: "center" }}>Loading notifications...</div>;

  return (
    <DashboardLayout 
      theme={theme} 
      role={role} 
      navGroups={nav} 
      userName={user?.name} 
      headerTitle="Notifications" 
      headerSub="Stay updated with your activities"
    >
      <div style={{ maxWidth: 800, margin: "0 auto", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
             <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
             <p>No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.notificationID} style={{ 
              padding: 20, 
              borderBottom: "1px solid #f3f4f6", 
              background: n.isRead ? "transparent" : "#f0f7ff",
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
              transition: "background 0.2s"
            }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: n.type === "System" ? "#f3f4f6" : "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18
              }}>
                {n.type === "System" ? "⚙️" : "📘"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>{n.title}</h4>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ margin: "0 0 12px 0", fontSize: 14, color: "#4b5563", lineHeight: 1.5 }}>{n.message}</p>
                {!n.isRead && (
                  <button 
                    onClick={() => handleMarkRead(n.notificationID)}
                    style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
