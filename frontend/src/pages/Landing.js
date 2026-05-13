import { useState, useEffect, useRef } from "react";

// ─── Scroll Animation Hook ────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Animated Counter ────────────────────────────────────────────────────────
function Counter({ end, suffix = "", prefix = "" }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ─── Fade-in wrapper ─────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, direction = "up" }) {
  const [ref, inView] = useInView();
  const transforms = { up: "translateY(40px)", left: "translateX(-40px)", right: "translateX(40px)", none: "none" };
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : transforms[direction],
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Glass Card ──────────────────────────────────────────────────────────────
function GlassCard({ children, style = {}, hover = true }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(10,185,138,0.18)",
        borderRadius: 24,
        boxShadow: hovered && hover
          ? "0 24px 80px rgba(10,185,138,0.18), 0 4px 24px rgba(0,0,0,0.07)"
          : "0 4px 24px rgba(0,0,0,0.06)",
        transform: hovered && hover ? "translateY(-4px) scale(1.01)" : "none",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        borderRadius: 16,
        border: "1px solid rgba(10,185,138,0.15)",
        background: open ? "rgba(10,185,138,0.04)" : "rgba(255,255,255,0.7)",
        marginBottom: 12,
        cursor: "pointer",
        transition: "all 0.3s ease",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px" }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{q}</span>
        <span style={{
          width: 28, height: 28, borderRadius: "50%",
          background: open ? "#0ab98a" : "rgba(10,185,138,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: open ? "#fff" : "#0ab98a",
          fontSize: 18, fontWeight: 700, flexShrink: 0,
          transition: "all 0.3s ease",
          transform: open ? "rotate(45deg)" : "none",
        }}>+</span>
      </div>
      <div style={{ maxHeight: open ? 300 : 0, overflow: "hidden", transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ padding: "0 24px 20px", fontSize: 14, color: "#475569", lineHeight: 1.7 }}>{a}</div>
      </div>
    </div>
  );
}

// ─── Pricing Card ─────────────────────────────────────────────────────────────
function PricingCard({ plan, price, desc, features, cta, popular, onSignUp }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 28,
        border: popular ? "2px solid #0ab98a" : "1px solid rgba(10,185,138,0.15)",
        background: popular ? "linear-gradient(145deg,#0ab98a,#059669)" : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        padding: "36px 32px",
        flex: 1,
        minWidth: 260,
        maxWidth: 340,
        position: "relative",
        transform: hov ? "translateY(-8px)" : popular ? "translateY(-6px)" : "none",
        boxShadow: popular ? "0 24px 80px rgba(10,185,138,0.35)" : hov ? "0 20px 60px rgba(0,0,0,0.1)" : "0 4px 20px rgba(0,0,0,0.06)",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {popular && (
        <div style={{
          position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(90deg,#0ab98a,#0ea5e9)",
          color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          padding: "5px 18px", borderRadius: 20, textTransform: "uppercase",
          boxShadow: "0 4px 16px rgba(10,185,138,0.4)",
        }}>Most Popular</div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: popular ? "rgba(255,255,255,0.8)" : "#0ab98a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{plan}</div>
      <div style={{ fontSize: 42, fontWeight: 800, color: popular ? "#fff" : "#0f172a", marginBottom: 4, letterSpacing: "-0.03em" }}>
        {price === "Custom" ? "Custom" : <>${price}<span style={{ fontSize: 16, fontWeight: 500, opacity: 0.7 }}>/mo</span></>}
      </div>
      <div style={{ fontSize: 13, color: popular ? "rgba(255,255,255,0.75)" : "#64748b", marginBottom: 28, lineHeight: 1.5 }}>{desc}</div>
      {features.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: popular ? "rgba(255,255,255,0.25)" : "rgba(10,185,138,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: popular ? "#fff" : "#0ab98a", fontSize: 11, fontWeight: 800 }}>✓</span>
          </div>
          <span style={{ fontSize: 13, color: popular ? "rgba(255,255,255,0.9)" : "#475569" }}>{f}</span>
        </div>
      ))}
      <button
        onClick={onSignUp}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 14, marginTop: 24,
          background: popular ? "#fff" : "linear-gradient(135deg,#0ab98a,#0ea5e9)",
          color: popular ? "#0ab98a" : "#fff",
          border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700,
          boxShadow: popular ? "0 4px 20px rgba(0,0,0,0.15)" : "0 4px 20px rgba(10,185,138,0.35)",
          transition: "all 0.2s ease",
        }}
      >{cta}</button>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function NovalaLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToApp = () => window.location.href = "https://www.getnovala.com/login";
  const goToSignUp = () => window.location.href = "https://www.getnovala.com/register";

  const navLinks = ["Features", "How It Works", "AI Engine", "Pricing", "FAQ"];

  const features = [
    {
      icon: "🧠",
      title: "AI Financial Intelligence",
      desc: "Upload any invoice or receipt. Novala's AI instantly extracts, categorizes, and records every financial detail — no manual entry ever again.",
      gradient: "linear-gradient(135deg,rgba(10,185,138,0.08),rgba(14,165,233,0.08))",
      border: "rgba(10,185,138,0.2)",
    },
    {
      icon: "📊",
      title: "Live Financial Dashboard",
      desc: "Real-time revenue tracking, expense trends, and cash flow forecasting. Your finances visualized beautifully — always up to date.",
      gradient: "linear-gradient(135deg,rgba(14,165,233,0.08),rgba(139,92,246,0.08))",
      border: "rgba(14,165,233,0.2)",
    },
    {
      icon: "⚡",
      title: "Smart Invoice Follow-Up",
      desc: "AI detects overdue invoices and automatically schedules professional follow-up emails with PDF attachments — sent at the perfect time.",
      gradient: "linear-gradient(135deg,rgba(139,92,246,0.08),rgba(10,185,138,0.08))",
      border: "rgba(139,92,246,0.2)",
    },
    {
      icon: "🔍",
      title: "Semantic Document Search",
      desc: "Search your financial documents in plain English. 'Show me all overdue invoices from last quarter' — Novala understands.",
      gradient: "linear-gradient(135deg,rgba(245,158,11,0.08),rgba(10,185,138,0.08))",
      border: "rgba(245,158,11,0.2)",
    },
    {
      icon: "🛡️",
      title: "Automated Bookkeeping",
      desc: "Bank-grade reconciliation, duplicate detection, and transaction categorization — all handled automatically by AI.",
      gradient: "linear-gradient(135deg,rgba(10,185,138,0.08),rgba(245,158,11,0.08))",
      border: "rgba(10,185,138,0.2)",
    },
    {
      icon: "📄",
      title: "Professional Invoicing",
      desc: "Create beautiful branded invoices in seconds. Track payments, send reminders, and get paid faster — all from one place.",
      gradient: "linear-gradient(135deg,rgba(14,165,233,0.08),rgba(10,185,138,0.08))",
      border: "rgba(14,165,233,0.2)",
    },
  ];

  const steps = [
    { num: "01", title: "Upload Your Documents", desc: "Drag and drop invoices, receipts, bank statements. AI processes everything in seconds.", icon: "📁" },
    { num: "02", title: "AI Extracts & Organizes", desc: "Novala reads, categorizes, and records all financial data automatically with high accuracy.", icon: "🤖" },
    { num: "03", title: "Get Financial Insights", desc: "Real-time dashboards, reports, and AI-powered recommendations surface instantly.", icon: "📈" },
    { num: "04", title: "Automate & Scale", desc: "Set up automated follow-ups, recurring reports, and smart alerts — then focus on growing.", icon: "🚀" },
  ];

  const faqs = [
    { q: "How does Novala's AI extract data from documents?", a: "Novala uses advanced large language models combined with computer vision to read and understand financial documents. It extracts vendor names, amounts, dates, line items, and payment status with high accuracy — even from handwritten or scanned documents." },
    { q: "Is my financial data secure?", a: "Absolutely. Novala uses bank-grade AES-256 encryption, SOC 2 compliant infrastructure on AWS, and never shares your data with third parties. Your documents are stored in encrypted S3 buckets with strict access controls." },
    { q: "Can I import data from my existing accounting software?", a: "Yes. Novala integrates with QuickBooks, Xero, FreshBooks, and major banks via Plaid. You can also import CSV files, PDFs, and connect directly via API." },
    { q: "How does the AI invoice follow-up work?", a: "Novala detects overdue invoices and suggests follow-up emails. You review and edit the message, pick a date and time, and Novala sends a professional email with the invoice PDF attached — automatically, at the scheduled time." },
    { q: "Is there a free trial?", a: "Yes — all plans come with a 14-day free trial with full access to all features. No credit card required for the Essentials plan." },
    { q: "Can I use Novala for my team or business?", a: "Absolutely. Novala supports multi-user teams with role-based permissions, shared dashboards, and collaborative workflows. Enterprise plans include white-label options and dedicated support." },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif", background: "#f8fffe", color: "#0f172a", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f0fdf9; }
        ::-webkit-scrollbar-thumb { background: #0ab98a; border-radius: 99px; }

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes floatSlow { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(2deg)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 40px rgba(10,185,138,0.2)} 50%{box-shadow:0 0 80px rgba(10,185,138,0.4)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        .hero-bg {
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(10,185,138,0.12) 0%, transparent 70%),
                      radial-gradient(ellipse 50% 40% at 80% 50%, rgba(14,165,233,0.07) 0%, transparent 60%),
                      linear-gradient(180deg, #f0fdf9 0%, #f8fffe 100%);
        }
        .gradient-text {
          background: linear-gradient(135deg, #0ab98a 0%, #0ea5e9 50%, #0ab98a 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .cta-primary {
          background: linear-gradient(135deg, #0ab98a, #059669);
          color: #fff;
          border: none;
          padding: 16px 36px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(10,185,138,0.4);
          transition: all 0.25s ease;
          font-family: inherit;
          letter-spacing: -0.01em;
        }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(10,185,138,0.5); }
        .cta-secondary {
          background: rgba(255,255,255,0.9);
          color: #0f172a;
          border: 1px solid rgba(10,185,138,0.25);
          padding: 16px 36px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all 0.25s ease;
          font-family: inherit;
        }
        .cta-secondary:hover { transform: translateY(-2px); border-color: rgba(10,185,138,0.5); box-shadow: 0 8px 32px rgba(10,185,138,0.12); }
        .nav-link {
          color: #475569;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
          background: none;
          border: none;
          font-family: inherit;
        }
        .nav-link:hover { color: #0ab98a; }
        .feature-card:hover .feature-icon { transform: scale(1.15) rotate(-5deg); }
        .feature-icon { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); font-size: 32px; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 40 ? "rgba(248,255,254,0.92)" : "transparent",
        backdropFilter: scrollY > 40 ? "blur(20px)" : "none",
        borderBottom: scrollY > 40 ? "1px solid rgba(10,185,138,0.1)" : "none",
        transition: "all 0.3s ease",
        padding: "0 clamp(16px, 5vw, 80px)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,#0ab98a,#059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(10,185,138,0.4)",
            }}>
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="19" cy="9" r="2" fill="#fff"/>
              </svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a" }}>
              No<span style={{ color: "#0ab98a" }}>vala</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="desktop-nav">
            {navLinks.map(l => (
              <button key={l} className="nav-link" onClick={() => {
                const el = document.getElementById(l.toLowerCase().replace(/ /g, "-"));
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}>{l}</button>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="cta-secondary" style={{ padding: "10px 20px", fontSize: 13 }} onClick={goToApp}>Sign In</button>
            <button className="cta-primary" style={{ padding: "10px 22px", fontSize: 13 }} onClick={goToSignUp}>Get Started Free</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80, paddingBottom: 60, padding: "100px clamp(16px,5vw,80px) 60px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div style={{ textAlign: "center", maxWidth: 820, margin: "0 auto" }}>

            {/* Badge */}
            <Reveal delay={0}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(10,185,138,0.08)", border: "1px solid rgba(10,185,138,0.2)", borderRadius: 99, padding: "7px 18px", marginBottom: 32 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0ab98a", animation: "pulse-glow 2s infinite" }}/>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0ab98a", letterSpacing: "0.08em", textTransform: "uppercase" }}>AI-Powered Financial Intelligence</span>
              </div>
            </Reveal>

            {/* Headline */}
            <Reveal delay={0.1}>
              <h1 style={{ fontSize: "clamp(40px,6vw,80px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.04em", color: "#0f172a", marginBottom: 24 }}>
                Your finances,<br/>
                <span className="gradient-text">finally intelligent.</span>
              </h1>
            </Reveal>

            {/* Subheadline */}
            <Reveal delay={0.2}>
              <p style={{ fontSize: "clamp(16px,2vw,20px)", color: "#475569", lineHeight: 1.65, marginBottom: 40, maxWidth: 620, margin: "0 auto 40px", fontWeight: 400 }}>
                Novala uses AI to automate bookkeeping, invoice management, and financial reporting — so you can focus on growing your business, not managing spreadsheets.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={0.3}>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
                <button className="cta-primary" onClick={goToSignUp} style={{ fontSize: 16, padding: "18px 42px" }}>
                  Start Free — No Card Needed
                </button>
                <button className="cta-secondary" onClick={goToApp} style={{ fontSize: 16, padding: "18px 42px" }}>
                  Sign In to Dashboard →
                </button>
              </div>
            </Reveal>

            {/* Trust line */}
            <Reveal delay={0.4}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 80 }}>
                {["✓ 14-day free trial", "✓ No credit card required", "✓ Cancel anytime", "✓ Bank-grade security"].map(t => (
                  <span key={t} style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Dashboard Mockup */}
          <Reveal delay={0.5}>
            <div style={{ position: "relative", maxWidth: 960, margin: "0 auto" }}>
              {/* Glow */}
              <div style={{
                position: "absolute", inset: -40, borderRadius: 40,
                background: "radial-gradient(ellipse at center, rgba(10,185,138,0.15) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}/>

              {/* Main card */}
              <div style={{
                background: "rgba(255,255,255,0.9)", backdropFilter: "blur(30px)",
                borderRadius: 28, border: "1px solid rgba(10,185,138,0.15)",
                boxShadow: "0 32px 100px rgba(10,185,138,0.15), 0 8px 32px rgba(0,0,0,0.08)",
                overflow: "hidden", position: "relative", animation: "float 6s ease-in-out infinite",
              }}>
                {/* Top bar */}
                <div style={{ background: "linear-gradient(135deg,#0ab98a,#059669)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }}/>)}
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
                    app.getnovala.com — Dashboard
                  </div>
                </div>

                {/* Dashboard preview */}
                <div style={{ padding: 28, background: "#f8fffe" }}>
                  {/* Stats row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                    {[
                      { label: "Total Revenue", value: "$124,820", change: "+18.4%", color: "#0ab98a" },
                      { label: "Outstanding", value: "$18,340", change: "-2.1%", color: "#f59e0b" },
                      { label: "Expenses", value: "$42,180", change: "+4.2%", color: "#ef4444" },
                      { label: "Net Profit", value: "$64,300", change: "+22.7%", color: "#0ea5e9" },
                    ].map(s => (
                      <div key={s.label} style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", border: "1px solid rgba(10,185,138,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.change} this month</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart placeholder */}
                  <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(10,185,138,0.08)", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Revenue Overview</div>
                      <div style={{ fontSize: 11, color: "#0ab98a", fontWeight: 600, background: "rgba(10,185,138,0.08)", padding: "4px 12px", borderRadius: 99 }}>Last 6 months</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
                      {[45, 62, 55, 78, 68, 90].map((h, i) => (
                        <div key={i} style={{ flex: 1, borderRadius: "6px 6px 0 0", background: i === 5 ? "linear-gradient(180deg,#0ab98a,#059669)" : "rgba(10,185,138,0.12)", height: `${h}%`, transition: "height 0.5s ease" }}/>
                      ))}
                    </div>
                  </div>

                  {/* Recent invoices */}
                  <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", border: "1px solid rgba(10,185,138,0.08)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Recent Invoices</div>
                    {[
                      { name: "Brenda Rustemeier", amount: "$4,200", status: "Paid", color: "#0ab98a" },
                      { name: "TechCorp Solutions", amount: "$8,750", status: "Due", color: "#f59e0b" },
                      { name: "Maple Design Co.", amount: "$2,400", status: "Overdue", color: "#ef4444" },
                    ].map((inv, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 2 ? "1px solid #f1f5f9" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#0ab98a22,#0ea5e922)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>📄</div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{inv.name}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{inv.amount}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: inv.color, background: `${inv.color}18`, padding: "3px 10px", borderRadius: 99 }}>{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div style={{ position: "absolute", top: 80, right: -30, background: "#fff", borderRadius: 16, padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid rgba(10,185,138,0.15)", animation: "floatSlow 4s ease-in-out infinite", zIndex: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>AI PROCESSED</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0ab98a" }}>247 docs</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>this month</div>
              </div>

              <div style={{ position: "absolute", bottom: 60, left: -30, background: "#fff", borderRadius: 16, padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid rgba(14,165,233,0.2)", animation: "floatSlow 5s ease-in-out infinite 1s", zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0ab98a", animation: "pulse-glow 2s infinite" }}/>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#0ab98a" }}>Follow-up sent</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Invoice #1042 — $8,750</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: "60px clamp(16px,5vw,80px)", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 40 }}>
            {[
              { value: 98, suffix: "%", label: "AI Accuracy Rate", prefix: "" },
              { value: 10000, suffix: "+", label: "Documents Processed", prefix: "" },
              { value: 500, suffix: "+", label: "Small Businesses", prefix: "" },
              { value: 40, suffix: "hrs", label: "Saved Per Month", prefix: "" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "clamp(36px,4vw,52px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0f172a", marginBottom: 8 }}>
                    <span className="gradient-text"><Counter end={s.value} suffix={s.suffix} prefix={s.prefix}/></span>
                  </div>
                  <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "100px clamp(16px,5vw,80px)", background: "linear-gradient(180deg,#f8fffe,#f0fdf9)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0ab98a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Everything You Need</div>
              <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: 16, lineHeight: 1.1 }}>
                AI that actually understands<br/>your finances
              </h2>
              <p style={{ fontSize: 18, color: "#64748b", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
                Every feature is designed to save you time and give you clarity — not add more complexity.
              </p>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20 }}>
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div
                  className="feature-card"
                  style={{
                    background: f.gradient,
                    border: `1px solid ${f.border}`,
                    borderRadius: 24,
                    padding: "32px 28px",
                    cursor: "default",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div className="feature-icon" style={{ marginBottom: 20 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 10, letterSpacing: "-0.02em" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "100px clamp(16px,5vw,80px)", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0ab98a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Simple Process</div>
              <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", lineHeight: 1.1 }}>
                From upload to insight<br/>in seconds
              </h2>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 24, position: "relative" }}>
            {steps.map((s, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div style={{ textAlign: "center", padding: "32px 20px" }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px",
                    background: "linear-gradient(135deg,rgba(10,185,138,0.1),rgba(14,165,233,0.1))",
                    border: "1px solid rgba(10,185,138,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28,
                  }}>{s.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#0ab98a", letterSpacing: "0.1em", marginBottom: 10 }}>{s.num}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 10, letterSpacing: "-0.02em" }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SECTION ── */}
      <section id="ai-engine" style={{ padding: "100px clamp(16px,5vw,80px)", background: "linear-gradient(135deg,#0f172a 0%,#0c2a22 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(10,185,138,0.12),transparent)", filter: "blur(60px)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(14,165,233,0.1),transparent)", filter: "blur(50px)", pointerEvents: "none" }}/>

        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <Reveal direction="left">
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0ab98a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>AI Engine</div>
                <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: "#fff", marginBottom: 20, lineHeight: 1.15, letterSpacing: "-0.03em" }}>
                  An AI co-pilot for your entire financial operation
                </h2>
                <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.7, marginBottom: 32 }}>
                  Novala's AI doesn't just extract data — it understands context, detects anomalies, predicts cash flow, and proactively flags issues before they become problems.
                </p>
                {[
                  "Semantic document understanding",
                  "Anomaly & duplicate detection",
                  "Natural language financial queries",
                  "Automated follow-up scheduling",
                  "Predictive cash flow insights",
                ].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#0ab98a,#059669)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>
                    </div>
                    <span style={{ fontSize: 14, color: "#cbd5e1", fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal direction="right">
              <div style={{ position: "relative" }}>
                <div style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(10,185,138,0.2)",
                  borderRadius: 24,
                  padding: 28,
                  backdropFilter: "blur(20px)",
                  animation: "float 5s ease-in-out infinite",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0ab98a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0ab98a", animation: "pulse-glow 2s infinite" }}/>
                    AI Processing
                  </div>
                  {[
                    { label: "Document Reading", pct: 100, color: "#0ab98a" },
                    { label: "Data Extraction", pct: 97, color: "#0ea5e9" },
                    { label: "Categorization", pct: 94, color: "#8b5cf6" },
                    { label: "Anomaly Detection", pct: 99, color: "#f59e0b" },
                  ].map((item, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{item.label}</span>
                        <span style={{ fontSize: 12, color: item.color, fontWeight: 700 }}>{item.pct}%</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: 99, boxShadow: `0 0 12px ${item.color}` }}/>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(10,185,138,0.08)", borderRadius: 12, border: "1px solid rgba(10,185,138,0.2)" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Latest action</div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>✓ Invoice #1042 processed — $8,750 extracted</div>
                    <div style={{ fontSize: 11, color: "#0ab98a", marginTop: 4 }}>2 seconds ago</div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "100px clamp(16px,5vw,80px)", background: "linear-gradient(180deg,#f0fdf9,#f8fffe)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0ab98a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Simple Pricing</div>
              <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", lineHeight: 1.1, marginBottom: 16 }}>
                Start free. Scale with confidence.
              </h2>
              <p style={{ fontSize: 16, color: "#64748b", maxWidth: 440, margin: "0 auto" }}>
                14-day free trial on all plans. No credit card required.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", alignItems: "flex-start" }}>
              <PricingCard
                plan="Essentials"
                price="20"
                desc="Perfect for freelancers and solo businesses getting started."
                features={["Up to 100 documents/mo", "AI data extraction", "Basic invoicing", "Financial dashboard", "Email support"]}
                cta="Start Free Trial"
                onSignUp={goToSignUp}
              />
              <PricingCard
                plan="Premium"
                price="30"
                desc="For growing businesses that need full financial automation."
                features={["Unlimited documents", "AI follow-up emails", "Smart Search (RAG)", "Advanced reports", "Bill pay & reconciliation", "Priority support"]}
                cta="Start Free Trial"
                popular={true}
                onSignUp={goToSignUp}
              />
              <PricingCard
                plan="Enterprise"
                price="Custom"
                desc="For teams and agencies needing scale, compliance, and control."
                features={["Everything in Premium", "Multi-user & roles", "White-label option", "API access", "Custom integrations", "Dedicated success manager"]}
                cta="Contact Sales"
                onSignUp={() => window.location.href = "mailto:support@getnovala.com"}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "100px clamp(16px,5vw,80px)", background: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0ab98a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>FAQ</div>
              <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", lineHeight: 1.15 }}>
                Common questions
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            {faqs.map((f, i) => <FAQ key={i} q={f.q} a={f.a}/>)}
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "100px clamp(16px,5vw,80px)", background: "linear-gradient(135deg,#0f172a,#0c2a22)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 50%,rgba(10,185,138,0.15),transparent)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", top: -80, left: -80, width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(10,185,138,0.08)", animation: "spin-slow 20s linear infinite", pointerEvents: "none" }}/>

        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <Reveal>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#0ab98a,#059669)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", boxShadow: "0 0 60px rgba(10,185,138,0.4)", animation: "pulse-glow 3s infinite" }}>
              <svg width="32" height="32" viewBox="0 0 22 22" fill="none">
                <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="19" cy="9" r="2" fill="#fff"/>
              </svg>
            </div>
            <h2 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 800, color: "#fff", marginBottom: 20, lineHeight: 1.1, letterSpacing: "-0.04em" }}>
              Ready to transform how you<br/>
              <span className="gradient-text">manage your finances?</span>
            </h2>
            <p style={{ fontSize: 18, color: "#94a3b8", marginBottom: 40, lineHeight: 1.6 }}>
              Join hundreds of businesses already saving hours every week with Novala's AI financial intelligence platform.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="cta-primary" onClick={goToSignUp} style={{ fontSize: 16, padding: "18px 42px" }}>
                Get Started Free Today →
              </button>
              <button className="cta-secondary" onClick={goToApp} style={{ fontSize: 16, padding: "18px 42px", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
                Sign In
              </button>
            </div>
            <p style={{ fontSize: 13, color: "#475569", marginTop: 20 }}>14-day free trial · No credit card required · Cancel anytime</p>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "48px clamp(16px,5vw,80px)", background: "#0f172a", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#0ab98a,#059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                    <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>No<span style={{ color: "#0ab98a" }}>vala</span></span>
              </div>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, maxWidth: 260 }}>
                AI-powered financial intelligence for modern businesses. Automate bookkeeping, invoicing, and reporting.
              </p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Security", "Integrations"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: 13, color: "#475569", marginBottom: 10, cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={e => e.target.style.color = "#0ab98a"}
                    onMouseLeave={e => e.target.style.color = "#475569"}>{l}</div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <span style={{ fontSize: 13, color: "#475569" }}>© 2026 Novala. All rights reserved.</span>
            <div style={{ display: "flex", gap: 20 }}>
              {["🔒 Bank-grade Security", "☁️ AWS Hosted", "✓ SOC 2 Compliant"].map(b => (
                <span key={b} style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}