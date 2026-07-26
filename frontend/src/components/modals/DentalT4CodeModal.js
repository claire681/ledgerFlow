import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import EditModal from "./EditModal";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const C = {
  ink: "#0E1A1A",
  muted: "#12262B",
  line: "#E7EAF0",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  page: "#F8F9FA",
};

const CODES = [
  { value: "1", label: "Code 1 — No dental coverage available", subtitle: "No one had employer-provided dental coverage." },
  { value: "2", label: "Code 2 — Payee only", subtitle: "Coverage available to the employee only." },
  { value: "3", label: "Code 3 — Payee, spouse, and dependents", subtitle: "Coverage available to the employee, spouse, and dependents." },
  { value: "4", label: "Code 4 — Payee and spouse", subtitle: "Coverage available to the employee and spouse only." },
  { value: "5", label: "Code 5 — Payee and dependents", subtitle: "Coverage available to the employee and dependents only." },
];

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

export default function DentalT4CodeModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const employee = props.employee || {};
  const initial = props.current || employee.dental_benefit_code || null;

  const [selected, setSelected] = useState(initial ? String(initial) : null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(function() {
    if (isOpen) {
      setSelected(initial ? String(initial) : null);
      setSaving(false); setSaveError(null);
    }
  }, [isOpen, initial]);

  const hasChanges = selected !== (initial ? String(initial) : null);

  async function handleSave() {
    if (!employee.id || !selected) return;
    setSaving(true); setSaveError(null);
    try {
      const r = await fetch(API + "/api/v1/payroll/employees/" + employee.id, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ dental_benefit_code: selected }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error("Save failed: " + (txt || r.status));
      }
      setSaving(false);
      onSaved && onSaved();
    } catch (e) {
      setSaving(false); setSaveError(e.message || "Save failed");
    }
  }

  const employeeName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "this employee";
  const positionRaw = employee.position_title || "";
  const subtitle = positionRaw ? (employeeName + " \u00b7 " + positionRaw) : employeeName;
  const year = new Date().getFullYear();

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="Dental T4 code"
      subtitle={subtitle}
      iconLetter="D"
      saving={saving}
      saveError={saveError}
      saveDisabled={!hasChanges || !selected || saving}
      hasUnsavedChanges={hasChanges}
      saveLabel="Save dental code"
      secondaryAction={
        <a
          href="mailto:support@getnovala.com?subject=Feedback%20on%20dental%20T4%20code"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.brandDark, textDecoration: "underline", fontWeight: 700 }}
        >
          <MessageSquare size={15} /> Give feedback
        </a>
      }
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
        Was employer-provided dental coverage available in {year}?
      </div>
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 20, lineHeight: 1.5 }}>
        CRA requires this on every T4 slip. Select the code that describes the dental coverage this employee had access to.
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {CODES.map(function(c) {
          const on = selected === c.value;
          return (
            <div
              key={c.value}
              onClick={function() { setSelected(c.value); }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "12px 14px",
                border: on ? "2px solid " + C.brand : "1px solid " + C.line,
                borderRadius: 10,
                background: on ? C.brandBg : "#FFFFFF",
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 9,
                border: on ? "0" : "1.5px solid " + C.line,
                background: on ? C.brand : "#FFFFFF",
                flexShrink: 0, marginTop: 2,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {on && <div style={{ width: 8, height: 8, borderRadius: 4, background: "#FFFFFF" }} />}
              </div>
              <div>
                <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 700 }}>{c.label}</div>
                <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, marginTop: 2 }}>{c.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 18, padding: "12px 14px", background: C.page,
        border: "1px solid " + C.line, borderRadius: 10,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
        </svg>
        <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>
          Report the coverage the employee <span style={{ fontWeight: 700 }}>had access to</span> during the year, not whether they enrolled. Confirm annually before issuing T4 slips.
        </div>
      </div>
    </EditModal>
  );
}