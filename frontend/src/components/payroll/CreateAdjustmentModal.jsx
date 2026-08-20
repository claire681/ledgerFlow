import React, { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const authHeaders = () => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : "",
  };
};

// Simple money formatter
const fmt = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * CreateAdjustmentModal
 * ---------------------
 * Modal used to create an adjustment cheque for an existing pay stub.
 *
 * Props:
 * - open: bool
 * - onClose: () => void
 * - onCreated: (adjustmentResult) => void  called after successful create
 * - originalStub: { id, employee_name, pay_date, net_pay, gross_pay }
 */
export default function CreateAdjustmentModal({ open, onClose, onCreated, originalStub }) {
  const [direction, setDirection] = useState("extra_pay");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset state when modal opens with a new stub
  useEffect(() => {
    if (open) {
      setDirection("extra_pay");
      setAmount("");
      setReason("");
      setError("");
      setSubmitting(false);
    }
  }, [open, originalStub]);

  // Lock body scroll while open + handle Esc
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

  if (!open || !originalStub) return null;

  const amountNum = parseFloat(amount) || 0;
  const canSubmit = amountNum > 0 && reason.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(API_URL + "/api/v1/payroll/paycheques/" + originalStub.id + "/adjust", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          direction,
          gross_amount: amountNum,
          reason: reason.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || "Could not create adjustment (HTTP " + res.status + ")");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      if (onCreated) onCreated(data);
      onClose();
    } catch (e) {
      setError("Network error: " + e.message);
      setSubmitting(false);
    }
  };

  // Colors and tokens
  const INK = "#000000";
  const DARK = "#1A2332";
  const TEAL = "#15A08C";
  const TEAL_DARK = "#0B7377";
  const TEAL_SOFT = "#E1F5EE";
  const LINE = "#D1D5DB";

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
        aria-labelledby="adj-modal-title"
        style={{
          background: "white",
          width: 540,
          maxWidth: "100%",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          overflow: "hidden",
          fontFamily: "Inter, 'Plus Jakarta Sans', sans-serif",
          color: INK,
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "22px 26px 8px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "#FEF3C7", color: "#92400E",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <DollarSign size={20} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 id="adj-modal-title" style={{
                fontSize: 17, fontWeight: 700, color: INK,
                margin: "0 0 4px", letterSpacing: "-0.01em",
              }}>
                Create adjustment cheque
              </h2>
              <div style={{ fontSize: 13, color: DARK, lineHeight: 1.5, fontWeight: 500 }}>
                Correct this pay stub without changing the original.
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: DARK, padding: 4, display: "flex",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Original stub card */}
          <div style={{
            background: "#F9FAFB", border: "1px solid " + LINE,
            borderRadius: 8, padding: "12px 14px", marginBottom: 18,
          }}>
            <div style={{
              fontSize: 11, color: DARK, letterSpacing: "0.5px",
              textTransform: "uppercase", fontWeight: 700, marginBottom: 5,
            }}>
              Correcting
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>
              {originalStub.employee_name}
            </div>
            <div style={{ fontSize: 13, color: DARK, marginTop: 4, fontWeight: 500 }}>
              Pay date {originalStub.pay_date} · Net ${fmt(originalStub.net_pay)}
            </div>
          </div>

          {/* Adjustment type */}
          <div style={{ marginBottom: 15 }}>
            <label style={{
              fontSize: 13, fontWeight: 700, color: INK,
              marginBottom: 8, display: "block",
            }}>
              Adjustment type
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <TypeCard
                selected={direction === "extra_pay"}
                onClick={() => setDirection("extra_pay")}
                title="Extra pay owed"
                desc="Employee is owed more money"
                icon={<TrendingUp size={16} />}
              />
              <TypeCard
                selected={direction === "recover_overpayment"}
                onClick={() => setDirection("recover_overpayment")}
                title="Recover overpayment"
                desc="Employee was overpaid, recover it"
                icon={<TrendingDown size={16} />}
              />
            </div>
          </div>

          {/* Gross amount */}
          <div style={{ marginBottom: 15 }}>
            <label style={{
              fontSize: 13, fontWeight: 700, color: INK,
              marginBottom: 8, display: "block",
            }}>
              Gross amount
            </label>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", color: DARK, fontWeight: 700,
                fontSize: 14, pointerEvents: "none",
              }}>
                $
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                style={{
                  width: "100%", padding: "10px 12px 10px 26px",
                  border: "1px solid " + LINE, borderRadius: 8,
                  fontSize: 13.5, fontFamily: "inherit", color: INK,
                  background: "white", outline: "none", boxSizing: "border-box",
                  fontWeight: 600,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = TEAL;
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(21, 160, 140, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = LINE;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 15 }}>
            <label style={{
              fontSize: 13, fontWeight: 700, color: INK,
              marginBottom: 8, display: "block",
            }}>
              Reason for adjustment
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="For example: Missed overtime hours from July 15"
              style={{
                width: "100%", padding: "10px 12px",
                border: "1px solid " + LINE, borderRadius: 8,
                fontSize: 13.5, fontFamily: "inherit", color: INK,
                background: "white", outline: "none", boxSizing: "border-box",
                fontWeight: 500, resize: "vertical", minHeight: 80, lineHeight: 1.5,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = TEAL;
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(21, 160, 140, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = LINE;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FCA5A5",
              borderRadius: 8, padding: "10px 12px", marginBottom: 10,
              color: "#991B1B", fontSize: 13, fontWeight: 600,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 26px 18px", borderTop: "1px solid #E5E7EB",
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              fontSize: 13.5, padding: "10px 20px", borderRadius: 8,
              cursor: submitting ? "not-allowed" : "pointer", fontWeight: 700,
              fontFamily: "inherit", border: "1px solid " + LINE,
              background: "white", color: INK,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              fontSize: 13.5, padding: "10px 20px", borderRadius: 8,
              cursor: canSubmit ? "pointer" : "not-allowed", fontWeight: 700,
              fontFamily: "inherit", border: "none",
              background: canSubmit ? TEAL : "#D1D5DB",
              color: "white",
            }}
          >
            {submitting ? "Creating..." : "Create adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Radio-card selector
function TypeCard({ selected, onClick, title, desc, icon }) {
  const TEAL = "#15A08C";
  const TEAL_DARK = "#0B7377";
  const TEAL_SOFT = "#E1F5EE";
  const LINE = "#D1D5DB";
  const INK = "#000000";
  const DARK = "#1A2332";

  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        border: selected ? "2px solid " + TEAL : "1.5px solid " + LINE,
        borderRadius: 10,
        padding: selected ? "11px 13px" : "12px 14px",
        cursor: "pointer",
        background: selected ? TEAL_SOFT : "white",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        color: selected ? TEAL_DARK : INK,
      }}>
        {icon}
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</span>
      </div>
      <div style={{
        fontSize: 11.5,
        color: selected ? TEAL_DARK : DARK,
        fontWeight: 500,
        lineHeight: 1.4,
      }}>
        {desc}
      </div>
    </div>
  );
}