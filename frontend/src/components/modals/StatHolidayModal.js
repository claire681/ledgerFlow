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
  danger: "#A32D2D",
};

const DAYS = [
  { key: "mon", letter: "M", label: "Monday" },
  { key: "tue", letter: "T", label: "Tuesday" },
  { key: "wed", letter: "W", label: "Wednesday" },
  { key: "thu", letter: "T", label: "Thursday" },
  { key: "fri", letter: "F", label: "Friday" },
  { key: "sat", letter: "S", label: "Saturday" },
  { key: "sun", letter: "S", label: "Sunday" },
];

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

export default function StatHolidayModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const employee = props.employee || {};
  const initialData = props.data || null;

  const [selectedDays, setSelectedDays] = useState([]);
  const [initialSelected, setInitialSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(function() {
    if (isOpen) {
      var init = (initialData && Array.isArray(initialData.regular_workdays))
        ? initialData.regular_workdays.slice()
        : (employee.tax_info && Array.isArray(employee.tax_info.regular_workdays)
            ? employee.tax_info.regular_workdays.slice()
            : ["mon","tue","wed","thu","fri"]);
      setSelectedDays(init);
      setInitialSelected(init.slice().sort());
      setSaving(false);
      setSaveError(null);
    }
  }, [isOpen, initialData, employee]);

  function toggle(key) {
    if (selectedDays.indexOf(key) >= 0) {
      setSelectedDays(selectedDays.filter(function(d) { return d !== key; }));
    } else {
      // Keep display order matching DAYS
      var next = DAYS.map(function(d) { return d.key; }).filter(function(d) {
        return d === key || selectedDays.indexOf(d) >= 0;
      });
      setSelectedDays(next);
    }
  }

  const hasChanges = JSON.stringify(selectedDays.slice().sort()) !== JSON.stringify(initialSelected);

  async function handleSave() {
    if (!employee.id) return;
    setSaving(true); setSaveError(null);
    var currentTaxInfo = (employee.tax_info && typeof employee.tax_info === "object") ? employee.tax_info : {};
    var body = { tax_info: Object.assign({}, currentTaxInfo, { regular_workdays: selectedDays }) };
    try {
      const r = await fetch(API + "/api/v1/payroll/employees/" + employee.id, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error("Save failed: " + (txt || r.status));
      }
      setSaving(false);
      onSaved && onSaved();
    } catch (e) {
      setSaving(false);
      setSaveError(e.message || "Save failed");
    }
  }

  const employeeName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "this employee";
  const positionRaw = employee.position_title || "";
  const subtitle = positionRaw ? (employeeName + " \u00b7 " + positionRaw) : employeeName;
  const firstName = employee.first_name || "this employee";

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="Edit stat holiday pay"
      subtitle={subtitle}
      iconLetter="H"
      saving={saving}
      saveError={saveError}
      saveDisabled={!hasChanges || saving}
      hasUnsavedChanges={hasChanges}
      saveLabel="Save changes"
      secondaryAction={
        <a
          href="mailto:support@getnovala.com?subject=Feedback%20on%20stat%20holiday%20pay"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.brandDark, textDecoration: "underline", fontWeight: 700 }}
        >
          <MessageSquare size={15} /> Give feedback
        </a>
      }
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
        Which days does {firstName} normally work?
      </div>
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 20, lineHeight: 1.5 }}>
        Select the days of the week that are considered regular work days. Novala uses this to determine stat holiday eligibility and compute the average daily wage on payroll runs.
      </div>

      {/* Workday letter circles */}
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#12262B", marginBottom: 10 }}>Regular workdays</label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {DAYS.map(function(d) {
          const on = selectedDays.indexOf(d.key) >= 0;
          return (
            <div
              key={d.key}
              onClick={function() { toggle(d.key); }}
              title={d.label}
              style={{
                width: 44, height: 44, borderRadius: 22,
                background: on ? C.brand : "#FFFFFF",
                border: on ? "0" : "1.5px solid " + C.line,
                color: on ? "#FFFFFF" : C.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 700,
                cursor: "pointer", userSelect: "none",
                fontFamily: FONT,
              }}
            >
              {d.letter}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, lineHeight: 1.5, padding: 12, background: C.brandBg, borderRadius: 10 }}>
        <span style={{ fontWeight: 700 }}>Alberta ESA:</span> An employee is entitled to stat holiday pay if they have worked for the employer for at least 30 workdays in the 12 months before the holiday. Novala tracks this automatically as pay runs are processed.
      </div>
    </EditModal>
  );
}