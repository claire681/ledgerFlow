import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Printer, Receipt, User, MinusCircle, Building2,
  AlertCircle, Wallet,
} from "lucide-react";
import {
  Button, Card, CardHeader, StatusPill, Spinner,
  colors, typography, spacing, radius,
} from "../design-system";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  "Authorization": `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined) return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency", currency: currency || "CAD",
    }).format(num);
  } catch (e) { return num.toFixed(2); }
};

const formatHours = (h) => {
  if (h === null || h === undefined || h === "") return "";
  const num = typeof h === "string" ? parseFloat(h) : h;
  if (isNaN(num) || num === 0) return "";
  return num.toFixed(2);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch (e) { return dateStr; }
};

const pick = (obj, ...keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return null;
};

const getStubName = (stub) =>
  pick(stub, "employee_name", "name", "full_name") ||
  [pick(stub, "first_name"), pick(stub, "last_name")].filter(Boolean).join(" ") ||
  (stub.employee &&
    (pick(stub.employee, "name", "full_name") ||
      [pick(stub.employee, "first_name"), pick(stub.employee, "last_name")].filter(Boolean).join(" "))) ||
  "Unnamed";

const iconWrapStyle = {
  width: 38, height: 38,
  background: colors.brandSoft,
  borderRadius: radius.lg,
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
};

function ErrorBlock({ title, message }) {
  return (
    <Card style={{
      background: colors.dangerSoft,
      border: `1px solid ${colors.danger}40`,
      display: "flex", alignItems: "flex-start",
      gap: spacing[3], marginBottom: spacing[5],
    }}>
      <AlertCircle size={20} color={colors.danger} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ ...typography.bodyStrong, color: colors.dangerText, marginBottom: 4 }}>
          {title || "Something went wrong"}
        </div>
        <div style={{ ...typography.caption, color: colors.dangerText }}>{message}</div>
      </div>
    </Card>
  );
}

function SummaryStat({ label, value, emphasis }) {
  return (
    <div>
      <div style={{
        ...typography.tiny, color: colors.textMuted,
        textTransform: "uppercase", letterSpacing: "0.08em",
        marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontSize: emphasis ? 28 : 20,
        fontWeight: 700,
        color: emphasis ? colors.brandPrimary : colors.textPrimary,
        fontFeatureSettings: '"tnum" 1',
        letterSpacing: "-0.02em",
        lineHeight: 1.2,
      }}>{value}</div>
    </div>
  );
}

const itemTd = (extra = {}) => ({
  padding: "10px 12px",
  ...typography.bodySm,
  fontFeatureSettings: '"tnum" 1',
  ...extra,
});

function LineRow({ label, hours, rate, current, ytd, bold, currency }) {
  return (
    <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
      <td style={itemTd({
        color: bold ? colors.textPrimary : colors.textSecondary,
        fontWeight: bold ? 600 : 400,
      })}>{label}</td>
      <td style={itemTd({ textAlign: "right", color: colors.textSecondary })}>
        {formatHours(hours)}
      </td>
      <td style={itemTd({ textAlign: "right", color: colors.textSecondary })}>
        {rate !== undefined && rate !== null && rate !== 0 ? formatCurrency(rate, currency) : ""}
      </td>
      <td style={itemTd({
        textAlign: "right",
        color: colors.textPrimary,
        fontWeight: bold ? 700 : 500,
      })}>{formatCurrency(current, currency)}</td>
      <td style={itemTd({ textAlign: "right", color: colors.textMuted })}>
        {ytd !== undefined && ytd !== null ? formatCurrency(ytd, currency) : ""}
      </td>
    </tr>
  );
}

function DeductionRow({ label, current, ytd, bold, currency }) {
  return (
    <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
      <td style={itemTd({
        color: bold ? colors.textPrimary : colors.textSecondary,
        fontWeight: bold ? 600 : 400,
      })}>{label}</td>
      <td style={itemTd({
        textAlign: "right",
        color: colors.textPrimary,
        fontWeight: bold ? 700 : 500,
      })}>{formatCurrency(current, currency)}</td>
      <td style={itemTd({ textAlign: "right", color: colors.textMuted })}>
        {ytd !== undefined && ytd !== null ? formatCurrency(ytd, currency) : ""}
      </td>
    </tr>
  );
}

const thLeft = {
  textAlign: "left",
  padding: "10px 12px",
  ...typography.labelUppercase,
  color: colors.textMuted,
  whiteSpace: "nowrap",
  background: colors.bgCardActive,
  borderBottom: `1px solid ${colors.borderSubtle}`,
};
const thRight = { ...thLeft, textAlign: "right" };

export default function PayStubDetail() {
  const { runId, stubId } = useParams();
  const navigate = useNavigate();

  const [run, setRun] = useState(null);
  const [stub, setStub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load run (for context: pay dates, status, currency)
      let runData = null;
      let runRes = await fetch(`${API_URL}/api/v1/payroll/runs/${runId}`, { headers: authHeaders() });
      if (runRes.status === 404 || runRes.status === 405) {
        const listRes = await fetch(`${API_URL}/api/v1/payroll/runs`, { headers: authHeaders() });
        if (listRes.ok) {
          const list = await listRes.json();
          runData = (Array.isArray(list) ? list : []).find((r) => String(r.id) === String(runId));
        }
      } else if (runRes.ok) {
        runData = await runRes.json();
      }
      setRun(runData);

      // Load stubs and find the matching one
      const stubsRes = await fetch(`${API_URL}/api/v1/payroll/runs/${runId}/stubs`, { headers: authHeaders() });
      if (!stubsRes.ok) {
        throw new Error(`Could not load pay stubs (HTTP ${stubsRes.status})`);
      }
      const stubsData = await stubsRes.json();
      const list = Array.isArray(stubsData) ? stubsData : (stubsData.stubs || stubsData.data || []);
      const found = list.find((s) => String(s.id) === String(stubId));
      if (!found) throw new Error("Pay stub not found");
      setStub(found);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [runId, stubId]);

  if (loading) {
    return (
      <div style={{ background: colors.bgPage, minHeight: "100vh", padding: `${spacing[10]}px` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center", paddingTop: spacing[12] }}>
          <Spinner size={20} label="Loading pay stub..." inline />
        </div>
      </div>
    );
  }

  if (error || !stub) {
    return (
      <div style={{
        background: colors.bgPage, minHeight: "100vh",
        fontFamily: typography.fontFamily,
        padding: `${spacing[8]}px ${spacing[10]}px`,
        boxSizing: "border-box",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <button onClick={() => navigate(`/payroll/runs/${runId}`)} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            ...typography.bodySm, color: colors.textSecondary,
            padding: 0, marginBottom: spacing[6],
            fontFamily: typography.fontFamily,
          }}>
            <ArrowLeft size={16} /> Back to pay run
          </button>
          <ErrorBlock title="Could not load pay stub" message={error || "Not found"} />
          <Button variant="secondary" onClick={load}>Try again</Button>
        </div>
      </div>
    );
  }

  const currency = stub.currency || run?.currency || "CAD";
  const status = (run?.status || stub.status || "draft").toLowerCase();

  // Defensive field accessors for the 43-col pay_stubs schema
  const regularHours = pick(stub, "regular_hours", "hours_regular");
  const regularPay = pick(stub, "regular_pay", "pay_regular");
  const overtimeHours = pick(stub, "overtime_hours", "hours_overtime", "ot_hours");
  const overtimePay = pick(stub, "overtime_pay", "ot_pay");
  const vacationHours = pick(stub, "vacation_hours", "hours_vacation");
  const vacationPay = pick(stub, "vacation_pay", "pay_vacation");
  const sickHours = pick(stub, "sick_hours", "hours_sick");
  const sickPay = pick(stub, "sick_pay", "pay_sick");
  const holidayHours = pick(stub, "stat_holiday_hours", "holiday_hours");
  const holidayPay = pick(stub, "stat_holiday_pay", "holiday_pay");
  const bonus = pick(stub, "bonus", "bonus_pay");
  const commission = pick(stub, "commission", "commission_pay");
  const reimbursement = pick(stub, "reimbursement", "reimbursements");
  const grossPay = pick(stub, "gross_pay", "total_gross", "gross") || 0;

  const federalTax = pick(stub, "federal_tax", "federal_income_tax", "tax_federal");
  const provincialTax = pick(stub, "provincial_tax", "state_tax", "tax_provincial", "tax_state");
  const cpp = pick(stub, "cpp_employee", "cpp", "social_security_employee", "social_security");
  const ei = pick(stub, "ei_employee", "ei", "medicare_employee", "medicare");
  const otherDed = pick(stub, "other_deductions", "additional_deductions");
  const totalDed = pick(stub, "total_deductions", "deductions", "employee_deductions") || 0;
  const netPay = pick(stub, "net_pay", "total_net", "net") || 0;

  const cppEr = pick(stub, "cpp_employer", "social_security_employer");
  const eiEr = pick(stub, "ei_employer", "medicare_employer");
  const wcb = pick(stub, "wcb_employer", "wcb", "workers_comp");
  const employerTotal = pick(stub, "employer_contributions", "total_employer_contributions") || 0;
  const remittance = pick(stub, "remittance_owed", "total_remittance_owed");

  const ytdGross = pick(stub, "ytd_gross", "ytd_gross_pay");
  const ytdRegular = pick(stub, "ytd_regular_pay", "ytd_regular");
  const ytdOT = pick(stub, "ytd_overtime_pay", "ytd_overtime");
  const ytdVacation = pick(stub, "ytd_vacation_pay", "ytd_vacation");
  const ytdSick = pick(stub, "ytd_sick_pay", "ytd_sick");
  const ytdHoliday = pick(stub, "ytd_stat_holiday_pay", "ytd_holiday");
  const ytdBonus = pick(stub, "ytd_bonus");
  const ytdCommission = pick(stub, "ytd_commission");
  const ytdFederal = pick(stub, "ytd_federal_tax");
  const ytdProvincial = pick(stub, "ytd_provincial_tax", "ytd_state_tax");
  const ytdCpp = pick(stub, "ytd_cpp_employee", "ytd_cpp");
  const ytdEi = pick(stub, "ytd_ei_employee", "ytd_ei");
  const ytdOther = pick(stub, "ytd_other_deductions");
  const ytdDed = pick(stub, "ytd_total_deductions", "ytd_deductions");
  const ytdNet = pick(stub, "ytd_net_pay", "ytd_net");

  const employeeRate = pick(stub, "hourly_rate", "pay_rate", "rate");

  return (
    <div style={{
      background: colors.bgPage,
      minHeight: "100vh",
      fontFamily: typography.fontFamily,
      padding: `${spacing[8]}px ${spacing[10]}px ${spacing[10]}px`,
      boxSizing: "border-box",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Back link */}
        <button onClick={() => navigate(`/payroll/runs/${runId}`)} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
          ...typography.bodySm, color: colors.textSecondary,
          padding: 0, marginBottom: spacing[3],
          fontFamily: typography.fontFamily,
        }}>
          <ArrowLeft size={16} /> Back to pay run
        </button>

        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: spacing[4],
          flexWrap: "wrap",
          marginBottom: spacing[8],
        }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{
              ...typography.tiny,
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 4,
            }}>Pay stub</div>
            <div style={{ display: "flex", alignItems: "center", gap: spacing[3], marginBottom: spacing[1] }}>
              <h1 style={{ ...typography.displaySm, color: colors.textPrimary, margin: 0 }}>
                {getStubName(stub)}
              </h1>
              <StatusPill status={status} />
            </div>
            <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>
              {formatDate(run?.pay_period_start || stub.pay_period_start)}
              {" to "}
              {formatDate(run?.pay_period_end || stub.pay_period_end)}
              {(run?.pay_date || stub.pay_date) && (
                <>{" · Pay date "}{formatDate(run?.pay_date || stub.pay_date)}</>
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => window.print()} iconLeft={<Printer size={14} />}>
              Print
            </Button>
          </div>
        </div>

        {/* Summary strip */}
        <Card style={{ marginBottom: spacing[5] }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: spacing[6],
          }}>
            <SummaryStat label="Gross pay" value={formatCurrency(grossPay, currency)} />
            <SummaryStat label="Deductions" value={formatCurrency(totalDed, currency)} />
            <SummaryStat label="Employer cost" value={formatCurrency(employerTotal, currency)} />
            <SummaryStat label="Net pay" value={formatCurrency(netPay, currency)} emphasis />
          </div>
        </Card>

        {/* Two-column grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: spacing[5],
          marginBottom: spacing[5],
        }}>

          {/* Earnings */}
          <Card noPadding>
            <div style={{ padding: spacing[6], borderBottom: `1px solid ${colors.borderSubtle}` }}>
              <CardHeader
                title="Earnings"
                subtitle="Hours, rate, current pay, and year to date"
                icon={<div style={iconWrapStyle}><Wallet size={18} color={colors.brandPrimary} /></div>}
              />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: typography.fontFamily }}>
                <thead>
                  <tr>
                    <th style={thLeft}>Item</th>
                    <th style={thRight}>Hours</th>
                    <th style={thRight}>Rate</th>
                    <th style={thRight}>Current</th>
                    <th style={thRight}>YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {(regularPay || regularHours) && (
                    <LineRow label="Regular pay" hours={regularHours} rate={employeeRate} current={regularPay} ytd={ytdRegular} currency={currency} />
                  )}
                  {(overtimePay || overtimeHours) && (
                    <LineRow label="Overtime" hours={overtimeHours} rate={employeeRate ? employeeRate * 1.5 : null} current={overtimePay} ytd={ytdOT} currency={currency} />
                  )}
                  {(holidayPay || holidayHours) && (
                    <LineRow label="Stat holiday" hours={holidayHours} rate={employeeRate} current={holidayPay} ytd={ytdHoliday} currency={currency} />
                  )}
                  {(vacationPay || vacationHours) && (
                    <LineRow label="Vacation" hours={vacationHours} rate={employeeRate} current={vacationPay} ytd={ytdVacation} currency={currency} />
                  )}
                  {(sickPay || sickHours) && (
                    <LineRow label="Sick" hours={sickHours} rate={employeeRate} current={sickPay} ytd={ytdSick} currency={currency} />
                  )}
                  {bonus > 0 && (
                    <LineRow label="Bonus" current={bonus} ytd={ytdBonus} currency={currency} />
                  )}
                  {commission > 0 && (
                    <LineRow label="Commission" current={commission} ytd={ytdCommission} currency={currency} />
                  )}
                  {reimbursement > 0 && (
                    <LineRow label="Reimbursement" current={reimbursement} currency={currency} />
                  )}
                  <LineRow label="Total gross" current={grossPay} ytd={ytdGross} bold currency={currency} />
                </tbody>
              </table>
            </div>
          </Card>

          {/* Deductions */}
          <Card noPadding>
            <div style={{ padding: spacing[6], borderBottom: `1px solid ${colors.borderSubtle}` }}>
              <CardHeader
                title="Employee deductions"
                subtitle="Taxes and other amounts withheld from gross pay"
                icon={<div style={iconWrapStyle}><MinusCircle size={18} color={colors.brandPrimary} /></div>}
              />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: typography.fontFamily }}>
                <thead>
                  <tr>
                    <th style={thLeft}>Item</th>
                    <th style={thRight}>Current</th>
                    <th style={thRight}>YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {federalTax !== null && <DeductionRow label="Federal income tax" current={federalTax} ytd={ytdFederal} currency={currency} />}
                  {provincialTax !== null && <DeductionRow label={(run?.country || stub.country) === "US" ? "State income tax" : "Provincial income tax"} current={provincialTax} ytd={ytdProvincial} currency={currency} />}
                  {cpp !== null && <DeductionRow label={(run?.country || stub.country) === "US" ? "Social Security" : "CPP"} current={cpp} ytd={ytdCpp} currency={currency} />}
                  {ei !== null && <DeductionRow label={(run?.country || stub.country) === "US" ? "Medicare" : "EI"} current={ei} ytd={ytdEi} currency={currency} />}
                  {otherDed !== null && otherDed > 0 && <DeductionRow label="Other deductions" current={otherDed} ytd={ytdOther} currency={currency} />}
                  <DeductionRow label="Total deductions" current={totalDed} ytd={ytdDed} bold currency={currency} />
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Net pay highlight */}
        <Card style={{
          background: colors.brandSoft,
          border: `1px solid ${colors.brandSoftStrong}`,
          marginBottom: spacing[5],
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: spacing[4],
            flexWrap: "wrap",
          }}>
            <div>
              <div style={{
                ...typography.tiny,
                color: colors.brandPrimary,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 6,
                fontWeight: 600,
              }}>
                Net pay this period
              </div>
              <div style={{
                fontSize: 36,
                fontWeight: 700,
                color: colors.brandPrimary,
                fontFeatureSettings: '"tnum" 1',
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}>
                {formatCurrency(netPay, currency)}
              </div>
            </div>
            {ytdNet !== null && (
              <div style={{ textAlign: "right" }}>
                <div style={{
                  ...typography.tiny, color: colors.textMuted,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  marginBottom: 6,
                }}>YTD net</div>
                <div style={{
                  ...typography.bodyStrong,
                  color: colors.textPrimary,
                  fontFeatureSettings: '"tnum" 1',
                  fontSize: 20,
                }}>{formatCurrency(ytdNet, currency)}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Employer contributions (informational) */}
        {employerTotal > 0 && (
          <Card noPadding>
            <div style={{ padding: spacing[6], borderBottom: `1px solid ${colors.borderSubtle}` }}>
              <CardHeader
                title="Employer contributions"
                subtitle="What the business pays on top of gross pay. Does not reduce employee net pay."
                icon={<div style={iconWrapStyle}><Building2 size={18} color={colors.brandPrimary} /></div>}
              />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: typography.fontFamily }}>
                <thead>
                  <tr>
                    <th style={thLeft}>Item</th>
                    <th style={thRight}>Current</th>
                  </tr>
                </thead>
                <tbody>
                  {cppEr !== null && <DeductionRow label={(run?.country || stub.country) === "US" ? "Employer Social Security" : "Employer CPP"} current={cppEr} currency={currency} />}
                  {eiEr !== null && <DeductionRow label={(run?.country || stub.country) === "US" ? "Employer Medicare" : "Employer EI"} current={eiEr} currency={currency} />}
                  {wcb !== null && wcb > 0 && <DeductionRow label="Workers comp / WCB" current={wcb} currency={currency} />}
                  <DeductionRow label="Total employer cost" current={employerTotal} bold currency={currency} />
                  {remittance !== null && remittance > 0 && (
                    <DeductionRow label="Remittance owed" current={remittance} currency={currency} />
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
