import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, PlusCircle, Check, X } from "lucide-react";

const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  ink: "#0E1A1A", muted: "#12262B", line: "#E7EAF0", page: "#F4F6F8",
  brand: "#15A08C", brandDark: "#0F6E56", brandBg: "#E1F5EE",
  danger: "#A32D2D", dangerBg: "#FBEAEA", dangerBorder: "#F5C4C4",
};

function money(n) {
  if (n == null || isNaN(n)) return "$0.00";
  var parts = Number(n).toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "$" + parts.join(".");
}

function initials(first, last) {
  var f = (first || "").trim().charAt(0).toUpperCase();
  var l = (last || "").trim().charAt(0).toUpperCase();
  return (f + l) || "?";
}

function shell(inner) {
  return createPortal(
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(14,26,26,0.55)", zIndex: 10000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}>
      <div style={{ background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 14, maxWidth: 520, width: "100%", boxShadow: "0 20px 40px rgba(14,26,26,0.15)", overflow: "hidden", fontFamily: FONT }}>
        {inner}
      </div>
    </div>,
    document.body
  );
}

// ===================================================================
// 1. Adjust amount modal
// ===================================================================
export function AdjustStatPayModal(props) {
  const { emp, holiday, isOpen, onCancel, onSave } = props;
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(function() {
    if (isOpen && emp) {
      setAmount(emp.stat_pay_amount != null ? Number(emp.stat_pay_amount).toFixed(2) : "0.00");
      setReason("");
    }
  }, [isOpen, emp]);

  if (!isOpen || !emp) return null;

  const esaMin = emp.adw != null ? Number(emp.adw) : 0;
  const entered = parseFloat(amount) || 0;
  const belowESA = entered < esaMin;
  const hourly = emp.hourly_rate ? Number(emp.hourly_rate) : 22;

  return shell(
    <div>
      <div style={{ padding: "22px 24px", borderBottom: "1px solid " + C.line }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: C.ink, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            {initials(emp.first_name, emp.last_name)}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>
              Adjust stat pay for {emp.first_name} {emp.last_name}
            </div>
            <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, marginTop: 2 }}>
              {holiday.name} \u2014 {formatDate(holiday.date)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "22px 24px" }}>
        <div style={{ padding: "14px 16px", background: C.page, borderRadius: 10, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: C.ink, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>Alberta ESA minimum</div>
              <div style={{ fontSize: 12, color: C.ink, fontWeight: 500, marginTop: 3 }}>Based on ADW of {money(esaMin)} (last 4 weeks)</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{money(esaMin)}</div>
          </div>
        </div>

        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Custom stat pay amount</label>
        <div style={{ display: "flex", alignItems: "center", height: 48, padding: "0 16px", border: "1px solid " + C.line, borderRadius: 10, marginBottom: 16, background: "#FFFFFF" }}>
          <span style={{ fontSize: 15, color: C.ink, fontWeight: 700, marginRight: 6 }}>$</span>
          <input value={amount} onChange={function(e) { setAmount(e.target.value); }} inputMode="decimal"
            style={{ border: 0, outline: 0, fontSize: 15, color: C.ink, flex: 1, fontFamily: FONT, fontWeight: 700, fontVariantNumeric: "tabular-nums", background: "transparent" }} />
          <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 500 }}>CAD</span>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button onClick={function() { setAmount(hourly.toFixed(2)); }}
            style={{ flex: 1, height: 34, background: "#FFFFFF", color: C.ink, border: "1px solid " + C.line, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
            1 hour ({money(hourly)})
          </button>
          <button onClick={function() { setAmount((esaMin / 2).toFixed(2)); }}
            style={{ flex: 1, height: 34, background: "#FFFFFF", color: C.ink, border: "1px solid " + C.line, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
            Half day ({money(esaMin / 2)})
          </button>
          <button onClick={function() { setAmount(esaMin.toFixed(2)); }}
            style={{ flex: 1, height: 34, background: "#FFFFFF", color: C.ink, border: "1px solid " + C.line, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
            Full ADW ({money(esaMin)})
          </button>
        </div>

        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Reason (optional)</label>
        <textarea value={reason} onChange={function(e) { setReason(e.target.value); }}
          placeholder="e.g., Employee worked only 1 hour on the holiday"
          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1px solid " + C.line, borderRadius: 10, fontSize: 13, color: C.ink, fontFamily: FONT, resize: "vertical", minHeight: 60, outline: 0, background: "#FFFFFF" }} />

        {belowESA && entered >= 0 && (
          <div style={{ marginTop: 16, padding: "12px 14px", background: C.dangerBg, border: "1px solid " + C.dangerBorder, borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertTriangle size={16} color={C.danger} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, fontSize: 12.5, color: C.ink, fontWeight: 500, lineHeight: 1.5 }}>
              <strong style={{ color: C.danger }}>Below Alberta ESA minimum.</strong> {money(entered)} is {money(esaMin - entered)} less than what Alberta ESA requires. You will be asked to confirm before continuing.
            </div>
          </div>
        )}

        <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel}
            style={{ height: 38, padding: "0 18px", background: "#FFFFFF", color: C.ink, border: "1px solid " + C.line, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
            Cancel
          </button>
          <button onClick={function() { onSave({ stat_pay_amount: entered, eligible: true, reason: reason, method_applied: emp.method_applied }); }}
            style={{ height: 38, padding: "0 22px", background: C.ink, color: "#FFFFFF", border: 0, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
            Save {money(entered)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// 2. Mark as not eligible modal (destructive override)
// ===================================================================
export function MarkNotEligibleModal(props) {
  const { emp, holiday, isOpen, onCancel, onConfirm } = props;
  const [reason, setReason] = useState("");
  const [ack, setAck] = useState(false);

  useEffect(function() {
    if (isOpen) { setReason(""); setAck(false); }
  }, [isOpen]);

  if (!isOpen || !emp) return null;

  const checks = emp.checks || {};

  return shell(
    <div>
      <div style={{ padding: "22px 24px", borderBottom: "1px solid " + C.line }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: C.dangerBg, color: C.danger, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>
              Mark {emp.first_name} as not eligible?
            </div>
            <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, marginTop: 2 }}>
              {holiday.name} \u2014 {formatDate(holiday.date)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "22px 24px" }}>
        <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500, lineHeight: 1.6, marginBottom: 16 }}>
          Novala determined {emp.first_name} <strong>IS eligible</strong> based on Alberta ESA rules. Overriding this means they'll receive <strong>$0.00</strong> in stat pay for {holiday.name}.
        </div>

        <div style={{ padding: "14px 16px", background: C.page, borderRadius: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: C.ink, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>Novala's eligibility check</div>
          <div style={{ display: "grid", gap: 6 }}>
            {checks.employed_30_days && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.ink, fontWeight: 500 }}>
                <Check size={14} strokeWidth={2.5} color={C.brandDark} />
                Employed {checks.employed_30_days.days_employed || "-"} days
              </div>
            )}
            {checks.worked_5_of_9 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.ink, fontWeight: 500 }}>
                <Check size={14} strokeWidth={2.5} color={C.brandDark} />
                Worked 5 of 9 workdays before
              </div>
            )}
            {checks.worked_before_after && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.ink, fontWeight: 500 }}>
                <Check size={14} strokeWidth={2.5} color={C.brandDark} />
                Worked day before and after
              </div>
            )}
          </div>
        </div>

        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
          Reason for override <span style={{ color: C.danger }}>*</span>
        </label>
        <textarea required value={reason} onChange={function(e) { setReason(e.target.value); }}
          placeholder="e.g., Employee did not work June 30, called in without approval"
          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1px solid " + C.line, borderRadius: 10, fontSize: 13, color: C.ink, fontFamily: FONT, resize: "vertical", minHeight: 70, outline: 0, background: "#FFFFFF" }} />
        <div style={{ fontSize: 12, color: C.ink, fontWeight: 500, marginTop: 6, lineHeight: 1.5 }}>
          This reason will be logged to your audit trail to protect you in case of an employee dispute.
        </div>

        <div onClick={function() { setAck(!ack); }} style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "flex-start", padding: 12, background: "#FFFFFF", border: "1.5px solid " + C.dangerBorder, borderRadius: 10, cursor: "pointer" }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: ack ? C.danger : "#FFFFFF", border: ack ? "0" : "1.5px solid " + C.line, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            {ack && <Check size={12} strokeWidth={3.5} color="#FFFFFF" />}
          </div>
          <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 500, lineHeight: 1.5 }}>
            I understand that Novala determined {emp.first_name} is eligible under Alberta ESA and I am overriding this decision.
          </div>
        </div>

        <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel}
            style={{ height: 38, padding: "0 18px", background: "#FFFFFF", color: C.ink, border: "1px solid " + C.line, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
            Cancel
          </button>
          <button
            disabled={!ack || !reason.trim()}
            onClick={function() { onConfirm({ eligible: false, stat_pay_amount: 0, reason: reason }); }}
            style={{ height: 38, padding: "0 22px", background: (!ack || !reason.trim()) ? "#C3CBD6" : C.danger, color: "#FFFFFF", border: 0, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: (!ack || !reason.trim()) ? "not-allowed" : "pointer", fontFamily: FONT }}>
            Confirm \u2014 no stat pay
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// 3. Override - mark as eligible (positive override)
// ===================================================================
export function OverrideEligibleModal(props) {
  const { emp, holiday, isOpen, onCancel, onConfirm } = props;
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(function() {
    if (isOpen && emp) {
      // Suggest ADW if computable, else hourly_rate * 8, else 0
      var suggested = 0;
      if (emp.adw != null && Number(emp.adw) > 0) suggested = Number(emp.adw);
      else if (emp.hourly_rate) suggested = Number(emp.hourly_rate) * 8;
      setAmount(suggested.toFixed(2));
      setReason("");
    }
  }, [isOpen, emp]);

  if (!isOpen || !emp) return null;

  const entered = parseFloat(amount) || 0;

  return shell(
    <div>
      <div style={{ padding: "22px 24px", borderBottom: "1px solid " + C.line }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: C.brandBg, color: C.brandDark, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <PlusCircle size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>
              Pay {emp.first_name} stat pay anyway?
            </div>
            <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, marginTop: 2 }}>
              {holiday.name} \u2014 {formatDate(holiday.date)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "22px 24px" }}>
        <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500, lineHeight: 1.6, marginBottom: 16 }}>
          Novala determined {emp.first_name} is <strong>NOT eligible</strong> ({emp.ineligibility_reason || "does not meet Alberta ESA rules"}). You can still choose to pay them \u2014 you're paying MORE than Alberta ESA requires, which is always legal.
        </div>

        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Amount to pay</label>
        <div style={{ display: "flex", alignItems: "center", height: 48, padding: "0 16px", border: "1px solid " + C.line, borderRadius: 10, marginBottom: 12, background: "#FFFFFF" }}>
          <span style={{ fontSize: 15, color: C.ink, fontWeight: 700, marginRight: 6 }}>$</span>
          <input value={amount} onChange={function(e) { setAmount(e.target.value); }} inputMode="decimal"
            style={{ border: 0, outline: 0, fontSize: 15, color: C.ink, flex: 1, fontFamily: FONT, fontWeight: 700, fontVariantNumeric: "tabular-nums", background: "transparent" }} />
          <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 500 }}>CAD</span>
        </div>
        <div style={{ fontSize: 12, color: C.ink, fontWeight: 500, marginBottom: 20, lineHeight: 1.5 }}>
          Suggested: {money(entered)} (typical daily wage estimate).
        </div>

        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Reason (optional)</label>
        <textarea value={reason} onChange={function(e) { setReason(e.target.value); }}
          placeholder="e.g., New hire goodwill bonus"
          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1px solid " + C.line, borderRadius: 10, fontSize: 13, color: C.ink, fontFamily: FONT, resize: "vertical", minHeight: 60, outline: 0, background: "#FFFFFF" }} />

        <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel}
            style={{ height: 38, padding: "0 18px", background: "#FFFFFF", color: C.ink, border: "1px solid " + C.line, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
            Cancel
          </button>
          <button onClick={function() { onConfirm({ eligible: true, stat_pay_amount: entered, reason: reason }); }}
            style={{ height: 38, padding: "0 22px", background: C.ink, color: "#FFFFFF", border: 0, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
            Confirm \u2014 pay {money(entered)}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso) {
  try {
    var d = new Date(iso + "T00:00:00");
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  } catch (e) { return iso; }
}