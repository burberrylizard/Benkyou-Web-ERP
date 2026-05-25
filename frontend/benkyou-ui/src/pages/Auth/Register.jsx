import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api";
import { useAuth } from "../../context/AuthContext";

// A single form state object to collect all data across steps
const initialFormState = {
  institutionName: "",
  shortCode: "",
  country: "Philippines",
  adminEmail: "",
  phone: "",
  timeZone: "Asia/Manila",
  address: "",
  firstName: "",
  lastName: "",
  adminAccountEmail: "",
  password: "",
  confirmPassword: "",
  agreeToTerms: false,
  organizationType: "HigherEducation",
  subscriptionPlan: "Basic" // Free, Basic, Premium
};

export default function Register() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [step, setStep] = useState(1); // 1: Org, 2: Credentials, 3: Subscription, 4: Focus, 5: Welcome
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [countries, setCountries] = useState(["Philippines"]);

  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name");
        const data = await res.json();
        const names = data.map(c => c.name.common).sort();
        setCountries(names);
      } catch (err) {
        console.error("Failed to fetch countries:", err);
      }
    }
    fetchCountries();
  }, []);

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleOrgSubmit = () => {
    if (!form.institutionName || !form.shortCode || !form.adminEmail) {
      alert("Please fill in the required fields (Institution Name, Short Code, Contact Email).");
      return;
    }
    setStep(2);
  };

  const handleCredentialsSubmit = () => {
    if (!form.firstName || !form.lastName || !form.adminAccountEmail || !form.password) {
      alert("Please fill in all required administrator credentials.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!form.agreeToTerms) {
      alert("You must agree to the Terms of Service.");
      return;
    }

    // Password strength check
    const hasUpper = /[A-Z]/.test(form.password);
    const hasLower = /[a-z]/.test(form.password);
    const hasDigit = /\d/.test(form.password);
    const hasSpecial = /[^A-Za-z0-9]/.test(form.password);
    if (form.password.length < 14 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      alert("Password must be at least 14 characters, and include uppercase, lowercase, digit, and special character.");
      return;
    }

    setStep(3);
  };

  const handleSubscriptionSubmit = () => {
    setStep(4);
  };

  const handleOnboardingSubmit = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      // 1. Submit Registration API
      await apiRequest("auth/register-org", {
        method: "POST",
        body: {
          organizationName: form.institutionName,
          shortCode: form.shortCode.toLowerCase().replace(/\s+/g, "-").trim(),
          email: form.adminAccountEmail,
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password,
          organizationType: form.organizationType
        },
      });

      // 2. If registration succeeds, move to step 5 (Welcome screen)
      setStep(5);
    } catch (err) {
      console.error(err);
      let message = err.message || "Registration failed. Please check your credentials and try again.";
      if (err.details && err.details.errors && Array.isArray(err.details.errors)) {
        message = err.details.errors.join(" ");
      }
      setErrorMessage(message);
      // Go back to credentials step to let them fix any errors
      setStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunchDashboard = async () => {
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const targetTenantCode = form.shortCode.toLowerCase().replace(/\s+/g, "-").trim();
      const data = await apiRequest("auth/login", {
        method: "POST",
        body: {
          tenantCode: targetTenantCode,
          identifier: form.adminAccountEmail,
          password: form.password
        }
      });
      // Save session and redirect automatically
      signIn(data);
      const { buildDashboardPath } = await import("../../utils/session");
      const path = buildDashboardPath(data.role || "Admin", data.tenantCode || targetTenantCode);
      navigate(path, { replace: true });
    } catch (err) {
      console.error("Auto-login failed:", err);
      // Fallback: navigate to login screen
      navigate("/login", {
        state: {
          message: "Onboarding complete! Please sign in with your credentials.",
          identifier: form.adminAccountEmail,
          tenantCode: form.shortCode
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #555; }
      `}</style>

      <div style={styles.card}>
        {/* LEFT SIDEBAR WIZARD STEPS */}
        <div style={styles.sidebar.container}>
          <div>
            <div style={styles.sidebar.logo}>
              ben<span style={{ color: "#7eb3e8" }}>kyou</span>
            </div>

            <h2 style={styles.sidebar.title}>Institution Setup</h2>
            <p style={styles.sidebar.sub}>Let's customize your universal learning space.</p>

            <div style={styles.sidebar.steps}>
              <Step number={1} title="Organization" desc="Basic details" active={step === 1} done={step > 1} />
              <Step number={2} title="Credentials" desc="Admin account settings" active={step === 2} done={step > 2} />
              <Step number={3} title="Subscription" desc="Select your plan" active={step === 3} done={step > 3} />
              <Step number={4} title="LMS Focus" desc="Tailor terminology" active={step === 4} done={step > 4} />
              <Step number={5} title="Launch" desc="Welcome to Benkyou" active={step === 5} />
            </div>
          </div>

          <a onClick={() => navigate("/login")} style={{ ...styles.sidebar.footerLink, cursor: "pointer" }}>Already have an account? Sign in</a>
        </div>

        {/* RIGHT CONTENT WIZARD PANEL */}
        <div style={styles.content.container}>
          {/* STEP 1: ORGANIZATION DETAILS */}
          {step === 1 && (
            <>
              <div style={styles.content.header}>
                <h1 style={styles.content.title}>Tell us about your organization</h1>
                <p style={styles.content.subTitle}>This establishes your primary workspace identity in Benkyou.</p>
              </div>

              <div style={styles.content.formGrid}>
                <FormField label="INSTITUTION NAME *" value={form.institutionName} onChange={(v) => handleInputChange("institutionName", v)} placeholder="E.g., De La Salle University" fullWidth />
                
                <FormField label="SHORT CODE *" value={form.shortCode} onChange={(v) => handleInputChange("shortCode", v)} placeholder="dlsu-manila" />
                <SelectField label="COUNTRY" value={form.country} onChange={(v) => handleInputChange("country", v)} options={countries} />

                <FormField label="ADMIN CONTACT EMAIL *" value={form.adminEmail} onChange={(v) => handleInputChange("adminEmail", v)} placeholder="admin@dlsu.edu.ph" type="email" fullWidth />

                <FormField label="PHONE (OPTIONAL)" value={form.phone} onChange={(v) => handleInputChange("phone", v)} placeholder="+63 2..." type="tel" />
                <SelectField label="TIME ZONE" value={form.timeZone} onChange={(v) => handleInputChange("timeZone", v)} options={["Asia/Manila", "Asia/Tokyo"]} />

                <FormField label="ADDRESS (OPTIONAL)" value={form.address} onChange={(v) => handleInputChange("address", v)} placeholder="E.g., 2401 Taft Ave, Malate, Manila" fullWidth />
              </div>

              <div style={styles.content.footer}>
                <button style={styles.content.primaryBtn} onClick={handleOrgSubmit}>Continue to credentials</button>
              </div>
            </>
          )}

          {/* STEP 2: ADMINISTRATOR ACCOUNT DETAILS */}
          {step === 2 && (
            <>
              <div style={styles.content.header}>
                <h1 style={styles.content.title}>Create your admin account</h1>
                <p style={styles.content.subTitle}>This credentials set will serve as the primary security owner for {form.institutionName || "your institution"}.</p>
              </div>

              <div style={styles.content.alertBox}>
                <div style={styles.content.alertIcon}>ℹ️</div>
                <div>
                  <p style={styles.content.alertText}>Additional admins, instructors, operators, and student accounts can be configured within your dashboard after setup.</p>
                </div>
              </div>

              <div style={styles.content.formGrid}>
                <FormField label="FIRST NAME *" value={form.firstName} onChange={(v) => handleInputChange("firstName", v)} placeholder="Charlize" />
                <FormField label="LAST NAME *" value={form.lastName} onChange={(v) => handleInputChange("lastName", v)} placeholder="Inday" />

                <FormField label="EMAIL ADDRESS *" value={form.adminAccountEmail} onChange={(v) => handleInputChange("adminAccountEmail", v)} placeholder="charlize@dlsu.edu.ph" type="email" fullWidth />

                <FormField label="PASSWORD *" value={form.password} onChange={(v) => handleInputChange("password", v)} placeholder="14+ chars, upper, lower, num, special" type="password" />
                <FormField label="CONFIRM PASSWORD *" value={form.confirmPassword} onChange={(v) => handleInputChange("confirmPassword", v)} placeholder="••••••••" type="password" />
              </div>

              <div style={styles.content.checkboxGroup}>
                <input type="checkbox" checked={form.agreeToTerms} onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)} style={styles.content.checkbox} id="terms-check" />
                <label htmlFor="terms-check" style={styles.content.checkboxLabel}>
                  I agree to the <a href="#" style={{color: "#7eb3e8"}}>Terms of Service</a> and <a href="#" style={{color: "#7eb3e8"}}>Privacy Policy</a>
                </label>
              </div>

              {errorMessage && (
                <div style={styles.content.errorBox}>
                  {errorMessage}
                </div>
              )}

              <div style={{ ...styles.content.footer, ...styles.content.multiBtnGroup }}>
                <button style={styles.content.backBtn} onClick={() => setStep(1)}>Back</button>
                <button style={styles.content.primaryBtn} onClick={handleCredentialsSubmit}>Continue to plans</button>
              </div>
            </>
          )}

          {/* STEP 3: SUBSCRIPTION PLAN CHOICE */}
          {step === 3 && (
            <>
              <div style={styles.content.header}>
                <h1 style={styles.content.title}>Select your subscription plan</h1>
                <p style={styles.content.subTitle}>Select a pricing package that matches your operational scale. You can modify this anytime.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, margin: "20px 0" }}>
                {[
                  {
                    id: "Free",
                    name: "🎓 Free Starter",
                    price: "₱0",
                    users: "10 active users",
                    features: ["Core LMS features", "1GB secure storage", "Basic community support"]
                  },
                  {
                    id: "Basic",
                    name: "🏫 Professional School",
                    price: "₱4,999",
                    users: "100 active users",
                    features: ["Everything in Starter", "10GB secure storage", "Operator batch enrollment", "Custom reports & Recharts"],
                    recommended: true
                  },
                  {
                    id: "Premium",
                    name: "💼 Enterprise Elite",
                    price: "₱19,999",
                    users: "Unlimited active users",
                    features: ["Everything in Pro", "100GB secure storage", "Dedicated server tier", "Priority 24/7 SLA support"]
                  }
                ].map((plan) => {
                  const isSelected = form.subscriptionPlan === plan.id;
                  return (
                    <div 
                      key={plan.id}
                      onClick={() => handleInputChange("subscriptionPlan", plan.id)}
                      style={{
                        background: isSelected ? "rgba(24, 95, 165, 0.05)" : "#0b1019",
                        border: isSelected ? "2.5px solid #175fa5" : "1px solid #374151",
                        borderRadius: 14,
                        padding: 24,
                        cursor: "pointer",
                        position: "relative",
                        transition: "all 0.2s"
                      }}
                    >
                      {plan.recommended && (
                        <div style={{
                          position: "absolute",
                          top: -12,
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: "#175fa5",
                          color: "#fff",
                          padding: "3px 12px",
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.05em"
                        }}>
                          RECOMMENDED
                        </div>
                      )}
                      
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{plan.name}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#175fa5", marginBottom: 12 }}>
                        {plan.price}
                        <span style={{ fontSize: 13, fontWeight: 400, color: "#9ca3af" }}>/mo</span>
                      </div>
                      
                      <div style={{ fontSize: 12, color: "#a8c8e8", fontWeight: 600, marginBottom: 16 }}>
                        Capacity Limit: {plan.users}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#9ca3af" }}>
                        {plan.features.map((feat, idx) => (
                          <div key={idx} style={{ display: "flex", gap: 6 }}>
                            <span style={{ color: "#10b981" }}>✓</span>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ ...styles.content.footer, ...styles.content.multiBtnGroup, marginTop: 40 }}>
                <button style={styles.content.backBtn} onClick={() => setStep(2)}>Back</button>
                <button style={styles.content.primaryBtn} onClick={handleSubscriptionSubmit}>Continue to LMS focus</button>
              </div>
            </>
          )}

          {/* STEP 4: TERMINOLOGY FOCUS QUESTIONS */}
          {step === 4 && (
            <>
              <div style={styles.content.header}>
                <h1 style={styles.content.title}>Setup your institution focus</h1>
                <p style={styles.content.subTitle}>Select your organization type to dynamically customize terminology structures and levels instantly.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, margin: "20px 0" }}>
                {[
                  {
                    value: "HigherEducation",
                    title: "🎓 Higher Education Focus",
                    desc: "Tailored for universities and colleges. Pre-configures terminology: 'Programs' (e.g. BSIT, BSCS) and 'Year Levels' (e.g. 1st Year, 2nd Year)."
                  },
                  {
                    value: "K12",
                    title: "🏫 K-12 Secondary School Focus",
                    desc: "Optimized for high schools and grade schools. Pre-configures terminology: 'Grades/Tracks' (e.g. STEM, HUMSS) and 'Grade Levels' (e.g. Grade 11, Grade 12)."
                  }
                ].map((opt) => {
                  const isChecked = form.organizationType === opt.value;
                  return (
                    <label
                      key={opt.value}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        padding: 16,
                        border: isChecked ? "2px solid #175fa5" : "1px solid #374151",
                        background: isChecked ? "rgba(23,95,165,0.05)" : "#0b1019",
                        borderRadius: 12,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <input
                        type="radio"
                        name="focusSelect"
                        value={opt.value}
                        checked={isChecked}
                        onChange={() => handleInputChange("organizationType", opt.value)}
                        style={{ marginTop: 4, cursor: "pointer" }}
                      />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{opt.title}</div>
                        <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: "1.4" }}>{opt.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {errorMessage && (
                <div style={styles.content.errorBox}>
                  {errorMessage}
                </div>
              )}

              <div style={{ ...styles.content.footer, ...styles.content.multiBtnGroup, marginTop: 40 }}>
                <button style={styles.content.backBtn} onClick={() => setStep(3)} disabled={isSubmitting}>Back</button>
                <button style={styles.content.primaryBtn} onClick={handleOnboardingSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Finalizing setup..." : "Finish onboarding & register"}
                </button>
              </div>
            </>
          )}

          {/* STEP 5: WELCOME SCREEN & AUTO LOGIN */}
          {step === 5 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ 
                fontSize: 64, 
                width: 100, 
                height: 100, 
                borderRadius: "50%", 
                background: "rgba(16,185,129,0.1)", 
                border: "2px solid #10b981", 
                color: "#10b981", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                margin: "0 auto 28px" 
              }}>
                🎉
              </div>
              <h1 style={{ ...styles.content.title, fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
                Welcome to Benkyou, {form.firstName}!
              </h1>
              <p style={{ ...styles.content.subTitle, fontSize: 14, color: "#a0b4cb", lineHeight: "1.6", maxWidth: 500, margin: "0 auto 32px" }}>
                Your organization <strong>{form.institutionName}</strong> has been successfully configured as a <strong>{
                  form.organizationType === "K12" ? "K-12 School" :
                  form.organizationType === "Corporate" ? "Corporate Academy" :
                  form.organizationType === "General" ? "Learning Boot camp" : "Higher Education Portal"
                }</strong>. 
                <br /><br />
                Your selected subscription plan is set to <strong>{form.subscriptionPlan} Plan</strong>. Let's enter your dashboard!
              </p>

              {errorMessage && (
                <div style={{ ...styles.content.errorBox, maxWidth: 500, margin: "0 auto 20px" }}>
                  {errorMessage}
                </div>
              )}

              <button 
                style={{ ...styles.content.primaryBtn, maxWidth: 300, margin: "0 auto" }} 
                onClick={handleLaunchDashboard}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Connecting..." : "🚀 Launch Admin Dashboard"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* COMPONENTS */

function Step({ number, title, desc, active, done }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginTop: 24 }}>
      <div style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: done ? "#175fa5" : active ? "#fff" : "#374151",
        color: done ? "#fff" : active ? "#000" : "#9ca3af",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: done ? 12 : 14,
        fontWeight: 600,
        marginRight: 16,
        flexShrink: 0
      }}>
        {done ? "✓" : number}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: active || done ? "#fff" : "#9ca3af" }}>{title}</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

function FormField({ label, type = "text", value, onChange, placeholder, disabled, fullWidth }) {
  return (
    <div style={{ width: "100%", gridColumn: fullWidth ? "1 / span 2" : "span 1" }}>
      <label style={styles.content.label}>{label}</label>
      <input
        type={type}
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        style={{ ...styles.content.input, opacity: disabled ? 0.6 : 1 }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, fullWidth }) {
  return (
    <div style={{ width: "100%", gridColumn: fullWidth ? "1 / span 2" : "span 1" }}>
      <label style={styles.content.label}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.content.input}>
        {options.map(opt => {
          const isObj = typeof opt === "object";
          const val = isObj ? opt.value : opt;
          const lbl = isObj ? opt.label : opt;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
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
    maxWidth: 1100, 
    display: "grid",
    gridTemplateColumns: "320px 1fr", 
    background: "#1e293b", 
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.4)"
  },

  sidebar: {
    container: {
      background: "#0d2137", 
      padding: "40px", 
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between", 
      minHeight: 600, 
    },
    logo: {
      fontSize: 24,
      fontWeight: 600,
      textTransform: "lowercase",
      marginBottom: 20
    },
    title: {
      fontSize: 18,
      fontWeight: 500,
      marginBottom: 8
    },
    sub: {
      fontSize: 12,
      color: "#9ca3af",
      marginBottom: 12,
      lineHeight: 1.6
    },
    steps: {
      flexGrow: 1, 
    },
    footerLink: {
      fontSize: 12,
      color: "#a8c8e8",
      textDecoration: "none",
      marginTop: "auto" 
    }
  },

  content: {
    container: {
      padding: "50px 60px", 
      color: "#fff"
    },
    header: {
      marginBottom: 40,
    },
    title: {
      fontSize: 20,
      fontWeight: 500,
      marginBottom: 10
    },
    subTitle: {
      fontSize: 12,
      color: "#9ca3af",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px 16px", 
    },
    label: {
      fontSize: 10,
      color: "#a8c8e8", 
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.02em",
    },
    input: {
      width: "100%",
      padding: "12px",
      marginTop: 6,
      background: "#0b0f14", 
      border: "1px solid #374151",
      borderRadius: 8,
      color: "#dde2e8",
      fontSize: 14,
      outline: "none",
      transition: "border-color 0.2s",
      ':focus': {
        borderColor: "#175fa5",
      }
    },
    alertBox: {
      background: "#e0f2fe", 
      border: "1px solid #bae6fd",
      borderRadius: 10,
      padding: "16px 20px",
      marginBottom: 40,
      display: "flex",
      alignItems: "flex-start",
      gap: 12
    },
    alertIcon: {
      color: "#1d4ed8",
      fontSize: 16,
      flexShrink: 0
    },
    alertText: {
      fontSize: 13,
      color: "#0c4a6e", 
      margin: 0,
      lineHeight: 1.5
    },
    errorBox: {
      marginTop: 24,
      padding: "12px 14px",
      background: "rgba(220, 38, 38, 0.12)",
      border: "1px solid rgba(248, 113, 113, 0.35)",
      borderRadius: 8,
      color: "#fecaca",
      fontSize: 13,
      lineHeight: 1.5
    },
    checkboxGroup: {
      display: "flex",
      alignItems: "center",
      marginTop: 30,
      gap: 10,
    },
    checkbox: {
      width: 16,
      height: 16,
      border: "1px solid #374151",
      borderRadius: 4,
      background: "#0b0f14",
      cursor: "pointer",
    },
    checkboxLabel: {
      fontSize: 13,
      color: "#9ca3af",
    },
    footer: {
      marginTop: 50,
    },
    multiBtnGroup: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
    },
    primaryBtn: {
      width: "100%",
      padding: "14px",
      background: "#175fa5", 
      color: "#fff",
      border: "none",
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    backBtn: {
      padding: "14px 24px",
      background: "#4b5563", 
      border: "none",
      borderRadius: 8,
      color: "#fff",
      fontSize: 14,
      cursor: "pointer",
      transition: "background-color 0.2s",
    }
  }
};
