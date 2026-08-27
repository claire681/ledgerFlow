import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Info, Building2, ArrowLeft } from "lucide-react";
import { apiFetch } from "../utils/apiFetch";

// ---------------------------------------------------------------------------
// PaymentHistory
// All payments recorded in Novala. No status column until Phase 3
// (bank statement reconciliation) can confirm settlement.
// ---------------------------------------------------------------------------

const T = {
  ink:      "#0E1A1A",
  slate:    "#12262B",
  muted:    "#556",
  line:     "#F0F2F5",
  lineDark: "#E7EAF0",
  card:     "#FFFFFF",
  cardAlt:  "#FAFBFC",
  amberTint:"#FFF8E5",
  amberBorder: "#F0D775",
  amberInk: "#7A5B0F",
  amberDeep:"#5A430A",
};
const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'SF Mono', Menlo, Consolas, monospace";

function fmtMoney(v) {
  const n = typeof v === "number" ? v : parseFloat(String(v || 0));
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtPeriod(sourceRef) {
  if (!sourceRef) return "";
  // sourceRef is like "2026-08" — turn into "August 2026"
  if (/^\d{4}-\d{2}$/.test(sourceRef)) {
    const [year, month] = sourceRef.split("-");
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return sourceRef;
}

function obligationLabel(p) {
  const map = {
    "pd7a": "Payroll remittance",
    "gst_hst": "GST/HST remittance",
    "wcb": "WCB premium",
    "payroll": "Direct deposit",
  };
  return map[p.source_type] || p.source_name || "Payment";
}

function subLabel(p) {
  const period = fmtPeriod(p.source_ref);
  if (p.source_type === "pd7a") {
    return period ? period + " · PD7A" : "PD7A";
  }
  return period || "";
}

function methodLabel(p) {
  if (p.provider === "manual") return "Manual";
  if (p.provider === "vopay") return "Auto-pay (VoPay)";
  if (p.provider === "plooto") return "Auto-pay (Plooto)";
  return p.provider || "Manual";
}

export default function PaymentHistory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ["payments-history"],
    queryFn: async () => {
      const res = await apiFetch("/api/v1/payments");
      if (!res.ok) throw new Error("Failed to load payments");
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  const summary = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let monthAmt = 0, monthCount = 0;
    let ytdAmt = 0, ytdCount = 0;
    let lastPayment = null;

    for (const p of payments) {
      const d = new Date(p.payment_date);
      if (isNaN(d)) continue;
      const amt = parseFloat(String(p.amount || 0));

      if (d.getFullYear() === thisYear) {
        ytdAmt += amt;
        ytdCount += 1;
        if (d.getMonth() === thisMonth) {
          monthAmt += amt;
          monthCount += 1;
        }
      }
      if (!lastPayment || new Date(p.payment_date) > new Date(lastPayment.payment_date)) {
        lastPayment = p;
      }
    }

    return { monthAmt, monthCount, ytdAmt, ytdCount, lastPayment };
  }, [payments]);

  const filtered = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.trim().toLowerCase();
    return payments.filter(p => {
      const label = obligationLabel(p).toLowerCase();
      const sub = subLabel(p).toLowerCase();
      const amt = String(p.amount || "").toLowerCase();
      return label.includes(q) || sub.includes(q) || amt.includes(q);
    });
  }, [payments, search]);

  // Sort newest first
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date)),
    [filtered]
  );

  return (
    <div style={{
      maxWidth: "100%", margin: 0, padding: "28px 32px 90px",
      fontFamily: FONT, color: T.ink,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "transparent", border: 0, padding: "6px 10px 6px 6px",
            font: "inherit", fontSize: 12.5, fontWeight: 600,
            color: T.muted, cursor: "pointer", borderRadius: 6,
            marginBottom: 12, marginLeft: -6,
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.3px" }}>
          Payment history
        </h1>
        <div style={{ fontSize: 14, color: T.slate, marginTop: 4, fontWeight: 500 }}>
          All payments recorded in Novala
        </div>
      </div>

      {/* Banner about status tracking */}
      <div style={{
        background: T.amberTint,
        border: "1px solid " + T.amberBorder,
        color: T.amberInk,
        padding: "12px 16px",
        borderRadius: 8,
        marginBottom: 24,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1.5,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          <b style={{ color: T.amberDeep, fontWeight: 700 }}>Payments below reflect what Novala recorded, not confirmed bank settlement.</b>{" "}
          Bank statement reconciliation will add status tracking so you can see which payments actually left your bank.
        </span>
      </div>

      {/* Summary cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        marginBottom: 28,
        maxWidth: 720,
      }}>
        <SummaryCard
          label="This month"
          value={fmtMoney(summary.monthAmt)}
          sub={summary.monthCount === 1 ? "1 payment" : summary.monthCount + " payments"}
        />
        <SummaryCard
          label="Year to date"
          value={fmtMoney(summary.ytdAmt)}
          sub={summary.ytdCount === 1 ? "1 payment" : summary.ytdCount + " payments"}
        />
        <SummaryCard
          label="Last payment"
          value={summary.lastPayment ? fmtDate(summary.lastPayment.payment_date) : "—"}
          sub={summary.lastPayment ? obligationLabel(summary.lastPayment) : "No payments yet"}
          mono={false}
          smallValue
        />
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search
            size={14}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.muted }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by obligation or amount"
            style={{
              width: "100%",
              padding: "8px 14px 8px 32px",
              border: "1px solid " + T.lineDark,
              borderRadius: 8,
              font: "inherit",
              fontSize: 13,
              color: T.ink,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid " + T.lineDark, borderRadius: 10, overflow: "hidden", background: T.card }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>
            Loading payments...
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#8B1538", fontSize: 13 }}>
            Failed to load payments. Refresh to try again.
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: T.line,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: T.muted, marginBottom: 12,
            }}>
              <Building2 size={22} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: T.ink }}>
              {search ? "No payments match your search" : "No payments yet"}
            </h2>
            <p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>
              {search
                ? "Try a different search term."
                : "When you record a payment, it will show up here."}
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th style={{ width: 110 }}>Date</Th>
                <Th>Obligation</Th>
                <Th style={{ width: 160 }}>Method</Th>
                <Th style={{ width: 130, textAlign: "right" }}>Amount</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <Row key={p.id} p={p} first={i === 0} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sorted.length > 0 && (
        <div style={{
          marginTop: 14,
          fontSize: 12,
          color: T.muted,
          fontWeight: 500,
        }}>
          Showing {sorted.length} of {payments.length} payment{payments.length === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, smallValue = false }) {
  return (
    <div style={{
      background: T.cardAlt,
      border: "1px solid " + T.lineDark,
      borderRadius: 10,
      padding: "16px 18px",
    }}>
      <div style={{
        fontSize: 11.5, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: 0.5, color: T.muted, marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: smallValue ? 15 : 22,
        fontWeight: 700,
        fontFamily: smallValue ? "inherit" : MONO,
        color: T.ink,
        letterSpacing: smallValue ? 0 : "-0.5px",
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginTop: 4, fontWeight: 500 }}>
        {sub}
      </div>
    </div>
  );
}

function Th({ children, style = {} }) {
  return (
    <th style={{
      textAlign: "left",
      padding: "12px 16px",
      fontSize: 11.5,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      color: T.muted,
      background: T.cardAlt,
      borderBottom: "1px solid " + T.lineDark,
      ...style,
    }}>
      {children}
    </th>
  );
}

function Row({ p, first }) {
  const [hover, setHover] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: "default",
        background: hover ? T.cardAlt : "transparent",
        transition: "background .1s",
      }}
    >
      <td style={{
        padding: "14px 16px",
        fontSize: 12.5,
        color: T.muted,
        fontWeight: 500,
        borderTop: first ? "none" : "1px solid " + T.line,
      }}>
        {fmtDate(p.payment_date)}
      </td>
      <td style={{
        padding: "14px 16px",
        fontSize: 13.5,
        color: T.ink,
        borderTop: first ? "none" : "1px solid " + T.line,
      }}>
        <div style={{ fontWeight: 600 }}>{obligationLabel(p)}</div>
        <div style={{ color: T.muted, marginTop: 2, fontSize: 12.5, fontWeight: 500 }}>
          {subLabel(p)}
        </div>
      </td>
      <td style={{
        padding: "14px 16px",
        borderTop: first ? "none" : "1px solid " + T.line,
      }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12.5,
          color: T.slate,
          fontWeight: 600,
        }}>
          <span style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: T.line,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: T.slate,
          }}>
            <Building2 size={12} />
          </span>
          {methodLabel(p)}
        </span>
      </td>
      <td style={{
        padding: "14px 16px",
        textAlign: "right",
        fontFamily: MONO,
        fontSize: 13.5,
        fontWeight: 600,
        color: T.ink,
        borderTop: first ? "none" : "1px solid " + T.line,
      }}>
        {fmtMoney(p.amount)}
      </td>
    </tr>
  );
}
