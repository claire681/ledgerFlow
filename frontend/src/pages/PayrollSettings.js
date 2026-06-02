import React from "react";
import ReactDOM from "react-dom";
import { X, Pencil } from "lucide-react";

const BRAND = "#0F5959";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const BORDER = "#DDE5E5";

// TODO: per-row edit drawers not yet specced (Appendix B). Stub for now.
const stub = (label) => () => alert(`Edit ${label} — coming soon.`);

const ROWS = [
  { id: "general_tax", label: "General tax",
    description: "Manage overall company info like address and filing info" },
  { id: "federal_tax", label: "Federal tax",
    description: "Enter info such as CRA payroll number, deposit schedule, and filing requirement" },
  { id: "auto_payroll", label: "Auto Payroll",
    descNode: (<>Automatically pay your employees. <a href="#" onClick={(e) => e.preventDefault()} style={{color: BRAND, fontWeight: 600, textDecoration: "underline"}}>Learn more</a></>),
    value: "No employees enrolled" },
  { id: "work_locations", label: "Work locations",
    description: "Manage all work locations" },
  { id: "email_notifications", label: "Email notifications",
    description: "Send to",
    // TODO: pull from company settings (currently hardcoded sample)
    value: "contact@brightcarehealth.ca",
    subrows: [
      "Setup notifications", "Form filing notifications",
      "Payday notifications", "Tax notifications",
      "Payday reminders", "Tax setup reminders",
    ] },
  { id: "bank_accounts", label: "Bank accounts",
    description: "Account number",
    // TODO: pull last 4 from bank account record
    value: "\u2024\u2024\u2024\u20242955",
    extraNode: (<a href="#" onClick={(e) => e.preventDefault()} style={{color: BRAND, fontSize: 14, fontWeight: 600, textDecoration: "underline"}}>Manage payroll principal officer information</a>) },
  { id: "printing", label: "Printing",
    description: "Paycheques and pay stubs",
    value: "Pay stubs only" },
  { id: "direct_deposit", label: "Direct deposit",
    description: "Funding time",
    value: "2-day",
    // TODO: real funding limit from payment processor
    extraNode: (<div style={{fontSize: 13.5, color: SUB, marginTop: 6}}>Funding limit: <strong style={{color: INK}}>$40K per payroll (6-day period)</strong></div>) },
  { id: "contact_info", label: "Contact information",
    description: "Manage primary payroll contact information." },
  { id: "workers_comp", label: "Workers' compensation",
    description: "Add the details of your workers' comp insurance coverage." },
  { id: "accounting", label: "Accounting",
    description: "Choose how payroll transactions are mapped" },
];

export function PayrollSettings({ onClose }) {
  const node = (
    <div style={{
      position: "fixed", inset: 0, background: "#fff",
      zIndex: 9000, overflow: "auto",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      animation: "psIn 0.28s cubic-bezier(0.16,1,0.3,1)",
    }}>
      <style>{`@keyframes psIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>

      <div style={{
        position: "sticky", top: 0, background: "#fff", zIndex: 2,
        borderBottom: `1px solid ${BORDER}`,
        padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <h1 style={{margin: 0, fontSize: 24, fontWeight: 700, color: INK, letterSpacing: "-0.01em"}}>
          Payroll Settings
        </h1>
        <button onClick={onClose} aria-label="Close" style={{
          width: 38, height: 38, borderRadius: 999,
          background: "transparent", border: "none", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: SUB, transition: "background 0.15s",
        }} onMouseEnter={(e) => e.currentTarget.style.background = "#F1F5F5"}
           onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <X size={22} strokeWidth={2.1} />
        </button>
      </div>

      <div style={{maxWidth: 1100, padding: "32px 40px 120px", margin: 0}}>
        {ROWS.map(row => (
          <PSRow key={row.id} row={row} onEdit={stub(row.label)} />
        ))}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: `1px solid ${BORDER}`,
        padding: "16px 40px", display: "flex", justifyContent: "flex-end",
        zIndex: 2,
      }}>
        <button onClick={onClose} style={{
          padding: "11px 28px", borderRadius: 10, border: "none",
          background: BRAND, color: "#fff",
          fontWeight: 700, fontSize: 15, cursor: "pointer",
          boxShadow: "0 6px 14px -6px rgba(15,89,89,0.5)",
          transition: "transform 0.15s",
        }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
           onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
          Done
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(node, document.body);
}

function PSRow({ row, onEdit }) {
  return (
    <div style={{
      display: "flex", padding: "20px 0",
      borderBottom: `1px solid ${BORDER}`,
      alignItems: "flex-start", gap: 24,
    }}>
      <div style={{flex: "0 0 220px"}}>
        <div style={{fontSize: 15, fontWeight: 700, color: INK}}>{row.label}</div>
      </div>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontSize: 14, color: SUB, lineHeight: 1.55, marginBottom: row.value ? 8 : 0}}>
          {row.descNode || row.description}
        </div>
        {row.value && (
          <div style={{fontSize: 14.5, color: INK, fontWeight: 600}}>{row.value}</div>
        )}
        {row.extraNode && (
          <div style={{marginTop: 8}}>{row.extraNode}</div>
        )}
        {row.subrows && (
          <div style={{
            marginTop: 16,
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "10px 32px",
          }}>
            {row.subrows.map((sub, i) => (
              <div key={i} style={{display: "flex", justifyContent: "space-between", fontSize: 13.5}}>
                <span style={{color: SUB}}>{sub}</span>
                <span style={{color: INK, fontWeight: 500}}>Send to you</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={onEdit} style={{
        width: 36, height: 36, borderRadius: 8,
        background: "transparent", border: "none", cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: SUB, flexShrink: 0, transition: "background 0.15s, color 0.15s",
      }} onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F5"; e.currentTarget.style.color = INK; }}
         onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = SUB; }}
         aria-label={`Edit ${row.label}`} title={`Edit ${row.label}`}>
        <Pencil size={18} strokeWidth={1.9} />
      </button>
    </div>
  );
}
