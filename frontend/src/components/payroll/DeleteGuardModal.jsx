import React, { useEffect } from "react";
import { X, Trash2, RotateCcw } from "lucide-react";

/**
 * DeleteGuardModal
 * ----------------
 * Modal shown when the user clicks Delete on any paycheque row.
 *
 * Paycheques are legally immutable financial records; they cannot be
 * hard-deleted per CRA (Canada), IRS (USA), HMRC (UK), etc. record
 * retention rules. This modal explains that and pushes the user to
 * Void, which is the compliant way to fix a mistake.
 *
 * Props:
 * - open: bool
 * - onClose: () => void
 * - onVoid: () => void   called when user clicks "Void instead"
 * - stub: { id, employee_name, pay_date, net_pay }
 */
export default function DeleteGuardModal({ open, onClose, onVoid, stub }) {
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
  const RED_BG = "#FEE2E2";
  const RED_INK = "#B91C1C";
  const TEAL = "#15A08C";
  const TEAL_DARK = "#0B7377";
  const TEAL_TINT = "#F0FDF9";
  const TEAL_BORDER = "rgba(21, 160, 140, 0.25)";

  const fmt = (n) => {
    const v = Number(n) || 0;
    return v.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        aria-labelledby="del-guard-title"
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
            borderRadius: 6,
          }}
        >
          <X size={18} />
        </button>

        <div style={{ padding: "32px 34px 24px" }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: RED_BG,
            color: RED_INK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Trash2 size={26} strokeWidth={2.5} />
          </div>

          <h2 id="del-guard-title" style={{
            fontSize: 18,
            fontWeight: 700,
            color: INK,
            margin: "0 0 12px",
            letterSpacing: "-0.01em",
            textAlign: "center",
          }}>
            Paycheques can't be deleted
          </h2>

          <div style={{
            fontSize: 14,
            color: DARK,
            lineHeight: 1.6,
            margin: "0 0 20px",
            fontWeight: 500,
            textAlign: "center",
          }}>
            Once a paycheque exists, it must be kept for tax records.
            To fix a mistake, void it instead.
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
              Paycheque
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>
              {stub.employee_name}
            </div>
            <div style={{ fontSize: 12.5, color: DARK, marginTop: 4, fontWeight: 500 }}>
              Pay date {stub.pay_date} · Net ${fmt(stub.net_pay)}
            </div>
          </div>

          <div style={{
            background: TEAL_TINT,
            border: "1px solid " + TEAL_BORDER,
            borderRadius: 8,
            padding: "12px 14px",
          }}>
            <div style={{
              fontSize: 11,
              color: TEAL_DARK,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 6,
            }}>
              What voiding does
            </div>
            <div style={{
              fontSize: 12.5,
              color: DARK,
              lineHeight: 1.55,
              fontWeight: 600,
            }}>
              Voiding reverses the paycheque's amounts and marks it as voided in your records. The audit trail stays intact so you're covered for tax filings and CRA compliance.
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
            onClick={onClose}
            style={{
              fontSize: 13.5,
              padding: "10px 20px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              fontFamily: "inherit",
              border: "1px solid " + LINE,
              background: "white",
              color: INK,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
          >
            Cancel
          </button>
          <button
            onClick={handleVoid}
            style={{
              fontSize: 13.5,
              padding: "10px 20px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              fontFamily: "inherit",
              border: "none",
              background: TEAL,
              color: "white",
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = TEAL_DARK}
            onMouseLeave={(e) => e.currentTarget.style.background = TEAL}
          >
            <RotateCcw size={14} />
            Void instead
          </button>
        </div>
      </div>
    </div>
  );
}