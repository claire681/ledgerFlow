import { useState, useEffect, useRef } from "react";
import {
  Brain, BarChart3, Bell, Search, Shield, FileText,
  Upload, Bot, TrendingUp, Rocket, Menu, X, Check,
  Lock, Cloud, ChevronDown,
} from "lucide-react";

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

function Counter({ end, suffix = "" }) {
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
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function Reveal({ children, delay = 0, direction = "up", pop = false }) {
  const [ref, inView] = useInView();
  const transforms = {
    up:    "translateY(40px) scale(0.97)",
    left:  "translateX(-40px)",
    right: "translateX(40px)",
    none:  "none",
  };
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "none" : transforms[direction],
      transition: pop
        ? `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) ${delay}s`
        : `opacity 0.65s ease ${delay}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        borderRadius: 14, border: "1px solid rgba(10,185,138,0.15)",
        background: open ? "rgba(10,185,138,0.04)" : "rgba(255,255,255,0.7)",
        marginBottom: 10, cursor: "pointer", transition: "all 0.3s ease", overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", gap: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", lineHeight: 1.4 }}>{q}</span>
        <ChevronDown size={18} color="#0ab98a" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.3s ease" }}/>
      </div>
      <div style={{ maxHeight: open ? 300 : 0, overflow: "hidden", transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ padding: "0 20px 18px", fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{a}</div>
      </div>
    </div>
  );
}

function PricingCard({ plan, price, desc, features, cta, popular, onSignUp }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 24, padding: "32px 28px", width: "100%", maxWidth: 340,
        border: popular ? "2px solid #0ab98a" : "1px solid rgba(10,185,138,0.15)",
        background: popular ? "linear-gradient(145deg,#0ab98a,#059669)" : "rgba(255,255,255,0.9)",
        position: "relative",
        transform: hov ? "translateY(-12px) scale(1.02)" : popular ? "translateY(-4px)" : "none",
        boxShadow: popular ? "0 24px 70px rgba(10,185,138,0.4)" : hov ? "0 20px 60px rgba(0,0,0,0.12)" : "0 4px 20px rgba(0,0,0,0.06)",
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {popular && (
        <div style={{
          position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(90deg,#0ab98a,#0ea5e9)", color: "#fff",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", padding: "4px 16px",
          borderRadius: 20, textTransform: "uppercase", whiteSpace: "nowrap",
          boxShadow: "0 4px 14px rgba(10,185,138,0.5)",
        }}>Most Popular</div>
      )}
      <div style={{ fontSize: 11, fontWeight: 700, color: popular ? "rgba(255,255,255,0.8)" : "#0ab98a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{plan}</div>
      <div style={{ fontSize: 38, fontWeight: 800, color: popular ? "#fff" : "#0f172a", marginBottom: 4, letterSpacing: "-0.03em" }}>
        {price === "Custom" ? "Custom" : <>${price}<span style={{ fontSize: 14, fontWeight: 500, opacity: 0.7 }}>/mo</span></>}
      </div>
      <div style={{ fontSize: 13, color: popular ? "rgba(255,255,255,0.75)" : "#64748b", marginBottom: 24, lineHeight: 1.5 }}>{desc}</div>
      {features.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: popular ? "rgba(255,255,255,0.25)" : "rgba(10,185,138,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <Check size={10} color={popular ? "#fff" : "#0ab98a"} strokeWidth={3}/>
          </div>
          <span style={{ fontSize: 13, color: popular ? "rgba(255,255,255,0.9)" : "#475569", lineHeight: 1.4 }}>{f}</span>
        </div>
      ))}
      <button
        onClick={onSignUp}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 12, marginTop: 20,
          background: popular ? "#fff" : "linear-gradient(135deg,#0ab98a,#0ea5e9)",
          color: popular ? "#0ab98a" : "#fff", border: "none", cursor: "pointer",
          fontSize: 14, fontWeight: 700, transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: popular ? "0 4px 16px rgba(0,0,0,0.15)" : "0 4px 16px rgba(10,185,138,0.35)",
          fontFamily: "inherit",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = popular ? "0 6px 24px rgba(0,0,0,0.2)" : "0 8px 28px rgba(10,185,138,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = popular ? "0 4px 16px rgba(0,0,0,0.15)" : "0 4px 16px rgba(10,185,138,0.35)"; }}
      >{cta}</button>
    </div>
  );
}

export default function NovalaLanding() {
  const [scrollY, setScrollY]   = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const goToApp    = () => { window.location.href = "https://www.getnovala.com/login"; };
  const goToSignUp = () => { window.location.href = "https://www.getnovala.com/register"; };

  const navLinks = ["Features", "How It Works", "AI Engine", "Pricing", "FAQ"];

  const features = [
    { icon: <Brain size={28} color="#0ab98a"/>,    title: "AI Financial Intelligence",  desc: "Upload any invoice or receipt. Novala's AI instantly extracts, categorizes, and records every financial detail — no manual entry ever again.",            gradient: "linear-gradient(135deg,rgba(10,185,138,0.07),rgba(14,165,233,0.07))",   border: "rgba(10,185,138,0.18)"  },
    { icon: <BarChart3 size={28} color="#0ea5e9"/>, title: "Live Financial Dashboard",   desc: "Real-time revenue tracking, expense trends, and cash flow forecasting. Your finances visualized beautifully — always up to date.",                         gradient: "linear-gradient(135deg,rgba(14,165,233,0.07),rgba(139,92,246,0.07))",  border: "rgba(14,165,233,0.18)"  },
    { icon: <Bell size={28} color="#8b5cf6"/>,      title: "Smart Invoice Follow-Up",    desc: "AI detects overdue invoices and automatically schedules professional follow-up emails with PDF attachments — sent at the perfect time.",                      gradient: "linear-gradient(135deg,rgba(139,92,246,0.07),rgba(10,185,138,0.07))",  border: "rgba(139,92,246,0.18)"  },
    { icon: <Search size={28} color="#f59e0b"/>,    title: "Semantic Document Search",   desc: "Search your financial documents in plain English. 'Show me all overdue invoices from last quarter' — Novala understands.",                                   gradient: "linear-gradient(135deg,rgba(245,158,11,0.07),rgba(10,185,138,0.07))",  border: "rgba(245,158,11,0.18)"  },
    { icon: <Shield size={28} color="#0ab98a"/>,    title: "Automated Bookkeeping",      desc: "Bank-grade reconciliation, duplicate detection, and transaction categorization — all handled automatically by AI.",                                           gradient: "linear-gradient(135deg,rgba(10,185,138,0.07),rgba(245,158,11,0.07))",  border: "rgba(10,185,138,0.18)"  },
    { icon: <FileText size={28} color="#0ea5e9"/>,  title: "Professional Invoicing",     desc: "Create beautiful branded invoices in seconds. Track payments, send reminders, and get paid faster — all from one place.",                                     gradient: "linear-gradient(135deg,rgba(14,165,233,0.07),rgba(10,185,138,0.07))",  border: "rgba(14,165,233,0.18)"  },
  ];

  const steps = [
    { icon: <Upload size={28} color="#0ab98a"/>,     num: "01", title: "Upload Your Documents",   desc: "Drag and drop invoices, receipts, bank statements. AI processes everything in seconds."                  },
    { icon: <Bot size={28} color="#0ea5e9"/>,        num: "02", title: "AI Extracts & Organizes", desc: "Novala reads, categorizes, and records all financial data automatically with high accuracy."             },
    { icon: <TrendingUp size={28} color="#8b5cf6"/>, num: "03", title: "Get Financial Insights",  desc: "Real-time dashboards, reports, and AI-powered recommendations surface instantly."                       },
    { icon: <Rocket size={28} color="#f59e0b"/>,     num: "04", title: "Automate & Scale",        desc: "Set up automated follow-ups, recurring reports, and smart alerts — then focus on growing."              },
  ];

  const faqs = [
    { q: "How does Novala's AI extract data from documents?",       a: "Novala uses advanced large language models combined with computer vision to read and understand financial documents. It extracts vendor names, amounts, dates, line items, and payment status with high accuracy." },
    { q: "Is my financial data secure?",                            a: "Absolutely. Novala uses bank-grade AES-256 encryption, AWS infrastructure, and never shares your data with third parties. Your documents are stored in encrypted S3 buckets with strict access controls." },
    { q: "Can I import data from my existing accounting software?", a: "Yes. Novala integrates with QuickBooks, Xero, FreshBooks, and major banks. You can also import CSV files, PDFs, and connect directly via API." },
    { q: "How does the AI invoice follow-up work?",                 a: "Novala detects overdue invoices and suggests follow-up emails. You review, edit the message, pick a date and time, and Novala sends a professional email with the invoice PDF attached automatically." },
    { q: "Is there a free trial?",                                  a: "Yes — all plans come with a 14-day free trial with full access to all features. No credit card required for the Essentials plan." },
    { q: "Can I use Novala for my team?",                           a: "Absolutely. Novala supports multi-user teams with role-based permissions, shared dashboards, and collaborative workflows. Enterprise plans include white-label options and dedicated support." },
  ];

  const px = "clamp(16px, 5vw, 80px)";

  return (
    <div style={{ fontFamily: "'DM Sans','Inter',system-ui,sans-serif", background: "#f8fffe", color: "#0f172a", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#0ab98a; border-radius:99px; }

        @keyframes float      { 0%,100%{transform:translateY(0)}           50%{transform:translateY(-12px)} }
        @keyframes floatSlow  { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-8px) rotate(1.5deg)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 30px rgba(10,185,138,0.2)} 50%{box-shadow:0 0 70px rgba(10,185,138,0.55)} }
        @keyframes shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes ping       { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2.2);opacity:0} }
        @keyframes wave       { 0%,100%{transform:scaleY(0.5)} 50%{transform:scaleY(1.5)} }
        @keyframes bar-load   { from{width:0} to{width:var(--w)} }

        .gradient-text {
          background: linear-gradient(135deg,#0ab98a 0%,#0ea5e9 50%,#0ab98a 100%);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation:shimmer 3s linear infinite;
        }
        .cta-primary {
          background:linear-gradient(135deg,#0ab98a,#059669); color:#fff; border:none;
          padding:15px 32px; border-radius:13px; font-size:15px; font-weight:700;
          cursor:pointer; box-shadow:0 6px 24px rgba(10,185,138,0.4);
          transition:all 0.25s cubic-bezier(0.16,1,0.3,1); font-family:inherit; white-space:nowrap;
        }
        .cta-primary:hover  { transform:translateY(-3px) scale(1.02); box-shadow:0 14px 40px rgba(10,185,138,0.55); }
        .cta-primary:active { transform:scale(0.97); }
        .cta-secondary {
          background:rgba(255,255,255,0.9); color:#0f172a;
          border:1px solid rgba(10,185,138,0.25); padding:15px 32px;
          border-radius:13px; font-size:15px; font-weight:600; cursor:pointer;
          backdrop-filter:blur(10px); transition:all 0.25s cubic-bezier(0.16,1,0.3,1); font-family:inherit; white-space:nowrap;
        }
        .cta-secondary:hover { transform:translateY(-3px); border-color:rgba(10,185,138,0.5); box-shadow:0 8px 28px rgba(10,185,138,0.15); }

        .feature-card { transition:transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; cursor:default; }
        .feature-card:hover { transform:translateY(-10px) scale(1.02) !important; box-shadow:0 24px 60px rgba(10,185,138,0.18) !important; }
        .feature-card:hover .feature-icon { transform:scale(1.25) rotate(-8deg); }
        .feature-icon { transition:transform 0.4s cubic-bezier(0.16,1,0.3,1); display:inline-block; }

        .step-card { transition:all 0.4s cubic-bezier(0.16,1,0.3,1); }
        .step-card:hover { transform:translateY(-10px) scale(1.03) !important; }
        .step-card:hover .step-icon {
          transform:scale(1.18) rotate(6deg);
          background:linear-gradient(135deg,rgba(10,185,138,0.22),rgba(14,165,233,0.22)) !important;
          box-shadow:0 0 32px rgba(10,185,138,0.35);
        }
        .step-icon { transition:all 0.4s cubic-bezier(0.16,1,0.3,1); }

        .stat-card { transition:all 0.35s cubic-bezier(0.16,1,0.3,1); padding:16px 8px; border-radius:20px; }
        .stat-card:hover { transform:translateY(-6px) scale(1.05); background:rgba(10,185,138,0.04); }

        .nav-link-btn { position:relative; }
        .nav-link-btn::after { content:''; position:absolute; bottom:-3px; left:0; right:0; height:2px; background:#0ab98a; transform:scaleX(0); transition:transform 0.25s ease; border-radius:99px; }
        .nav-link-btn:hover::after { transform:scaleX(1); }

        .desktop-only { display:flex !important; }
        .mobile-only  { display:none  !important; }
        .hero-float-badge { display:block !important; }

        @media (max-width:768px) {
          .desktop-only     { display:none  !important; }
          .mobile-only      { display:flex  !important; }
          .hero-float-badge { display:none  !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        background: scrollY > 40 ? "rgba(248,255,254,0.96)" : "transparent",
        backdropFilter: scrollY > 40 ? "blur(20px)" : "none",
        borderBottom: scrollY > 40 ? "1px solid rgba(10,185,138,0.1)" : "none",
        transition:"all 0.3s ease", padding:`0 ${px}`,
      }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>

          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:9, flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#0ab98a,#059669)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(10,185,138,0.4)", flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="19" cy="9" r="2" fill="#fff"/>
              </svg>
            </div>
            <span style={{ fontSize:19, fontWeight:800, letterSpacing:"-0.03em", color:"#0f172a" }}>No<span style={{ color:"#0ab98a" }}>vala</span></span>
          </div>

          {/* Desktop nav links */}
          <div className="desktop-only" style={{ alignItems:"center", gap:28 }}>
            {navLinks.map(l => (
              <button key={l} className="nav-link-btn"
                onClick={() => { const el = document.getElementById(l.toLowerCase().replace(/ /g,"-")); if(el) el.scrollIntoView({behavior:"smooth"}); }}
                style={{ color:"#475569", fontSize:13, fontWeight:500, cursor:"pointer", transition:"color 0.2s", background:"none", border:"none", fontFamily:"inherit", position:"relative" }}
                onMouseEnter={e => e.target.style.color="#0ab98a"}
                onMouseLeave={e => e.target.style.color="#475569"}>
                {l}
              </button>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="desktop-only" style={{ gap:8 }}>
            <button className="cta-secondary" style={{ padding:"9px 18px", fontSize:13 }} onClick={goToApp}>Sign In</button>
            <button className="cta-secondary" style={{ padding:"9px 18px", fontSize:13, borderColor:"rgba(10,185,138,0.4)", color:"#0ab98a", fontWeight:700 }} onClick={goToSignUp}>Create Account</button>
          </div>

          {/* Mobile hamburger */}
          <button className="mobile-only" onClick={() => setMenuOpen(o => !o)}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#0f172a", alignItems:"center", justifyContent:"center", padding:6, borderRadius:8 }}>
            {menuOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>

        {/* Mobile slide-down menu */}
        <div style={{
          position:"fixed", top:64, left:0, right:0,
          background:"rgba(248,255,254,0.98)", backdropFilter:"blur(24px)",
          borderBottom: menuOpen ? "1px solid rgba(10,185,138,0.12)" : "none",
          padding: menuOpen ? "16px 24px 28px" : "0 24px",
          maxHeight: menuOpen ? "100vh" : 0,
          overflow:"hidden",
          transition:"max-height 0.4s cubic-bezier(0.16,1,0.3,1), padding 0.3s ease",
          zIndex:99, display:"flex", flexDirection:"column",
        }}>
          <div style={{ display:"flex", flexDirection:"column", marginBottom:20 }}>
            {navLinks.map((l,i) => (
              <button key={l}
                onClick={() => { setMenuOpen(false); setTimeout(() => { const el = document.getElementById(l.toLowerCase().replace(/ /g,"-")); if(el) el.scrollIntoView({behavior:"smooth"}); }, 350); }}
                style={{
                  textAlign:"left", padding:"14px 0", fontSize:17, fontWeight:600, color:"#0f172a",
                  background:"none", border:"none",
                  borderBottom: i < navLinks.length-1 ? "1px solid rgba(10,185,138,0.08)" : "none",
                  cursor:"pointer", fontFamily:"inherit",
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? "none" : "translateY(-8px)",
                  transition:`opacity 0.3s ease ${i*0.05}s, transform 0.3s ease ${i*0.05}s, color 0.2s`,
                }}
                onMouseEnter={e => e.currentTarget.style.color="#0ab98a"}
                onMouseLeave={e => e.currentTarget.style.color="#0f172a"}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <button className="cta-primary"   style={{ padding:"15px", fontSize:15, width:"100%", textAlign:"center", borderRadius:13 }} onClick={() => { setMenuOpen(false); goToSignUp(); }}>Create Account →</button>
            <button className="cta-secondary" style={{ padding:"15px", fontSize:15, width:"100%", textAlign:"center", borderRadius:13 }} onClick={() => { setMenuOpen(false); goToApp(); }}>Sign In</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        padding:`100px ${px} 60px`,
        background:"radial-gradient(ellipse 80% 60% at 50% -10%,rgba(10,185,138,0.12) 0%,transparent 70%), radial-gradient(ellipse 50% 40% at 80% 50%,rgba(14,165,233,0.07) 0%,transparent 60%), linear-gradient(180deg,#f0fdf9 0%,#f8fffe 100%)",
      }}>
        <div style={{ maxWidth:1200, margin:"0 auto", width:"100%" }}>
          <div style={{ textAlign:"center", maxWidth:800, margin:"0 auto" }}>

            <Reveal delay={0}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(10,185,138,0.08)", border:"1px solid rgba(10,185,138,0.2)", borderRadius:99, padding:"6px 16px", marginBottom:28 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:"#0ab98a", animation:"pulse-glow 2s infinite" }}/>
                <span style={{ fontSize:11, fontWeight:700, color:"#0ab98a", letterSpacing:"0.08em", textTransform:"uppercase" }}>AI-Powered Financial Intelligence</span>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h1 style={{ fontSize:"clamp(36px,7vw,78px)", fontWeight:800, lineHeight:1.08, letterSpacing:"-0.04em", color:"#0f172a", marginBottom:20 }}>
                Your finances,<br/><span className="gradient-text">finally intelligent.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p style={{ fontSize:"clamp(15px,2.5vw,19px)", color:"#475569", lineHeight:1.65, maxWidth:560, margin:"0 auto 36px" }}>
                Novala uses AI to automate bookkeeping, invoice management, and financial reporting — so you can focus on growing your business.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:36 }}>
                <button className="cta-primary"   onClick={goToSignUp} style={{ fontSize:15, padding:"16px 36px" }}>Start Free — No Card Needed</button>
                <button className="cta-secondary" onClick={goToApp}    style={{ fontSize:15, padding:"16px 36px" }}>Sign In to Dashboard →</button>
              </div>
            </Reveal>

            <Reveal delay={0.38}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, flexWrap:"wrap", marginBottom:28 }}>
                {["✓ 14-day free trial","✓ No credit card required","✓ Cancel anytime","✓ Bank-grade security"].map(t => (
                  <span key={t} style={{ fontSize:12, color:"#64748b", fontWeight:500 }}>{t}</span>
                ))}
              </div>
            </Reveal>

            {/* Live activity ticker */}
            <Reveal delay={0.45}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:52 }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.85)", backdropFilter:"blur(12px)", border:"1px solid rgba(10,185,138,0.15)", borderRadius:99, padding:"8px 20px", boxShadow:"0 4px 20px rgba(10,185,138,0.1)" }}>
                  <div style={{ display:"flex", gap:3, alignItems:"center" }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{ width:3, height:14, borderRadius:99, background:"#0ab98a", animation:`wave 1s ease-in-out infinite`, animationDelay:`${i*0.15}s` }}/>
                    ))}
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color:"#475569" }}>
                    <span style={{ color:"#0ab98a", fontWeight:700 }}>247 businesses</span> processed documents with Novala today
                  </span>
                  <div style={{ position:"relative", width:8, height:8, flexShrink:0 }}>
                    <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"#0ab98a", animation:"ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}/>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:"#0ab98a" }}/>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Dashboard Mockup */}
          <Reveal delay={0.5}>
            <div style={{ position:"relative", maxWidth:900, margin:"0 auto" }}>
              <div style={{ position:"absolute", inset:-30, borderRadius:40, background:"radial-gradient(ellipse at center,rgba(10,185,138,0.12) 0%,transparent 70%)", filter:"blur(20px)", pointerEvents:"none" }}/>
              <div style={{ background:"rgba(255,255,255,0.92)", backdropFilter:"blur(30px)", borderRadius:24, border:"1px solid rgba(10,185,138,0.15)", boxShadow:"0 24px 80px rgba(10,185,138,0.15),0 8px 32px rgba(0,0,0,0.08)", overflow:"hidden", position:"relative", animation:"float 6s ease-in-out infinite" }}>

                <div style={{ background:"linear-gradient(135deg,#0ab98a,#059669)", padding:"12px 20px", display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ display:"flex", gap:5 }}>
                    {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }}/>)}
                  </div>
                  <div style={{ flex:1, background:"rgba(255,255,255,0.15)", borderRadius:7, padding:"5px 12px", fontSize:11, color:"rgba(255,255,255,0.9)", fontWeight:500 }}>app.getnovala.com — Dashboard</div>
                </div>

                <div style={{ padding:"clamp(14px,3vw,24px)", background:"#f8fffe" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10, marginBottom:16 }}>
                    {[
                      { label:"Revenue",     value:"$124,820", color:"#0ab98a" },
                      { label:"Outstanding", value:"$18,340",  color:"#f59e0b" },
                      { label:"Expenses",    value:"$42,180",  color:"#ef4444" },
                      { label:"Net Profit",  value:"$64,300",  color:"#0ea5e9" },
                    ].map(s => (
                      <div key={s.label} style={{ background:"#fff", borderRadius:12, padding:"12px 14px", border:"1px solid rgba(10,185,138,0.08)" }}>
                        <div style={{ fontSize:9, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{s.label}</div>
                        <div style={{ fontSize:"clamp(14px,2.5vw,20px)", fontWeight:800, color:"#0f172a", letterSpacing:"-0.02em" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"#fff", borderRadius:12, padding:"16px 18px", border:"1px solid rgba(10,185,138,0.08)" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Revenue Overview</div>
                    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:60 }}>
                      {[45,62,55,78,68,90].map((h,i) => (
                        <div key={i} style={{ flex:1, borderRadius:"5px 5px 0 0", background:i===5?"linear-gradient(180deg,#0ab98a,#059669)":"rgba(10,185,138,0.12)", height:`${h}%`, transition:"height 0.6s ease" }}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-float-badge" style={{ position:"absolute", top:60, right:-24, background:"#fff", borderRadius:14, padding:"10px 14px", boxShadow:"0 8px 28px rgba(0,0,0,0.12)", border:"1px solid rgba(10,185,138,0.15)", animation:"floatSlow 4s ease-in-out infinite", zIndex:10 }}>
                <div style={{ fontSize:9, fontWeight:700, color:"#64748b", marginBottom:3 }}>AI PROCESSED</div>
                <div style={{ fontSize:18, fontWeight:800, color:"#0ab98a" }}>247 docs</div>
                <div style={{ fontSize:9, color:"#94a3b8" }}>this month</div>
              </div>

              <div className="hero-float-badge" style={{ position:"absolute", bottom:40, left:-24, background:"#fff", borderRadius:14, padding:"10px 14px", boxShadow:"0 8px 28px rgba(0,0,0,0.12)", border:"1px solid rgba(14,165,233,0.2)", animation:"floatSlow 5s ease-in-out infinite 1s", zIndex:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:"#0ab98a", animation:"pulse-glow 2s infinite" }}/>
                  <span style={{ fontSize:10, fontWeight:700, color:"#0ab98a" }}>Follow-up sent</span>
                </div>
                <div style={{ fontSize:11, color:"#64748b", marginTop:3 }}>Invoice #1042 — $8,750</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding:`48px ${px}`, background:"#fff" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"clamp(20px,4vw,40px)" }}>
            {[
              { value:98,    suffix:"%",   label:"AI Accuracy Rate"    },
              { value:10000, suffix:"+",   label:"Documents Processed" },
              { value:500,   suffix:"+",   label:"Businesses"          },
              { value:40,    suffix:"hrs", label:"Saved Per Month"     },
            ].map((s,i) => (
              <Reveal key={i} delay={i*0.1} pop={true}>
                <div className="stat-card" style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"clamp(32px,5vw,50px)", fontWeight:800, letterSpacing:"-0.04em", color:"#0f172a", marginBottom:6 }}>
                    <span className="gradient-text"><Counter end={s.value} suffix={s.suffix}/></span>
                  </div>
                  <div style={{ fontSize:13, color:"#64748b", fontWeight:500 }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding:`80px ${px}`, background:"linear-gradient(180deg,#f8fffe,#f0fdf9)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#0ab98a", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Everything You Need</div>
              <h2 style={{ fontSize:"clamp(28px,5vw,50px)", fontWeight:800, letterSpacing:"-0.03em", color:"#0f172a", marginBottom:14, lineHeight:1.1 }}>
                AI that actually understands<br/>your finances
              </h2>
              <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"#64748b", maxWidth:500, margin:"0 auto", lineHeight:1.6 }}>
                Every feature is designed to save you time and give you clarity.
              </p>
            </div>
          </Reveal>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
            {features.map((f,i) => (
              <Reveal key={i} delay={i*0.08} pop={true}>
                <div className="feature-card" style={{ background:f.gradient, border:`1px solid ${f.border}`, borderRadius:20, padding:"26px 24px", height:"100%" }}>
                  <div className="feature-icon" style={{ marginBottom:16 }}>{f.icon}</div>
                  <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:8, letterSpacing:"-0.02em" }}>{f.title}</h3>
                  <p style={{ fontSize:13, color:"#475569", lineHeight:1.65 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding:`80px ${px}`, background:"#fff" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:48 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#0ab98a", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Simple Process</div>
              <h2 style={{ fontSize:"clamp(28px,5vw,48px)", fontWeight:800, letterSpacing:"-0.03em", color:"#0f172a", lineHeight:1.1 }}>
                From upload to insight<br/>in seconds
              </h2>
            </div>
          </Reveal>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:20 }}>
            {steps.map((s,i) => (
              <Reveal key={i} delay={i*0.12} pop={true}>
                <div className="step-card" style={{ textAlign:"center", padding:"24px 16px" }}>
                  <div className="step-icon" style={{ width:64, height:64, borderRadius:18, margin:"0 auto 16px", background:"linear-gradient(135deg,rgba(10,185,138,0.08),rgba(14,165,233,0.08))", border:"1px solid rgba(10,185,138,0.18)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize:10, fontWeight:800, color:"#0ab98a", letterSpacing:"0.1em", marginBottom:8 }}>{s.num}</div>
                  <h3 style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:8, letterSpacing:"-0.02em" }}>{s.title}</h3>
                  <p style={{ fontSize:13, color:"#64748b", lineHeight:1.6 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SECTION ── */}
      <section id="ai-engine" style={{ padding:`80px ${px}`, background:"linear-gradient(135deg,#0f172a 0%,#0c2a22 100%)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"20%", left:"10%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(10,185,138,0.1),transparent)", filter:"blur(50px)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"10%", right:"5%", width:240, height:240, borderRadius:"50%", background:"radial-gradient(circle,rgba(14,165,233,0.08),transparent)", filter:"blur(40px)", pointerEvents:"none" }}/>

        <div style={{ maxWidth:1100, margin:"0 auto", position:"relative" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"clamp(32px,5vw,64px)", alignItems:"center" }}>
            <Reveal direction="left">
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#0ab98a", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:18 }}>AI Engine</div>
                <h2 style={{ fontSize:"clamp(26px,4vw,46px)", fontWeight:800, color:"#fff", marginBottom:18, lineHeight:1.15, letterSpacing:"-0.03em" }}>
                  An AI co-pilot for your entire financial operation
                </h2>
                <p style={{ fontSize:"clamp(13px,1.8vw,16px)", color:"#94a3b8", lineHeight:1.7, marginBottom:28 }}>
                  Novala's AI doesn't just extract data — it understands context, detects anomalies, predicts cash flow, and proactively flags issues before they become problems.
                </p>
                {[
                  { icon:<Brain size={15} color="#0ab98a"/>,      text:"Semantic document understanding"    },
                  { icon:<Shield size={15} color="#0ab98a"/>,     text:"Anomaly & duplicate detection"      },
                  { icon:<Search size={15} color="#0ab98a"/>,     text:"Natural language financial queries" },
                  { icon:<Bell size={15} color="#0ab98a"/>,       text:"Automated follow-up scheduling"     },
                  { icon:<TrendingUp size={15} color="#0ab98a"/>, text:"Predictive cash flow insights"      },
                ].map((f,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, transition:"transform 0.2s ease" }}
                    onMouseEnter={e => e.currentTarget.style.transform="translateX(6px)"}
                    onMouseLeave={e => e.currentTarget.style.transform="none"}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(10,185,138,0.12)", border:"1px solid rgba(10,185,138,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{f.icon}</div>
                    <span style={{ fontSize:13, color:"#cbd5e1", fontWeight:500 }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal direction="right">
              <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(10,185,138,0.2)", borderRadius:22, padding:"clamp(20px,3vw,28px)", backdropFilter:"blur(20px)", animation:"float 5s ease-in-out infinite" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#0ab98a", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:"#0ab98a", animation:"pulse-glow 2s infinite" }}/>
                  AI Processing
                </div>
                {[
                  { label:"Document Reading",  pct:100, color:"#0ab98a" },
                  { label:"Data Extraction",   pct:97,  color:"#0ea5e9" },
                  { label:"Categorization",    pct:94,  color:"#8b5cf6" },
                  { label:"Anomaly Detection", pct:99,  color:"#f59e0b" },
                ].map((item,i) => (
                  <div key={i} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:12, color:"#94a3b8", fontWeight:500 }}>{item.label}</span>
                      <span style={{ fontSize:12, color:item.color, fontWeight:700 }}>{item.pct}%</span>
                    </div>
                    <div style={{ height:5, background:"rgba(255,255,255,0.08)", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${item.pct}%`, background:item.color, borderRadius:99, boxShadow:`0 0 10px ${item.color}` }}/>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:18, padding:"12px 14px", background:"rgba(10,185,138,0.08)", borderRadius:10, border:"1px solid rgba(10,185,138,0.2)" }}>
                  <div style={{ fontSize:10, color:"#64748b", marginBottom:3 }}>Latest action</div>
                  <div style={{ fontSize:12, color:"#e2e8f0", fontWeight:600 }}>✓ Invoice #1042 processed — $8,750</div>
                  <div style={{ fontSize:10, color:"#0ab98a", marginTop:3 }}>2 seconds ago</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding:`80px ${px}`, background:"linear-gradient(180deg,#f0fdf9,#f8fffe)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#0ab98a", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Simple Pricing</div>
              <h2 style={{ fontSize:"clamp(28px,5vw,50px)", fontWeight:800, letterSpacing:"-0.03em", color:"#0f172a", lineHeight:1.1, marginBottom:14 }}>
                Start free. Scale with confidence.
              </h2>
              <p style={{ fontSize:"clamp(14px,2vw,16px)", color:"#64748b", maxWidth:400, margin:"0 auto" }}>14-day free trial on all plans. No credit card required.</p>
            </div>
          </Reveal>

          <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap", alignItems:"flex-start", padding:"8px 0" }}>
            {[
              { plan:"Essentials", price:"20",     desc:"Perfect for freelancers and solo businesses.",      features:["Up to 100 documents/mo","AI data extraction","Basic invoicing","Financial dashboard","Email support"],                                                          cta:"Start Free Trial", popular:false },
              { plan:"Premium",    price:"30",     desc:"For growing businesses that need full automation.", features:["Unlimited documents","AI follow-up emails","Smart Search (RAG)","Advanced reports","Bill pay & reconciliation","Priority support"],                            cta:"Start Free Trial", popular:true  },
              { plan:"Enterprise", price:"Custom", desc:"For teams needing scale, compliance, and control.", features:["Everything in Premium","Multi-user & roles","White-label option","API access","Custom integrations","Dedicated success manager"],                             cta:"Contact Sales",    popular:false },
            ].map((p,i) => (
              <Reveal key={i} delay={i*0.12} pop={true}>
                <PricingCard
                  {...p}
                  onSignUp={p.price === "Custom"
                    ? () => window.location.href = "mailto:support@getnovala.com"
                    : goToSignUp}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding:`80px ${px}`, background:"#fff" }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:48 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#0ab98a", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>FAQ</div>
              <h2 style={{ fontSize:"clamp(26px,5vw,42px)", fontWeight:800, letterSpacing:"-0.03em", color:"#0f172a", lineHeight:1.15 }}>Common questions</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            {faqs.map((f,i) => <FAQ key={i} q={f.q} a={f.a}/>)}
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding:`80px ${px}`, background:"linear-gradient(135deg,#0f172a,#0c2a22)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 60% at 50% 50%,rgba(10,185,138,0.13),transparent)", pointerEvents:"none" }}/>
        <div style={{ maxWidth:640, margin:"0 auto", textAlign:"center", position:"relative" }}>
          <Reveal>
            <div style={{ width:64, height:64, borderRadius:18, background:"linear-gradient(135deg,#0ab98a,#059669)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", boxShadow:"0 0 50px rgba(10,185,138,0.4)", animation:"pulse-glow 3s infinite" }}>
              <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
                <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="19" cy="9" r="2" fill="#fff"/>
              </svg>
            </div>
            <h2 style={{ fontSize:"clamp(28px,5vw,52px)", fontWeight:800, color:"#fff", marginBottom:18, lineHeight:1.1, letterSpacing:"-0.04em" }}>
              Ready to transform how you<br/><span className="gradient-text">manage your finances?</span>
            </h2>
            <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"#94a3b8", marginBottom:36, lineHeight:1.6 }}>
              Join hundreds of businesses already saving hours every week with Novala.
            </p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <button className="cta-primary" onClick={goToSignUp} style={{ fontSize:15, padding:"16px 36px" }}>Get Started Free Today →</button>
              <button onClick={goToApp} style={{ fontSize:15, padding:"16px 36px", borderRadius:13, background:"rgba(255,255,255,0.08)", color:"#fff", border:"1px solid rgba(255,255,255,0.15)", cursor:"pointer", fontFamily:"inherit", fontWeight:600, transition:"all 0.25s ease" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.14)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.transform="none"; }}>
                Sign In
              </button>
            </div>
            <p style={{ fontSize:12, color:"#475569", marginTop:18 }}>14-day free trial · No credit card required · Cancel anytime</p>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding:`40px ${px}`, background:"#0f172a", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"clamp(24px,4vw,40px)", marginBottom:40 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:14 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#0ab98a,#059669)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                    <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize:17, fontWeight:800, color:"#fff", letterSpacing:"-0.03em" }}>No<span style={{ color:"#0ab98a" }}>vala</span></span>
              </div>
              <p style={{ fontSize:12, color:"#475569", lineHeight:1.7, maxWidth:220 }}>AI-powered financial intelligence for modern businesses.</p>
            </div>
            {[
              { title:"Product", links:["Features","Pricing","Security","Integrations"] },
              { title:"Company", links:["About","Blog","Careers","Contact"]             },
              { title:"Legal",   links:["Privacy Policy","Terms of Service","Cookie Policy"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:14 }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize:13, color:"#475569", marginBottom:9, cursor:"pointer", transition:"color 0.2s, transform 0.2s" }}
                    onMouseEnter={e => { e.target.style.color="#0ab98a"; e.target.style.transform="translateX(4px)"; }}
                    onMouseLeave={e => { e.target.style.color="#475569"; e.target.style.transform="none"; }}>{l}</div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <span style={{ fontSize:12, color:"#475569" }}>© 2026 Novala. All rights reserved.</span>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
              {[
                { icon:<Lock size={11}/>,   text:"Bank-grade Security" },
                { icon:<Cloud size={11}/>,  text:"AWS Hosted"          },
                { icon:<Shield size={11}/>, text:"SOC 2 Compliant"     },
              ].map(b => (
                <span key={b.text} style={{ fontSize:11, color:"#475569", fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ color:"#0ab98a" }}>{b.icon}</span>{b.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}