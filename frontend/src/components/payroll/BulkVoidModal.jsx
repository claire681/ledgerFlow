import React, { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const authHeaders = () => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : "",
  };
};

/**
 * BulkVoidModal
 * -------------
 * Modal to void multiple selected paycheques with a single shared reason.
 *
 * Props:
 * - open: bool
 * - onClose: () => void
 * - onDone: (result) => void   called when all requests finish
 * - stubs: [{ id, employee_name, pay_date, net_pay, is_adjustment, status }]
 */
export default function BulkVoidModal({ open, onClose, onDone, stubs }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
      setSubmitting(false);
    }
  }, [open, stubs]);

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

  if (!open || !stubs || stubs.length === 0) return null;

  const eligible = stubs.filter(s => s.status !== "voided");
  const total = stubs.length;
  const skipCount = total - eligible.length;

  const canSubmit = reason.trim().length > 0 && !submitting && eligible.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    const results = { success: 0, failed: 0, errors: [] };
    for (const s of eligible) {
      try {
        const res = await fetch(API_URL + "/api/v1/payroll/paycheques/" + s.id + "/void", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ reason: reason.trim() }),
        });
        if (res.ok) {
          results.success += 1;
        } else {
          results.failed += 1;
          const err = await res.json().catch(() => ({}));
          results.errors.push(`${s.employee_name} (${s.pay_date}): ${err.detail || "HTTP " + res.status}`);
        }
      } catch (e) {
        results.failed += 1;
        results.errors.push(`${s.employee_name}: ${e.message}`);
      }
    }

    setSubmitting(false);
    if (onDone) onDone(results);
    onClose();
  };

  const INK = "#000000";
  const DARK = "#1A2332";
  const LINE = "#D1D5DB";
  const RED = "#DC2626";
  const RED_HOVER = "#B91C1C";
  const RED_BG = "#FEE2E2";
  const AMBER_TINT = "#FEFCE8";
  const AMBER_BORDER = "#FDE68A";
  const AMBER_INK = "#92400E";

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
        style={{
          background: "white",
          width: 520,
          maxWidth: "100%",
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          overflow: "hidden",
          position: "relative",
          fontFamily: "Inter, 'Plus Jakarta Sans', sans-serif",
          color: INK,
          maxHeight: "92vh",
          overflowY: "auto",
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

        <div style={{ padding: "26px 30px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: RED_BG, color: RED,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: 17, fontWeight: 700, color: INK,
                margin: "0 0 4px", letterSpacing: "-0.01em",
              }}>
                Void {eligible.length} paycheque{eligible.length === 1 ? "" : "s"}?
              </h2>
              <div style={{ fontSize: 13, color: DARK, lineHeight: 1.5, fontWeight: 500 }}>
                Each paycheque will be marked voided and YTD balances will be reversed. The audit trail stays intact.
              </div>
            </div>
          </div>

          {skipCount > 0 && (
            <div style={{
              background: AMBER_TINT, border: "1px solid " + AMBER_BORDER,
              borderRadius: 8, padding: "10px 12px", marginBottom: 14,
              fontSize: 12.5, color: AMBER_INK, fontWeight: 700,
            }}>
              {skipCount} already voided paycheque{skipCount === 1 ? "" : "s"} will be skipped.
            </div>
          )}

          <div style={{
            background: "#F9FAFB", border: "1px solid " + LINE,
            borderRadius: 8, padding: "10px 12px", marginBottom: 16,
            maxHeight: 160, overflowY: "auto",
          }}>
            <div style={{
              fontSize: 11, color: DARK, letterSpacing: "0.5px",
              textTransform: "uppercase", fontWeight: 700, marginBottom: 6,
            }}>
              Voiding
            </div>
            {eligible.map(s => (
              <div key={s.id} style={{
                display: "flex", justifyContent: "space-between", gap: 8,
                padding: "3px 0", fontSize: 12.5, color: INK, fontWeight: 500,
              }}>
                <span>{s.employee_name} · {s.pay_date}</span>
                <span style={{ color: DARK, fontWeight: 600 }}>${Number(s.net_pay || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{
              fontSize: 13, fontWeight: 700, color: INK,
              marginBottom: 6, display: "block",
            }}>
              Reason for voiding (applied to all)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="For example: Duplicate pay run entered by mistake"
              style={{
                width: "100%", padding: "10px 12px",
                border: "1px solid " + LINE, borderRadius: 8,
                fontSize: 13.5, fontFamily: "inherit", color: INK,
                background: "white", outline: "none", boxSizing: "border-box",
                fontWeight: 500, resize: "vertical", minHeight: 70, lineHeight: 1.5,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#15A08C";
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
              borderRadius: 8, padding: "10px 12px",
              color: "#991B1B", fontSize: 13, fontWeight: 600,
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{
          padding: "14px 30px 18px", borderTop: "1px solid #E5E7EB",
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
              background: canSubmit ? RED : "#D1D5DB",
              color: "white",
              boxShadow: canSubmit ? "0 1px 2px rgba(0,0,0,0.12)" : "none",
            }}
            onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.background = RED_HOVER; }}
            onMouseLeave={(e) => { if (canSubmit) e.currentTarget.style.background = RED; }}
          >
            {submitting ? "Voiding..." : `Void ${eligible.length}`}
          </button>
        </div>
      </div>
    </div>
  );
}