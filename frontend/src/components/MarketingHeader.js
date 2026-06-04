import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown, Sparkles, ArrowRight, Receipt, Brain, FileText,
  BarChart3, CreditCard, Banknote, Plug, Layers, Wallet, HelpCircle,
} from "lucide-react";

const TEAL        = "#0F9599";
const TEAL_DARK   = "#0B7377";
const TEAL_TINT   = "#E6F4F4";
const INK         = "#0E1A1A";
const SUB         = "#5B6B6B";
const BORDER      = "#E2E8E8";
const BG          = "#FFFFFF";
const BG_TINT     = "#F9FAFA";
const FOOTER_DARK = "#0B3D3D";
const CONTENT_MAX = 1240;
const NAV_H       = 72;
const FONT        = "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const PRODUCTS = [
  { Icon: Brain,     label: "Accounting", desc: "Books that update themselves" },
  { Icon: Receipt,   label: "Receipts",   desc: "Snap, extract, reconcile" },
  { Icon: FileText,  label: "Invoicing",  desc: "Branded, recurring, paid" },
  { Icon: Banknote,  label: "Payroll",    desc: "Run payroll in minutes" },
];
const FEATURES = ["Receipt scanner","Bank feed sync","Smart categorization","Live dashboards","Reports & analytics","200+ integrations","Tax tracking","Documents","See all features"];
const STAGES = ["Freelancers","Small business","Growing teams"];
const INDUSTRIES = ["Home healthcare","Professional services","Retail","Consulting"];
const NOVA_FEATURES = ["Receipt extraction","Smart bookkeeping","Tax estimation","Reports on demand"];
const SUPPORT = [
  { label: "Help centre",      path: "/help/auto-payroll" },
  { label: "Getting started",  path: "/help/auto-payroll" },
  { label: "Tutorials",        path: "/help/auto-payroll" },
  { label: "Status page",      path: "/help/auto-payroll" },
  { label: "Contact support",  path: "/help/auto-payroll" },
];

function NovalaLogo({ size = 32, color = INK, showWordmark = true }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <img src="/logo512.png" alt="Novala" style={{ width: size, height: size, objectFit: "contain", display: "block" }} />
      {showWordmark && (
        <span style={{ color: color, fontWeight: 800, fontSize: Math.round(size * 0.75), letterSpacing: "-0.02em" }}>Novala</span>
      )}
    </span>
  );
}

export default function MarketingHeader() {
  const navigate = useNavigate();
  const [productsOpen, setProductsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const navItem = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", borderRadius: 8, cursor: "pointer",
    color: INK, fontSize: 14.5, fontWeight: 500,
    transition: "background 0.15s", userSelect: "none",
  };

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.95)", borderBottom: `1px solid ${BORDER}`, backdropFilter: "saturate(180%) blur(12px)", fontFamily: FONT }}>
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "0 32px", height: NAV_H, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <NovalaLogo size={32} />
          </span>

          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>

            {/* Products & features */}
            <div onMouseEnter={() => setProductsOpen(true)} onMouseLeave={() => setProductsOpen(false)} style={{ position: "relative" }}>
              <span style={navItem}>
                <Layers size={15} strokeWidth={2} color={TEAL} />
                Products & features
                <ChevronDown size={14} style={{ transform: productsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </span>

              {productsOpen && (
                <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", paddingTop: 6 }}>
                  <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 28, boxShadow: "0 30px 60px -24px rgba(0,0,0,0.18)", display: "grid", gridTemplateColumns: "repeat(4, 1fr) 280px", gap: 28, minWidth: 1100 }}>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Products</div>
                      {PRODUCTS.map((p, i) => (
                        <div key={i} style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "start", gap: 10, transition: "background 0.15s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = BG_TINT}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          onClick={() => navigate("/#features")}
                        >
                          <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: TEAL_TINT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <p.Icon size={16} color={TEAL} />
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{p.label}</div>
                            <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{p.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Features</div>
                      {FEATURES.map((f, i) => (
                        <div key={i} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, color: INK, transition: "background 0.15s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = BG_TINT}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          onClick={() => navigate("/#features")}
                        >{f}</div>
                      ))}
                    </div>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Business stage</div>
                      {STAGES.map((s, i) => (
                        <div key={i} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, color: INK, transition: "background 0.15s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = BG_TINT}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >{s}</div>
                      ))}
                    </div>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Industry</div>
                      {INDUSTRIES.map((s, i) => (
                        <div key={i} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, color: INK, transition: "background 0.15s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = BG_TINT}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >{s}</div>
                      ))}
                    </div>

                    {/* Meet Nova promo card */}
                    <div style={{ background: `linear-gradient(135deg, ${FOOTER_DARK} 0%, ${TEAL} 100%)`, borderRadius: 16, padding: 24, color: "#fff", position: "relative", overflow: "hidden", boxShadow: "0 0 0 1px rgba(15,149,153,0.25), 0 20px 40px -10px rgba(15,149,153,0.35)" }}>
                      <span style={{ position: "absolute", top: 16, right: 16, background: "#fff", color: TEAL_DARK, fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 999, letterSpacing: "0.08em" }}>NEW</span>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                        <Sparkles size={20} color="#fff" />
                      </div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-0.015em" }}>Meet Nova</h3>
                      <p style={{ margin: "6px 0 14px", fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>The intelligent assistant powering every part of Novala.</p>
                      {NOVA_FEATURES.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 6 }}>
                          <Sparkles size={11} color="#fff" /> <span>{f}</span>
                        </div>
                      ))}
                      <button onClick={() => navigate("/pricing")} style={{ marginTop: 14, background: "#fff", color: TEAL_DARK, border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        Learn more <ArrowRight size={13} strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Plans & pricing */}
            <span onClick={() => navigate("/pricing")} style={navItem}
              onMouseEnter={(e) => e.currentTarget.style.background = BG_TINT}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <Wallet size={15} strokeWidth={2} color={TEAL} />
              Plans & pricing
            </span>

            {/* Learn & support */}
            <div onMouseEnter={() => setSupportOpen(true)} onMouseLeave={() => setSupportOpen(false)} style={{ position: "relative" }}>
              <span style={navItem}>
                <HelpCircle size={15} strokeWidth={2} color={TEAL} />
                Learn & support
                <ChevronDown size={14} style={{ transform: supportOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </span>
              {supportOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, paddingTop: 6 }}>
                  <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 8, boxShadow: "0 20px 40px -16px rgba(0,0,0,0.18)", minWidth: 220 }}>
                    {SUPPORT.map((s, i) => (
                      <div key={i} onClick={() => navigate(s.path)} style={{ padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 14, color: INK, transition: "background 0.15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = BG_TINT}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >{s.label}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span onClick={() => navigate("/login")} style={{ color: INK, fontSize: 14.5, fontWeight: 600, cursor: "pointer", padding: "8px 12px", borderRadius: 8 }}
            onMouseEnter={(e) => e.currentTarget.style.background = BG_TINT}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >Sign in</span>
          <button onClick={() => navigate("/pricing")}
            onMouseEnter={(e) => e.currentTarget.style.background = TEAL_DARK}
            onMouseLeave={(e) => e.currentTarget.style.background = TEAL}
            style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
          >Get started</button>
        </div>
      </div>
    </header>
  );
}
