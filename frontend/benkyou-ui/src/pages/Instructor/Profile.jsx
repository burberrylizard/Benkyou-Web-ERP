import { useState, useRef } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { INST_THEME, getNav, INST_STYLES as s } from "./instructorConfig";
import { useAuth } from "../../context/AuthContext";
import { useApiData } from "../../hooks/useApiData";
import { getDashboardSummary } from "../../services/dashboardService";
import { updateProfile, changeOwnPassword, uploadProfilePhoto } from "../../services/userService";

export default function InstructorProfile() {
  const { user: authUser, refreshUser } = useAuth();
  const { data, isLoading } = useApiData(getDashboardSummary);

  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "" });
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
  const [savingPw, setSavingPw] = useState(false);

  // Photo upload
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleEditToggle = () => {
    if (!editMode) {
      const [first, ...rest] = (authUser?.name || "").split(" ");
      setProfileForm({ firstName: first || "", lastName: rest.join(" ") || "" });
      setProfileMsg({ type: "", text: "" });
    }
    setEditMode(!editMode);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg({ type: "", text: "" });
    try {
      await updateProfile(profileForm);
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
      setEditMode(false);
      if (refreshUser) refreshUser();
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMsg({ type: "", text: "" });
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    setSavingPw(true);
    try {
      await changeOwnPassword(pwForm.currentPassword, pwForm.newPassword);
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPwForm(false);
    } catch (err) {
      setPwMsg({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setSavingPw(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadProfilePhoto(file);
      setProfileMsg({ type: "success", text: "Photo uploaded!" });
      if (refreshUser) refreshUser();
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Failed to upload photo." });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("My Profile")} headerTitle="Profile" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>Loading profile...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("My Profile")} userName={authUser?.name} headerTitle="Profile" headerSub="Manage your instructor profile">
      <div style={s.twoCol}>
        {/* Personal Info */}
        <div style={s.tableCard}>
          <h2 style={s.cardTitle}>Personal information</h2>

          {/* Avatar + Upload */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20, marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#185fa5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", overflow: "hidden", flexShrink: 0 }}>
              {authUser?.profilePhotoUrl
                ? <img src={authUser.profilePhotoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (authUser?.name?.split(" ").map(w => w[0]).join("").toUpperCase() || "U")
              }
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#e8edf4" }}>{authUser?.name}</div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...s.outlineBtn, fontSize: 11, padding: "4px 10px", marginTop: 6 }}>
                {uploading ? "Uploading..." : "Change photo"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
            </div>
          </div>

          {editMode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={fi.group}>
                <label style={fi.label}>FIRST NAME</label>
                <input style={fi.input} value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} />
              </div>
              <div style={fi.group}>
                <label style={fi.label}>LAST NAME</label>
                <input style={fi.input} value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={handleSaveProfile} disabled={savingProfile} style={s.primaryBtn}>{savingProfile ? "Saving..." : "Save"}</button>
                <button onClick={() => setEditMode(false)} style={s.outlineBtn}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <Field label="Full name" value={authUser?.name || "N/A"} />
              <Field label="Email" value={authUser?.email || "N/A"} />
              <Field label="Role" value={authUser?.role || "Instructor"} />
              <Field label="Organization" value={data?.organization?.name || "N/A"} />
            </div>
          )}

          {!editMode && <button onClick={handleEditToggle} style={{ ...s.primaryBtn, marginTop: 20 }} className="btn-hover-dl">Edit profile</button>}

          {profileMsg.text && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, fontSize: 13, background: profileMsg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: profileMsg.type === "success" ? "#10b981" : "#ef4444" }}>
              {profileMsg.text}
            </div>
          )}
        </div>

        {/* Teaching Summary */}
        <div style={s.tableCard}>
          <h2 style={s.cardTitle}>Teaching summary</h2>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "My courses", value: data?.stats?.totalCourses?.toString() || "0", icon: "📚", bg: "rgba(16,185,129,0.1)" },
              { label: "Total students", value: data?.stats?.totalEnrollments?.toString() || "0", icon: "👥", bg: "rgba(59,130,246,0.1)" },
              { label: "Assessments", value: data?.stats?.totalAssessments?.toString() || "0", icon: "📝", bg: "rgba(245,158,11,0.1)" },
              { label: "Published courses", value: data?.stats?.publishedCourses?.toString() || "0", icon: "✅", bg: "rgba(139,92,246,0.1)" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 10, border: "1px solid rgba(30,58,95,0.4)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{item.icon}</div>
                <div style={{ flex: 1, fontSize: 14, color: "#8ea4bd" }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#e8edf4" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security */}
      <div style={s.tableCard}>
        <h2 style={s.cardTitle}>Security</h2>
        <div style={{ marginTop: 16 }}>
          <div style={local.settingRow}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#e8edf4" }}>Password</div>
              <div style={{ fontSize: 13, color: "#5a7a9a" }}>Update your password regularly</div>
            </div>
            <button onClick={() => { setShowPwForm(!showPwForm); setPwMsg({ type: "", text: "" }); }} style={s.outlineBtn}>
              {showPwForm ? "Cancel" : "Change password"}
            </button>
          </div>

          {showPwForm && (
            <div style={{ marginTop: 16, padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid #1e3a5f" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={fi.group}>
                  <label style={fi.label}>CURRENT PASSWORD</label>
                  <input style={fi.input} type="password" value={pwForm.currentPassword} onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={fi.group}>
                    <label style={fi.label}>NEW PASSWORD</label>
                    <input style={fi.input} type="password" value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} />
                  </div>
                  <div style={fi.group}>
                    <label style={fi.label}>CONFIRM NEW PASSWORD</label>
                    <input style={fi.input} type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})} />
                  </div>
                </div>
                <button onClick={handleChangePassword} disabled={savingPw} style={{ ...s.primaryBtn, alignSelf: "flex-start", background: "#7c3aed" }}>
                  {savingPw ? "Updating..." : "Update Password"}
                </button>
              </div>
              {pwMsg.text && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, fontSize: 13, background: pwMsg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: pwMsg.type === "success" ? "#10b981" : "#ef4444" }}>
                  {pwMsg.text}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(30,58,95,0.4)" }}>
      <span style={{ fontSize: 14, color: "#6b85a3" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: "#e8edf4" }}>{value}</span>
    </div>
  );
}

const fi = {
  group: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, fontWeight: 600, color: "#5a7a9a", letterSpacing: "0.05em" },
  input: { padding: "10px 14px", border: "1px solid #2a4060", borderRadius: 8, outline: "none", background: "#0d1a2b", color: "#e8edf4", fontSize: 14 },
};

const local = {
  settingRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid rgba(30,58,95,0.4)" },
};
