import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, AlertCircle } from "lucide-react";
import { apiFetch } from "../../utils/apiFetch";

// ---------------------------------------------------------------------------
// HowToPayCRA (Executive / Stripe-style)
// Renders the confirmation view for a recorded payroll remittance.
// - Summary header with big amount + Recorded badge
// - iOS-style segmented control (Bank / CRA / Other)
// - Copy rows as horizontal dividers, no boxes
// ---------------------------------------------------------------------------

const T = {
  ink:      "#0E1A1A",
  slate:    "#12262B",
  muted:    "#556",
  line:     "#F0F2F5",
  lineDark: "#E7EAF0",
  card:     "#FFFFFF",
  seg:      "#F0F2F5",
  tealTint: "#E1F5EE",
  tealInk:  "#0F6E56",
  amberTint:"#FFF8E5",
  amberBorder: "#F0D775",
  amberInk: "#7A5B0F",
};
const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'SF Mono', Menlo, Consolas, monospace";

const BANKS = [
  { id: "rbc",    label: "RBC",    payeeName: "CANADA REVENUE AGENCY - PAYROLL & OTHER" },
  { id: "td",     label: "TD",     payeeName: "CANADA REVENUE AGENCY - TAX PAYROLL" },
  { id: "scotia", label: "Scotia", payeeName: "CANADA REVENUE AGENCY - PAYROLL DEDNS" },
  { id: "bmo",    label: "BMO",    payeeName: "CANADA REVENUE - PAYROLL & SOURCE DEDUCTIONS" },
  { id: "cibc",   label: "CIBC",   payeeName: "CANADA REVENUE AGENCY (BUSINESS) - PAYROLL" },
];

function parseAmount(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  return parseFloat(String(v).replace(/,/g, "")) || 0;
}

function fmtAmountForCopy(v) {
  return parseAmount(v).toFixed(2);
}

function fmtAmountDisplay(v) {
  const n = parseAmount(v);
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Ghost Copy Button ---
function CopyButton({ value, disabled }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button
      onClick={copy}
      disabled={disabled || !value}
      style={{
        background: "transparent",
        border: 0,
        color: copied ? T.tealInk : T.ink,
        padding: "4px 10px",
        font: "inherit",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: (disabled || !value) ? "not-allowed" : "pointer",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        gap: 5,
        transition: "background .12s",
      }}
      onMouseEnter={(e) => { if (!disabled && value) e.currentTarget.style.background = T.line; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {copied ? (
        <>
          <Check size={12} strokeWidth={3} />
          Copied
        </>
      ) : (
        <>
          <Copy size={12} strokeWidth={2} />
          Copy
        </>
      )}
    </button>
  );
}

function CopyRow({ label, value, last = false }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "14px 0",
      borderBottom: last ? "none" : "1px solid " + T.line,
    }}>
      <span style={{ fontSize: 12.5, color: T.muted, fontWeight: 500 }}>
        {label}
      </span>
      <span style={{
        flex: 1,
        textAlign: "right",
        fontFamily: MONO,
        fontSize: 14,
        fontWeight: 600,
        color: T.ink,
        overflowWrap: "anywhere",
      }}>
        {value || "—"}
      </span>
      <CopyButton value={value} />
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 13,
      fontWeight: 700,
      color: T.ink,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      margin: "20px 0 4px",
    }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HowToPayCRA({ obligation }) {
  const [tab, setTab] = useState("bank");
  const [selectedBankId, setSelectedBankId] = useState("rbc");

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await apiFetch("/api/v1/auth/me");
      if (!res.ok) throw new Error("Failed to load user");
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const selectedBank = BANKS.find(b => b.id === selectedBankId) || BANKS[0];
  const craAccount = user?.cra_payroll_account || "";
  const amountForCopy = fmtAmountForCopy(obligation?.amount);
  const amountDisplay = fmtAmountDisplay(obligation?.amount);

  return (
    <div style={{ fontFamily: FONT, color: T.ink, margin: "-22px -24px" }}>
      {/* Summary block */}
      <div style={{ padding: "24px 24px 22px", borderBottom: "1px solid " + T.line }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 14, color: T.slate, fontWeight: 500 }}>Payroll remittance</div>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: T.tealTint,
            color: T.tealInk,
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 700,
          }}>
            <Check size={11} strokeWidth={3} />
            Recorded
          </span>
        </div>
        <div style={{
          fontSize: 32,
          fontWeight: 700,
          fontFamily: MONO,
          color: T.ink,
          letterSpacing: "-0.5px",
        }}>
          {amountDisplay}
        </div>
        <div style={{
          fontSize: 12.5,
          color: T.slate,
          marginTop: 6,
          fontWeight: 500,
        }}>
          Statement of Account (PD7A) · {obligation?.liability || ""}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 24 }}>
        <div style={{
          fontSize: 14,
          color: T.slate,
          fontWeight: 500,
          marginBottom: 20,
          lineHeight: 1.55,
        }}>
          <b style={{ color: T.ink, fontWeight: 700 }}>Send this payment to CRA.</b>{" "}
          Novala has recorded it. You still need to actually pay, using one of the options below.
        </div>

        {/* Segmented control */}
        <div style={{
          display: "flex",
          gap: 0,
          background: T.seg,
          borderRadius: 10,
          padding: 4,
          marginBottom: 22,
        }}>
          {[
            { id: "bank",  label: "Bank bill pay" },
            { id: "cra",   label: "CRA My Payment" },
            { id: "other", label: "Other" },
          ].map((seg) => (
            <button
              key={seg.id}
              onClick={() => setTab(seg.id)}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: tab === seg.id ? T.card : "transparent",
                border: 0,
                font: "inherit",
                fontSize: 12.5,
                fontWeight: 600,
                color: tab === seg.id ? T.ink : T.slate,
                cursor: "pointer",
                borderRadius: 7,
                boxShadow: tab === seg.id ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                transition: "background .12s",
              }}
            >
              {seg.label}
            </button>
          ))}
        </div>

        {tab === "bank" && (
          <div>
            <div style={{
              fontSize: 12,
              color: T.muted,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 8,
            }}>
              Your bank
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              {BANKS.map(bank => (
                <div
                  key={bank.id}
                  onClick={() => setSelectedBankId(bank.id)}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid " + (bank.id === selectedBankId ? T.ink : "#C9CED6"),
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    color: bank.id === selectedBankId ? "#fff" : T.ink,
                    background: bank.id === selectedBankId ? T.ink : T.card,
                    cursor: "pointer",
                  }}
                >
                  {bank.label}
                </div>
              ))}
            </div>

            <SectionTitle>Log into your bank, then</SectionTitle>
            <CopyRow label="Payee" value={selectedBank.payeeName} />
            <CopyRow label="Account" value={craAccount} />
            <CopyRow label="Amount" value={amountForCopy} last={true} />

            {!craAccount && (
              <div style={{
                background: T.amberTint,
                border: "1px solid " + T.amberBorder,
                color: T.amberInk,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 500,
                marginTop: 12,
                lineHeight: 1.5,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <b>Missing your CRA payroll account number.</b> Add it in{" "}
                  <a href="/settings/company" style={{ color: T.amberInk, fontWeight: 700, textDecoration: "underline" }}>Settings → Company</a>{" "}
                  so it fills in automatically here.
                </span>
              </div>
            )}

            <div style={{
              fontSize: 12.5,
              color: T.muted,
              marginTop: 16,
              lineHeight: 1.5,
              fontWeight: 500,
            }}>
              After the first payment, your bank remembers the payee. Next month you'll only enter the amount.
            </div>
          </div>
        )}

        {tab === "cra" && (
          <div>
            <div style={{
              fontSize: 14,
              color: T.slate,
              lineHeight: 1.55,
              fontWeight: 500,
              marginBottom: 18,
            }}>
              CRA's free My Payment service uses Interac Online to pay directly from your bank
              account. Works with most major Canadian banks. Confirmation is instant.
            </div>

            <SectionTitle>You'll need</SectionTitle>
            <CopyRow label="Account" value={craAccount} />
            <CopyRow label="Amount" value={amountForCopy} last={true} />

            {!craAccount && (
              <div style={{
                background: T.amberTint,
                border: "1px solid " + T.amberBorder,
                color: T.amberInk,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 500,
                marginTop: 12,
                lineHeight: 1.5,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <b>Missing your CRA payroll account number.</b> Add it in{" "}
                  <a href="/settings/company" style={{ color: T.amberInk, fontWeight: 700, textDecoration: "underline" }}>Settings → Company</a>.
                </span>
              </div>
            )}

            <a
              href="https://www.canada.ca/en/revenue-agency/services/e-services/payment-save-time-pay-online.html"
              target="_blank"
              rel="noreferrer"
              style={{
                background: T.ink,
                color: "#fff",
                border: 0,
                borderRadius: 10,
                padding: "12px 18px",
                font: "inherit",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                marginTop: 18,
              }}
            >
              Open CRA My Payment
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        )}

        {tab === "other" && (
          <div>
            <SectionTitle>Pre-authorized debit (PAD)</SectionTitle>
            <div style={{ fontSize: 14, color: T.slate, lineHeight: 1.6, fontWeight: 500, marginBottom: 6 }}>
              Set up once via CRA My Business Account. CRA pulls the amount from your bank
              on the date you specify. Best for recurring predictable payments.
            </div>
            <a
              href="https://www.canada.ca/en/revenue-agency/services/my-business-account.html"
              target="_blank"
              rel="noreferrer"
              style={{ color: T.ink, fontSize: 13.5, fontWeight: 700, textDecoration: "underline" }}
            >
              Set up PAD
            </a>

            <SectionTitle>Cheque by mail</SectionTitle>
            <div style={{ fontSize: 14, color: T.slate, lineHeight: 1.6, fontWeight: 500 }}>
              Print the PD7A voucher, make the cheque payable to <i>Receiver General</i>,
              and mail to Sudbury Tax Centre. Slowest option, but works if your bank is offline.
            </div>

            <SectionTitle>In person</SectionTitle>
            <div style={{ fontSize: 14, color: T.slate, lineHeight: 1.6, fontWeight: 500 }}>
              Pay at any Canadian financial institution with the PD7A voucher. Fees may apply.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
