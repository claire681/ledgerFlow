import React, { useEffect, useState } from "react";
import { Palmtree, Stethoscope, Clock, Calendar } from "lucide-react";

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
  amber: "#854F0B",
  amberBg: "#FAEEDA",
  danger: "#A32D2D",
};

const SICK_POLICY_LABEL = {
  "none": "No sick pay",
  "fixed": "Paid days per year",
  "accrued": "Accrued per hour worked",
};

const UNPAID_LABEL = {
  "not_allowed": "Not allowed",
  "as_requested": "As requested",
  "with_approval": "With approval",
};

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

function fmtMoney(v) {
  if (v === null || v === undefined) return "-";
  var n = Number(v);
  if (isNaN(n)) return "-";
  var hasCents = Math.round(n * 100) % 100 !== 0;
  var fixed = hasCents ? n.toFixed(2) : String(Math.round(n));
  var parts = fixed.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "$" + parts.join(".");
}

function fmtDate(iso) {
  if (!iso) return "-";
  try {
    var d = new Date(iso);
    var dd = String(d.getDate()).padStart(2, "0");
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var yyyy = d.getFullYear();
    return dd + "/" + mm + "/" + yyyy;
  } catch (e) { return "-"; }
}

export default function TimeOffCard(props) {
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
    fetch(API + "/api/v1/payroll/time-off/" + employeeId, { headers: authHeaders() })
      .then(function(r) { if (!r.ok) throw new Error("Failed to load time off info"); return r.json(); })
      .then(function(d) { setData(d); setLoading(false); })
      .catch(function(e) { setError(e.message || "Load failed"); setLoading(false); });
  }, [employeeId]);

  function openEdit() {
    window.dispatchEvent(new CustomEvent("novala:openTimeOffModal", { detail: { data: data } }));
  }

  const configured = !!(data && data.configured);

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 12, marginBottom: 12, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", cursor: "pointer" }} onClick={onToggleOpen}>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{section.title}</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 2 }}>Vacation, sick pay, and unpaid leave policies for this employee.</div>
        </div>
        <a
          onClick={function(e) { e.stopPropagation(); openEdit(); }}
          style={{ fontSize: 13, color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer", marginRight: 12 }}
        >
          {configured ? "Edit" : "Start"}
        </a>
        <span style={{ color: C.muted, fontSize: 14 }}>{isOpen ? "\u25be" : "\u25b8"}</span>
      </div>

      {isOpen && (
        <div style={{ borderTop: "1px solid " + C.line }}>
          {loading && (
            <div style={{ padding: "24px 20px", color: C.muted, fontSize: 13, fontWeight: 500 }}>Loading time off info...</div>
          )}
          {error && (
            <div style={{ padding: "24px 20px", color: C.danger, fontSize: 13, fontWeight: 600 }}>{error}</div>
          )}

          {!loading && !error && !configured && (
            <div style={{ padding: "36px 22px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, margin: "0 auto 12px", borderRadius: 10, background: "#E7EAF0", color: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Palmtree size={20} />
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, marginBottom: 4 }}>No time off policies set</div>
              <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, maxWidth: 360, margin: "0 auto 16px", lineHeight: 1.5 }}>
                Set vacation, sick pay, and unpaid leave policies to track balances automatically.
              </div>
              <button
                onClick={openEdit}
                style={{ height: 38, padding: "0 16px", background: C.ink, color: "#FFFFFF", border: 0, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}
              >
                Set up time off
              </button>
            </div>
          )}

          {!loading && !error && configured && data && (
            <div style={{ padding: "4px 22px 18px" }}>
              {/* Vacation */}
              <div style={{ marginTop: 14, border: "1px solid " + C.line, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "#E7EAF0", color: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Palmtree size={13} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Vacation</span>
                  </div>
                  <span style={{ padding: "3px 10px", background: C.brandBg, color: C.brandDark, borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>
                    {data.vacation.policy}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, paddingTop: 6, borderTop: "1px solid " + C.line }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Accrual rate</div>
                    <div style={{ fontSize: 15, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {data.vacation.accrual_rate ? data.vacation.accrual_rate + "%" : "-"}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 500, marginTop: 2 }}>of gross earnings</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Current balance</div>
                    <div style={{ fontSize: 15, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {data.vacation.balance_hours.toFixed(2)} hrs
                    </div>
                    <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 500, marginTop: 2 }}>~{fmtMoney(data.vacation.estimated_payout)} payable</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Accrued this year</div>
                    <div style={{ fontSize: 15, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {data.vacation.accrued_this_year_hours.toFixed(2)} hrs
                    </div>
                    <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 500, marginTop: 2 }}>From finalized pay runs</div>
                  </div>
                </div>
              </div>

              {/* Sick pay */}
              <div style={{ marginTop: 14, border: "1px solid " + C.line, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "#E7EAF0", color: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Stethoscope size={13} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Sick pay</span>
                  </div>
                  <span style={{ padding: "3px 10px", background: C.brandBg, color: C.brandDark, borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>
                    {data.sick_pay.policy === "none"
                      ? "No sick pay"
                      : (data.sick_pay.days_per_year + " paid days per year")}
                  </span>
                </div>
                {data.sick_pay.policy !== "none" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, paddingTop: 6, borderTop: "1px solid " + C.line }}>
                    <div>
                      <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Days remaining</div>
                      <div style={{ fontSize: 15, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {data.sick_pay.days_remaining} days
                      </div>
                      <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 500, marginTop: 2 }}>{data.sick_pay.days_used} used this year</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Resets on</div>
                      <div style={{ fontSize: 15, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtDate(data.sick_pay.yearly_reset)}</div>
                      <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 500, marginTop: 2 }}>Yearly reset</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Unpaid leave */}
              <div style={{ marginTop: 14, border: "1px solid " + C.line, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "#E7EAF0", color: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Clock size={13} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Unpaid leave</span>
                  </div>
                  <span style={{ padding: "3px 10px", background: C.amberBg, color: C.amber, borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>
                    {UNPAID_LABEL[data.unpaid_leave.policy] || "As requested"}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, marginTop: 8, lineHeight: 1.5 }}>
                  {data.unpaid_leave.policy === "not_allowed"
                    ? "Unpaid time off is not permitted for this employee."
                    : (data.unpaid_leave.policy === "with_approval"
                        ? "Unpaid time off requires manager approval and does not reduce vacation or sick balance."
                        : "Unpaid time off is allowed and does not reduce vacation or sick balance.")}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}