import React from "react";
import { Heart, Plus, Phone } from "lucide-react";

const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  ink: "#0E1A1A", muted: "#12262B", line: "#E7EAF0", page: "#F8F9FA",
  brand: "#15A08C", brandDark: "#0F6E56", brandBg: "#E1F5EE",
  chipBg: "#E7EAF0",
};

function initials(name) {
  if (!name) return "?";
  var parts = String(name).trim().split(/\s+/);
  var f = parts[0] ? parts[0].charAt(0).toUpperCase() : "";
  var l = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : "";
  return (f + l) || "?";
}

export default function EmergencyContactsCard(props) {
  const section = props.section;
  const isOpen = props.isOpen;
  const onToggleOpen = props.onToggleOpen;
  const employee = props.employee || {};

  function openEdit() {
    window.dispatchEvent(new CustomEvent("novala:openEmergencyContactsModal"));
  }

  const p1Name = employee.emergency_contact_name || employee.emergency_name || null;
  const p1Rel = employee.emergency_contact_relationship || employee.emergency_relationship || null;
  const p1Phone = employee.emergency_contact_phone || employee.emergency_phone || null;
  const p1Email = employee.emergency_contact_email || null;

  const p2Name = employee.emergency_contact_2_name || null;
  const p2Rel = employee.emergency_contact_2_relationship || null;
  const p2Phone = employee.emergency_contact_2_phone || null;
  const p2Email = employee.emergency_contact_2_email || null;

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 12, marginBottom: 12, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", cursor: "pointer", borderBottom: isOpen ? "1px solid " + C.line : "0" }} onClick={onToggleOpen}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: isOpen ? C.brandBg : C.chipBg,
          color: isOpen ? C.brandDark : "#000000",
          display: "flex", alignItems: "center", justifyContent: "center", marginRight: 12,
          transition: "background 0.15s ease, color 0.15s ease",
        }}>
          
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Emergency contacts</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 2 }}>People to contact in case of emergency.</div>
        </div>
        <a onClick={function(e) { e.stopPropagation(); openEdit(); }}
          style={{ fontSize: 13, color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer", marginRight: 12 }}>
          {p1Name ? "Edit" : "Start"}
        </a>
        <span style={{ color: C.muted, fontSize: 14 }}>{isOpen ? "\u25be" : "\u25b8"}</span>
      </div>

      {isOpen && (
        <div style={{ padding: "4px 22px 22px" }}>
          {p1Name ? (
            <ContactCard name={p1Name} rel={p1Rel} phone={p1Phone} email={p1Email} tag="Primary" />
          ) : (
            <EmptyPrimary onAdd={openEdit} />
          )}

          {p2Name ? (
            <ContactCard name={p2Name} rel={p2Rel} phone={p2Phone} email={p2Email} tag="Secondary" />
          ) : (
            p1Name && <EmptySecondary onAdd={openEdit} />
          )}
        </div>
      )}
    </div>
  );
}

function ContactCard(props) {
  return (
    <div style={{ marginTop: 14, padding: "16px 20px", background: C.page, borderRadius: 10, border: "1px solid " + C.line }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 24, background: C.ink, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>
          {initials(props.name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{props.name}</span>
            <span style={{ padding: "2px 8px", background: C.brandBg, color: C.brandDark, borderRadius: 5, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>
              {props.tag}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, marginTop: 3 }}>{props.rel || "-"}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14, paddingTop: 12, borderTop: "1px solid " + C.line }}>
        <div>
          <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 3 }}>Phone</div>
          <div style={{ fontSize: 13.5, color: props.phone ? C.ink : "#94A0B2", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{props.phone || "Not set"}</div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 3 }}>Email</div>
          <div style={{ fontSize: 13.5, color: props.email ? C.ink : "#94A0B2", fontWeight: 500 }}>{props.email || "Not set"}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyPrimary(props) {
  return (
    <div style={{ marginTop: 14, padding: "36px 22px", textAlign: "center", background: C.page, borderRadius: 10, border: "1px solid " + C.line }}>
      <div style={{ width: 44, height: 44, margin: "0 auto 12px", borderRadius: 10, background: C.chipBg, color: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, marginBottom: 4 }}>No emergency contact set</div>
      <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, maxWidth: 380, margin: "0 auto 16px", lineHeight: 1.5 }}>
        Add someone to contact in case of a medical emergency or workplace incident.
      </div>
      <button onClick={props.onAdd}
        style={{ height: 38, padding: "0 16px", background: C.ink, color: "#FFFFFF", border: 0, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
        Add contact
      </button>
    </div>
  );
}

function EmptySecondary(props) {
  return (
    <div style={{ marginTop: 14, padding: 20, border: "1.5px dashed " + C.line, borderRadius: 10, textAlign: "center" }}>
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, marginBottom: 4 }}>Add a secondary contact</div>
      <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 12 }}>Recommended for extra safety in emergencies.</div>
      <button onClick={props.onAdd}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", background: "#FFFFFF", color: C.ink, border: "1px solid " + C.line, borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
        <Plus size={14} strokeWidth={2.5} /> Add contact
      </button>
    </div>
  );
}