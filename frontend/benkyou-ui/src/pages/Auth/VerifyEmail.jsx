import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../../api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!userId || !token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    const verify = async () => {
      try {
        const data = await apiRequest(`auth/verify-email?userId=${userId}&token=${encodeURIComponent(token)}`);
        
        setStatus("success");
        setMessage("Your email has been verified successfully!");
        
        // Auto-login if token provided
        if (data.token) {
          localStorage.setItem("token", data.token);
          if (data.tenantCode) localStorage.setItem("tenantCode", data.tenantCode);
        }
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Verification failed. The link may be expired.");
      }
    };

    verify();
  }, [userId, token]);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      <div style={styles.card}>
        <div style={styles.logo}>
          ben<span style={{ color: "#7eb3e8" }}>kyou</span>
        </div>

        {status === "verifying" && (
          <div style={styles.content}>
            <div style={styles.spinner}></div>
            <h1 style={styles.title}>Verifying your email...</h1>
            <p style={styles.sub}>Please wait while we confirm your account.</p>
          </div>
        )}

        {status === "success" && (
          <div style={styles.content}>
            <div style={styles.iconSuccess}>✓</div>
            <h1 style={styles.title}>Account Verified!</h1>
            <p style={styles.sub}>{message}</p>
            <Link to="/login" style={styles.primaryBtn}>
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === "error" && (
          <div style={styles.content}>
            <div style={styles.iconError}>✕</div>
            <h1 style={styles.title}>Verification Failed</h1>
            <p style={styles.sub}>{message}</p>
            <Link to="/login" style={styles.secondaryBtn}>
              Back to Login
            </Link>
          </div>
        )}
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
    maxWidth: 450,
    background: "#1e293b",
    borderRadius: 16,
    padding: "40px",
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
  },
  logo: {
    fontSize: 28,
    fontWeight: 600,
    marginBottom: 40,
    color: "#fff",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: 500,
    color: "#fff",
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    color: "#9ca3af",
    marginBottom: 32,
    lineHeight: 1.6,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(126, 179, 232, 0.1)",
    borderTop: "3px solid #7eb3e8",
    borderRadius: "50%",
    marginBottom: 24,
    animation: "spin 1s linear infinite",
  },
  iconSuccess: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "rgba(34, 197, 94, 0.1)",
    color: "#22c55e",
    fontSize: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iconError: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    fontSize: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  primaryBtn: {
    display: "inline-block",
    width: "100%",
    padding: "14px",
    background: "#175fa5",
    color: "#fff",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 15,
    transition: "background 0.2s",
  },
  secondaryBtn: {
    display: "inline-block",
    width: "100%",
    padding: "14px",
    background: "transparent",
    border: "1px solid #374151",
    color: "#fff",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 15,
  }
};
