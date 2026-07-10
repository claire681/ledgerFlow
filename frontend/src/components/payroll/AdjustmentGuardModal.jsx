import React, { useEffect } from "react";
import { X, AlertTriangle, Mail, Trash2 } from "lucide-react";

// Support email used by the "Contact us" button.
// Change here if the support address changes across the app.
const SUPPORT_EMAIL = "support@getnovala.com";

/**
 * AdjustmentGuardModal
 * --------------------
 * Modal shown when the user clicks Edit on an adjustment cheque row.
 * Adjustment cheques are legally immutable per CRA record-keeping rules,
 * so this modal explains that and offers two paths:
 *   1) Void this adjustment (opens the void flow via onVoid callback)
 *   2) Contact us (opens mailto)
 *
 * Props:
 * - open: bool
 * - onClose: () => void
 * - onVoid: () => void   called when user clicks "Void this adjustment"
 * - stub: { id, employee_name, pay_date, net_pay }  the adjustment cheque
 */
export default function AdjustmentGuardModal({ open, onClose, onVoid, stub }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !stub) return null;

  const INK = "#000000";
  const DARK = "#1A2332";
  const LINE = "#D1D5DB";
  const AMBER_BG = "#FEF3C7";
  const AMBER_INK = "#92400E";
  const AMBER_TINT = "#FEFCE8";
  const AMBER_BORDER = "#FDE68A";
  const DANGER = "#DC2626";
  const DANGER_HOVER = "#B91C1C";

  const fmt = (n) => {
    const v = Number(n) || 0;
    return v.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleContact = () => {
    const subject = "Edit request: adjustment cheque " + (stub.id || "");
    const body = "I need help with adjustment cheque for " + (stub.employee_name || "") +
                 " (pay date " + (stub.pay_date || "") + ").";
    window.location.href = "mailto:" + SUPPORT_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    onClose();
  };

  const handleVoid = () => {
    onClose();
    if (onVoid) onVoid();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adj-guard-title"
        style={{
          background: "white",
          width: 480,
          maxWidth: "100%",
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          overflow: "hidden",
          position: "relative",
          fontFamily: "Inter, 'Plus Jakarta Sans', sans-serif",
          color: INK,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "transparent",
            border: "none",
            color: DARK,
            cursor: "pointer",
            padding: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
          }}
        >
          <X size={18} />
        </button>

        <div style={{ padding: "32px 34px 26px" }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: AMBER_BG,
            color: AMBER_INK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <AlertTriangle size={26} strokeWidth={2.5} />
          </div>

          <h2 id="adj-guard-title" style={{
            fontSize: 18,
            fontWeight: 700,
            color: INK,
            margin: "0 0 12px",
            letterSpacing: "-0.01em",
            textAlign: "center",
          }}>
            Adjustment cheques cannot be edited
          </h2>

          <div style={{
            fontSize: 14,
            color: DARK,
            lineHeight: 1.6,
            margin: "0 0 20px",
            fontWeight: 500,
            textAlign: "center",
          }}>
            Adjustment cheques are permanent for compliance and audit purposes.
          </div>

          <div style={{
            background: "#F9FAFB",
            border: "1px solid " + LINE,
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 18,
          }}>
            <div style={{
              fontSize: 11,
              color: DARK,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 5,
            }}>
              Adjustment cheque
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>
              {stub.employee_name}
            </div>
            <div style={{ fontSize: 12.5, color: DARK, marginTop: 4, fontWeight: 500 }}>
              Pay date {stub.pay_date} · Net ${fmt(stub.net_pay)}
            </div>
          </div>

          <div style={{
            background: AMBER_TINT,
            border: "1px solid " + AMBER_BORDER,
            borderRadius: 8,
            padding: "12px 14px",
          }}>
            <div style={{
              fontSize: 11,
              color: AMBER_INK,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 6,
            }}>
              To fix this
            </div>
            <div style={{ fontSize: 13, color: DARK, lineHeight: 1.55, fontWeight: 600, display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ color: AMBER_INK, fontWeight: 700 }}>1.</span>
              <span>Void this adjustment cheque</span>
            </div>
            <div style={{ fontSize: 13, color: DARK, lineHeight: 1.55, fontWeight: 600, display: "flex", gap: 8 }}>
              <span style={{ color: AMBER_INK, fontWeight: 700 }}>2.</span>
              <span>Create a new adjustment on the original pay stub</span>
            </div>
          </div>
        </div>

        <div style={{
          padding: "16px 34px 22px",
          borderTop: "1px solid #E5E7EB",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}>
          <button
            onClick={handleContact}
            style={{
              fontSize: 13.5,
              padding: "10px 18px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              fontFamily: "inherit",
              border: "1px solid " + LINE,
              background: "white",
              color: INK,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
          >
            <Mail size={14} />
            Contact us
          </button>
          <button
            onClick={handleVoid}
            style={{
              fontSize: 13.5,
              padding: "10px 18px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              fontFamily: "inherit",
              border: "none",
              background: DANGER,
              color: "white",
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = DANGER_HOVER}
            onMouseLeave={(e) => e.currentTarget.style.background = DANGER}
          >
            <Trash2 size={14} />
            Void this adjustment
          </button>
        </div>
      </div>
    </div>
  );
}