import React, { useEffect, useState } from "react";
import { Briefcase, User, Calendar, MapPin } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  ink: "#0E1A1A", muted: "#12262B", line: "#E7EAF0", page: "#F8F9FA",
  brand: "#15A08C", brandDark: "#0F6E56", brandBg: "#E1F5EE",
  chipBg: "#E7EAF0",
};

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t };
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

function tenureFrom(iso) {
  if (!iso) return null;
  try {
    var start = new Date(iso);
    var now = new Date();
    var years = now.getFullYear() - start.getFullYear();
    var months = now.getMonth() - start.getMonth();
    if (months < 0) { years -= 1; months += 12; }
    if (years <= 0 && months <= 0) return "Less than a month";
    if (years === 0) return months + (months === 1 ? " month" : " months");
    if (months === 0) return years + (years === 1 ? " year" : " years");
    return years + "y " + months + "m";
  } catch (e) { return null; }
}

export default function EmploymentDetailsCard(props) {
  const section = props.section;
  const isOpen = props.isOpen;
  const onToggleOpen = props.onToggleOpen;
  const employee = props.employee || {};

  const [locations, setLocations] = useState([]);

  useEffect(function() {
    if (!isOpen) return;
    fetch(API + "/api/v1/work-locations", { headers: authHeaders() })
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(function(data) { setLocations(Array.isArray(data) ? data : (data.items || [])); })
      .catch(function() {});
  }, [isOpen]);

  function openEdit() {
    window.dispatchEvent(new CustomEvent("novala:openEmploymentDetailsModal", { detail: { locations: locations } }));
  }

  const title = employee.position_title || "-";
  const dept = employee.department || null;
  const empType = employee.employment_type || null;
  const payType = employee.pay_type || null;
  const payFreq = employee.pay_frequency || null;
  const startDate = employee.start_date || null;
  const startFmt = fmtDateDDMMYYYY(startDate);
  const tenure = tenureFrom(startDate);
  const empId = employee.id ? String(employee.id).slice(0, 8).toUpperCase() : "-";

  var locName = null;
  var locProv = null;
  if (employee.work_location_id) {
    var m = locations.find(function(l) { return String(l.id) === String(employee.work_location_id); });
    if (m) { locName = m.name; locProv = m.province_or_state || m.province || null; }
  }

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 12, marginBottom: 12, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", cursor: "pointer", borderBottom: isOpen ? "1px solid " + C.line : "0" }} onClick={onToggleOpen}>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Employment details</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 2 }}>Role, dates, work location, and tenure.</div>
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
            <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, letterSpacing: "-0.01em" }}>{title}</div>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginTop: 4 }}>
              {startFmt ? ("Started " + startFmt + (tenure ? " \u00b7 " + tenure + " tenure" : "")) : "No start date set"}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <span style={{ padding: "4px 10px", background: C.brandBg, color: C.brandDark, borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>Active</span>
              {empType && <PillDark>{empType}</PillDark>}
              {payType && <PillDark>{cap(payType)}</PillDark>}
              {payFreq && <PillDark>{payFreq}</PillDark>}
            </div>
          </div>

          {/* Role */}
          <SubCard title="Role">
            <Row label="Position title" value={title} />
            <Row label="Department" value={dept} />
            <Row label="Employee ID number" value={empId} mono />
            <Row label="Employment type" value={empType} isLast />
          </SubCard>

          {/* Dates */}
          <SubCard title="Dates">
            <Row label="Start date" value={startFmt} mono />
            <Row label="Tenure" value={tenure} isLast />
          </SubCard>

          {/* Work location */}
          <SubCard title="Work location" icon={<MapPin size={13} strokeWidth={2.5} />}>
            <Row label="Location" value={locName ? (locName + (locProv ? " \u00b7 " + locProv : "")) : null} isLast />
          </SubCard>
        </div>
      )}
    </div>
  );
}

function cap(s) { if (!s) return s; return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
function PillDark(props) {
  return <span style={{ padding: "4px 10px", background: C.chipBg, color: C.muted, borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>{props.children}</span>;
}
function SubCard(props) {
  return (
    <div style={{ marginTop: 14, border: "1px solid " + C.line, borderRadius: 10, padding: "4px 18px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0 12px", borderBottom: "1px solid " + C.line }}>
        
        <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{props.title}</span>
      </div>
      <div style={{ paddingTop: 6 }}>{props.children}</div>
    </div>
  );
}
function Row(props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "10px 24px", padding: "12px 0", borderBottom: props.isLast ? "0" : "1px solid " + C.line }}>
      <span style={{ fontSize: 13.5, color: C.muted, fontWeight: 700 }}>{props.label}</span>
      <span style={{ fontSize: 13.5, color: props.value ? C.ink : "#94A0B2", fontWeight: 500, fontVariantNumeric: props.mono ? "tabular-nums" : "normal" }}>{props.value || "Not set"}</span>
    </div>
  );
}