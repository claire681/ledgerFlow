import React from "react";
import { User, Mail, Home, IdCard } from "lucide-react";

const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  ink: "#0E1A1A", muted: "#12262B", line: "#E7EAF0", page: "#F8F9FA",
  brand: "#15A08C", brandDark: "#0F6E56", brandBg: "#E1F5EE",
  chipBg: "#E7EAF0",
};

function initials(first, last) {
  var f = (first || "").trim().charAt(0).toUpperCase();
  var l = (last || "").trim().charAt(0).toUpperCase();
  return (f + l) || "?";
}

function fmtDateDDMMYYYY(iso) {
  if (!iso) return null;
  try {
    var s = String(iso).slice(0, 10);
    var parts = s.split("-");
    if (parts.length !== 3) return s;
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  } catch (e) { return null; }
}

function maskSIN(sin) {
  if (!sin) return null;
  var raw = String(sin).trim();
  // If already masked (contains asterisks or Xs), extract visible digits
  var visible = raw.replace(/[^0-9]/g, "");
  if (visible.length === 0) return "XXX-XXX-XXX";
  if (visible.length < 3) return "XXX-XXX-" + visible.padStart(3, "X");
  var last3 = visible.slice(-3);
  return "XXX-XXX-" + last3;
}

export default function PersonalInfoCard(props) {
  const section = props.section;
  const isOpen = props.isOpen;
  const onToggleOpen = props.onToggleOpen;
  const employee = props.employee || {};

  function openEdit() {
    window.dispatchEvent(new CustomEvent("novala:openPersonalInfoModal"));
  }

  const first = employee.first_name || "";
  const last = employee.last_name || "";
  const fullName = (first + " " + last).trim() || "Unnamed employee";
  const position = employee.position_title || "-";
  const empId = employee.employee_number || (employee.id ? String(employee.id).slice(0, 8).toUpperCase() : "-");
  const email = employee.personal_email || employee.email || null;
  const phone = employee.phone || null;
  const dob = fmtDateDDMMYYYY(employee.date_of_birth);
  const sin = maskSIN(employee.sin_or_ssn || employee.sin);
  const street = employee.address_line1 || employee.address || null;
  const line2 = employee.address_line2 || null;
  const city = employee.city || null;
  const prov = employee.province_or_state || employee.province || null;
  const postal = employee.postal_or_zip || employee.postal_code || null;
  const mailingSame = employee.mailing_address_same !== false;

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
          <User size={16} strokeWidth={isOpen ? 2 : 2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Personal information</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 2 }}>Name, contact, address, and identification for this employee.</div>
        </div>
        <a onClick={function(e) { e.stopPropagation(); openEdit(); }}
          style={{ fontSize: 13, color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer", marginRight: 12 }}>
          Edit
        </a>
        <span style={{ color: C.muted, fontSize: 14 }}>{isOpen ? "\u25be" : "\u25b8"}</span>
      </div>

      {isOpen && (
        <div style={{ padding: "4px 22px 22px" }}>
          {/* Hero */}
          <div style={{ marginTop: 14, padding: "18px 20px", background: C.page, borderRadius: 10, border: "1px solid " + C.line }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: C.ink, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
                {initials(first, last)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, letterSpacing: "-0.01em" }}>{fullName}</div>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginTop: 3 }}>{position} · Employee ID {empId}</div>
              </div>
              <span style={{ padding: "5px 12px", background: C.brandBg, color: C.brandDark, borderRadius: 6, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>Active</span>
            </div>
          </div>

          {/* Contact */}
          <SubCard title="Contact" icon={<Mail size={13} strokeWidth={2.5} />}>
            <Row label="Email" value={email} />
            <Row label="Phone" value={phone} mono />
            <Row label="Date of birth" value={dob} mono isLast />
          </SubCard>

          {/* Address */}
          <SubCard title="Address" icon={<Home size={13} strokeWidth={2.5} />} rightTag={mailingSame ? "Mailing same" : "Different mailing"}>
            <Row label="Street" value={line2 ? (street + " " + line2) : street} />
            <Row label="City / Province" value={city && prov ? (city + " · " + prov) : (city || prov)} />
            <Row label="Postal code" value={postal} mono isLast />
          </SubCard>

          {/* Identification */}
          <SubCard title="Identification" icon={<IdCard size={13} strokeWidth={2.5} />}>
            <Row label="Social Insurance Number" value={sin} mono isLast />
          </SubCard>
        </div>
      )}
    </div>
  );
}

function SubCard(props) {
  return (
    <div style={{ marginTop: 14, border: "1px solid " + C.line, borderRadius: 10, padding: "4px 18px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0 12px", borderBottom: "1px solid " + C.line }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: C.chipBg, color: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {props.icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{props.title}</span>
        {props.rightTag && (
          <span style={{ marginLeft: "auto", padding: "3px 9px", background: C.brandBg, color: C.brandDark, borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{props.rightTag}</span>
        )}
      </div>
      <div style={{ paddingTop: 6 }}>{props.children}</div>
    </div>
  );
}

function Row(props) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "200px 1fr", gap: "10px 24px",
      padding: "12px 0",
      borderBottom: props.isLast ? "0" : "1px solid " + C.line,
    }}>
      <span style={{ fontSize: 13.5, color: C.muted, fontWeight: 700 }}>{props.label}</span>
      <span style={{
        fontSize: 13.5, color: props.value ? C.ink : "#94A0B2", fontWeight: 500,
        fontVariantNumeric: props.mono ? "tabular-nums" : "normal",
      }}>
        {props.value || "Not set"}
      </span>
    </div>
  );
}