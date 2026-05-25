import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../services/authService";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // email, code, done
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setError("");
    try {
      await forgotPassword(email);
      setStep("code");
    } catch (err) {
      setError(err.message || "Failed to send reset code. Check your email address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await resetPassword(email, code, newPassword);
      setStep("done");
    } catch (err) {
      setError(err.message || "Invalid code or reset failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #555; }
      `}</style>

      <div style={styles.card}>
        {/* LEFT SIDEBAR */}
        <div style={styles.sidebar}>
          <div>
            <div style={styles.logo}>
              ben<span style={{ color: "#7eb3e8" }}>kyou</span>
            </div>
            <h2 style={styles.sideTitle}>Password Recovery</h2>
            <p style={styles.sideSub}>
              {step === "email" && "Enter your email address and we'll send you a 6-digit verification code to reset your password."}
              {step === "code" && "We've sent a verification code to your email. Enter it below along with your new password."}
              {step === "done" && "Your password has been reset successfully. You can now sign in with your new password."}
            </p>
            <div style={{ marginTop: 40 }}>
              <StepIndicator step={1} label="Enter email" active={step === "email"} done={step !== "email"} />
              <StepIndicator step={2} label="Verify & reset" active={step === "code"} done={step === "done"} />
              <StepIndicator step={3} label="Done" active={step === "done"} done={false} />
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div style={styles.content}>
          {step === "email" && (
            <>
              <div style={styles.header}>
                <h1 style={styles.title}>Reset your password</h1>
                <p style={styles.sub}>Enter the email address associated with your account</p>
              </div>
              <form onSubmit={handleSendOtp} style={styles.formGrid}>
                <div style={{ width: "100%" }}>
                  <label style={styles.label}>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@school.edu.ph"
                    style={styles.input}
                    required
                  />
                </div>
                {error && <div style={styles.errorBox}>{error}</div>}
                <button type="submit" disabled={isSubmitting} style={styles.primaryBtn}>
                  {isSubmitting ? "Sending code..." : "Send Reset Code"}
                </button>
                <button type="button" onClick={() => navigate("/login")} style={styles.backBtn}>
                  ← Back to sign in
                </button>
              </form>
            </>
          )}

          {step === "code" && (
            <>
              <div style={styles.header}>
                <h1 style={styles.title}>Enter verification code</h1>
                <p style={styles.sub}>
                  We sent a 6-digit code to <strong style={{ color: "#7eb3e8" }}>{email}</strong>
                </p>
              </div>
              <form onSubmit={handleResetPassword} style={styles.formGrid}>
                <div style={{ width: "100%" }}>
                  <label style={styles.label}>VERIFICATION CODE</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    style={styles.input}
                    maxLength={6}
                    required
                  />
                </div>
                <div style={{ width: "100%" }}>
                  <label style={styles.label}>NEW PASSWORD</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={{ width: "100%" }}>
                  <label style={styles.label}>CONFIRM NEW PASSWORD</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    style={styles.input}
                    required
                  />
                </div>
                {error && <div style={styles.errorBox}>{error}</div>}
                <button type="submit" disabled={isSubmitting} style={styles.primaryBtn}>
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </button>
                <button type="button" onClick={() => { setStep("email"); setError(""); }} style={styles.backBtn}>
                  ← Use a different email
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 60, marginBottom: 24 }}>✅</div>
              <h1 style={styles.title}>Password reset successful!</h1>
              <p style={{ ...styles.sub, marginBottom: 32 }}>
                You can now sign in with your new password.
              </p>
              <button onClick={() => navigate("/login")} style={styles.primaryBtn}>
                Sign in now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step, label, active, done }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
        background: done ? "#10b981" : active ? "#185fa5" : "rgba(255,255,255,0.06)",
        color: done || active ? "#fff" : "#5a7a9a",
        border: active ? "2px solid #3b82f6" : "none",
      }}>
        {done ? "✓" : step}
      </div>
      <span style={{ fontSize: 13, color: active ? "#e8edf4" : "#5a7a9a", fontWeight: active ? 600 : 400 }}>{label}</span>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 20 },
  card: { width: "100%", maxWidth: 950, display: "grid", gridTemplateColumns: "360px 1fr", background: "#1e293b", borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" },
  sidebar: { background: "#0d2137", padding: "50px 36px", color: "#fff", display: "flex", flexDirection: "column" },
  logo: { fontSize: 24, fontWeight: 600, textTransform: "lowercase", marginBottom: 40 },
  sideTitle: { fontSize: 20, fontWeight: 500, marginBottom: 12, lineHeight: 1.2 },
  sideSub: { fontSize: 14, color: "#9ca3af", marginBottom: 24, lineHeight: 1.6 },
  content: { padding: "50px 60px", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center" },
  header: { marginBottom: 36 },
  title: { fontSize: 24, fontWeight: 500, marginBottom: 8 },
  sub: { fontSize: 14, color: "#9ca3af" },
  formGrid: { display: "flex", flexDirection: "column", gap: 20 },
  label: { display: "block", fontSize: 11, color: "#a8c8e8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 },
  input: { width: "100%", padding: "14px", background: "#0b0f14", border: "1px solid #374151", borderRadius: 8, color: "#dde2e8", fontSize: 14, outline: "none" },
  errorBox: { padding: "12px 14px", background: "rgba(220,38,38,0.12)", border: "1px solid rgba(248,113,113,0.35)", borderRadius: 8, color: "#fecaca", fontSize: 13 },
  primaryBtn: { width: "100%", padding: "14px", marginTop: 10, background: "#175fa5", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  backBtn: { width: "100%", padding: "12px", background: "transparent", color: "#7eb3e8", border: "1px solid #374151", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" },
};
