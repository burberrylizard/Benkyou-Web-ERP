import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { getActiveOrganizations } from "../../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, dashboardPath } = useAuth();
  
  // REDIRECT IF ALREADY AUTHENTICATED
  useEffect(() => {
    if (isAuthenticated) {
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, dashboardPath, navigate]);

  const [step, setStep] = useState("credentials"); // credentials, otp
  const [tempToken, setTempToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    institutionCode: location.state?.tenantCode || "",
    identifier: location.state?.identifier || "",
    password: "",
    otpCode: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    getActiveOrganizations()
      .then(orgs => setOrganizations(orgs || []))
      .catch(() => setOrganizations([]));
  }, []);

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const data = await apiRequest("auth/login", {
        method: "POST",
        body: {
          tenantCode: form.institutionCode,
          identifier: form.identifier,
          password: form.password,
        },
      });

      if (data.requiresMfa) {
        setTempToken(data.tempToken);
        setStep("otp");
        return;
      }

      finishLogin(data);
    } catch (err) {
      console.error("Login error:", err);
      // Clear password on error
      setForm(prev => ({ ...prev, password: "" }));
      
      if (err.message.includes("verify your email")) {
        setErrorMessage("Your email is not verified. Please check your inbox for the OTP.");
      } else {
        setErrorMessage(err.message || "Invalid email or password. Please try again.");
      }
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
      // For SuperAdmin, the endpoint is slightly different, but since the SuperAdmin uses SuperAdminLogin,
      // this Login page is only for normal users.
      const data = await apiRequest("auth/verify-otp", {
        method: "POST",
        body: {
          tempToken: tempToken,
          code: form.otpCode,
        },
      });

      finishLogin(data);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Verification code failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishLogin = (data) => {
    // SAVE SESSION VIA CONTEXT
    // signIn will update the context state, which triggers the useEffect redirect
    signIn(data);
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #555; }
      `}</style>

      <div style={styles.card}>
        {/* LEFT SIDEBAR - Universal Messaging */}
        <div style={styles.sidebar.container}>
          <div>
            <div style={styles.sidebar.logo}>
              ben<span style={{ color: "#7eb3e8" }}>kyou</span>
            </div>

            <div style={styles.sidebar.badge}>
              Universal Learning Portal
            </div>

            <h2 style={styles.sidebar.title}>Welcome to Benkyou</h2>
            <p style={styles.sidebar.sub}>
              The all-in-one learning management system for administrators, educators, and students.
            </p>

            <div style={styles.sidebar.bullets}>
              <BulletItem icon="🛡️" text="Admins: Manage system & users" />
              <BulletItem icon="👩‍🏫" text="Instructors: Build courses & track progress" />
              <BulletItem icon="🎓" text="Students: Access lessons & assessments" />
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT - Unified Login Form */}
        <div style={styles.content.container}>
          {step === "credentials" ? (
            <>
              <div style={styles.content.header}>
                <h1 style={styles.content.title}>Sign in to your account</h1>
                <p style={styles.content.subTitle}>Enter your institution code and credentials to continue</p>
              </div>

              <form onSubmit={handleLogin} style={styles.content.formGrid}>
                <div style={{ width: "100%" }}>
                  <label style={styles.content.label}>INSTITUTION</label>
                  <select
                    value={form.institutionCode}
                    onChange={(e) => handleInputChange("institutionCode", e.target.value)}
                    style={styles.content.input}
                    required
                  >
                    <option value="">Select your institution</option>
                    {organizations.map(org => (
                      <option key={org.tenantID} value={org.tenantCode}>{org.name} ({org.tenantCode})</option>
                    ))}
                  </select>
                </div>
                
                <FormField 
                  label="EMAIL OR STUDENT ID" 
                  value={form.identifier} 
                  onChange={(v) => handleInputChange("identifier", v)} 
                  placeholder="name@school.edu.ph or ID number" 
                  type="text" 
                />

                <div style={{ width: "100%" }}>
                  <FormField 
                    label="PASSWORD" 
                    value={form.password} 
                    onChange={(v) => handleInputChange("password", v)} 
                    placeholder="••••••••" 
                    type="password" 
                  />
                  <div style={{ textAlign: "right", marginTop: 8 }}>
                    <a onClick={(e) => { e.preventDefault(); navigate("/forgot-password"); }} style={{ ...styles.content.forgotLink, cursor: "pointer" }}>Forgot password?</a>
                  </div>
                </div>

                {errorMessage && (
                  <div style={styles.content.errorBox}>
                    {errorMessage}
                  </div>
                )}

                <button type="submit" style={styles.content.primaryBtn}>
                  Sign in
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={styles.content.header}>
                <h1 style={styles.content.title}>Two-Factor Authentication</h1>
                <p style={styles.content.subTitle}>Enter the 6-digit code sent to your email.</p>
              </div>

              <form onSubmit={handleVerifyOtp} style={styles.content.formGrid}>
                <FormField 
                  label="VERIFICATION CODE" 
                  value={form.otpCode} 
                  onChange={(v) => handleInputChange("otpCode", v)} 
                  placeholder="123456" 
                  type="text" 
                />

                <button type="submit" style={styles.content.primaryBtn}>
                  Verify & Sign in
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep("credentials")} 
                  style={{...styles.content.primaryBtn, background: "transparent", border: "1px solid #374151"}}
                >
                  Back to login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/* COMPONENTS */

function BulletItem({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
      <div style={{ fontSize: 16, marginRight: 12 }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, color: "#cbd5e1" }}>{text}</span>
    </div>
  );
}

function FormField({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={{ width: "100%" }}>
      <label style={styles.content.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.content.input}
        required
      />
    </div>
  );
}

/* STYLES */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 950, 
    display: "grid",
    gridTemplateColumns: "380px 1fr", 
    background: "#1e293b",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.4)"
  },

  sidebar: {
    container: {
      background: "#0d2137",
      padding: "50px 40px",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
    },
    logo: {
      fontSize: 24,
      fontWeight: 600,
      textTransform: "lowercase",
      marginBottom: 40
    },
    badge: {
      display: "inline-block",
      background: "rgba(126, 179, 232, 0.15)",
      color: "#7eb3e8",
      padding: "6px 14px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500,
      marginBottom: 24
    },
    title: {
      fontSize: 22,
      fontWeight: 500,
      marginBottom: 12,
      lineHeight: 1.2
    },
    sub: {
      fontSize: 14,
      color: "#9ca3af",
      marginBottom: 32,
      lineHeight: 1.6
    },
    bullets: {
      marginTop: 20
    }
  },

  content: {
    container: {
      padding: "50px 60px",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    },
    header: {
      marginBottom: 36,
    },
    title: {
      fontSize: 24,
      fontWeight: 500,
      marginBottom: 8
    },
    subTitle: {
      fontSize: 14,
      color: "#9ca3af",
    },
    errorBox: {
      padding: "12px 14px",
      background: "rgba(220, 38, 38, 0.12)",
      border: "1px solid rgba(248, 113, 113, 0.35)",
      borderRadius: 8,
      color: "#fecaca",
      fontSize: 13,
      lineHeight: 1.5,
      marginBottom: 10
    },
    formGrid: {
      display: "flex",
      flexDirection: "column",
      gap: 20, 
    },
    label: {
      display: "block",
      fontSize: 11,
      color: "#a8c8e8",
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: 8
    },
    input: {
      width: "100%",
      padding: "14px",
      background: "#0b0f14",
      border: "1px solid #374151",
      borderRadius: 8,
      color: "#dde2e8",
      fontSize: 14,
      outline: "none",
      transition: "border-color 0.2s",
    },
    forgotLink: {
      fontSize: 12,
      color: "#7eb3e8",
      textDecoration: "none",
      fontWeight: 500
    },
    primaryBtn: {
      width: "100%",
      padding: "14px",
      marginTop: 10,
      background: "#175fa5",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
  }
};
