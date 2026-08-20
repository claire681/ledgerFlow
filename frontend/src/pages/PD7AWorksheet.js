import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Printer, Download } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const authHeaders = () => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : "",
  };
};

const INK = "#000000";
const DARK = "#1A2332";
const TEAL_INK = "#0B7377";

function money(n) {
  const v = Number(n) || 0;
  return "$" + v.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDMY(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function PD7AWorksheet() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_URL}/api/v1/payroll/taxes/archived-forms/${id}`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        setForm(data);
        setLoading(false);
      })
      .catch((e) => {
        setError("Could not load form: " + e.message);
        setLoading(false);
      });
  }, [id]);

  const fd = (form && form.form_data) || {};
  const company = fd.company || {};

  // Derive period month and year from period_end
  let periodYear = "";
  let periodMonth = "";
  if (form && form.period_end) {
    const d = new Date(form.period_end);
    if (!isNaN(d.getTime())) {
      periodYear = d.getFullYear();
      periodMonth = String(d.getMonth() + 1).padStart(2, "0");
    }
  }

  return (
    <div style={{
      background: "#E5E7EB",
      minHeight: "100vh",
      padding: "24px 24px 60px",
      fontFamily: "Inter, 'Plus Jakarta Sans', sans-serif",
      color: INK,
      fontSize: 14,
      fontWeight: 500,
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <a
          onClick={() => navigate("/payroll/taxes/archived")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: TEAL_INK,
            fontWeight: 700,
            marginBottom: 14,
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          Back to Archived forms
        </a>

        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginBottom: 16,
          maxWidth: 850,
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          <button
            onClick={() => window.print()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 14px",
              borderRadius: 8,
              background: "white",
              border: "1px solid #D1D5DB",
              color: INK,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Printer size={14} strokeWidth={2.5} />
            Print
          </button>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 14px",
              borderRadius: 8,
              background: "#0E1A1A",
              border: "1px solid #0E1A1A",
              color: "white",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              opacity: 0.5,
            }}
            title="PDF export coming soon"
            disabled
          >
            <Download size={14} strokeWidth={2.5} />
            Download PDF
          </button>
        </div>

        {loading && (
          <div style={paperStyle(true)}>
            <div style={{ textAlign: "center", padding: 100, color: DARK, fontWeight: 600 }}>
              Loading...
            </div>
          </div>
        )}

        {error && (
          <div style={paperStyle(true)}>
            <div style={{
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#991B1B",
              fontSize: 13,
              fontWeight: 600,
            }}>
              {error}
            </div>
          </div>
        )}

        {form && !loading && (
          <div style={paperStyle(false)}>
            <div style={watermarkStyle}>DO NOT SUBMIT WORKSHEET TO CRA</div>

            {/* CRA-style header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              paddingBottom: 12,
              borderBottom: "2px solid " + INK,
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: INK, lineHeight: 1.3 }}>
                Canada Revenue<br />Agency
                <div style={{ color: INK, marginTop: 3 }}>Agence du revenu<br />du Canada</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: INK, lineHeight: 1.4, fontWeight: 700 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>PD7A</div>
                Statement of Account for<br />
                Current Source Deductions<br />
                (Régulier / Regular)
              </div>
            </div>

            <h2 style={{
              textAlign: "center",
              fontSize: 20,
              fontWeight: 700,
              margin: "12px 0 6px",
              color: INK,
              letterSpacing: "0.3px",
            }}>
              Current Period Worksheet
            </h2>
            <div style={{
              textAlign: "center",
              fontSize: 13,
              color: INK,
              fontWeight: 600,
              margin: "0 auto 26px",
              maxWidth: 560,
            }}>
              Use the amounts below to make your PD7A remittance to CRA for the current period.
            </div>

            <SectionLabel>Summary for the current remittance period</SectionLabel>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 8 }}>
              <tbody>
                <tr>
                  <TableCell label="CPP contributions" value={money(fd.cpp_contributions)} />
                  <TableCell label="EI premiums" value={money(fd.ei_premiums)} />
                  <TableCell label="Tax deductions" value={money(fd.tax_deductions)} />
                  <TableCell label="Current payment" value={money(fd.current_payment)} />
                  <TableCell label="Gross payroll" value={money(fd.gross_payroll)} />
                  <TableCell label="No. of employees" value={fd.employee_count || 0} />
                </tr>
              </tbody>
            </table>

            <SectionLabel>How to pay CRA</SectionLabel>
            <div style={{ fontSize: 12, color: INK, fontWeight: 600, lineHeight: 1.6, margin: "14px 0" }}>
              <ol style={{ paddingLeft: 22, margin: "8px 0" }}>
                <li style={{ marginBottom: 6 }}>
                  <strong>Copy the amounts above</strong> - you will need CPP contributions, EI premiums, tax deductions, and current payment.
                </li>
                <li style={{ marginBottom: 6 }}>
                  <strong>Choose how to pay CRA</strong> (any of these):
                  <ul style={{ paddingLeft: 20, margin: "6px 0" }}>
                    <li style={{ marginBottom: 3 }}>
                      Online banking - add "CRA - Payroll Deductions" as a payee, use your business number{" "}
                      {company.business_number || "746043769"}
                    </li>
                    <li style={{ marginBottom: 3 }}>
                      CRA My Business Account at canada.ca/my-cra-business-account
                    </li>
                    <li style={{ marginBottom: 3 }}>
                      CRA My Payment at canada.ca/cra-my-payment (Interac or Visa Debit)
                    </li>
                    <li style={{ marginBottom: 3 }}>
                      Mail the personalized PD7A voucher CRA sent you, if you have one, with a cheque
                    </li>
                  </ul>
                </li>
                <li>
                  Payment is due by the <strong>15th of the month following</strong> the end of the remitting period.
                </li>
              </ol>
            </div>

            {/* Scissors separator */}
            <div style={{
              borderTop: "2px dashed " + INK,
              margin: "30px 0 26px",
              position: "relative",
            }}>
              <span style={{
                position: "absolute",
                top: -12,
                left: 20,
                background: "white",
                padding: "0 6px",
                fontSize: 16,
                color: INK,
              }}>✂</span>
            </div>

            <div style={{
              textAlign: "center",
              fontSize: 15,
              fontWeight: 700,
              margin: "0 0 20px",
              color: INK,
              letterSpacing: "0.3px",
            }}>
              Current Source Deductions Remittance Voucher
            </div>

            {/* Voucher block */}
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <Box style={{ flex: 2 }}>
                <BoxLabel>Account number</BoxLabel>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: INK,
                  fontVariantNumeric: "tabular-nums",
                  textAlign: "left",
                  marginTop: 4,
                }}>
                  {company.account_number_formatted || "-- -- -- -- --"}
                </div>
              </Box>
              <Box>
                <BoxLabel>Do not use this area</BoxLabel>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <span style={{ border: "1px solid " + INK, width: 24, height: 20 }} />
                  <span style={{ border: "1px solid " + INK, width: 24, height: 20 }} />
                </div>
              </Box>
            </div>

            <Box style={{ width: "100%", marginBottom: 12 }}>
              <BoxLabel>Gross payroll in remitting period (dollars only)</BoxLabel>
              <div style={boxValueStyle}>{money(fd.gross_payroll)}</div>
            </Box>

            <div style={{
              padding: "10px 12px",
              border: "1px solid " + INK,
              marginBottom: 12,
              fontSize: 12,
              color: INK,
              fontWeight: 600,
              lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {company.name || "Company name"}
              </div>
              <div>{company.address_street || ""}</div>
              <div>
                {company.address_city ? company.address_city + " " : ""}
                {company.address_province ? company.address_province + " " : ""}
                {company.address_postal || ""}
              </div>
              <div>Canada</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <Box>
                <BoxLabel>Number of employees in last pay period</BoxLabel>
                <div style={{ ...boxValueStyle, fontSize: 20 }}>{fd.employee_count || 0}</div>
              </Box>
              <Box>
                <BoxLabel>End of remitting period</BoxLabel>
                <div style={{
                  display: "flex",
                  gap: 16,
                  justifyContent: "flex-end",
                  alignItems: "flex-end",
                  marginTop: 6,
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: INK, fontWeight: 700, textTransform: "uppercase" }}>
                      Year
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>
                      {periodYear}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: INK, fontWeight: 700, textTransform: "uppercase" }}>
                      Month
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>
                      {periodMonth}
                    </div>
                  </div>
                </div>
              </Box>
            </div>

            <div style={{
              border: "2px solid " + INK,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: INK,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}>
                Amount paid
              </div>
              <div style={{
                fontSize: 22,
                fontWeight: 700,
                color: INK,
                fontVariantNumeric: "tabular-nums",
              }}>
                {money(fd.current_payment)}
              </div>
            </div>

            {/* Signature lines */}
            <div style={{ marginTop: 30, display: "flex", gap: 40 }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  borderBottom: "1px solid " + INK,
                  height: 22,
                  marginTop: 14,
                }} />
                <div style={{ fontSize: 10, color: INK, fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>
                  Authorized signature
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  borderBottom: "1px solid " + INK,
                  height: 22,
                  marginTop: 14,
                }} />
                <div style={{ fontSize: 10, color: INK, fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>
                  Date (YYYY-MM-DD)
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 28,
              paddingTop: 14,
              borderTop: "1px solid " + INK,
              fontSize: 10,
              color: INK,
              fontWeight: 600,
              lineHeight: 1.6,
              textAlign: "center",
            }}>
              This worksheet is generated by Novala for your records only. Do not submit it to CRA.
              Most employers pay through online banking or CRA My Business Account.
              If CRA mailed you a personalized PD7A voucher, you can use that too.
              <br />
              Generated on {formatDMY(form.archived_at)} · Novala Payroll
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function paperStyle(isLoading) {
  return {
    background: "white",
    width: 850,
    minHeight: isLoading ? 400 : 1100,
    margin: "0 auto",
    padding: 72,
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    color: INK,
  };
}

const watermarkStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%) rotate(-25deg)",
  fontSize: 44,
  fontWeight: 700,
  color: "rgba(18, 38, 43, 0.08)",
  whiteSpace: "nowrap",
  pointerEvents: "none",
  letterSpacing: 2,
};

const boxValueStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: INK,
  fontVariantNumeric: "tabular-nums",
  textAlign: "right",
  marginTop: 4,
};

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 13,
      fontWeight: 700,
      color: INK,
      margin: "22px 0 10px",
      textTransform: "uppercase",
      letterSpacing: "0.6px",
      borderBottom: "1px solid " + INK,
      paddingBottom: 4,
    }}>
      {children}
    </div>
  );
}

function TableCell({ label, value }) {
  return (
    <td style={{
      border: "1px solid " + INK,
      padding: "10px 10px 24px",
      verticalAlign: "top",
      width: "16.66%",
    }}>
      <div style={{ color: INK, fontWeight: 700, fontSize: 11 }}>{label}</div>
      <div style={{
        textAlign: "right",
        fontWeight: 700,
        fontSize: 15,
        marginTop: 8,
        color: INK,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
    </td>
  );
}

function Box({ children, style }) {
  return (
    <div style={{
      border: "1px solid " + INK,
      padding: "8px 10px",
      flex: 1,
      ...(style || {}),
    }}>
      {children}
    </div>
  );
}

function BoxLabel({ children }) {
  return (
    <div style={{
      fontSize: 10,
      color: INK,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.4px",
      marginBottom: 6,
    }}>
      {children}
    </div>
  );
}