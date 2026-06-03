import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Sparkles, Phone } from "lucide-react";

const TEAL = "#0F9599";
const TEAL_DARK = "#0B7377";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const BORDER = "#DDE5E5";
const PROMO_DARK = "#0A2F30";

const PRODUCTS = ["Accounting", "Payroll", "Receipt scanning (Nova AI)", "Time tracking"];
const FEATURES = [
  "Invoicing & invoice generator",
  "Receipt capture & scan",
  "Expense tracking",
  "Bank feeds / transactions",
  "Reporting",
  "Manage customers",
  "Sales tax tracking",
  "Documents",
  "See all features",
];
const STAGES = ["Small business", "New business", "Freelancers"];
const INDUSTRIES = ["Home Healthcare", "Professional services", "Small clinics", "Consultants"];
const NOVA_ITEMS = ["Receipt AI", "Bookkeeping AI", "Reporting AI", "Tax AI"];
const SUPPORT_LINKS = ["Help centre", "Tutorials", "Webinars", "Community", "Blog", "Status page"];

export default function MarketingHeader() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const headerRef = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleEnter = (which) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpenMenu(which);
  };
  const handleLeave = () => {
    closeTimerRef.current = setTimeout(() => setOpenMenu(null), 140);
  };
  const linkHover = (on) => (e) => { e.currentTarget.style.color = on ? TEAL : INK; };

  return (
    <header ref={headerRef} style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 50, fontFamily: "system-ui, -apple-system, sans-serif" }}>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 32px", display: "flex", alignItems: "center", gap: 24 }}>

        <span onClick={() => navigate("/")} style={{ color: TEAL, fontWeight: 800, fontSize: 24, letterSpacing: "-0.015em", cursor: "pointer", flexShrink: 0 }}>Novala</span>

        <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>

          <div onMouseEnter={() => handleEnter("products")} onMouseLeave={handleLeave}>
            <button style={{ background: openMenu === "products" ? "#F1F5F5" : "transparent", border: "none", fontSize: 15, fontWeight: 500, color: INK, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", fontFamily: "inherit", borderRadius: 6, transition: "background 0.15s" }}>
              Products & features
              <ChevronDown size={16} style={{ transform: openMenu === "products" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
          </div>

          <span onClick={() => navigate("/pricing")} onMouseEnter={linkHover(true)} onMouseLeave={linkHover(false)} style={{ fontSize: 15, fontWeight: 500, color: INK, cursor: "pointer", padding: "8px 12px", borderRadius: 6, transition: "color 0.15s" }}>Plans & pricing</span>

          <div onMouseEnter={() => handleEnter("support")} onMouseLeave={handleLeave} style={{ position: "relative" }}>
            <button style={{ background: openMenu === "support" ? "#F1F5F5" : "transparent", border: "none", fontSize: 15, fontWeight: 500, color: INK, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", fontFamily: "inherit", borderRadius: 6, transition: "background 0.15s" }}>
              Learn & support
              <ChevronDown size={16} style={{ transform: openMenu === "support" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            {openMenu === "support" && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)", minWidth: 220, padding: 8, zIndex: 60 }}>
                {SUPPORT_LINKS.map((it, i) => (
                  <a key={i} href="#" onMouseEnter={(e) => e.currentTarget.style.background = "#F1F5F5"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} style={{ display: "block", padding: "8px 12px", fontSize: 14, color: INK, textDecoration: "none", borderRadius: 6, transition: "background 0.15s" }}>{it}</a>
                ))}
              </div>
            )}
          </div>

        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: SUB }}>
            <Phone size={14} />
            <span>Talk to Sales</span>
          </span>
          <span onClick={() => navigate("/login")} onMouseEnter={linkHover(true)} onMouseLeave={linkHover(false)} style={{ fontSize: 14, color: INK, fontWeight: 600, cursor: "pointer", transition: "color 0.15s" }}>Sign in</span>
          <button onClick={() => navigate("/pricing")} onMouseEnter={(e) => e.currentTarget.style.background = TEAL_DARK} onMouseLeave={(e) => e.currentTarget.style.background = TEAL} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}>Get started</button>
        </div>
      </div>

      {openMenu === "products" && (
        <div onMouseEnter={() => handleEnter("products")} onMouseLeave={handleLeave} style={{ position: "absolute", left: 0, right: 0, top: "100%", background: "#fff", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, boxShadow: "0 16px 32px -12px rgba(0,0,0,0.18)", padding: "32px 32px 40px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr) 340px", gap: 32, alignItems: "start" }}>

            {[
              { title: "Products", items: PRODUCTS },
              { title: "Features", items: FEATURES },
              { title: "Business stage", items: STAGES },
              { title: "Industry", items: INDUSTRIES },
            ].map((col, ci) => (
              <div key={ci}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: SUB, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px 0" }}>{col.title}</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.items.map((item, i) => (
                    <li key={i}>
                      <a href="#" onMouseEnter={(e) => e.currentTarget.style.color = TEAL} onMouseLeave={(e) => e.currentTarget.style.color = INK} style={{ color: INK, textDecoration: "none", fontSize: 14, transition: "color 0.15s" }}>{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div style={{ background: `linear-gradient(135deg, ${PROMO_DARK} 0%, #0F4F52 100%)`, borderRadius: 16, padding: 24, color: "#fff", border: `1.5px solid rgba(15,149,153,0.45)`, boxShadow: "0 0 40px -10px rgba(15,149,153,0.5)" }}>
              <div style={{ display: "inline-block", background: TEAL, color: "#fff", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 12 }}>NEW</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 19, fontWeight: 800, letterSpacing: "-0.015em" }}>Meet Nova: AI for every job</h3>
              <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "rgba(255,255,255,0.78)", lineHeight: 1.55 }}>The intelligent layer across Novala. Less typing, fewer mistakes, more time on the work that matters.</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px 0", display: "flex", flexDirection: "column", gap: 8 }}>
                {NOVA_ITEMS.map((it, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <Sparkles size={14} color={TEAL} />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/pricing")} onMouseEnter={(e) => e.currentTarget.style.background = TEAL_DARK} onMouseLeave={(e) => e.currentTarget.style.background = TEAL} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}>Try Nova</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
