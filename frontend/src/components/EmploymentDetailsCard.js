import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiFetch from "../utils/apiFetch";
const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  ink: "#0E1A1A", label: "#12262B", line: "#E7EAF0", muted: "#6B7280",
  brand: "#15A08C", brandDark: "#0F6E56",
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

var PROVINCE_ABBREV = {
  "Alberta": "AB", "British Columbia": "BC", "Manitoba": "MB",
  "New Brunswick": "NB", "Newfoundland and Labrador": "NL",
  "Nova Scotia": "NS", "Northwest Territories": "NT", "Nunavut": "NU",
  "Ontario": "ON", "Prince Edward Island": "PE", "Quebec": "QC",
  "Saskatchewan": "SK", "Yukon": "YT",
};

var STATUS_LABELS = {
  active: "Active",
  paid_leave: "Paid leave of absence",
  unpaid_leave: "Unpaid leave of absence",
  terminated: "Terminated",
  not_on_payroll: "Not on payroll",
  deceased: "Deceased",
};

var PAY_SCHEDULE_LABELS = {
  weekly: "Weekly",
  bi_weekly: "Bi-weekly",
  biweekly: "Bi-weekly",
  semi_monthly: "Semi-monthly",
  semimonthly: "Semi-monthly",
  monthly: "Monthly",
};

export default function EmploymentDetailsCard(props) {
  const employee = props.employee || {};
  const openEdit = props.openEdit || function() { window.dispatchEvent(new CustomEvent("novala:openEmploymentDetailsModal", { detail: {} })); };

  const status = STATUS_LABELS[employee.employment_status] || "Active";
  const hireDate = fmtDateDDMMYYYY(employee.start_date);
  const paySchedule = PAY_SCHEDULE_LABELS[employee.pay_schedule] || employee.pay_schedule || null;

  // Work location - 2 lines
  const workStreet = employee.work_street || null;
  const workCity = employee.work_city || null;
  const workProvinceRaw = employee.work_province || null;
  const workProvinceAbbrev = workProvinceRaw ? (PROVINCE_ABBREV[workProvinceRaw] || workProvinceRaw) : null;
  const workPostal = employee.work_postal || null;

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async function() {
      const r = await apiFetch("/api/v1/payroll/employees");
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : (data.items || data.employees || []);
    },
  });
  const managerRecord = employees.find(function(e) { return e.id === employee.manager_id; }) || null;

  const managerFullName = managerRecord
    ? ([managerRecord.first_name, managerRecord.last_name].filter(Boolean).join(" ") || "Unnamed")
    : (employee.manager_name || null);
  const managerInitials = managerFullName
    ? managerFullName.split(/\s+/).map(function(p) { return p[0]; }).slice(0, 2).join("").toUpperCase()
    : "";
  const manager = managerFullName
  const department = employee.department || null;
  const jobTitle = employee.position_title || null;
  const empId = employee.employee_number || null;

  const cellStyle = { fontFamily: FONT };
  const labelStyle = { fontSize: 13, fontWeight: 700, color: C.label, marginBottom: 6 };
  const valueStyle = { fontSize: 15, fontWeight: 500, color: C.ink, lineHeight: 1.45 };
  const emptyStyle = { fontSize: 14, fontWeight: 500, color: C.muted, fontStyle: "italic" };

  function renderValue(v) {
    if (v === null || v === undefined || v === "") {
      return <div style={emptyStyle}>Not set</div>;
    }
    return <div style={valueStyle}>{v}</div>;
  }

  function renderWorkLocation() {
    if (!workStreet && !workCity && !workProvinceAbbrev && !workPostal) {
      return <div style={emptyStyle}>Not set</div>;
    }
    var line2Parts = [];
    if (workCity) line2Parts.push(workCity);
    var provPostal = "";
    if (workProvinceAbbrev) provPostal += workProvinceAbbrev;
    if (workPostal) provPostal += (provPostal ? " " : "") + workPostal;
    if (line2Parts.length && provPostal) line2Parts[line2Parts.length - 1] = line2Parts[line2Parts.length - 1] + ", " + provPostal;
    else if (provPostal) line2Parts.push(provPostal);
    var line2 = line2Parts.join(", ");
    return (
      <div>
        {workStreet && <div style={valueStyle}>{workStreet}</div>}
        {line2 && <div style={valueStyle}>{line2}</div>}
      </div>
    );
  }

  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 12,
      marginBottom: 12, padding: "24px 28px", fontFamily: FONT,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>Employment details</div>
        <div
          onClick={openEdit}
          style={{ fontSize: 14, fontWeight: 600, color: C.brandDark, cursor: "pointer" }}
          onMouseEnter={function(e) { e.currentTarget.style.textDecoration = "underline"; }}
          onMouseLeave={function(e) { e.currentTarget.style.textDecoration = "none"; }}
        >Edit</div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        columnGap: 24,
        rowGap: 28,
        marginTop: 24,
      }}>
        {/* Row 1: Status, Hire date, Pay schedule */}
        <div style={cellStyle}>
          <div style={labelStyle}>Status</div>
          {renderValue(status)}
        </div>
        <div style={cellStyle}>
          <div style={labelStyle}>Hire date</div>
          {renderValue(hireDate)}
        </div>
        <div style={cellStyle}>
          <div style={labelStyle}>Pay schedule</div>
          {renderValue(paySchedule)}
        </div>

        {/* Row 2: Work location, Manager, Department */}
        <div style={cellStyle}>
          <div style={labelStyle}>Work location</div>
          {renderWorkLocation()}
        </div>
        <div style={cellStyle}>
          <div style={labelStyle}>Manager</div>
          {manager ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#E1F5EE", color: "#0F6E56", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{managerInitials}</div>
            <span>{manager}</span>
          </div>
        ) : renderValue(null)}
        </div>
        <div style={cellStyle}>
          <div style={labelStyle}>Department</div>
          {renderValue(department)}
        </div>

        {/* Row 3: Job title, Employee ID, empty */}
        <div style={cellStyle}>
          <div style={labelStyle}>Job title</div>
          {renderValue(jobTitle)}
        </div>
        <div style={cellStyle}>
          <div style={labelStyle}>Employee ID</div>
          {renderValue(empId)}
        </div>
        <div></div>
      </div>
    </div>
  );
}
