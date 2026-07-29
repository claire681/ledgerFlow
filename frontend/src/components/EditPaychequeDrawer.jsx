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

function EditPaychequeDrawer({ runId, employeeId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paySectionOpen, setPaySectionOpen] = useState(true);
  const [empTaxesOpen, setEmpTaxesOpen] = useState(true);
  const [erTaxesOpen, setErTaxesOpen] = useState(true);

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
      if (e.key === "Escape") onClose && onClose();
    }
    document.addEventListener("keydown", onKey);
    return function() { document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1199, fontFamily: FONT }}>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: C.scrim,
          zIndex: 1199,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed",
        top: 64,
        left: 0,
        right: 0,
        bottom: 0,
        background: C.white,
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
      }}>

        {/* Top bar */}
        <div style={{
          height: 56,
          background: C.page,
          borderBottom: "1px solid " + C.line,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 16,
          padding: "0 24px",
          flexShrink: 0,
        }}>
          <button
            onClick={function() { window.location.href = "mailto:support@getnovala.com?subject=Help with editing a paycheque"; }}
            aria-label="Help"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HelpCircle size={20} strokeWidth={2} stroke={C.ink} />
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} strokeWidth={2} stroke={C.ink} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 32px 40px",
          background: C.white,
        }}>
          {loading && (
            <div style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>Loading paycheque...</div>
          )}

          {error && (
            <div>
              <div style={{ fontSize: 16, color: C.ink, fontWeight: 700, marginBottom: 4 }}>
                Could not load this paycheque.
              </div>
              <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{error}</div>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Summary block */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 32,
              }}>
                <div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: C.ink,
                    marginBottom: 6,
                  }}>PAY TO</div>
                  <div style={{
                    fontSize: 30,
                    fontWeight: 700,
                    color: C.ink,
                    lineHeight: 1.15,
                  }}>{data.employee.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: C.ink,
                    marginBottom: 6,
                  }}>NET PAY</div>
                  <div style={{
                    fontSize: 38,
                    fontWeight: 700,
                    color: C.ink,
                    fontVariantNumeric: "tabular-nums",
                  }}>{fmtMoney(data.net_pay)}</div>
                </div>
              </div>

              {/* Meta grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "24px 32px",
                marginBottom: 40,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Employee address</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.6 }}>
                    {data.employee.address_line1 || "Not set"}
                    {data.employee.address_line2 && (<><br />{data.employee.address_line2}</>)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Pay date</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.6, fontVariantNumeric: "tabular-nums" }}>
                    {fmtDate(data.pay_run.pay_date)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 16, marginBottom: 4 }}>Paid from</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.6 }}>
                    {data.company.paid_from}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Pay period</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.6, fontVariantNumeric: "tabular-nums" }}>
                    {fmtDate(data.pay_run.pay_period_start)} to {fmtDate(data.pay_run.pay_period_end)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 16, marginBottom: 4 }}>Paid by</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.6, fontVariantNumeric: "tabular-nums" }}>
                    Cheque ({fmtMoney(data.net_pay)})
                  </div>
                </div>
              </div>

              {/* PAY SECTION */}
              <SectionHeader open={paySectionOpen} onClick={function() { setPaySectionOpen(!paySectionOpen); }} label="Pay" />
              {paySectionOpen && (
                <PayTable earnings={data.earnings} />
              )}

              {/* EMPLOYEE TAXES SECTION */}
              <SectionHeader open={empTaxesOpen} onClick={function() { setEmpTaxesOpen(!empTaxesOpen); }} label="Employee taxes" />
              {empTaxesOpen && (
                <TaxTable rows={data.employee_taxes} showTotal={true} />
              )}

              {/* EMPLOYER TAXES SECTION */}
              <SectionHeader open={erTaxesOpen} onClick={function() { setErTaxesOpen(!erTaxesOpen); }} label="Employer taxes" />
              {erTaxesOpen && (
                <TaxTable rows={data.employer_taxes} showTotal={true} />
              )}

              {/* MEMO */}
              <div style={{ marginTop: 40 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Memo</div>
                <textarea
                  defaultValue={data.memo || ""}
                  maxLength={1000}
                  style={{
                    width: 430,
                    minHeight: 190,
                    padding: 12,
                    border: "1.5px solid " + C.ink,
                    borderRadius: 8,
                    fontSize: 14,
                    color: C.ink,
                    fontFamily: FONT,
                    resize: "vertical",
                    background: C.white,
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          height: 72,
          background: C.white,
          borderTop: "1px solid " + C.line,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              background: C.white,
              border: "1.5px solid " + C.ink,
              borderRadius: 10,
              color: C.ink,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            Close
          </button>
          <button
            disabled
            style={{
              padding: "10px 16px",
              background: C.inkDark,
              border: "none",
              borderRadius: 10,
              color: C.white,
              fontSize: 14,
              fontWeight: 700,
              cursor: "not-allowed",
              fontFamily: FONT,
              opacity: 0.45,
              boxShadow: "0 1px 2px rgba(18,38,43,0.12)",
            }}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader(props) {
  const Icon = props.open ? ChevronDown : ChevronRight;
  return (
    <button
      onClick={props.onClick}
      aria-expanded={props.open}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 40,
        marginBottom: 16,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        fontFamily: FONT,
      }}
    >
      <Icon size={18} strokeWidth={2.5} stroke={C.ink} />
      <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>{props.label}</div>
    </button>
  );
}

function PayTable(props) {
  const earnings = props.earnings || [];
  const total = earnings.reduce(function(sum, r) { return sum + Number(r.current || 0); }, 0);
  const ytdTotal = earnings.reduce(function(sum, r) { return sum + Number(r.ytd || 0); }, 0);
  const gridCols = "minmax(0, 1fr) 140px 100px 140px 140px";

  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: gridCols,
        columnGap: 24,
        paddingBottom: 12,
        borderBottom: "1px solid " + C.line,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: C.ink,
      }}>
        <div>Type</div>
        <div style={{ textAlign: "right" }}>Hours</div>
        <div style={{ textAlign: "right" }}>Rate</div>
        <div style={{ textAlign: "right" }}>Current</div>
        <div style={{ textAlign: "right" }}>YTD</div>
      </div>

      {earnings.map(function(row, idx) {
        return (
          <div key={idx} style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            columnGap: 24,
            padding: "16px 0",
            borderBottom: "1px solid " + C.line,
            alignItems: "center",
            fontSize: 14,
            color: C.ink,
            fontWeight: 500,
            minHeight: 56,
          }}>
            <div>{row.type}</div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {row.hours !== null && row.hours !== undefined ? Number(row.hours).toFixed(2) : ""}
            </div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {row.rate !== null && row.rate !== undefined ? fmtMoney(row.rate) : ""}
            </div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(row.current)}</div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(row.ytd)}</div>
          </div>
        );
      })}

      <div style={{
        display: "grid",
        gridTemplateColumns: gridCols,
        columnGap: 24,
        padding: "16px 0",
        background: C.page,
        alignItems: "center",
        fontSize: 14,
        color: C.ink,
        fontWeight: 700,
      }}>
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
  const total = rows.reduce(function(sum, r) { return sum + Number(r.current || 0); }, 0);
  const ytdTotal = rows.reduce(function(sum, r) { return sum + Number(r.ytd || 0); }, 0);
  const gridCols = "minmax(0, 1fr) 220px 140px";

  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: gridCols,
        columnGap: 24,
        paddingBottom: 12,
        borderBottom: "1px solid " + C.line,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: C.ink,
      }}>
        <div>Type</div>
        <div style={{ textAlign: "right" }}>Current</div>
        <div style={{ textAlign: "right" }}>YTD</div>
      </div>

      {rows.map(function(row, idx) {
        return (
          <div key={idx} style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            columnGap: 24,
            padding: "16px 0",
            borderBottom: "1px solid " + C.line,
            alignItems: "center",
            fontSize: 14,
            color: C.ink,
            fontWeight: 500,
            minHeight: 56,
          }}>
            <div>{row.type}</div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(row.current)}</div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(row.ytd)}</div>
          </div>
        );
      })}

      {props.showTotal && (
        <div style={{
          display: "grid",
          gridTemplateColumns: gridCols,
          columnGap: 24,
          padding: "16px 0",
          background: C.page,
          alignItems: "center",
          fontSize: 14,
          color: C.ink,
          fontWeight: 700,
        }}>
          <div style={{ paddingLeft: 12 }}>Total</div>
          <div style={{ textAlign: "right", paddingRight: 12, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(total)}</div>
          <div style={{ textAlign: "right", paddingRight: 12, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(ytdTotal)}</div>
        </div>
      )}
    </div>
  );
}

export default EditPaychequeDrawer;
