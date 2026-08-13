import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, CalendarCheck } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const C = {
  ink: "#0E1A1A",
  muted: "#12262B",
  line: "#E7EAF0",
  page: "#F8F9FA",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  danger: "#A32D2D",
  dangerBg: "#FBEAEA",
};

const DAYS = [
  { key: "mon", letter: "M" },
  { key: "tue", letter: "T" },
  { key: "wed", letter: "W" },
  { key: "thu", letter: "T" },
  { key: "fri", letter: "F" },
  { key: "sat", letter: "S" },
  { key: "sun", letter: "S" },
];

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

function fmtMoney(v) {
  if (v === null || v === undefined) return null;
  var n = Number(v);
  if (isNaN(n)) return null;
  var hasCents = Math.round(n * 100) % 100 !== 0;
  var fixed = hasCents ? n.toFixed(2) : String(Math.round(n));
  var parts = fixed.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "$" + parts.join(".");
}

export default function StatHolidayPayCard(props) {
  const section = props.section;
  const isOpen = props.isOpen;
  const onToggleOpen = props.onToggleOpen;
  const employeeId = props.employeeId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(function() {
    if (!employeeId) { setLoading(false); return; }
    setLoading(true); setError(null);
    fetch(API + "/api/v1/payroll/stat-holiday/" + employeeId, { headers: authHeaders() })
      .then(function(r) { if (!r.ok) throw new Error("Failed to load stat holiday info"); return r.json(); })
      .then(function(d) { setData(d); setLoading(false); })
      .catch(function(e) { setError(e.message || "Load failed"); setLoading(false); });
  }, [employeeId]);

  function openEdit() {
    window.dispatchEvent(new CustomEvent("novala:openStatHolidayModal", { detail: { data: data } }));
  }

  const eligible = !!(data && data.eligible);
  const workdays = new Set((data && data.regular_workdays) || []);

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 12, marginBottom: 12, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", cursor: "pointer" }} onClick={onToggleOpen}>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{section.title}</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 2 }}>Regular workdays and eligibility for statutory holiday pay.</div>
        </div>
        <a
          onClick={function(e) { e.stopPropagation(); openEdit(); }}
          style={{ fontSize: 13, color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer", marginRight: 12 }}
        >
          Edit
        </a>
        <span style={{ color: C.muted, fontSize: 14 }}>{isOpen ? "\u25be" : "\u25b8"}</span>
      </div>

      {isOpen && (
        <div style={{ borderTop: "1px solid " + C.line, padding: "16px 20px" }}>
          {loading && (
            <div style={{ color: C.muted, fontSize: 13, fontWeight: 500 }}>Loading stat holiday info...</div>
          )}
          {error && (
            <div style={{ color: C.danger, fontSize: 13, fontWeight: 600 }}>{error}</div>
          )}
          {!loading && !error && data && (
            <>
              {/* Eligibility row */}
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "10px 24px", paddingBottom: 16, borderBottom: "1px solid " + C.line }}>
                <span style={{ fontSize: 13.5, color: C.muted, fontWeight: 700, alignSelf: "center" }}>Eligibility</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {eligible ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: C.brandBg, color: C.brandDark, borderRadius: 6, fontSize: 12.5, fontWeight: 700 }}>
                      <CheckCircle2 size={14} /> Eligible
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: C.dangerBg, color: C.danger, borderRadius: 6, fontSize: 12.5, fontWeight: 700 }}>
                      <XCircle size={14} /> Not eligible yet
                    </span>
                  )}
                  <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 500 }}>
                    Worked {data.days_worked} of last 365 days
                    {eligible
                      ? " (" + data.days_needed + "+ required)"
                      : " (" + Math.max(0, Math.ceil(data.days_needed - data.days_worked)) + " more needed)"}
                  </span>
                </div>
              </div>

              {/* Regular workdays row */}
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "10px 24px", padding: "16px 0", borderBottom: "1px solid " + C.line }}>
                <div>
                  <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 700 }}>Regular workdays</div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 4 }}>Days the employee normally works</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {DAYS.map(function(d) {
                    var on = workdays.has(d.key);
                    return (
                      <div
                        key={d.key}
                        style={{
                          width: 34, height: 34, borderRadius: 17,
                          background: on ? C.brand : "#FFFFFF",
                          border: on ? "0" : "1.5px solid " + C.line,
                          color: on ? "#FFFFFF" : C.muted,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700,
                        }}
                      >
                        {d.letter}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ADW row */}
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "10px 24px", padding: "16px 0" }}>
                <div>
                  <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 700 }}>Average daily wage</div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 4 }}>Last 4 weeks wages divided by days worked</div>
                </div>
                {data.adw_calc_available ? (
                  <span style={{ fontSize: 20, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(data.adw)}</span>
                ) : (
                  <span style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>Not yet available (needs pay history)</span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}