import React, { useEffect, useState } from "react";
import { MoreVertical, Info, Minus, MinusCircle } from "lucide-react";

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
};

const DENTAL_CODE_LABEL = {
  "1": "Code 1 (No coverage)",
  "2": "Code 2 (Payee only)",
  "3": "Code 3 (Payee, spouse, dependents)",
  "4": "Code 4 (Payee and spouse)",
  "5": "Code 5 (Payee and dependents)",
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

function categoryLabelOf(item) {
  var dt = item.deduction_type || {};
  var cat = (dt.category || item.category || "").toLowerCase();
  if (cat.indexOf("retire") >= 0 || cat.indexOf("rrsp") >= 0 || cat.indexOf("pension") >= 0) return "Retirement plan";
  if (cat.indexOf("health") >= 0 || cat.indexOf("dental") >= 0 || cat.indexOf("insurance") >= 0) return "Health insurance";
  return "Other deduction";
}

function amountDisplay(v) {
  if (v == null) return null;
  if (typeof v === "string" && v.trim().endsWith("%")) return v;
  return fmtMoney(v);
}

function employeeAmount(item) {
  var dt = item.deduction_type || {};
  var v = item.employee_amount != null
    ? item.employee_amount
    : (item.amount_override != null ? item.amount_override : dt.default_rate);
  if (v == null) return "-";
  var unit = dt.unit_label || "";
  if (unit.indexOf("%") >= 0) return v + "% of gross";
  return fmtMoney(v) + " / pay";
}

function employerAmount(item) {
  var v = item.employer_amount != null ? item.employer_amount : null;
  if (v == null) return "-";
  var dt = item.deduction_type || {};
  var unit = dt.unit_label || "";
  if (unit.indexOf("%") >= 0) return v + "% match";
  return fmtMoney(v) + " / pay";
}

function totalsPerPay(items) {
  var totalEmp = 0, totalEr = 0;
  items.forEach(function(it) {
    var dt = it.deduction_type || {};
    var unit = (dt.unit_label || "").toLowerCase();
    var isPct = unit.indexOf("%") >= 0;
    var ee = it.employee_amount != null ? it.employee_amount : (it.amount_override != null ? it.amount_override : dt.default_rate);
    var er = it.employer_amount != null ? it.employer_amount : null;
    if (!isPct) {
      if (ee != null) totalEmp += Number(ee) || 0;
      if (er != null) totalEr += Number(er) || 0;
    }
  });
  return { totalEmp: totalEmp, totalEr: totalEr };
}

export default function DeductionsCard(props) {
  const section = props.section;
  const isOpen = props.isOpen;
  const onToggleOpen = props.onToggleOpen;
  const employeeId = props.employeeId;
  const employee = props.employee || {};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpenFor, setMenuOpenFor] = useState(null);

  useEffect(function() {
    if (!employeeId) { setLoading(false); return; }
    setLoading(true); setError(null);
    fetch(API + "/api/v1/employee-deduction-items/employee/" + employeeId, { headers: authHeaders() })
      .then(function(r) { if (!r.ok) throw new Error("Failed to load deductions"); return r.json(); })
      .then(function(data) {
        var list = Array.isArray(data) ? data : (data.items || []);
        setItems(list);
        setLoading(false);
      })
      .catch(function(e) { setError(e.message || "Load failed"); setLoading(false); });
  }, [employeeId]);

  useEffect(function() {
    function closeMenu() { setMenuOpenFor(null); }
    window.addEventListener("click", closeMenu);
    return function() { window.removeEventListener("click", closeMenu); };
  }, []);

  function openAdd() { window.dispatchEvent(new CustomEvent("novala:openAddDeductionModal")); }
  function openEdit(item) { window.dispatchEvent(new CustomEvent("novala:openEditDeductionModal", { detail: item })); }
  function openDentalCode() { window.dispatchEvent(new CustomEvent("novala:openDentalCodeModal", { detail: { current: employee.dental_benefit_code || null } })); }
  function unassign(item) {
    var name = (item.deduction_type && item.deduction_type.name) || "this item";
    if (!window.confirm("Unassign " + name + " from this employee?")) return;
    window.dispatchEvent(new CustomEvent("novala:unassignDeductionItem", { detail: item }));
  }

  const empty = !loading && items.length === 0;
  const totals = totalsPerPay(items);
  const dentalCode = employee.dental_benefit_code ? String(employee.dental_benefit_code) : null;

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 12, marginBottom: 12, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", cursor: "pointer" }} onClick={onToggleOpen}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: isOpen ? C.brandBg : "#E7EAF0", color: isOpen ? C.brandDark : "#000000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginRight: 12 }}>
          <MinusCircle size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{section.title}</span>
            <span title="Voluntary items only. CPP, EI, and income tax are automatic." style={{ color: C.muted, cursor: "help", display: "inline-flex" }}>
              <Info size={14} />
            </span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 2 }}>
            Voluntary items like RRSP, health insurance, or garnishments. Statutory items (CPP, EI, tax) are automatic.
          </div>
        </div>
        {!empty && (
          <button
            onClick={function(e) { e.stopPropagation(); openAdd(); }}
            style={{ height: 34, padding: "0 12px", background: C.ink, color: "#FFFFFF", border: 0, borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginRight: 12, fontFamily: FONT }}
          >
            + Add
          </button>
        )}
        <span style={{ color: C.muted, fontSize: 14 }}>{isOpen ? "\u25be" : "\u25b8"}</span>
      </div>

      {isOpen && (
        <div style={{ borderTop: "1px solid " + C.line }}>
          {loading && <div style={{ padding: "24px 20px", color: C.muted, fontSize: 13, fontWeight: 500 }}>Loading deductions...</div>}
          {error && <div style={{ padding: "24px 20px", color: C.danger, fontSize: 13, fontWeight: 600 }}>{error}</div>}

          {!loading && !error && empty && (
            <div style={{ padding: "36px 22px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, margin: "0 auto 12px", borderRadius: 10, background: "#E7EAF0", color: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Minus size={20} />
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, marginBottom: 4 }}>No deductions or contributions yet</div>
              <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, maxWidth: 380, margin: "0 auto 16px", lineHeight: 1.5 }}>
                Add voluntary items like RRSP contributions, health insurance premiums, or garnishments.
              </div>
              <button
                onClick={openAdd}
                style={{ height: 38, padding: "0 16px", background: C.ink, color: "#FFFFFF", border: 0, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}
              >
                Set up deductions
              </button>
            </div>
          )}

          {!loading && !error && !empty && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 1.1fr 1.1fr 0.7fr", gap: 16, padding: "10px 20px", background: C.page, borderBottom: "1px solid " + C.line }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Category</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Item</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Employee</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Employer</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, textAlign: "right" }}>Actions</div>
              </div>

              {items.map(function(item) {
                var dt = item.deduction_type || {};
                var name = dt.name || "Custom deduction";
                return (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 1.1fr 1.1fr 0.7fr", gap: 16, padding: "13px 20px", alignItems: "center", borderBottom: "1px solid " + C.line }}>
                    <div style={{ fontSize: 13, color: C.ink, fontWeight: 700 }}>{categoryLabelOf(item)}</div>
                    <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{name}</div>
                    <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{employeeAmount(item)}</div>
                    <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{employerAmount(item)}</div>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, position: "relative" }}>
                      <a onClick={function() { openEdit(item); }} style={{ fontSize: 13, color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>Edit</a>
                      <div
                        onClick={function(e) { e.stopPropagation(); setMenuOpenFor(menuOpenFor === item.id ? null : item.id); }}
                        style={{ padding: "2px 4px", cursor: "pointer", color: C.muted, borderRadius: 4 }}
                      >
                        <MoreVertical size={16} />
                      </div>
                      {menuOpenFor === item.id && (
                        <div style={{ position: "absolute", top: 26, right: 0, width: 180, background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", overflow: "hidden", zIndex: 10 }}>
                          <div
                            onClick={function(e) { e.stopPropagation(); setMenuOpenFor(null); unassign(item); }}
                            style={{ padding: "10px 14px", fontSize: 13, color: C.danger, fontWeight: 700, cursor: "pointer" }}
                          >
                            Unassign
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Dental banner */}
              <div style={{ padding: "14px 20px", background: C.page, borderBottom: "1px solid " + C.line }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "#E7EAF0", color: "#000000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5.5c-3.5-3-8-2.5-9 2 0 4.5 1 6 3.5 10.5 1 1.5 1.5 3.5 2.5 3.5 1 0 1.5-2 2.5-4 1 2 1.5 4 2.5 4 1 0 1.5-2 2.5-3.5 2.5-4.5 3.5-6 3.5-10.5-1-4.5-5.5-5-9-2z"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
                      Dental T4 code: <span style={{ color: C.brandDark }}>{dentalCode ? DENTAL_CODE_LABEL[dentalCode] : "Not set"}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, marginTop: 2, lineHeight: 1.5 }}>Reported on T4 slips for CRA. Confirm annually.</div>
                  </div>
                  <a
                    onClick={openDentalCode}
                    style={{ fontSize: 12.5, color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {dentalCode ? "Change code" : "Set code"}
                  </a>
                </div>
              </div>

              {/* Totals */}
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 1.1fr 1.1fr 0.7fr", gap: 16, padding: "12px 20px", background: C.brandBg }}>
                <div style={{ gridColumn: "span 2", fontSize: 12.5, color: C.brandDark, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>Total per pay period (flat amounts)</div>
                <div style={{ fontSize: 14, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(totals.totalEmp)}</div>
                <div style={{ fontSize: 14, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(totals.totalEr)}</div>
                <div></div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}