import React, { useEffect } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { PAYROLL_TIERS } from "../data/plans";

const TEAL = "#0F9599";
const TEAL_DARK = "#0B7377";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const MUTED = "#9AA8A8";
const BORDER = "#E2E8E8";
const BG = "#FFFFFF";
const BG_TINT = "#F9FAFA";
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

export default function ChangePlanModal({ open, currentPayrollId, onChangePlan, onContinueWithout, onClose }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;
  const tiers = Object.values(PAYROLL_TIERS);
  const allSections = Object.keys(tiers[0].sections);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(14,26,26,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: BG, borderRadius: 20, maxWidth: 1100, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 80px -20px rgba(0,0,0,0.45)", fontFamily: FONT }}>
        <header style={{ padding: "20px 32px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <button onClick={onContinueWithout}
            onMouseEnter={(e) => e.currentTarget.style.color = TEAL}
            onMouseLeave={(e) => e.currentTarget.style.color = INK}
            style={{ background: "transparent", color: INK, border: "none", padding: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, transition: "color 0.15s", display: "inline-flex", alignItems: "center", gap: 6 }}>
            Continue without Payroll <ArrowRight size={14} strokeWidth={2.4} />
          </button>
          <button onClick={onClose}
            onMouseEnter={(e) => { e.currentTarget.style.background = BG_TINT; e.currentTarget.style.color = INK; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = SUB; }}
            style={{ background: "transparent", border: "none", color: SUB, padding: 8, borderRadius: 10, cursor: "pointer", display: "flex", transition: "all 0.15s" }} aria-label="Close">
            <X size={22} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ position: "sticky", top: 0, background: BG_TINT, padding: "20px 24px", textAlign: "left", fontSize: 12, fontWeight: 700, color: SUB, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${BORDER}`, width: "28%" }}>Features</th>
                {tiers.map((t) => {
                  const isSelected = t.id === currentPayrollId;
                  return (
                    <th key={t.id} style={{ position: "sticky", top: 0, background: BG_TINT, padding: "20px 16px", textAlign: "left", borderBottom: `1px solid ${BORDER}`, borderLeft: isSelected ? `2px solid ${TEAL}` : "none", borderRight: isSelected ? `2px solid ${TEAL}` : "none", verticalAlign: "top" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: MUTED, textDecoration: "line-through", marginTop: 6 }}>${t.originalPrice}/mo</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: INK }}>${t.monthlyPrice}</span>
                        <span style={{ fontSize: 13, color: SUB }}>/mo</span>
                      </div>
                      <div style={{ fontSize: 12, color: SUB, marginBottom: 12 }}>+ ${t.perEmployee}/employee/mo</div>
                      {isSelected ? (
                        <button disabled style={{ background: BG_TINT, color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "not-allowed", fontFamily: "inherit", width: "100%" }}>Selected</button>
                      ) : (
                        <button onClick={() => onChangePlan(t.id)}
                          onMouseEnter={(e) => e.currentTarget.style.background = TEAL_DARK}
                          onMouseLeave={(e) => e.currentTarget.style.background = TEAL}
                          style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%", transition: "background 0.15s" }}>Change plan</button>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {allSections.map((section) => (
                <React.Fragment key={section}>
                  <tr>
                    <td colSpan={tiers.length + 1} style={{ padding: "20px 24px 10px", fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: "0.1em", textTransform: "uppercase", background: BG_TINT }}>{section}</td>
                  </tr>
                  {tiers[0].sections[section].map(([label], rowIdx) => (
                    <tr key={rowIdx} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "12px 24px", fontSize: 13.5, color: INK }}>{label}</td>
                      {tiers.map((t) => {
                        const isSelected = t.id === currentPayrollId;
                        const included = t.sections[section][rowIdx][1];
                        return (
                          <td key={t.id} style={{ padding: "12px 16px", textAlign: "center", borderLeft: isSelected ? `2px solid ${TEAL}` : "none", borderRight: isSelected ? `2px solid ${TEAL}` : "none" }}>
                            {included ? <Check size={16} strokeWidth={2.5} color={TEAL} /> : <span style={{ color: MUTED, fontSize: 14 }}>-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
