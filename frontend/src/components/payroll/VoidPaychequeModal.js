import React, { useState, useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { formatCurrency, formatDate, employeeNameFromPaycheque } from "../../utils/paychequeStatus";

const BORDER = "#E5E7EB";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";

export default function VoidPaychequeModal({ open, onClose, paycheque, onConfirm }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) { setReason(""); setError(null); setSubmitting(false); }
  }, [open]);

  if (!open || !paycheque) return null;

  const name = employeeNameFromPaycheque(paycheque);
  const grossLabel = formatCurrency(paycheque.total_pay || paycheque.gross_pay, paycheque.currency);
  const netLabel = formatCurrency(paycheque.net_pay, paycheque.currency);
  const dateLabel = formatDate(paycheque.pay_date);
  const chequeLabel = paycheque.cheque_number ? "Cheque #" + paycheque.cheque_number : null;

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason);
      onClose();
    } catch (e) {
      setError(e.message || "Could not void paycheque");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "inherit" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", width: 480, maxWidth: "100%", borderRadius: 10 }}>
        <div style={{ padding: "18px 22px 8px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#FEF3C7", color: "#92400E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <RotateCcw size={19} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>Void this paycheque?</h2>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 3 }}>This will reverse the ledger entries and tax accruals. It can't be undone.</div>
            </div>
          </div>

          <div style={{ background: "#F9FAFB", border: "0.5px solid " + BORDER, borderRadius: 8, padding: "11px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>Paycheque</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{name}</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>
              {dateLabel}
              {grossLabel && (" · " + grossLabel + " gross")}
              {netLabel && (" · " + netLabel + " net")}
              {chequeLabel && (" · " + chequeLabel)}
            </div>
          </div>

          <div style={{ background: "#FEF3C7", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#92400E", fontWeight: 500, marginBottom: 4 }}>Voiding will:</div>
            <div style={{ fontSize: 11, color: "#92400E", lineHeight: 1.6 }}>
              • Create reversing entries in your general ledger<br />
              • Reverse CPP, EI, and federal income tax accruals<br />
              • Mark the paycheque as voided, leaving the row visible for audit
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: TEXT_SECONDARY, display: "block", marginBottom: 4 }}>Reason (recommended, recorded in audit trail)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Cheque issued in error, employee was not on this run"
              rows={2}
              style={{ width: "100%", padding: "7px 9px", borderRadius: 5, border: "0.5px solid " + BORDER, fontSize: 12, fontFamily: "inherit", color: TEXT_PRIMARY, boxSizing: "border-box", resize: "vertical" }}
            />
          </div>

          {error && (
            <div style={{ marginTop: 10, padding: "8px 10px", background: "#FEE2E2", color: "#991B1B", borderRadius: 6, fontSize: 12 }}>{error}</div>
          )}
        </div>

        <div style={{ padding: "12px 22px 16px", borderTop: "0.5px solid #F3F4F6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} disabled={submitting} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 5, background: "white", color: TEXT_PRIMARY, border: "0.5px solid " + BORDER, cursor: submitting ? "wait" : "pointer", fontWeight: 500, fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleConfirm} disabled={submitting} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 5, background: "#B45309", color: "white", border: "none", cursor: submitting ? "wait" : "pointer", fontWeight: 500, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <RotateCcw size={13} />
            {submitting ? "Voiding..." : "Void paycheque"}
          </button>
        </div>
      </div>
    </div>
  );
}
