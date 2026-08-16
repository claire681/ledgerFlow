import React, { useEffect, useState } from "react";
import { MessageSquare, FileText, CreditCard, Lock } from "lucide-react";
import EditModal from "./EditModal";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const C = { ink: "#0E1A1A", muted: "#12262B", line: "#E7EAF0", brand: "#15A08C", brandDark: "#0F6E56", brandBg: "#E1F5EE", page: "#F8F9FA" };

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

export default function PaymentMethodModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const employee = props.employee || {};

  const [method, setMethod] = useState("Cheque");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(function() {
    if (!isOpen) return;
    setMethod(function() { const at = (employee.account_type || employee.payment_method || employee.method || "").toLowerCase(); return at === "cheque" ? "Cheque" : (at === "direct_deposit" ? "Direct deposit" : "Cheque"); }());
    setSaving(false); setSaveError(null);
  }, [isOpen, employee]);

  async function handleSave() {
    if (!employee.id) return;
    setSaving(true); setSaveError(null);
    try {
      const r = await fetch(API + "/api/v1/payroll/employees/" + employee.id, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ account_type: (method || "").toLowerCase() }),
      });
      if (!r.ok) { const t = await r.text(); throw new Error("Save failed: " + (t || r.status)); }
      setSaving(false); onSaved && onSaved();
    } catch (e) { setSaving(false); setSaveError(e.message || "Save failed"); }
  }

  const employeeName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "this employee";
  const positionRaw = employee.position_title || "";
  const subtitle = positionRaw ? (employeeName + " \u00b7 " + positionRaw) : employeeName;

  return (
    <EditModal
      isOpen={isOpen} onClose={onClose} onSave={handleSave}
      title="Edit payment method" subtitle={subtitle} iconLetter="P"
      saving={saving} saveError={saveError} saveDisabled={saving}
      hasUnsavedChanges={true} saveLabel="Save payment method"
      secondaryAction={
        <a href="mailto:support@getnovala.com?subject=Feedback%20on%20payment%20method"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.brandDark, textDecoration: "underline", fontWeight: 700 }}>
          <MessageSquare size={15} /> Give feedback
        </a>
      }
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
        How does {employee.first_name || "this employee"} receive their pay?
      </div>
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 20, lineHeight: 1.5 }}>
        Cheque is the current working method. Direct deposit and bank connections are coming soon.
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <MethodOption
          selected={method === "Cheque"}
          onClick={function() { setMethod("Cheque"); }}
          icon={<FileText size={16} strokeWidth={2.5} />}
          title="Cheque"
          subtitle="Paper cheque issued each pay period."
        />
        <MethodOption
          selected={false}
          disabled={true}
          icon={<CreditCard size={16} strokeWidth={2.5} />}
          title="Direct deposit"
          subtitle="Deposit to a linked bank account. Coming soon."
          locked={true}
        />
      </div>
    </EditModal>
  );
}

function MethodOption(props) {
  const selected = !!props.selected;
  const disabled = !!props.disabled;
  return (
    <div
      onClick={disabled ? undefined : props.onClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 16px",
        border: selected ? "2px solid " + C.brand : "1px solid " + C.line,
        borderRadius: 10,
        background: selected ? C.brandBg : (disabled ? C.page : "#FFFFFF"),
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.75 : 1,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: selected ? "#FFFFFF" : "#E7EAF0",
        color: selected ? C.brandDark : "#000000",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {props.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 700 }}>{props.title}</span>
          {props.locked && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "#E7EAF0", color: C.muted, borderRadius: 5, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>
              <Lock size={10} strokeWidth={2.5} /> Coming soon
            </span>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, marginTop: 3, lineHeight: 1.4 }}>{props.subtitle}</div>
      </div>
      {selected && (
        <div style={{ width: 20, height: 20, borderRadius: 10, background: C.brand, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
      )}
    </div>
  );
}