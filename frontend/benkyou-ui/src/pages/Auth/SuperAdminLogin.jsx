import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useAuth();
  
  // REDIRECT IF ALREADY AUTHENTICATED
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/superadmin/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [step, setStep] = useState("credentials"); // credentials, otp
  const [tempToken, setTempToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    otpCode: "",
  });

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const data = await apiRequest("auth/superadmin/login", {
        method: "POST",
        body: {
          identifier: form.email,
          password: form.password,
        },
      });

      if (data.requiresMfa) {
        setTempToken(data.tempToken);
        setStep("otp");
        return;
      }

      // SAVE SESSION VIA CONTEXT
      signIn(data);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Invalid super admin credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const data = await apiRequest("auth/superadmin/verify-otp", {
        method: "POST",
        body: {
          tempToken: tempToken,
          code: form.otpCode,
        },
      });

      // SAVE SESSION VIA CONTEXT
      signIn(data);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Verification code failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #4b5563; }
      `}</style>

      <div style={styles.card}>
        {/* TOP HEADER */}
        <div style={styles.header}>
          <div style={styles.logo}>
            ben<span style={{ color: "#7eb3e8" }}>kyou</span>
          </div>
          <div style={styles.headerLabel}>
            System administration
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={styles.content}>
          
          <div style={styles.badgeContainer}>
            <div style={styles.badge}>
              <span style={{ marginRight: 8 }}>⭐</span> Super admin portal
            </div>
          </div>

          <div style={styles.alertBox}>
            <div style={styles.alertIcon}>⚠️</div>
            <div>
              <p style={styles.alertText}>
                <strong>Restricted access.</strong> This portal is for system administrators only. Institutional data is strictly isolated and cannot be overseen here. All logins are audited.
              </p>
            </div>
          </div>

          {step === "credentials" ? (
            <form onSubmit={handleLogin} style={styles.formGrid}>
              <FormField 
                label="SUPER ADMIN EMAIL" 
                value={form.email} 
                onChange={(v) => handleInputChange("email", v)} 
                placeholder="superadmin@benkyou.ph" 
                type="email" 
              />

              <FormField 
                label="PASSWORD" 
                value={form.password} 
                onChange={(v) => handleInputChange("password", v)} 
                placeholder="••••••••" 
                type="password" 
              />

              {errorMessage && (
                <div style={{ 
                  padding: "12px 14px", 
                  background: "rgba(220, 38, 38, 0.12)", 
                  border: "1px solid rgba(248, 113, 113, 0.35)", 
                  borderRadius: 8, 
                  color: "#fecaca", 
                  fontSize: 13, 
                  marginBottom: 10 
                }}>
                  {errorMessage}
                </div>
              )}

              <button type="submit" style={styles.primaryBtn}>
                Sign in to system console
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={styles.formGrid}>
              <div style={{ marginBottom: 12, color: "#fff", fontSize: 14 }}>
                Please check your email for the 6-digit authentication code.
              </div>

              {errorMessage && (
                <div style={{ 
                  padding: "12px 14px", 
                  background: "rgba(220, 38, 38, 0.12)", 
                  border: "1px solid rgba(248, 113, 113, 0.35)", 
                  borderRadius: 8, 
                  color: "#fecaca", 
                  fontSize: 13, 
                  marginBottom: 10 
                }}>
                  {errorMessage}
                </div>
              )}

              <FormField 
                label="VERIFICATION CODE" 
                value={form.otpCode} 
                onChange={(v) => handleInputChange("otpCode", v)} 
                placeholder="123456" 
                type="text" 
              />

              <button type="submit" style={styles.primaryBtn}>
                Verify & Sign in
              </button>
              <button 
                type="button" 
                onClick={() => setStep("credentials")} 
                style={{...styles.primaryBtn, background: "transparent", border: "1px solid #374151", marginTop: 8}}
              >
                Back to login
              </button>
            </form>
          )}

          <div style={styles.footer}>
            <span style={{ color: "#4b5563" }}>Not a super admin?</span>{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }} style={styles.returnLink}>
              Return to main login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* COMPONENTS */

function FormField({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={{ width: "100%" }}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.input}
        required
      />
    </div>
  );
}

/* STYLES */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0f18", // Slightly darker than the main login for a "backend" feel
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 540, // Narrower, single-column card
    background: "#111827", // Dark slate background
    border: "1px solid #1f2937",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  
  logo: {
    fontSize: 20,
    fontWeight: 600,
    textTransform: "lowercase",
    color: "#fff"
  },
  
  headerLabel: {
    fontSize: 13,
    color: "#476b91",
    fontWeight: 500
  },

  content: {
    padding: "40px 48px",
    display: "flex",
    flexDirection: "column",
  },

  badgeContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 28,
  },
  
  badge: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(126, 179, 232, 0.1)",
    border: "1px solid rgba(126, 179, 232, 0.2)",
    color: "#a8c8e8",
    padding: "8px 16px",
    borderRadius: 24,
    fontSize: 13,
    fontWeight: 500,
  },

  alertBox: {
    background: "rgba(245, 158, 11, 0.1)", // Tinted orange background
    border: "1px solid rgba(245, 158, 11, 0.3)",
    borderRadius: 8,
    padding: "16px",
    marginBottom: 32,
    display: "flex",
    alignItems: "flex-start",
    gap: 12
  },
  
  alertIcon: {
    fontSize: 16,
    flexShrink: 0,
    marginTop: 2
  },
  
  alertText: {
    fontSize: 13,
    color: "#fcd34d", // Soft yellow/orange text
    margin: 0,
    lineHeight: 1.5
  },

  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 20, 
  },
  
  label: {
    display: "block",
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: 8
  },
  
  input: {
    width: "100%",
    padding: "14px",
    background: "#0b0f14", // Deep dark input
    border: "1px solid #1f2937",
    borderRadius: 8,
    color: "#dde2e8",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  },

  primaryBtn: {
    width: "100%",
    padding: "14px",
    marginTop: 12,
    background: "#185fa5", 
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  
  footer: {
    marginTop: 32,
    textAlign: "center",
    fontSize: 13,
  },
  
  returnLink: {
    color: "#7eb3e8",
    textDecoration: "none",
    fontWeight: 500,
    marginLeft: 4,
    transition: "color 0.3s"
  }
};
