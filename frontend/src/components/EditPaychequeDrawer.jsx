import React, { useEffect, useState, useRef } from "react";
import { HelpCircle, X, ChevronDown, ChevronRight } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

// Novala design tokens - dark, professional
const C = {
  ink: "#12262B",
  inkDark: "#0E1A1A",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  page: "#F4F6F8",
  line: "#E7EAF0",
  white: "#FFFFFF",
  danger: "#B4232A",
  scrim: "rgba(18, 38, 43, 0.35)",
};

const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: "Bearer " + token } : {}),
  };
}

function fmtMoney(v) {
  const n = Number(v || 0);
  return "$" + n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return d + "/" + m + "/" + y;
}

// Map earning types to override codes for the backend
const EARNING_CODE = {
  "Regular Pay": "hours_regular",
  "Stat Holiday Pay": "hours_stat_holiday",
  "Stat pay - average daily wage": "stat_pay_amount",
};

// Map tax types (from load) to backend codes
const EMP_TAX_CODE = {
  "Income Tax": "income_tax",
  "Employment Insurance": "ei_employee",
  "Canada Pension Plan": "cpp_employee",
  "Second Canada Pension Plan": "cpp2_employee",
};
const ER_TAX_CODE = {
  "Employment Insurance Employer": "ei_employer",
  "Canada Pension Plan Employer": "cpp_employer",
  "Second Canada Pension Plan Employer": "cpp2_employer",
};

function EditPaychequeDrawer({ runId, employeeId, onClose, onSaved }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paySectionOpen, setPaySectionOpen] = useState(true);
  const [empTaxesOpen, setEmpTaxesOpen] = useState(true);
  const [erTaxesOpen, setErTaxesOpen] = useState(true);

  // Editable state - shadows the loaded data
  const [hoursRegular, setHoursRegular] = useState("");
  const [hoursStatHoliday, setHoursStatHoliday] = useState("");
  const [statPayAmount, setStatPayAmount] = useState("");
  const [empTaxes, setEmpTaxes] = useState([]);   // [{type, current, ytd, is_overridden}]
  const [erTaxes, setErTaxes] = useState([]);
  const [overrides, setOverrides] = useState({});  // { code: amount }
  const [memo, setMemo] = useState("");
  const [netPay, setNetPay] = useState(0);
  const [grossPay, setGrossPay] = useState(0);

  const [saving, setSaving] = useState(false);
  const [recalcing, setRecalcing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  const recalcTimerRef = useRef(null);

  // Load on mount
  useEffect(function() {
    if (!runId || !employeeId) return;
    setLoading(true);
    setError(null);
    fetch(API + "/api/v1/payroll/pay-runs/" + runId + "/paycheques/" + employeeId, {
      headers: authHeaders(),
    })
      .then(function(r) {
        if (!r.ok) throw new Error("Failed to load paycheque: " + r.status);
        return r.json();
      })
      .then(function(d) {
        setData(d);
        // Initialize editable state from loaded data
        const regular = d.earnings.find(function(e) { return e.type === "Regular Pay"; });
        const stat = d.earnings.find(function(e) { return e.type === "Stat Holiday Pay"; });
        const statAdw = d.earnings.find(function(e) { return e.type === "Stat pay - average daily wage"; });
        setHoursRegular(regular ? String(regular.hours || 0) : "0");
        setHoursStatHoliday(stat ? String(stat.hours || 0) : "0");
        setStatPayAmount(statAdw ? String(statAdw.current || 0) : "0");
        setEmpTaxes(d.employee_taxes || []);
        setErTaxes(d.employer_taxes || []);
        setMemo(d.memo || "");
        setNetPay(d.net_pay || 0);
        // Compute initial gross from earnings
        const gross = (d.earnings || []).reduce(function(sum, e) { return sum + Number(e.current || 0); }, 0);
        setGrossPay(gross);
        // Build initial overrides map from loaded is_overridden flags
        const ov = {};
        (d.employee_taxes || []).forEach(function(t) {
          if (t.is_overridden) {
            const code = EMP_TAX_CODE[t.type];
            if (code) ov[code] = t.current;
          }
        });
        (d.employer_taxes || []).forEach(function(t) {
          if (t.is_overridden) {
            const code = ER_TAX_CODE[t.type];
            if (code) ov[code] = t.current;
          }
        });
        setOverrides(ov);
        setDirty(false);
        setLoading(false);
      })
      .catch(function(e) {
        setError(e.message || "Could not load paycheque");
        setLoading(false);
      });
  }, [runId, employeeId]);

  // Esc key closes
  useEffect(function() {
    function onKey(e) {
      if (e.key === "Escape") attemptClose();
    }
    document.addEventListener("keydown", onKey);
    return function() { document.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty]);

  function attemptClose() {
    if (dirty) {
      setShowConfirmDiscard(true);
    } else {
      onClose && onClose();
    }
  }

  // Debounced recalculate when hours change
  function scheduleRecalc() {
    if (recalcTimerRef.current) clearTimeout(recalcTimerRef.current);
    recalcTimerRef.current = setTimeout(function() {
      recalculate();
    }, 400);
  }

  function recalculate() {
    if (!runId || !employeeId) return;
    setRecalcing(true);
    const body = {
      hours_regular: parseFloat(hoursRegular) || 0,
      hours_stat_holiday: parseFloat(hoursStatHoliday) || 0,
      stat_pay_amount: parseFloat(statPayAmount) || 0,
      overrides: overrides,
    };
    fetch(API + "/api/v1/payroll/pay-runs/" + runId + "/paycheques/" + employeeId + "/recalculate", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    })
      .then(function(r) {
        if (!r.ok) throw new Error("Recalc failed");
        return r.json();
      })
      .then(function(d) {
        setGrossPay(d.gross_pay || 0);
        setNetPay(d.net_pay || 0);
        // Update tax current values from response
        setEmpTaxes(function(prev) {
          return prev.map(function(t) {
            const code = EMP_TAX_CODE[t.type];
            const newT = (d.employee_taxes || []).find(function(x) { return x.code === code; });
            if (newT) return Object.assign({}, t, { current: newT.current, is_overridden: newT.is_overridden });
            return t;
          });
        });
        setErTaxes(function(prev) {
          return prev.map(function(t) {
            const code = ER_TAX_CODE[t.type];
            const newT = (d.employer_taxes || []).find(function(x) { return x.code === code; });
            if (newT) return Object.assign({}, t, { current: newT.current, is_overridden: newT.is_overridden });
            return t;
          });
        });
        setRecalcing(false);
      })
      .catch(function(e) {
        console.error("Recalc error:", e);
        setRecalcing(false);
      });
  }

  function handleHoursChange(field, val) {
    const digits = val.replace(/[^0-9.]/g, "");
    if (field === "regular") setHoursRegular(digits);
    if (field === "stat_holiday") setHoursStatHoliday(digits);
    if (field === "stat_pay") setStatPayAmount(digits);
    setDirty(true);
    scheduleRecalc();
  }

  function handleTaxOverride(code, val) {
    const num = val === "" ? 0 : parseFloat(val) || 0;
    setOverrides(function(prev) {
      return Object.assign({}, prev, { [code]: num });
    });
    setDirty(true);
    // Update the tax row's current value immediately (optimistic)
    setEmpTaxes(function(prev) {
      return prev.map(function(t) {
        if (EMP_TAX_CODE[t.type] === code) return Object.assign({}, t, { current: num, is_overridden: true });
        return t;
      });
    });
    setErTaxes(function(prev) {
      return prev.map(function(t) {
        if (ER_TAX_CODE[t.type] === code) return Object.assign({}, t, { current: num, is_overridden: true });
        return t;
      });
    });
    // Recompute net pay locally
    scheduleRecalc();
  }

  function resetOverride(code) {
    setOverrides(function(prev) {
      const next = Object.assign({}, prev);
      delete next[code];
      return next;
    });
    setEmpTaxes(function(prev) {
      return prev.map(function(t) {
        if (EMP_TAX_CODE[t.type] === code) return Object.assign({}, t, { is_overridden: false });
        return t;
      });
    });
    setErTaxes(function(prev) {
      return prev.map(function(t) {
        if (ER_TAX_CODE[t.type] === code) return Object.assign({}, t, { is_overridden: false });
        return t;
      });
    });
    setDirty(true);
    scheduleRecalc();
  }

  function handleMemoChange(val) {
    setMemo(val);
    setDirty(true);
  }

  function handleSave() {
    if (!runId || !employeeId) return;
    setSaving(true);
    const body = {
      hours_regular: parseFloat(hoursRegular) || 0,
      hours_stat_holiday: parseFloat(hoursStatHoliday) || 0,
      stat_pay_amount: parseFloat(statPayAmount) || 0,
      overrides: overrides,
      memo: memo,
    };
    fetch(API + "/api/v1/payroll/pay-runs/" + runId + "/paycheques/" + employeeId, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    })
      .then(function(r) {
        if (!r.ok) throw new Error("Save failed");
        return r.json();
      })
      .then(function(d) {
        setSaving(false);
        setDirty(false);
        if (onSaved) onSaved(d);
        onClose && onClose();
      })
      .catch(function(e) {
        setSaving(false);
        alert("Save failed: " + (e.message || e));
      });
  }

  const inputBase = {
    width: 130,
    height: 38,
    padding: "0 10px",
    borderRadius: 6,
    textAlign: "right",
    fontFamily: FONT,
    fontSize: 14,
    fontVariantNumeric: "tabular-nums",
    color: C.ink,
    background: C.white,
    border: "1.5px solid " + C.ink,
    outline: "none",
  };

  const inputOverride = Object.assign({}, inputBase, {
    border: "1.5px solid " + C.brandDark,
    background: C.brandBg,
    fontWeight: 700,
  });

  const empTotal = empTaxes.reduce(function(sum, t) { return sum + Number(t.current || 0); }, 0);
  const erTotal = erTaxes.reduce(function(sum, t) { return sum + Number(t.current || 0); }, 0);
  const empYtdTotal = empTaxes.reduce(function(sum, t) { return sum + Number(t.ytd || 0); }, 0);
  const erYtdTotal = erTaxes.reduce(function(sum, t) { return sum + Number(t.ytd || 0); }, 0);

  const netPayNegative = netPay < 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1199, fontFamily: FONT }}>
      <div onClick={attemptClose} style={{ position: "fixed", inset: 0, background: C.scrim, zIndex: 1199 }} />

      <div style={{ position: "fixed", top: 64, left: 0, right: 0, bottom: 0, background: C.white, zIndex: 1200, display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div style={{ height: 56, background: C.page, borderBottom: "1px solid " + C.line, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, padding: "0 24px", flexShrink: 0 }}>
          <button onClick={function() { window.location.href = "mailto:support@getnovala.com?subject=Help with editing a paycheque"; }} aria-label="Help" style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HelpCircle size={20} strokeWidth={2} stroke={C.ink} />
          </button>
          <button onClick={attemptClose} aria-label="Close" style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} strokeWidth={2} stroke={C.ink} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px 40px", background: C.white }}>
          {loading && (<div style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>Loading paycheque...</div>)}
          {error && (
            <div>
              <div style={{ fontSize: 16, color: C.ink, fontWeight: 700, marginBottom: 4 }}>Could not load this paycheque.</div>
              <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{error}</div>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Summary */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.ink, marginBottom: 6 }}>PAY TO</div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: C.ink, lineHeight: 1.15 }}>{data.employee.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.ink, marginBottom: 6 }}>NET PAY</div>
                  <div style={{ fontSize: 38, fontWeight: 700, color: netPayNegative ? C.danger : C.ink, fontVariantNumeric: "tabular-nums" }}>
                    {fmtMoney(netPay)}
                    {recalcing && (<span style={{ fontSize: 12, marginLeft: 8, color: C.ink, fontWeight: 500 }}>Recalculating...</span>)}
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "24px 32px", marginBottom: 40 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Employee address</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.6 }}>
                    {data.employee.address_line1 || "Not set"}
                    {data.employee.address_line2 && (<><br />{data.employee.address_line2}</>)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Pay date</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.6, fontVariantNumeric: "tabular-nums" }}>{fmtDate(data.pay_run.pay_date)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 16, marginBottom: 4 }}>Paid from</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.6 }}>{data.company.paid_from}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Pay period</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.6, fontVariantNumeric: "tabular-nums" }}>{fmtDate(data.pay_run.pay_period_start)} to {fmtDate(data.pay_run.pay_period_end)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 16, marginBottom: 4 }}>Paid by</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.6, fontVariantNumeric: "tabular-nums" }}>Cheque ({fmtMoney(netPay)})</div>
                </div>
              </div>

              {/* PAY SECTION */}
              <SectionHeader open={paySectionOpen} onClick={function() { setPaySectionOpen(!paySectionOpen); }} label="Pay" />
              {paySectionOpen && (
                <PayTable
                  hoursRegular={hoursRegular}
                  hoursStatHoliday={hoursStatHoliday}
                  statPayAmount={statPayAmount}
                  rate={data.employee.hourly_rate}
                  ytdRegular={(data.earnings.find(function(e) { return e.type === "Regular Pay"; }) || {}).ytd}
                  ytdStat={0}
                  ytdStatAdw={0}
                  onHoursChange={handleHoursChange}
                  inputBase={inputBase}
                  gross={grossPay}
                />
              )}

              {/* EMPLOYEE TAXES */}
              <SectionHeader open={empTaxesOpen} onClick={function() { setEmpTaxesOpen(!empTaxesOpen); }} label="Employee taxes" />
              {empTaxesOpen && (
                <TaxTable
                  rows={empTaxes}
                  total={empTotal}
                  ytdTotal={empYtdTotal}
                  onChange={handleTaxOverride}
                  onReset={resetOverride}
                  codeMap={EMP_TAX_CODE}
                  overrides={overrides}
                  inputBase={inputBase}
                  inputOverride={inputOverride}
                />
              )}

              {/* EMPLOYER TAXES */}
              <SectionHeader open={erTaxesOpen} onClick={function() { setErTaxesOpen(!erTaxesOpen); }} label="Employer taxes" />
              {erTaxesOpen && (
                <TaxTable
                  rows={erTaxes}
                  total={erTotal}
                  ytdTotal={erYtdTotal}
                  onChange={handleTaxOverride}
                  onReset={resetOverride}
                  codeMap={ER_TAX_CODE}
                  overrides={overrides}
                  inputBase={inputBase}
                  inputOverride={inputOverride}
                />
              )}

              {/* Memo */}
              <div style={{ marginTop: 40 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Memo</div>
                <textarea
                  value={memo}
                  onChange={function(e) { handleMemoChange(e.target.value); }}
                  maxLength={1000}
                  style={{ width: 430, minHeight: 190, padding: 12, border: "1.5px solid " + C.ink, borderRadius: 8, fontSize: 14, color: C.ink, fontFamily: FONT, resize: "vertical", background: C.white }}
                />
              </div>

              {netPayNegative && (
                <div style={{ marginTop: 20, padding: "12px 14px", background: "#FDECED", border: "1px solid " + C.danger, borderRadius: 8, color: C.danger, fontSize: 13, fontWeight: 700 }}>
                  Net pay is negative. Check the tax amounts before saving.
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ height: 72, background: C.white, borderTop: "1px solid " + C.line, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <button onClick={attemptClose} style={{ padding: "10px 16px", background: C.white, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Close</button>
          <button
            onClick={handleSave}
            disabled={!dirty || recalcing || saving || netPayNegative}
            style={{
              padding: "10px 16px",
              background: C.inkDark,
              border: "none",
              borderRadius: 10,
              color: C.white,
              fontSize: 14,
              fontWeight: 700,
              cursor: (!dirty || recalcing || saving || netPayNegative) ? "not-allowed" : "pointer",
              fontFamily: FONT,
              opacity: (!dirty || recalcing || saving || netPayNegative) ? 0.45 : 1,
              boxShadow: "0 1px 2px rgba(18,38,43,0.12)",
            }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {/* Confirm discard modal */}
      {showConfirmDiscard && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.white, borderRadius: 10, padding: "24px 28px", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Discard your changes?</div>
            <div style={{ fontSize: 13, color: C.ink, marginBottom: 20, fontWeight: 500 }}>The edits to this paycheque have not been saved.</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={function() { setShowConfirmDiscard(false); }} style={{ padding: "8px 14px", background: C.white, border: "1.5px solid " + C.ink, borderRadius: 8, color: C.ink, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Keep editing</button>
              <button onClick={function() { setShowConfirmDiscard(false); onClose && onClose(); }} style={{ padding: "8px 14px", background: C.danger, border: "none", borderRadius: 8, color: C.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Discard changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader(props) {
  const Icon = props.open ? ChevronDown : ChevronRight;
  return (
    <button onClick={props.onClick} aria-expanded={props.open} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 40, marginBottom: 16, background: "transparent", border: "none", cursor: "pointer", padding: 0, fontFamily: FONT }}>
      <Icon size={18} strokeWidth={2.5} stroke={C.ink} />
      <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>{props.label}</div>
    </button>
  );
}

function PayTable(props) {
  const rate = Number(props.rate || 0);
  const currentRegular = (parseFloat(props.hoursRegular) || 0) * rate;
  const currentStat = (parseFloat(props.hoursStatHoliday) || 0) * rate;
  const currentStatAdw = parseFloat(props.statPayAmount) || 0;
  const total = currentRegular + currentStat + currentStatAdw;
  const ytdTotal = Number(props.ytdRegular || 0) + Number(props.ytdStat || 0) + Number(props.ytdStatAdw || 0);
  const gridCols = "minmax(0, 1fr) 140px 100px 140px 140px";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: 24, paddingBottom: 12, borderBottom: "1px solid " + C.line, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.ink }}>
        <div>Type</div>
        <div style={{ textAlign: "right" }}>Hours</div>
        <div style={{ textAlign: "right" }}>Rate</div>
        <div style={{ textAlign: "right" }}>Current</div>
        <div style={{ textAlign: "right" }}>YTD</div>
      </div>

      {/* Regular Pay */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: 24, padding: "16px 0", borderBottom: "1px solid " + C.line, alignItems: "center", fontSize: 14, color: C.ink, fontWeight: 500, minHeight: 56 }}>
        <div>Regular Pay</div>
        <div style={{ textAlign: "right" }}>
          <input value={props.hoursRegular} onChange={function(e) { props.onHoursChange("regular", e.target.value); }} style={props.inputBase} />
        </div>
        <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(rate)}</div>
        <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(currentRegular)}</div>
        <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(props.ytdRegular)}</div>
      </div>

      {/* Stat Holiday */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: 24, padding: "16px 0", borderBottom: "1px solid " + C.line, alignItems: "center", fontSize: 14, color: C.ink, fontWeight: 500, minHeight: 56 }}>
        <div>Stat Holiday Pay</div>
        <div style={{ textAlign: "right" }}>
          <input value={props.hoursStatHoliday} onChange={function(e) { props.onHoursChange("stat_holiday", e.target.value); }} style={props.inputBase} />
        </div>
        <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(rate)}</div>
        <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(currentStat)}</div>
        <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(props.ytdStat)}</div>
      </div>

      {/* Stat pay ADW */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: 24, padding: "16px 0", borderBottom: "1px solid " + C.line, alignItems: "center", fontSize: 14, color: C.ink, fontWeight: 500, minHeight: 56 }}>
        <div>Stat pay - average daily wage</div>
        <div></div>
        <div></div>
        <div style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>$</span>
          <input value={props.statPayAmount} onChange={function(e) { props.onHoursChange("stat_pay", e.target.value); }} style={Object.assign({}, props.inputBase, { width: 110 })} />
        </div>
        <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(props.ytdStatAdw)}</div>
      </div>

      {/* Total */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: 24, padding: "16px 0", background: C.page, alignItems: "center", fontSize: 14, color: C.ink, fontWeight: 700 }}>
        <div style={{ paddingLeft: 12 }}>Total</div>
        <div></div>
        <div></div>
        <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(total)}</div>
        <div style={{ textAlign: "right", paddingRight: 12, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(ytdTotal)}</div>
      </div>
    </div>
  );
}

function TaxTable(props) {
  const rows = props.rows || [];
  const gridCols = "minmax(0, 1fr) 220px 140px";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: 24, paddingBottom: 12, borderBottom: "1px solid " + C.line, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.ink }}>
        <div>Type</div>
        <div style={{ textAlign: "right" }}>Current</div>
        <div style={{ textAlign: "right" }}>YTD</div>
      </div>

      {rows.map(function(row, idx) {
        const code = props.codeMap[row.type];
        const isOverridden = row.is_overridden || (code && props.overrides.hasOwnProperty(code));
        const val = code && props.overrides.hasOwnProperty(code) ? props.overrides[code] : row.current;

        return (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: 24, padding: "16px 0", borderBottom: "1px solid " + C.line, alignItems: "center", fontSize: 14, color: C.ink, fontWeight: 500, minHeight: 56 }}>
            <div>
              {row.type}
              {isOverridden && (
                <span onClick={function() { props.onReset(code); }} style={{ color: C.brandDark, fontSize: 12, fontWeight: 700, marginLeft: 8, cursor: "pointer" }}>Reset</span>
              )}
            </div>
            <div style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 700 }}>$</span>
              <input
                value={String(val || 0)}
                onChange={function(e) { props.onChange(code, e.target.value); }}
                style={isOverridden ? props.inputOverride : props.inputBase}
              />
            </div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(row.ytd)}</div>
          </div>
        );
      })}

      <div style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: 24, padding: "16px 0", background: C.page, alignItems: "center", fontSize: 14, color: C.ink, fontWeight: 700 }}>
        <div style={{ paddingLeft: 12 }}>Total</div>
        <div style={{ textAlign: "right", paddingRight: 12, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(props.total)}</div>
        <div style={{ textAlign: "right", paddingRight: 12, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(props.ytdTotal)}</div>
      </div>
    </div>
  );
}

export default EditPaychequeDrawer;
