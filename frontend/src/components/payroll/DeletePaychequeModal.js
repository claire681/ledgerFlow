import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { formatCurrency, formatDate, employeeNameFromPaycheque } from "../../utils/paychequeStatus";

const BORDER = "#E5E7EB";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";

export default function DeletePaychequeModal({ open, onClose, paycheque, onConfirm }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) { setError(null); setSubmitting(false); }
  }, [open]);

  if (!open || !paycheque) return null;

  const name = employeeNameFromPaycheque(paycheque);
  const blocked = !!paycheque.filed_or_remitted;
  const grossLabel = formatCurrency(paycheque.total_pay || paycheque.gross_pay, paycheque.currency);
  const netLabel = formatCurrency(paycheque.net_pay, paycheque.currency);

  const handleConfirm = async () => {
    if (blocked) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e.message || "Could not delete paycheque");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "inherit" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", width: 480, maxWidth: "100%", borderRadius: 10 }}>
        <div style={{ padding: "18px 22px 8px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#FEE2E2", color: "#991B1B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trash2 size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>
                {blocked ? "This paycheque can't be deleted" : "Delete this paycheque?"}
              </h2>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 3 }}>
                {blocked
                  ? "The pay run has been filed or remitted. Use Void instead to leave a proper audit trail."
                  : "This permanently removes the paycheque. The pay run can still be re-issued."}
              </div>
            </div>
          </div>

          <div style={{ background: "#F9FAFB", border: "0.5px solid " + BORDER, borderRadius: 8, padding: "11px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>Paycheque</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{name}</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>
              {formatDate(paycheque.pay_date)}
              {grossLabel && (" · " + grossLabel + " gross")}
              {netLabel && (" · " + netLabel + " net")}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 10, padding: "8px 10px", background: "#FEE2E2", color: "#991B1B", borderRadius: 6, fontSize: 12 }}>{error}</div>
          )}
        </div>

        <div style={{ padding: "12px 22px 16px", borderTop: "0.5px solid #F3F4F6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} disabled={submitting} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 5, background: "white", color: TEXT_PRIMARY, border: "0.5px solid " + BORDER, cursor: submitting ? "wait" : "pointer", fontWeight: 500, fontFamily: "inherit" }}>
            {blocked ? "Close" : "Cancel"}
          </button>
          {!blocked && (
            <button onClick={handleConfirm} disabled={submitting} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 5, background: "#DC2626", color: "white", border: "none", cursor: submitting ? "wait" : "pointer", fontWeight: 500, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Trash2 size={13} />
              {submitting ? "Deleting..." : "Delete paycheque"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
