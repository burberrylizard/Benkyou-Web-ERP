import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NAV_LINKS = ["Features", "Pricing", "For Schools"];

const STATS = [
  { value: "48+", label: "Institutions" },
  { value: "3,800+", label: "Learners" },
  { value: "99.9%", label: "Uptime" },
  { value: "14-day", label: "Free Trial" },
];

const FEATURES = [
  {
    icon: "📚",
    title: "Course Management",
    desc: "Build courses with sections, upload videos, articles, and files. Publish when ready.",
    color: "#e6f1fb",
  },
  {
    icon: "📈",
    title: "Progress Tracking",
    desc: "Students see completion status per item. Instructors see class-wide analytics in real time.",
    color: "#e2efda",
  },
  {
    icon: "✅",
    title: "Auto-Graded Assessments",
    desc: "Create quizzes with auto-grading, time limits, and multiple attempt controls.",
    color: "#eeedfe",
  },
  {
    icon: "🎓",
    title: "Enrollment Management",
    desc: "Admins enroll students, set deadlines, and manage enrollment status centrally.",
    color: "#d9f0e8",
  },
  {
    icon: "📊",
    title: "Analytics & Reports",
    desc: "Completion rates, scores, engagement — exported or viewed in-app per course.",
    color: "#faeeda",
  },
  {
    icon: "🔍",
    title: "Audit Logs",
    desc: "Every admin action is logged with timestamp and actor — full accountability trail.",
    color: "#fcebeb",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Register your institution",
    desc: "Sign up, name your organization, and invite your admin team. No credit card needed to start.",
  },
  {
    num: "2",
    title: "Create courses & add users",
    desc: "Build your course catalog, add instructors and students, and set up enrollment.",
  },
  {
    num: "3",
    title: "Learn & track progress",
    desc: "Students access content, take assessments, and see their progress in real time.",
  },
];

const ROLES = [
  { initials: "SA", label: "Super Admin", desc: "Manages all organizations, billing, and system-wide settings from one place.", bg: "#e6f1fb", color: "#0c447c" },
  { initials: "AD", label: "Admin", desc: "Manages users, courses, and enrollments within their institution.", bg: "#eeedfe", color: "#3c3489" },
  { initials: "IN", label: "Instructor", desc: "Creates content, grades assessments, and tracks student progress per course.", bg: "#d9f0e8", color: "#085041" },
  { initials: "ST", label: "Student", desc: "Accesses enrolled courses, completes content, and takes assessments.", bg: "#e2efda", color: "#27500a" },
];

const PLANS = [
  {
    name: "Free",
    price: "₱0",
    period: "/ month",
    desc: "Perfect for small teams getting started.",
    features: ["Up to 50 users", "5 courses", "1 GB storage"],
    missing: ["No analytics"],
    cta: "Get started free",
    popular: false,
  },
  {
    name: "Basic",
    price: "₱499",
    period: "/ month",
    desc: "Great for growing schools with active programs.",
    features: ["Up to 500 users", "Unlimited courses", "20 GB storage", "Full analytics"],
    missing: [],
    cta: "Start 14-day trial",
    popular: true,
  },
  {
    name: "Pro",
    price: "₱1,299",
    period: "/ month",
    desc: "For large institutions that need full scale.",
    features: ["Unlimited users", "Unlimited courses", "100 GB storage", "Priority support"],
    missing: [],
    cta: "Choose Pro",
    popular: false,
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#1a1a1a" }}>
      {/* Google font & Custom Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .nav-link { color: #a8c8e8; text-decoration: none; font-size: 13px; transition: color .2s; }
        .nav-link:hover { color: #fff; }
        .feat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .plan-card { transition: transform .2s, box-shadow .2s; }
        .plan-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); }

        /* Global Wide Container */
        .container { max-width: 1200px; margin: 0 auto; width: 100%; text-align: center; }

        /* Responsive Layout Classes */
        .section-padding { padding: 80px 32px; }
        .hero-padding { padding: 90px 32px 80px; }
        .nav-container { padding: 0 48px; }
        
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; text-align: left; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: left; }
        
        .grid-steps { display: grid; grid-template-columns: repeat(3, 1fr); background: #fff; border-radius: 14px; border: 0.5px solid #e5e5e5; overflow: hidden; text-align: left; }
        .step-item { padding: 40px 32px; border-right: 0.5px solid #e5e5e5; }
        .step-item:last-child { border-right: none; }

        .stats-container { display: flex; justify-content: center; gap: 80px; margin-top: 60px; padding-top: 40px; border-top: 0.5px solid rgba(255,255,255,.1); }
        .footer-container { display: flex; align-items: center; justify-content: space-between; background: #0d2137; padding: 32px 48px; }
        
        /* Hero Text Formatting for Readability */
        .hero-title { font-size: 48px; font-weight: 600; color: #fff; line-height: 1.2; margin-bottom: 20px; max-width: 700px; margin-left: auto; margin-right: auto; }
        .hero-desc { font-size: 16px; color: "#7fa8c8"; line-height: 1.75; max-width: 600px; margin: 0 auto 36px; }
        .section-desc { font-size: 15px; color: #666; line-height: 1.7; max-width: 600px; margin: 0 auto 48px; }
        
        .nav-links-wrap { display: flex; align-items: center; gap: 28px; }

        /* Tablet Breakpoint */
        @media (max-width: 960px) {
          .grid-3 { grid-template-columns: repeat(2, 1fr); }
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
          .grid-steps { grid-template-columns: 1fr; }
          .step-item { border-right: none; border-bottom: 0.5px solid #e5e5e5; }
          .step-item:last-child { border-bottom: none; }
          .stats-container { gap: 40px; }
          .nav-container { padding: 0 32px; }
        }

        /* Mobile Breakpoint */
        @media (max-width: 600px) {
          .section-padding { padding: 48px 20px; }
          .hero-padding { padding: 60px 20px 48px; }
          .nav-container { padding: 0 16px; }
          .hero-title { font-size: 36px; }
          
          .grid-3, .grid-4 { grid-template-columns: 1fr; }
          .stats-container { flex-wrap: wrap; gap: 24px; justify-content: center; }
          
          .desktop-only-links { display: none; }
          .nav-links-wrap { gap: 12px; }
          
          .footer-container { flex-direction: column; gap: 16px; text-align: center; padding: 24px 20px; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="nav-container" style={{ background: "#0d2137", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#fff", letterSpacing: "-0.3px" }}>
          ben<span style={{ color: "#7eb3e8" }}>kyou</span>
        </div>
        <div className="nav-links-wrap">
          <div className="desktop-only-links" style={{ display: "flex", gap: "32px", marginRight: "16px" }}>
            {NAV_LINKS.map((l) => (
              <a key={l} href="#" className="nav-link">{l}</a>
            ))}
          </div>
          <button onClick={() => navigate("/login")} style={{ background: "transparent", border: "0.5px solid rgba(255,255,255,0.25)", color: "#a8c8e8", padding: "8px 20px", borderRadius: 6, fontSize: 14, cursor: "pointer" }} className="btn-ghost">
            Sign in
          </button>
          <button onClick={() => navigate("/register")} style={{ background: "#185fa5", color: "#fff", border: "none", padding: "9px 22px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Get started
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-padding" style={{ background: "#0d2137", textAlign: "center" }}>
        <div className="container">
          <div style={{ display: "inline-block", padding: "6px 16px", background: "rgba(56,138,221,.18)", border: "0.5px solid rgba(56,138,221,.35)", borderRadius: 20, fontSize: 13, color: "#7eb3e8", marginBottom: 24, fontWeight: 500, letterSpacing: ".04em" }}>
            Multi-tenant learning management system
          </div>
          <h1 className="hero-title">
            The smarter way to run your{" "}
            <span style={{ color: "#7eb3e8" }}>institution's learning</span>
          </h1>
          <p className="hero-desc" style={{ color: "#7fa8c8" }}>
            Benkyou gives schools and organizations a complete platform to deliver courses, track student progress, and manage assessments — all in one place.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/register")} style={{ padding: "14px 32px", background: "#185fa5", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
              Start free — no credit card
            </button>
            <button style={{ padding: "14px 28px", border: "0.5px solid rgba(255,255,255,.22)", color: "#a8c8e8", background: "transparent", borderRadius: 8, fontSize: 15, cursor: "pointer" }} className="btn-ghost">
              See how it works ↓
            </button>
          </div>

          {/* Stats */}
          <div className="stats-container">
            {STATS.map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 28, fontWeight: 600, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "#7fa8c8", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section-padding">
        <div className="container">
          <div style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>Everything you need</div>
          <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 12 }}>Built for how schools actually work</h2>
          <p className="section-desc">
            From course creation to final grades — every module your institution needs is ready out of the box.
          </p>
          <div className="grid-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="feat-card" style={{ background: "#f9f9f9", borderRadius: 12, padding: "28px 24px", transition: "transform .2s, box-shadow .2s", cursor: "default" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section-padding" style={{ background: "#f5f7fa" }}>
        <div className="container">
          <div style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 12 }}>Set up in three steps</h2>
          <p className="section-desc">
            From registration to running your first course in under an hour.
          </p>
          <div className="grid-steps">
            {STEPS.map((s) => (
              <div key={s.num} className="step-item">
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e6f1fb", color: "#0c447c", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{s.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="section-padding">
        <div className="container">
          <div style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>Roles</div>
          <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 12 }}>One platform, four roles</h2>
          <p className="section-desc">
            Every user type has a tailored experience built for their specific needs.
          </p>
          <div className="grid-4">
            {ROLES.map((r) => (
              <div key={r.label} style={{ border: "0.5px solid #e5e5e5", borderRadius: 12, padding: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: r.bg, color: r.color, fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{r.initials}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{r.label}</h3>
                <p style={{ fontSize: 13.5, color: "#666", lineHeight: 1.6 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="section-padding" style={{ background: "#f5f7fa" }}>
        <div className="container">
          <div style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 12 }}>Start free, scale as you grow</h2>
          <p className="section-desc">
            All plans include a 14-day trial. Choose a plan after you're ready — no pressure at signup.
          </p>
          <div className="grid-3">
            {PLANS.map((p) => (
              <div key={p.name} className="plan-card" style={{ background: "#fff", border: p.popular ? "2px solid #185fa5" : "0.5px solid #e5e5e5", borderRadius: 14, padding: 32 }}>
                {p.popular && (
                  <div style={{ display: "inline-block", padding: "4px 12px", background: "#e6f1fb", color: "#0c447c", borderRadius: 6, fontSize: 12, fontWeight: 500, marginBottom: 12 }}>Most popular</div>
                )}
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{p.name}</div>
                <div style={{ fontSize: 32, fontWeight: 600, color: "#0d2137" }}>
                  {p.price} <span style={{ fontSize: 15, color: "#888", fontWeight: 400 }}>{p.period}</span>
                </div>
                <p style={{ fontSize: 14, color: "#666", margin: "12px 0 20px", lineHeight: 1.55 }}>{p.desc}</p>
                <hr style={{ border: "none", borderTop: "0.5px solid #e5e5e5", marginBottom: 20 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {p.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#333" }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#e2efda", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#3b6d11", flexShrink: 0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                  {p.missing.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#aaa" }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#f1f1f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#aaa", flexShrink: 0 }}>✗</span>
                      {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate("/register")} style={{ width: "100%", padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", background: p.popular ? "#0d2137" : "transparent", color: p.popular ? "#fff" : "#333", border: p.popular ? "none" : "0.5px solid #ccc" }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer-container">
        <div style={{ fontSize: 20, fontWeight: 600, color: "#fff" }}>ben<span style={{ color: "#7eb3e8" }}>kyou</span></div>
        <p style={{ fontSize: 14, color: "#4a7aa8" }}>© 2026 Benkyou. All rights reserved.</p>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy", "Terms", "Support"].map((l) => (
            <a key={l} href="#" style={{ fontSize: 14, color: "#4a7aa8", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}