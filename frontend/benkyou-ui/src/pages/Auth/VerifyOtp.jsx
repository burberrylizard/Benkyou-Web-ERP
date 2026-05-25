import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../../api";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState(location.state?.userId || "");
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // If no userId, redirect back to register
    if (!userId) {
      navigate("/register");
    }
  }, [userId, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiRequest("auth/verify-registration-otp", {
        method: "POST",
        body: { userId, code: otp },
      });

      setSuccessMessage("Email verified successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login", { state: { identifier: email } });
      }, 3000);
    } catch (err) {
      setErrorMessage(err.message || "Verification failed. Please check the code and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiRequest("auth/resend-registration-otp", {
        method: "POST",
        body: { userId },
      });
      setSuccessMessage("A new verification code has been sent to your email.");
    } catch (err) {
      setErrorMessage(err.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <div style={styles.card}>
        <div style={styles.sidebar.container}>
          <div>
            <div style={styles.sidebar.logo}>
              ben<span style={{ color: "#7eb3e8" }}>kyou</span>
            </div>
            <h2 style={styles.sidebar.title}>Almost there!</h2>
            <p style={styles.sidebar.sub}>
              We've sent a 6-digit verification code to <strong>{email}</strong>.
            </p>
            <div style={styles.sidebar.infoBox}>
              <span style={{ fontSize: "20px" }}>📧</span>
              <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1" }}>
                Check your inbox and spam folder. The code expires in 10 minutes.
              </p>
            </div>
          </div>
        </div>

        <div style={styles.content.container}>
          <div style={styles.content.header}>
            <h1 style={styles.content.title}>Verify your account</h1>
            <p style={styles.content.subTitle}>Enter the 6-digit code sent to your email address.</p>
          </div>

          <form onSubmit={handleVerify} style={styles.content.form}>
            <div style={styles.content.inputGroup}>
              <label style={styles.content.label}>VERIFICATION CODE</label>
              <input
                type="text"
                maxLength="6"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                style={styles.content.input}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {errorMessage && <div style={styles.content.errorBox}>{errorMessage}</div>}
            {successMessage && <div style={styles.content.successBox}>{successMessage}</div>}

            <button type="submit" style={styles.content.primaryBtn} disabled={isSubmitting || otp.length !== 6}>
              {isSubmitting ? "Verifying..." : "Verify Email"}
            </button>

            <div style={styles.content.footer}>
              <p style={styles.content.footerText}>
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || isSubmitting}
                  style={styles.content.linkBtn}
                >
                  {resending ? "Resending..." : "Resend Code"}
                </button>
              </p>
              <button
                type="button"
                onClick={() => navigate("/register")}
                style={styles.content.backBtn}
              >
                Back to Registration
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

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
    maxWidth: 900,
    display: "grid",
    gridTemplateColumns: "350px 1fr",
    background: "#1e293b",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
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
      marginBottom: 40,
    },
    title: {
      fontSize: 22,
      fontWeight: 500,
      marginBottom: 12,
    },
    sub: {
      fontSize: 14,
      color: "#9ca3af",
      marginBottom: 32,
      lineHeight: 1.6,
    },
    infoBox: {
      background: "rgba(126, 179, 232, 0.1)",
      padding: "16px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginTop: "auto",
    },
  },
  content: {
    container: {
      padding: "50px 60px",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },
    header: {
      marginBottom: 36,
    },
    title: {
      fontSize: 24,
      fontWeight: 500,
      marginBottom: 8,
    },
    subTitle: {
      fontSize: 14,
      color: "#9ca3af",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: 24,
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    label: {
      fontSize: 11,
      color: "#a8c8e8",
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    },
    input: {
      width: "100%",
      padding: "16px",
      background: "#0b0f14",
      border: "1px solid #374151",
      borderRadius: 8,
      color: "#fff",
      fontSize: 24,
      textAlign: "center",
      letterSpacing: "8px",
      outline: "none",
      transition: "border-color 0.2s",
    },
    primaryBtn: {
      width: "100%",
      padding: "14px",
      background: "#175fa5",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    errorBox: {
      padding: "12px",
      background: "rgba(239, 68, 68, 0.1)",
      border: "1px solid rgba(239, 68, 68, 0.2)",
      borderRadius: 8,
      color: "#f87171",
      fontSize: 13,
    },
    successBox: {
      padding: "12px",
      background: "rgba(34, 197, 94, 0.1)",
      border: "1px solid rgba(34, 197, 94, 0.2)",
      borderRadius: 8,
      color: "#4ade80",
      fontSize: 13,
    },
    footer: {
      marginTop: 20,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    },
    footerText: {
      fontSize: 14,
      color: "#9ca3af",
      margin: 0,
    },
    linkBtn: {
      background: "none",
      border: "none",
      color: "#7eb3e8",
      fontWeight: 600,
      cursor: "pointer",
      padding: 0,
      fontSize: 14,
    },
    backBtn: {
      background: "none",
      border: "none",
      color: "#9ca3af",
      fontSize: 12,
      cursor: "pointer",
      textDecoration: "underline",
    },
  },
};
