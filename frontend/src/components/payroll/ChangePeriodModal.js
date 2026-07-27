import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, AlertTriangle } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  ink: "#0E1A1A", muted: "#12262B", line: "#E7EAF0", page: "#F4F6F8",
  brand: "#15A08C", brandDark: "#0F6E56", brandBg: "#E1F5EE",
  amberBg: "#FEF6E7", amberBorder: "#F4E0B0",
  danger: "#A32D2D",
};

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

export default function ChangePeriodModal(props) {
  const { payRun, isOpen, onCancel, onSaved } = props;
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [payDate, setPayDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(function() {
    if (isOpen && payRun) {
      setStart(payRun.pay_period_start || "");
      setEnd(payRun.pay_period_end || "");
      setPayDate(payRun.pay_date || "");
      setError("");
    }
  }, [isOpen, payRun]);

  if (!isOpen || !payRun) return null;

  async function save() {
    setError("");
    if (!start || !end || !payDate) {
      setError("All three dates are required.");
      return;
    }
    if (end < start) {
      setError("End date must be on or after start date.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(API + "/api/v1/payroll/pay-runs/" + payRun.id + "/period", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          pay_period_start: start,
          pay_period_end: end,
          pay_date: payDate,
        }),
      });
      if (!r.ok) {
        setError("Save failed. Please try again.");
        setSaving(false);
        return;
      }
      const data = await r.json();
      setSaving(false);
      onSaved && onSaved(data);
    } catch (e) {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return createPortal(
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(14,26,26,0.55)", zIndex: 10001, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}>
      <div style={{ background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 14, maxWidth: 520, width: "100%", boxShadow: "0 20px 40px rgba(14,26,26,0.15)", overflow: "hidden", fontFamily: FONT }}>

        <div style={{ padding: "22px 24px", borderBottom: "1px solid " + C.line }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.brandBg, color: C.brandDark, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Calendar size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>Change pay period</div>
              <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, marginTop: 2 }}>Override auto-filled dates from schedule</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "22px 24px" }}>

          <div style={{ padding: "12px 14px", background: C.amberBg, border: "1px solid " + C.amberBorder, borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20 }}>
            <AlertTriangle size={16} color={C.ink} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, fontSize: 12.5, color: C.ink, fontWeight: 500, lineHeight: 1.5 }}>
              You are overriding the auto-filled period from your pay schedule. This may affect stat holiday detection, tax calculations, and pay stub display. Use this for off-cycle or corrected pay runs.
            </div>
          </div>

          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Period start</label>
          <input type="date" value={start} onChange={function(e) { setStart(e.target.value); }}
            style={{ width: "100%", boxSizing: "border-box", height: 44, padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, fontSize: 14, color: C.ink, fontFamily: FONT, fontWeight: 500, outline: 0, background: "#FFFFFF", marginBottom: 16 }} />

          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Period end</label>
          <input type="date" value={end} onChange={function(e) { setEnd(e.target.value); }}
            style={{ width: "100%", boxSizing: "border-box", height: 44, padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, fontSize: 14, color: C.ink, fontFamily: FONT, fontWeight: 500, outline: 0, background: "#FFFFFF", marginBottom: 16 }} />

          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Pay date</label>
          <input type="date" value={payDate} onChange={function(e) { setPayDate(e.target.value); }}
            style={{ width: "100%", boxSizing: "border-box", height: 44, padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, fontSize: 14, color: C.ink, fontFamily: FONT, fontWeight: 500, outline: 0, background: "#FFFFFF" }} />

          {error && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: C.danger, fontWeight: 700 }}>{error}</div>
          )}

          <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onCancel} disabled={saving}
              style={{ height: 38, padding: "0 18px", background: "#FFFFFF", color: C.ink, border: "1px solid " + C.line, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: FONT }}>
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              style={{ height: 38, padding: "0 22px", background: saving ? "#C3CBD6" : C.ink, color: "#FFFFFF", border: 0, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: FONT }}>
              {saving ? "Saving..." : "Save period"}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}