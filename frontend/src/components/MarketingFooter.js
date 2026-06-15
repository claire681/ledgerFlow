import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Globe, Check } from "lucide-react";

const BRAND = "#0F9599";
const NIGHT = "#0E3B3A";
const TEXT_INK = "#0E2A2A";
const TEXT_ON_DARK = "rgba(240, 250, 248, 0.85)";
const TEXT_DIM_ON_DARK = "rgba(240, 250, 248, 0.6)";
const BORDER_ON_DARK = "rgba(255, 255, 255, 0.12)";
const FONT_STACK = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

const CONTAINER = { maxWidth: 1240, margin: "0 auto", padding: "0 28px" };

const COUNTRIES = [
  { code: "en-CA", label: "Canada (English)", iso: "ca" },
  { code: "fr-CA", label: "Canada (Français)", iso: "ca" },
  { code: "en-US", label: "United States", iso: "us" },
  { code: "en-GB", label: "United Kingdom", iso: "gb" },
  { code: "en-AU", label: "Australia", iso: "au" },
  { code: "other", label: "Other countries", iso: null },
];

function CountrySelector() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => {
    try { return localStorage.getItem("novala_locale") || "en-CA"; }
    catch (e) { return "en-CA"; }
  });
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const current = COUNTRIES.find(c => c.code === selected) || COUNTRIES[0];

  const handleSelect = (code) => {
    setSelected(code);
    try { localStorage.setItem("novala_locale", code); } catch (e) {}
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontSize: 12, color: TEXT_DIM_ON_DARK, background: "transparent",
          padding: "7px 12px", border: "0.5px solid " + BORDER_ON_DARK,
          borderRadius: 6, cursor: "pointer", fontFamily: FONT_STACK, fontWeight: 500,
        }}
      >
        {current.iso ? (
          <img src={"https://flagcdn.com/16x12/" + current.iso + ".png"} width="16" height="12" alt="" style={{ display: "block", borderRadius: 2 }} />
        ) : (
          <Globe size={13} />
        )}
        <span>{current.label}</span>
        <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", bottom: "100%", right: 0, marginBottom: 8,
          background: "#FFFFFF", borderRadius: 10,
          boxShadow: "0 14px 30px rgba(0,0,0,0.28)",
          overflow: "hidden", minWidth: 220, zIndex: 50,
        }}>
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              onClick={() => handleSelect(c.code)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 14px",
                background: selected === c.code ? "rgba(15, 149, 153, 0.08)" : "transparent",
                color: TEXT_INK, fontSize: 13,
                fontWeight: selected === c.code ? 700 : 500,
                border: "none", cursor: "pointer", textAlign: "left", fontFamily: FONT_STACK,
              }}
            >
              {c.iso ? (
                <img src={"https://flagcdn.com/16x12/" + c.iso + ".png"} width="16" height="12" alt="" style={{ display: "block", borderRadius: 2, flexShrink: 0 }} />
              ) : (
                <Globe size={14} color="#5A6970" />
              )}
              <span style={{ flex: 1 }}>{c.label}</span>
              {selected === c.code && <Check size={14} color={BRAND} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const FOOTER_COLUMNS = [
  { h: "Product", links: ["Pricing", "Payroll", "Time tracking", "Employee app"] },
  { h: "Solutions", links: ["For owners", "For teams", "Multi country"] },
  { h: "Resources", links: ["Help center", "Knowledge base", "Status", "Changelog"] },
  { h: "Company", links: ["About", "Contact", "Terms", "Privacy"] },
];

export default function MarketingFooter() {
  return (
    <footer style={{ background: NIGHT, color: TEXT_ON_DARK, padding: "60px 0 32px", borderTop: "0.5px solid " + BORDER_ON_DARK, fontFamily: FONT_STACK }}>
      <div style={CONTAINER}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <img src="/logo512.png" width="28" height="28" alt="Novala" style={{ borderRadius: 7, display: "block" }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>Novala</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(240, 250, 248, 0.6)", lineHeight: 1.6, margin: 0, maxWidth: 280 }}>
              Hours in, pay out. The team app that fills payroll in for you.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 14 }}>{col.h}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                {col.links.map(l => (
                  <li key={l} style={{ fontSize: 13, color: "rgba(240, 250, 248, 0.6)", cursor: "pointer" }}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "0.5px solid " + BORDER_ON_DARK, paddingTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontSize: 12, color: "rgba(240, 250, 248, 0.5)" }}>(c) 2026 Novala. All rights reserved.</span>
          <CountrySelector />
        </div>
      </div>
    </footer>
  );
}
