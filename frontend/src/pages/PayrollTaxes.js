import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Filter, Printer, FileText, History, Archive,
  ChevronDown, CheckCircle2, Clock, AlertTriangle,
  X, HelpCircle,
} from "lucide-react";

import ResourcesDrawer from "../components/payroll/ResourcesDrawer";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const authHeaders = () => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : "",
  };
};

// Design tokens (from spec)
const TOKENS = {
  teal: "#15A08C",
  tealHover: "#0F8474",
  tealTint: "#E1F5EE",
  tealInk: "#0F6E56",
  slate: "#12262B",
  muted: "#66748B",
  faint: "#8A94A6",
  bg: "#F4F6F8",
  card: "#FFFFFF",
  line: "#E7EAF0",
  lineStrong: "#D5DBE3",
  ink: "#0E1A1A",
  amber: "#B7791F",
  amberTint: "#FDF3E2",
  amberLine: "#F1DDB8",
};

const money = (n) => {
  const v = Number(n) || 0;
  return "$" + v.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function PayrollTaxes() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine tab from URL: /payroll/taxes/payments (default) or /payroll/taxes/filings
  const tabFromUrl = location.pathname.endsWith("/filings") ? "filings" : "payments";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [pd7a, setPd7a] = useState(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load PD7A for current month on mount
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    setLoading(true);
    setError("");
    fetch(
      `${API_URL}/api/v1/payroll/taxes/pd7a?year=${year}&month=${month}`,
      { headers: authHeaders() }
    )
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        setPd7a(data);
        setLoading(false);
      })
      .catch((e) => {
        setError("Could not load remittance: " + e.message);
        setLoading(false);
      });
  }, []);

  const switchTab = (name) => {
    setActiveTab(name);
    navigate(`/payroll/taxes/${name}`, { replace: true });
  };

  return (
    <div style={{
      background: TOKENS.bg,
      minHeight: "100vh",
      fontFamily: "Inter, 'Plus Jakarta Sans', sans-serif",
      color: TOKENS.slate,
      fontSize: 14,
      lineHeight: 1.5,
    }}>
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "24px 24px 60px" }}>
        {/* Header */}
        <h1 style={{
          fontSize: 24, fontWeight: 600, margin: 0, color: TOKENS.slate,
        }}>
          Payroll taxes
        </h1>

        {/* Tabs */}
        <div style={{
          borderBottom: "1px solid " + TOKENS.line,
          marginTop: 16, display: "flex", gap: 26,
        }}>
          <button
            onClick={() => switchTab("payments")}
            style={{
              padding: "10px 2px",
              background: "none", border: "none",
              borderBottom: activeTab === "payments"
                ? "2px solid " + TOKENS.teal
                : "2px solid transparent",
              color: activeTab === "payments" ? TOKENS.tealInk : TOKENS.muted,
              fontWeight: activeTab === "payments" ? 600 : 400,
              fontSize: 15, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Payments
          </button>
          <button
            onClick={() => switchTab("filings")}
            style={{
              padding: "10px 2px",
              background: "none", border: "none",
              borderBottom: activeTab === "filings"
                ? "2px solid " + TOKENS.teal
                : "2px solid transparent",
              color: activeTab === "filings" ? TOKENS.tealInk : TOKENS.muted,
              fontWeight: activeTab === "filings" ? 600 : 400,
              fontSize: 15, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Filings
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "payments" && (
          <PaymentsTab pd7a={pd7a} loading={loading} error={error} navigate={navigate} onResourcesOpen={() => setResourcesOpen(true)} />
        )}
        {activeTab === "filings" && (
          <FilingsTab navigate={navigate} onResourcesOpen={() => setResourcesOpen(true)} />
        )}

        <ResourcesDrawer
          open={resourcesOpen}
          onClose={() => setResourcesOpen(false)}
          onNavigate={(path) => navigate(path)}
          country="CA"
        />
      </div>
    </div>
  );
}

// ============================================================
// Payments tab
// ============================================================

function PaymentsTab({ pd7a, loading, error, navigate, onResourcesOpen }) {
  const hasData = pd7a && pd7a.paycheque_count > 0;
  const currentPayment = pd7a ? pd7a.current_payment : 0;
  const dueDateDisplay = pd7a ? pd7a.due_date_display : "";
  const status = pd7a ? pd7a.status : "no_activity";
  const periodLabel = pd7a ? pd7a.period_label : "";

  return (
    <>
      {/* Metrics strip */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        marginTop: 18,
      }}>
        <MetricCard
          label="Due now"
          value={loading ? "Loading..." : money(hasData ? currentPayment : 0)}
        />
        <MetricCard
          label="Next payment due"
          value={loading ? "Loading..." : (hasData ? dueDateDisplay : "None")}
        />
        <MetricCard
          label="Upcoming filings"
          value="3"
        />
      </div>

      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginTop: 16, position: "relative",
      }}>
        <ToolbarBtn bordered icon={<Filter size={14} />} label="Filter" />
        <div style={{ flex: 1 }} />
        <ToolbarBtn icon={<Printer size={14} />} label="Print" />
        <ToolbarBtn icon={<FileText size={14} />} label="Resources" onClick={onResourcesOpen} />
        <ToolbarBtn icon={<History size={14} />} label="Payment history" />
      </div>

      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FCA5A5",
          borderRadius: 8, padding: "10px 12px", marginTop: 14,
          color: "#991B1B", fontSize: 13, fontWeight: 600,
        }}>
          {error}
        </div>
      )}

      {/* Action needed */}
      <SectionHeader label="Action needed" count={hasData ? 1 : 0} />
      {hasData ? (
        <ObligationCard
          title="Federal taxes"
          sub={periodLabel}
          statusPill={
            status === "ready_to_pay" ? "ready" :
            status === "overdue" ? "overdue" :
            "wait"
          }
          statusText={
            status === "ready_to_pay" ? "Ready to pay" :
            status === "overdue" ? "Overdue" :
            "Waiting"
          }
          dueLine={"Due " + dueDateDisplay}
          amount={money(currentPayment)}
          byLine={"Pay by " + dueDateDisplay}
          onPay={() => navigate("/payroll/taxes/archived")}
        />
      ) : (
        <EmptyState text="No remittance due this month." />
      )}

      {/* Coming up */}
      <SectionHeader label="Coming up" count={0} />
      <EmptyState text="Nothing coming up. You are all clear." />

      {/* Scheduled */}
      <SectionHeader label="Scheduled" count={0} />
      <EmptyState text="No scheduled payments yet." />

      {/* Payment resources */}
      <SectionHeader label="Payment resources" />
      <ResourceList
        items={[
          { title: "Record tax payments", desc: "Add or update tax payments made outside of Novala." },
          { title: "All payment resources", desc: "Payment history, tax liabilities, and other reports." },
          { title: "Remittance forms (twice a month)", desc: "Threshold 1 payroll remittances, source deductions, and company contributions." },
          { title: "Remittance forms (four times a month)", desc: "Threshold 2 payroll remittances, source deductions, and company contributions." },
          { title: "Remittance forms (monthly)", desc: "Monthly payroll remittance, source deductions, and company contributions." },
          { title: "Remittance forms (quarterly)", desc: "Quarterly payroll remittance, source deductions, and company contributions." },
        ]}
      />
    </>
  );
}

// ============================================================
// Filings tab (placeholder cards for T4 slips)
// ============================================================

function FilingsTab({ navigate, onResourcesOpen }) {
  const currentYear = new Date().getFullYear();
  const t4DueDate = "01/03/" + (currentYear + 1);

  return (
    <>
      <div style={{
        background: TOKENS.amberTint,
        border: "1px solid " + TOKENS.amberLine,
        borderRadius: 12, padding: "14px 16px",
        display: "flex", gap: 12, marginTop: 18,
      }}>
        <div style={{ color: TOKENS.amber }}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "#8A5A0C", fontSize: 14 }}>
            Select a dental benefits code for each employee
          </div>
          <div style={{ color: TOKENS.muted, fontSize: 13, marginTop: 2 }}>
            The CRA needs to know who has access to any dental benefits you offer. This info is required to file T4 slips. Add it on each employee's deductions and contributions page. <a style={{ color: TOKENS.teal, cursor: "pointer" }}>Find out more</a>
          </div>
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginTop: 16, position: "relative",
      }}>
        <ToolbarBtn bordered icon={<Filter size={14} />} label="Filter" />
        <div style={{ flex: 1 }} />
        <ToolbarBtn icon={<Printer size={14} />} label="Print" />
        <ToolbarBtn icon={<FileText size={14} />} label="Resources" onClick={onResourcesOpen} />
        <ToolbarBtn
          icon={<Archive size={14} />}
          label="Archive"
          onClick={() => navigate("/payroll/taxes/archived")}
        />
      </div>

      <SectionHeader label="Action needed" count={0} />
      <EmptyState text="You are all caught up." />

      <SectionHeader label="Coming up" count={3} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <FilingCard
          title="T4 summary"
          sub={"01/01/" + currentYear + " to 31/12/" + currentYear}
          dueLine={"Due " + t4DueDate}
          method="Manually file"
        />
        <FilingCard
          title="T4 employer slips"
          sub="Employer copy of T4 slips"
          dueLine={"Due " + t4DueDate}
          method="Manually file with XML"
        />
        <FilingCard
          title="T4 employee slips"
          sub="T4 slip for employee"
          dueLine={"Due " + t4DueDate}
          method="Manually file"
        />
      </div>

      <SectionHeader label="Done" count={0} />
      <EmptyState text="Completed filings will show up here." />

      <SectionHeader label="Filing resources" />
      <ResourceList
        items={[
          { title: "Record of employment", desc: "The ROEs you have created for your employees." },
          { title: "Archived forms and filings", desc: "Completed tax filings and forms ready to view and print.", onClick: () => navigate("/payroll/taxes/archived") },
          { title: "All filings resources", desc: "Tax filings, federal tax forms, and other compliance resources." },
        ]}
      />
    </>
  );
}

// ============================================================
// Sub-components
// ============================================================

function MetricCard({ label, value }) {
  return (
    <div style={{
      background: TOKENS.card,
      border: "1px solid " + TOKENS.line,
      borderRadius: 12,
      padding: "14px 16px",
    }}>
      <div style={{ fontSize: 13, color: TOKENS.muted }}>{label}</div>
      <div style={{
        fontSize: 24, fontWeight: 600, marginTop: 3,
        color: TOKENS.slate, fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
    </div>
  );
}

function ToolbarBtn({ icon, label, bordered, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        background: bordered ? TOKENS.card : "none",
        border: bordered ? "1px solid " + TOKENS.lineStrong : "none",
        color: bordered ? TOKENS.slate : TOKENS.muted,
        fontFamily: "inherit", fontSize: 13,
        cursor: "pointer", padding: "8px 11px",
        borderRadius: 8,
      }}
      onMouseEnter={(e) => {
        if (!bordered) {
          e.currentTarget.style.background = "#EEF1F4";
          e.currentTarget.style.color = TOKENS.slate;
        }
      }}
      onMouseLeave={(e) => {
        if (!bordered) {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = TOKENS.muted;
        }
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionHeader({ label, count }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 600, color: TOKENS.muted,
      letterSpacing: "0.2px", margin: "26px 0 10px",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {label}
      {count !== undefined && (
        <span style={{
          background: TOKENS.bg,
          border: "1px solid " + TOKENS.line,
          borderRadius: 999,
          minWidth: 20, height: 20,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, color: TOKENS.muted, padding: "0 6px",
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

function ObligationCard({ title, sub, statusPill, statusText, dueLine, amount, byLine, onPay }) {
  const pillColors = {
    ready: { bg: TOKENS.tealTint, color: TOKENS.tealInk, icon: <CheckCircle2 size={14} /> },
    wait: { bg: "#EEF1F4", color: TOKENS.muted, icon: <Clock size={14} /> },
    overdue: { bg: "#FEE2E2", color: "#991B1B", icon: <AlertTriangle size={14} /> },
  };
  const pill = pillColors[statusPill] || pillColors.wait;

  return (
    <div style={{
      background: TOKENS.card,
      border: "1px solid " + TOKENS.line,
      borderRadius: 12,
      padding: "16px 18px",
      display: "flex", flexWrap: "wrap", alignItems: "center",
      gap: 18, justifyContent: "space-between",
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: TOKENS.slate }}>{title}</div>
        <div style={{ fontSize: 13, color: TOKENS.muted }}>{sub}</div>
        <div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, padding: "4px 10px", borderRadius: 999,
            fontWeight: 500, marginTop: 8,
            background: pill.bg, color: pill.color,
          }}>
            {pill.icon}
            {statusText}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: TOKENS.slate }}>{dueLine}</div>
        <div style={{
          fontSize: 20, fontWeight: 600, color: TOKENS.slate,
          fontVariantNumeric: "tabular-nums",
        }}>
          {amount}
        </div>
        <div style={{ fontSize: 12, color: TOKENS.faint }}>{byLine}</div>
      </div>
      <button
        onClick={onPay}
        style={{
          fontFamily: "inherit", fontWeight: 600, fontSize: 14,
          borderRadius: 10, padding: "10px 16px", cursor: "pointer",
          border: "1px solid transparent",
          boxShadow: "0 1px 2px rgba(16,30,40,.06)",
          display: "inline-flex", alignItems: "center", gap: 7,
          background: TOKENS.teal, color: "#fff",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = TOKENS.tealHover}
        onMouseLeave={(e) => e.currentTarget.style.background = TOKENS.teal}
      >
        Pay and file
        <ChevronDown size={14} />
      </button>
    </div>
  );
}

function FilingCard({ title, sub, dueLine, method }) {
  return (
    <div style={{
      background: TOKENS.card,
      border: "1px solid " + TOKENS.line,
      borderRadius: 12,
      padding: "16px 18px",
      display: "flex", flexWrap: "wrap", alignItems: "center",
      gap: 18, justifyContent: "space-between",
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: TOKENS.slate }}>{title}</div>
        <div style={{ fontSize: 13, color: TOKENS.muted }}>{sub}</div>
        <div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, padding: "4px 10px", borderRadius: 999,
            fontWeight: 500, marginTop: 8,
            background: "#EEF1F4", color: TOKENS.muted,
          }}>
            <Clock size={14} />
            Not due yet
          </span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: TOKENS.slate }}>{dueLine}</div>
        <div style={{ fontSize: 12, color: TOKENS.faint }}>{method}</div>
      </div>
      <button
        style={{
          fontFamily: "inherit", fontWeight: 600, fontSize: 14,
          borderRadius: 10, padding: "10px 16px", cursor: "pointer",
          border: "1px solid " + TOKENS.lineStrong,
          background: TOKENS.card, color: TOKENS.slate,
        }}
      >
        Preview
      </button>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{
      background: TOKENS.card,
      border: "1px dashed " + TOKENS.lineStrong,
      borderRadius: 12,
      padding: 26,
      textAlign: "center",
      color: TOKENS.muted,
    }}>
      {text}
    </div>
  );
}

function ResourceList({ items }) {
  return (
    <div style={{
      border: "1px solid " + TOKENS.line,
      borderRadius: 12,
      overflow: "hidden",
      background: TOKENS.card,
    }}>
      {items.map((item, i) => (
        <div
          key={i}
          onClick={item.onClick}
          style={{
            display: "block",
            padding: "14px 16px",
            borderTop: i === 0 ? "none" : "1px solid " + TOKENS.line,
            cursor: item.onClick ? "pointer" : "default",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#F7F9FA"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ fontWeight: 600, color: TOKENS.teal, fontSize: 14 }}>
            {item.title}
          </div>
          <div style={{ color: TOKENS.muted, fontSize: 13, marginTop: 2 }}>
            {item.desc}
          </div>
        </div>
      ))}
    </div>
  );
}