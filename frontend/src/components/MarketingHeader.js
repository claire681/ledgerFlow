import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";

const BRAND = "#0F9599";
const NIGHT = "#0E3B3A";
const MINT = "#2FE3BE";
const TEXT_INK = "#0E2A2A";
const TEXT_DARK = "#5A6970";
const TEXT_DIM = "rgba(240, 250, 248, 0.65)";
const TEXT_TERTIARY = "#9CA3AF";
const BG_SOFT = "#F7F9F9";
const BORDER = "#E5E7EB";
const BORDER_ON_DARK = "rgba(255, 255, 255, 0.12)";
const FONT_STACK = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

const CONTAINER = { maxWidth: 1240, margin: "0 auto", padding: "0 28px" };

const MENU_CONTENT = {
  product: {
    columns: [
      { title: "Manage your accounting", items: ["Bookkeeping", "Get insights", "Plan ahead", "Work with an expert", "Accounting overview"] },
      { title: "Manage your team", items: ["Run payroll", "Track time", "Offer benefits", "Manage HR", "Team overview"] },
      { title: "Manage your money", items: ["Get paid and pay bills", "Manage banking", "Direct deposit", "Money overview"] },
    ],
    promo: { title: "Not sure what you need?", body: "Get a recommendation tailored to your business.", cta: "Help me decide" },
    bottomBar: ["See all products", "Try a demo"],
  },
  features: {
    columns: [
      { title: "Pay and money", items: ["Payroll", "Direct deposit", "Invoicing", "Expense tracking", "Reports", "Tax deductions"] },
      { title: "Time and team", items: ["Time tracking", "Clock in and out", "Clock-out reminders", "Scheduling", "Employee portal", "Mobile app"] },
      { title: "Compliance", items: ["Year end tax forms", "Pay schedules", "Deductions and contributions", "Multi country payroll"] },
    ],
    promo: { title: "Hours that fill themselves in", body: "Your team clocks in, hours flow to payroll, and you stay in control.", cta: "See how it works" },
    bottomBar: ["See all features"],
  },
  businessTypes: {
    columns: [
      { title: "Industry", items: ["Nonprofit", "Construction", "Professional services", "Retail", "Restaurants", "Healthcare", "See all industries"] },
      { title: "Stage", items: ["New business", "Small business", "Mid sized business", "Self employed"] },
    ],
    promo: { title: "Not sure what you need?", body: "Get a recommendation tailored to your business.", cta: "Help me decide" },
    bottomBar: ["See all products", "Try a demo"],
  },
  resources: {
    columns: [
      { title: "Why Novala", items: ["Explore features", "Compare Novala", "Add apps and integrations"] },
      { title: "Learn", items: ["Blog", "Guides", "Tutorials", "See more"] },
      { title: "Free tools", items: ["Invoice generator", "Paycheque calculator", "Timesheet calculator", "Invoice templates"] },
    ],
    promo: { title: "Need a hand?", body: "Visit the help centre or contact our team.", cta: "Get support" },
    bottomBar: ["Help and support", "Contact us"],
  },
};

const MENU_ROUTES = {
  "Employee portal": "/employee-portal",
};

function MegaMenuPanel({ content, onItemClick }) {
  const cols = content.columns;
  const colCount = cols.length;
  return (
    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#FFFFFF", boxShadow: "0 16px 30px rgba(0,0,0,0.15)", borderTop: "0.5px solid rgba(0,0,0,0.06)", zIndex: 100 }}>
      <div style={{ ...CONTAINER, padding: "32px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(" + colCount + ", 1fr) 320px", gap: 32 }}>
          {cols.map((col, i) => (
            <div key={i}>
              <h3 style={{ fontSize: 11.5, fontWeight: 700, color: TEXT_TERTIARY, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px" }}>{col.title}</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {col.items.map((item, j) => (
                  <li key={j} onClick={() => onItemClick && onItemClick(item)} style={{ fontSize: 13.5, fontWeight: 500, color: TEXT_INK, cursor: "pointer", padding: "5px 0", letterSpacing: "-0.005em" }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          <div style={{ background: BG_SOFT, border: "0.5px solid " + BORDER, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: TEXT_INK, marginBottom: 6, letterSpacing: "-0.01em" }}>{content.promo.title}</div>
            <div style={{ fontSize: 13, color: TEXT_DARK, lineHeight: 1.55, marginBottom: 14 }}>{content.promo.body}</div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: BRAND, cursor: "pointer" }}>
              {content.promo.cta} <ChevronRight size={13} />
            </span>
          </div>
        </div>
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "0.5px solid " + BORDER, display: "flex", gap: 24 }}>
          {content.bottomBar.map((item, i) => (
            <span key={i} style={{ fontSize: 12.5, fontWeight: 600, color: BRAND, cursor: "pointer" }}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MarketingHeader({ onFeaturesClick }) {
  const navigate = useNavigate();
  const handleMenuItemClick = (item) => {
    if (MENU_ROUTES[item]) navigate(MENU_ROUTES[item]);
  };
  const [openPanel, setOpenPanel] = useState(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setOpenPanel(null);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setOpenPanel(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggle = (panel) => {
    if (panel === "features" && onFeaturesClick) {
      onFeaturesClick();
      setOpenPanel(null);
      return;
    }
    setOpenPanel(prev => (prev === panel ? null : panel));
  };

  const navItems = [
    { key: "product", label: "Product", hasPanel: true },
    { key: "features", label: "Features", hasPanel: true },
    { key: "businessTypes", label: "Business types", hasPanel: true },
    { key: "pricing", label: "Pricing", hasPanel: false },
    { key: "resources", label: "Resources", hasPanel: true },
  ];

  return (
    <header ref={headerRef} style={{ background: NIGHT, borderBottom: "0.5px solid " + BORDER_ON_DARK, position: "relative", zIndex: 100 }}>
      <div style={{ padding: "16px 0" }}>
        <div style={{ ...CONTAINER, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <img src="/logo512.png" width="28" height="28" alt="Novala" style={{ borderRadius: 7, display: "block" }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.01em" }}>Novala</span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {navItems.map(item => {
              const isOpen = openPanel === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => item.hasPanel ? toggle(item.key) : navigate("/pricing")}
                  onKeyDown={(e) => {
                    if (item.hasPanel && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      toggle(item.key);
                    }
                  }}
                  style={{ background: "transparent", border: "none", padding: "8px 0", fontSize: 13.5, fontWeight: 600, color: isOpen ? "#FFFFFF" : TEXT_DIM, cursor: "pointer", fontFamily: FONT_STACK, display: "inline-flex", alignItems: "center", gap: 4 }}
                  aria-expanded={item.hasPanel ? isOpen : undefined}
                >
                  {item.label}
                  {item.hasPanel && <ChevronDown size={13} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />}
                </button>
              );
            })}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_DIM, cursor: "pointer" }}>Talk to sales</span>
            <span onClick={() => navigate("/login")} style={{ fontSize: 13, fontWeight: 600, color: TEXT_DIM, cursor: "pointer" }}>Sign in</span>
            <button onClick={() => navigate("/pricing")} style={{ background: MINT, color: NIGHT, fontSize: 13.5, fontWeight: 700, padding: "9px 18px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: FONT_STACK }}>
              Get started
            </button>
          </div>
        </div>
      </div>
      {openPanel && MENU_CONTENT[openPanel] && (
        <MegaMenuPanel content={MENU_CONTENT[openPanel]} onItemClick={handleMenuItemClick} />
      )}
    </header>
  );
}
