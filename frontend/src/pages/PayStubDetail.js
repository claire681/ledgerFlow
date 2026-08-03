import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";

const C = {
  ink: "#12262B",
  inkDark: "#0E1A1A",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  page: "#F4F6F8",
  card: "#FFFFFF",
  line: "#E7EAF0",
  muted: "#66748B",
};

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const tabular = { fontVariantNumeric: "tabular-nums" };
const API = "https://api.getnovala.com";

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("token") || "";
}

function fmtMoney(n) {
  const v = Number(n) || 0;
  return "$" + v.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtHours(h) {
  const n = Number(h) || 0;
  return n.toFixed(2);
}

function fmtDate(iso) {
  if (!iso) return "";
  const parts = String(iso).split("-");
  if (parts.length !== 3) return iso;
  return parts[2] + "/" + parts[1] + "/" + parts[0];
}

export default function PayStubDetail() {
  const { runId, stubId } = useParams();
  const navigate = useNavigate();

  const [run, setRun] = useState(null);
  const [stub, setStub] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(function() {
    let cancelled = false;
    async function load() {
      const token = getToken();
      const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" };
      try {
        const [runRes, stubsRes, companyRes] = await Promise.all([
          fetch(API + "/api/v1/payroll/runs/" + runId, { headers }).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
          fetch(API + "/api/v1/payroll/runs/" + runId + "/stubs", { headers }).then(function(r) { return r.ok ? r.json() : []; }).catch(function() { return []; }),
          fetch(API + "/api/v1/company/profile", { headers }).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
        ]);
        if (cancelled) return;

        setRun(runRes);
        setCompany(companyRes);

        const list = Array.isArray(stubsRes) ? stubsRes : (stubsRes.stubs || stubsRes.data || []);
        const found = list.find(function(s) { return String(s.stub_id || s.id) === String(stubId); });
        if (!found) {
          setError("Pay stub not found");
        } else {
          setStub(found);
        }
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(String((e && e.message) || e));
          setLoading(false);
        }
      }
    }
    load();
    return function() { cancelled = true; };
  }, [runId, stubId]);

  if (loading) {
    return (
      <div style={{ padding: "40px 32px", background: C.page, minHeight: "100vh", fontFamily: FONT }}>
        <div style={{ fontSize: 15, color: C.ink, fontWeight: 500 }}>Loading pay stub...</div>
      </div>
    );
  }

  if (error || !stub) {
    return (
      <div style={{ padding: "40px 32px", background: C.page, minHeight: "100vh", fontFamily: FONT }}>
        <div style={{ fontSize: 18, color: C.ink, fontWeight: 700, marginBottom: 8 }}>Could not load pay stub.</div>
        <div style={{ fontSize: 14, color: C.ink, fontWeight: 500, marginBottom: 20 }}>{error || "Unknown error"}</div>
        <button onClick={function() { navigate(-1); }} style={{ padding: "10px 16px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Back</button>
      </div>
    );
  }

  const empName = stub.employee_name || stub.name || "";
  const positionTitle = stub.position_title || "";
  const paymentMethod = stub.payment_method || "Cheque";

  const rate = Number(stub.hourly_rate || 0);
  const hrsReg = Number(stub.hours_regular || 0);
  const hrsOT = Number(stub.hours_overtime || 0);
  const hrsStat = Number(stub.hours_stat_holiday || 0);
  const gross = Number(stub.gross_pay || 0);
  const net = Number(stub.net_pay || 0);

  // Deductions
  const fed = Number(stub.federal_tax || 0);
  const prov = Number(stub.provincial_or_state_tax || 0);
  const ei = Number(stub.unemployment_employee || 0);
  const cpp = Number(stub.social_security_employee || 0);
  const cpp2 = Number(stub.social_security_2_employee || 0);
  const totalDeductions = Number(stub.total_employee_deductions || 0);

  // Employer contributions
  const eiEmployer = Number(stub.unemployment_employer || 0);
  const cppEmployer = Number(stub.social_security_employer || 0);
  const cpp2Employer = Number(stub.social_security_2_employer || 0);

  // YTD - stored + current
  const ytdRegular = Number(stub.ytd_regular_pay || 0) + (hrsReg * rate);
  const ytdGross = Number(stub.ytd_gross_pay || 0) + gross;
  const ytdFederal = Number(stub.ytd_federal_tax || 0) + fed;
  const ytdProv = Number(stub.ytd_provincial_or_state_tax || 0) + prov;
  const ytdEI = Number(stub.ytd_unemployment_employee || 0) + ei;
  const ytdCPP = Number(stub.ytd_social_security_employee || 0) + cpp;
  const ytdDeductions = Number(stub.ytd_total_employee_deductions || 0) + totalDeductions;
  const ytdEIEmployer = Number(stub.ytd_unemployment_employer || 0) + eiEmployer;
  const ytdCPPEmployer = Number(stub.ytd_social_security_employer || 0) + cppEmployer;

  const companyName = (company && company.legal_name) || (company && company.name) || "Company Name";
  const companyLocation = (company && [company.city, company.province_or_state, company.country].filter(Boolean).join(", ")) || "";

  const periodStart = run ? run.pay_period_start : null;
  const periodEnd = run ? run.pay_period_end : null;
  const payDate = run ? run.pay_date : null;

  // Table styles
  const thStyle = { textAlign: "left", padding: "10px 0", fontSize: 10, fontWeight: 700, color: C.ink, letterSpacing: "0.08em", textTransform: "uppercase" };
  const thRight = Object.assign({}, thStyle, { textAlign: "right" });
  const tdStyle = { padding: "10px 0", color: C.ink, fontSize: 13 };
  const tdRight = Object.assign({}, tdStyle, { textAlign: "right", ...tabular });
  const tdRightBold = Object.assign({}, tdRight, { fontWeight: 700 });
  const totalRow = { borderTop: "1.5px solid " + C.ink };
  const rowLine = { borderBottom: "1px solid " + C.line };

  return (
    <>
      {/* Print CSS - hide everything except the stub area */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #paystub-print-area, #paystub-print-area * { visibility: visible; }
          #paystub-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
          @page { margin: 0.5in; }
        }
      `}</style>

      <div style={{ maxWidth: "100%", margin: 0, padding: "28px 32px 90px", fontFamily: FONT, background: C.page, minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <div className="no-print">
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.ink, marginBottom: 14 }}>
              <a onClick={function() { navigate("/payroll/overview"); }} style={{ color: C.ink, fontWeight: 600, textDecoration: "none", opacity: 0.7, cursor: "pointer" }}>Payroll</a>
              <span style={{ color: C.ink, opacity: 0.4 }}>/</span>
              <a onClick={function() { navigate(-1); }} style={{ color: C.ink, fontWeight: 600, textDecoration: "none", opacity: 0.7, cursor: "pointer" }}>Pay runs</a>
              <span style={{ color: C.ink, opacity: 0.4 }}>/</span>
              <span style={{ color: C.ink, fontWeight: 700 }}>Pay stub</span>
            </div>

            {/* Title + actions */}
            <div style={{ background: C.card, borderRadius: 12, padding: "32px 40px 24px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 8 }}>Pay stub</div>
                  <div style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>{empName} · Pay date {fmtDate(payDate)}</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={function() { window.print(); }}
                    style={{ padding: "10px 16px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Download size={14} strokeWidth={2} />
                    Download PDF
                  </button>
                  <button
                    onClick={function() { window.print(); }}
                    style={{ padding: "10px 16px", background: C.inkDark, border: "none", borderRadius: 10, color: C.card, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Printer size={14} strokeWidth={2} />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PRINT AREA - the actual pay stub document */}
          <div id="paystub-print-area" style={{ background: C.card, borderRadius: 12, padding: 40, border: "1px solid " + C.line }}>

            {/* Company header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 24, borderBottom: "1.5px solid " + C.ink, marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{companyName}</div>
                {companyLocation && (<div style={{ fontSize: 12, color: C.ink, fontWeight: 500 }}>{companyLocation}</div>)}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>PAY STUB</div>
                <div style={{ fontSize: 12, color: C.ink, fontWeight: 500, ...tabular }}>{fmtDate(periodStart)} to {fmtDate(periodEnd)}</div>
              </div>
            </div>

            {/* Employee + Payment info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>EMPLOYEE</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 2 }}>{empName}</div>
                {positionTitle && (<div style={{ fontSize: 12, color: C.ink, fontWeight: 500 }}>{positionTitle}</div>)}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>PAYMENT</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 2 }}>{paymentMethod}</div>
                <div style={{ fontSize: 12, color: C.ink, fontWeight: 500, ...tabular }}>Pay date: {fmtDate(payDate)}</div>
              </div>
            </div>

            {/* Big Net Pay */}
            <div style={{ padding: "20px 0", marginBottom: 32, borderTop: "1px solid " + C.line, borderBottom: "1px solid " + C.line }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>NET PAY</div>
              <div style={{ fontSize: 44, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1, ...tabular }}>{fmtMoney(net)}</div>
            </div>

            {/* Earnings */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, paddingBottom: 8, borderBottom: "1.5px solid " + C.ink, marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>EARNINGS</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={rowLine}>
                    <th style={thStyle}>Type</th>
                    <th style={thRight}>Hours</th>
                    <th style={thRight}>Rate</th>
                    <th style={thRight}>Current</th>
                    <th style={thRight}>YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {hrsReg > 0 && (
                    <tr style={rowLine}>
                      <td style={tdStyle}>Regular Pay</td>
                      <td style={tdRight}>{fmtHours(hrsReg)}</td>
                      <td style={tdRight}>{fmtMoney(rate)}</td>
                      <td style={Object.assign({}, tdRight, { fontWeight: 600 })}>{fmtMoney(hrsReg * rate)}</td>
                      <td style={tdRight}>{fmtMoney(ytdRegular)}</td>
                    </tr>
                  )}
                  {hrsOT > 0 && (
                    <tr style={rowLine}>
                      <td style={tdStyle}>Overtime Pay</td>
                      <td style={tdRight}>{fmtHours(hrsOT)}</td>
                      <td style={tdRight}>{fmtMoney(rate * 1.5)}</td>
                      <td style={Object.assign({}, tdRight, { fontWeight: 600 })}>{fmtMoney(hrsOT * rate * 1.5)}</td>
                      <td style={tdRight}>-</td>
                    </tr>
                  )}
                  {hrsStat > 0 && (
                    <tr style={rowLine}>
                      <td style={tdStyle}>Stat Holiday Pay</td>
                      <td style={tdRight}>{fmtHours(hrsStat)}</td>
                      <td style={tdRight}>{fmtMoney(rate)}</td>
                      <td style={Object.assign({}, tdRight, { fontWeight: 600 })}>{fmtMoney(hrsStat * rate)}</td>
                      <td style={tdRight}>-</td>
                    </tr>
                  )}
                  <tr style={totalRow}>
                    <td style={Object.assign({}, tdStyle, { fontWeight: 700 })}>Gross Pay</td>
                    <td style={tdRightBold}>{fmtHours(hrsReg + hrsOT + hrsStat)}</td>
                    <td></td>
                    <td style={tdRightBold}>{fmtMoney(gross)}</td>
                    <td style={tdRightBold}>{fmtMoney(ytdGross)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Deductions */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, paddingBottom: 8, borderBottom: "1.5px solid " + C.ink, marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>DEDUCTIONS</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={rowLine}>
                    <th style={thStyle}>Type</th>
                    <th style={thRight}>Current</th>
                    <th style={thRight}>YTD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={rowLine}>
                    <td style={tdStyle}>Federal Income Tax</td>
                    <td style={tdRight}>{fmtMoney(fed)}</td>
                    <td style={tdRight}>{fmtMoney(ytdFederal)}</td>
                  </tr>
                  <tr style={rowLine}>
                    <td style={tdStyle}>Provincial Income Tax</td>
                    <td style={tdRight}>{fmtMoney(prov)}</td>
                    <td style={tdRight}>{fmtMoney(ytdProv)}</td>
                  </tr>
                  <tr style={rowLine}>
                    <td style={tdStyle}>Employment Insurance (EI)</td>
                    <td style={tdRight}>{fmtMoney(ei)}</td>
                    <td style={tdRight}>{fmtMoney(ytdEI)}</td>
                  </tr>
                  <tr style={rowLine}>
                    <td style={tdStyle}>Canada Pension Plan (CPP)</td>
                    <td style={tdRight}>{fmtMoney(cpp)}</td>
                    <td style={tdRight}>{fmtMoney(ytdCPP)}</td>
                  </tr>
                  {cpp2 > 0 && (
                    <tr style={rowLine}>
                      <td style={tdStyle}>CPP2 (Second)</td>
                      <td style={tdRight}>{fmtMoney(cpp2)}</td>
                      <td style={tdRight}>-</td>
                    </tr>
                  )}
                  <tr style={totalRow}>
                    <td style={Object.assign({}, tdStyle, { fontWeight: 700 })}>Total Deductions</td>
                    <td style={tdRightBold}>{fmtMoney(totalDeductions)}</td>
                    <td style={tdRightBold}>{fmtMoney(ytdDeductions)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Employer contributions */}
            {(eiEmployer > 0 || cppEmployer > 0) && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, paddingBottom: 8, borderBottom: "1.5px solid " + C.ink, marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>EMPLOYER CONTRIBUTIONS</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={rowLine}>
                      <th style={thStyle}>Type</th>
                      <th style={thRight}>Current</th>
                      <th style={thRight}>YTD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eiEmployer > 0 && (
                      <tr style={rowLine}>
                        <td style={tdStyle}>Employer EI</td>
                        <td style={tdRight}>{fmtMoney(eiEmployer)}</td>
                        <td style={tdRight}>{fmtMoney(ytdEIEmployer)}</td>
                      </tr>
                    )}
                    {cppEmployer > 0 && (
                      <tr style={rowLine}>
                        <td style={tdStyle}>Employer CPP</td>
                        <td style={tdRight}>{fmtMoney(cppEmployer)}</td>
                        <td style={tdRight}>{fmtMoney(ytdCPPEmployer)}</td>
                      </tr>
                    )}
                    {cpp2Employer > 0 && (
                      <tr style={rowLine}>
                        <td style={tdStyle}>Employer CPP2</td>
                        <td style={tdRight}>{fmtMoney(cpp2Employer)}</td>
                        <td style={tdRight}>-</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary */}
            <div style={{ paddingTop: 20, borderTop: "1.5px solid " + C.ink }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>Gross Pay</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, ...tabular }}>{fmtMoney(gross)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>Total Deductions</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, ...tabular }}>-{fmtMoney(totalDeductions)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", marginTop: 6, borderTop: "1px solid " + C.ink }}>
                <span style={{ fontSize: 15, color: C.ink, fontWeight: 700 }}>Net Pay</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: C.ink, ...tabular }}>{fmtMoney(net)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, marginTop: 24 }}>
            <button
              onClick={function() { navigate(-1); }}
              style={{ padding: "10px 16px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Back
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
