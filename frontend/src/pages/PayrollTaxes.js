import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Filter, Printer, FileText, History, Archive,
  ChevronDown, ChevronRight, CheckCircle2, Clock, AlertTriangle, X,
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

const TOKENS = {
  teal: "#15A08C",
  tealHover: "#0F8474",
  tealTint: "#E1F5EE",
  tealInk: "#0B7377",
  ink: "#000000",
  dark: "#1A2332",
  slateHead: "#12262B",
  bg: "#F4F6F8",
  card: "#FFFFFF",
  line: "#E7EAF0",
  lineStrong: "#D1D5DB",
  amber: "#B7791F",
  amberTint: "#FDF3E2",
  amberLine: "#F1DDB8",
  amberText: "#7A4A00",
  neutralPill: "#EEF1F4",
};

const money = (n) => {
  const v = Number(n) || 0;
  return "$" + v.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ============================================================
// MAIN
// ============================================================
export default function PayrollTaxes() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabFromUrl = location.pathname.endsWith("/filings") ? "filings" : "payments";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [pd7a, setPd7a] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resourcesOpen, setResourcesOpen] = useState(false);

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

  const openPrint = () => {
    window.open(`/payroll/taxes/print?tab=${activeTab}`, "_blank");
  };

  return (
    <div style={{
      background: TOKENS.bg,
      minHeight: "100vh",
      fontFamily: "Inter, 'Plus Jakarta Sans', sans-serif",
      color: TOKENS.ink,
      fontSize: 14,
      lineHeight: 1.5,
      fontWeight: 500,
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 24px 60px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: TOKENS.ink }}>
          Payroll taxes
        </h1>

        <div style={{
          display: "inline-flex",
          gap: 4,
          background: "#EDF0F3",
          borderRadius: 10,
          padding: 4,
          marginTop: 16,
        }}>
          <button onClick={() => switchTab("payments")} style={tabStyle(activeTab === "payments")}>
            Payments
          </button>
          <button onClick={() => switchTab("filings")} style={tabStyle(activeTab === "filings")}>
            Filings
          </button>
        </div>

        {activeTab === "payments" && (
          <PaymentsTab
            pd7a={pd7a} loading={loading} error={error}
            navigate={navigate}
            onResourcesOpen={() => setResourcesOpen(true)}
            onPrint={openPrint}
          />
        )}
        {activeTab === "filings" && (
          <FilingsTab
            navigate={navigate}
            onResourcesOpen={() => setResourcesOpen(true)}
            onPrint={openPrint}
          />
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

function tabStyle(active) {
  return {
    padding: "7px 18px",
    background: active ? "white" : "transparent",
    border: "none",
    borderRadius: 8,
    color: active ? TOKENS.ink : TOKENS.dark,
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: active ? 700 : 600,
    cursor: "pointer",
    boxShadow: active ? "0 1px 2px rgba(16, 30, 40, 0.08)" : "none",
  };
}

// ============================================================
// PAYMENTS TAB
// ============================================================
function PaymentsTab({ pd7a, loading, error, navigate, onResourcesOpen, onPrint }) {
  const hasData = pd7a && pd7a.paycheque_count > 0;
  const currentPayment = pd7a ? pd7a.current_payment : 0;
  const dueDateDisplay = pd7a ? pd7a.due_date_display : "";
  const status = pd7a ? pd7a.status : "no_activity";
  const periodLabel = pd7a ? pd7a.period_label : "";

  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    jurisdictions: [],
    periods: [],
    statuses: [],
  });

  return (
    <>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12, marginTop: 18,
      }}>
        <MetricTile label="Due now" value={loading ? "Loading..." : money(hasData ? currentPayment : 0)} />
        <MetricTile label="Next payment due" value={loading ? "Loading..." : (hasData ? dueDateDisplay : "None")} />
        <MetricTile label="Upcoming filings" value="3" />
      </div>

      <div style={toolbarStyle}>
        <ToolbarBtn
          bordered
          icon={<Filter size={14} strokeWidth={2.5} />}
          label="Filter"
          onClick={() => setFilterOpen(!filterOpen)}
          active={filterOpen}
        />
        {filterOpen && (
          <PaymentsFilterPopover
            filters={filters}
            setFilters={setFilters}
            onClose={() => setFilterOpen(false)}
          />
        )}
        <div style={{ flex: 1 }} />
        <ToolbarBtn icon={<Printer size={14} strokeWidth={2.5} />} label="Print" onClick={onPrint} />
        <ToolbarBtn icon={<FileText size={14} strokeWidth={2.5} />} label="Resources" onClick={onResourcesOpen} />
        <ToolbarBtn icon={<History size={14} strokeWidth={2.5} />} label="Payment history" />
      </div>

      {error && <ErrorStrip text={error} />}

      <SectionHead label="ACTION NEEDED" count={hasData ? 1 : 0} />
      {hasData ? (
        <>
          <ObligationCard
            title="Federal taxes"
            sub={periodLabel}
            status={status}
            dueDate={dueDateDisplay}
            amount={money(currentPayment)}
            breakdownOpen={breakdownOpen}
            onToggleBreakdown={() => setBreakdownOpen(!breakdownOpen)}
          />
          {breakdownOpen && (
            <BreakdownPanel
              rows={[
                { label: "Canada Pension Plan Employer", amount: pd7a.cpp_employer },
                { label: "Canada Pension Plan", amount: pd7a.cpp_employee },
                { label: "Employment Insurance Employer", amount: pd7a.ei_employer },
                { label: "Employment Insurance", amount: pd7a.ei_employee },
                { label: "Income Tax", amount: pd7a.tax_deductions },
              ]}
              total={pd7a.current_payment}
            />
          )}
        </>
      ) : (
        <EmptyBox text="No remittance due this month." />
      )}

      <SectionHead label="COMING UP" count={0} />
      <EmptyBox text="Coast is clear!" />

      <SectionHead label="SCHEDULED" count={0} />
      <EmptyBox text="Nothing to see here (yet)!" />

      <SectionHead label="PAYMENT RESOURCES" />
      <ResourceLinkList
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
// FILINGS TAB
// ============================================================
function FilingsTab({ navigate, onResourcesOpen, onPrint }) {
  const currentYear = new Date().getFullYear();
  const t4DueDate = "01/03/" + (currentYear + 1);
  const t4PeriodStart = "01/01/" + currentYear;
  const t4PeriodEnd = "31/12/" + currentYear;

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ periods: [], statuses: [] });

  return (
    <>
      <div style={{
        background: TOKENS.amberTint,
        border: "1px solid " + TOKENS.amberLine,
        borderRadius: 12, padding: "14px 16px",
        display: "flex", gap: 12, marginTop: 18,
      }}>
        <div style={{ color: TOKENS.amber }}>
          <AlertTriangle size={20} strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontWeight: 700, color: TOKENS.amberText, fontSize: 14 }}>
            Select a dental benefits code for each employee
          </div>
          <div style={{ color: TOKENS.dark, fontSize: 13, marginTop: 2, fontWeight: 600 }}>
            The CRA needs to know who has access to any dental benefits you offer. This info is required to file T4 slips. Add it on each employee's deductions and contributions page.{" "}
            <a style={{ color: TOKENS.tealInk, fontWeight: 700, cursor: "pointer" }}>Find out more</a>
          </div>
        </div>
      </div>

      <div style={toolbarStyle}>
        <ToolbarBtn
          bordered
          icon={<Filter size={14} strokeWidth={2.5} />}
          label="Filter"
          onClick={() => setFilterOpen(!filterOpen)}
          active={filterOpen}
        />
        {filterOpen && (
          <FilingsFilterPopover
            filters={filters}
            setFilters={setFilters}
            onClose={() => setFilterOpen(false)}
          />
        )}
        <div style={{ flex: 1 }} />
        <ToolbarBtn icon={<Printer size={14} strokeWidth={2.5} />} label="Print" onClick={onPrint} />
        <ToolbarBtn icon={<FileText size={14} strokeWidth={2.5} />} label="Resources" onClick={onResourcesOpen} />
        <ToolbarBtn icon={<Archive size={14} strokeWidth={2.5} />} label="Archive" onClick={() => navigate("/payroll/taxes/archived")} />
      </div>

      <SectionHead label="ACTION NEEDED" count={0} />
      <EmptyBox text="Woohoo! All caught up." />

      <SectionHead label="COMING UP" count={3} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <FilingCard title="T4 summary" sub={t4PeriodStart + " to " + t4PeriodEnd} dueDate={t4DueDate} method="Manually file" onPreview={() => window.open("/payroll/taxes/t4-preview/summary", "_blank")} />
        <FilingCard title="T4 employer slips" sub="Employer copy of T4 slips" dueDate={t4DueDate} method="Manually file with XML" onPreview={() => window.open("/payroll/taxes/t4-preview/employer", "_blank")} />
        <FilingCard title="T4 employee slips" sub="T4 slip for employee" dueDate={t4DueDate} method="Manually file" />
      </div>

      <SectionHead label="DONE" count={0} />
      <EmptyBox text="Nothing to see here (yet)!" />

      <SectionHead label="FILING RESOURCES" />
      <ResourceLinkList
        items={[
          { title: "Record of employment", desc: "The ROEs you have created for your employees." },
          { title: "Archived forms and filings", desc: "Completed tax filings and forms ready to view and print.", onClick: () => navigate("/payroll/taxes/archived") },
          { title: "All filings resources", desc: "Tax filings, federal tax forms, and other compliance resources.", onClick: onResourcesOpen },
        ]}
      />
    </>
  );
}

// ============================================================
// FILTER POPOVERS
// ============================================================
function PaymentsFilterPopover({ filters, setFilters, onClose }) {
  return (
    <FilterPopoverShell onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        <FilterGroup title="Tax jurisdiction">
          <FilterCheckbox
            label="Federal"
            checked={filters.jurisdictions.includes("Federal")}
            onChange={() => toggleFilter(filters, setFilters, "jurisdictions", "Federal")}
          />
        </FilterGroup>
        <FilterGroup title="Time period">
          {["This month", "Next month", "This quarter", "Next quarter", "Annual"].map((p) => (
            <FilterCheckbox
              key={p} label={p}
              checked={filters.periods.includes(p)}
              onChange={() => toggleFilter(filters, setFilters, "periods", p)}
            />
          ))}
        </FilterGroup>
        <FilterGroup title="Status">
          <FilterCheckbox
            label="Ready to pay"
            checked={filters.statuses.includes("Ready to pay")}
            onChange={() => toggleFilter(filters, setFilters, "statuses", "Ready to pay")}
          />
        </FilterGroup>
      </div>
      <FilterFooter
        onClear={() => setFilters({ jurisdictions: [], periods: [], statuses: [] })}
        onApply={onClose}
      />
    </FilterPopoverShell>
  );
}

function FilingsFilterPopover({ filters, setFilters, onClose }) {
  return (
    <FilterPopoverShell onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        <FilterGroup title="Time period">
          {["This quarter", "Annual"].map((p) => (
            <FilterCheckbox
              key={p} label={p}
              checked={filters.periods.includes(p)}
              onChange={() => toggleFilter(filters, setFilters, "periods", p)}
            />
          ))}
        </FilterGroup>
        <FilterGroup title="Status">
          {["Not due yet", "Overdue"].map((s) => (
            <FilterCheckbox
              key={s} label={s}
              checked={filters.statuses.includes(s)}
              onChange={() => toggleFilter(filters, setFilters, "statuses", s)}
            />
          ))}
        </FilterGroup>
        <div />
      </div>
      <FilterFooter
        onClear={() => setFilters({ periods: [], statuses: [] })}
        onApply={onClose}
      />
    </FilterPopoverShell>
  );
}

function toggleFilter(filters, setFilters, key, value) {
  const current = filters[key];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  setFilters({ ...filters, [key]: next });
}

function FilterPopoverShell({ children, onClose }) {
  return (
    <div style={{
      position: "absolute",
      top: 48, left: 0, zIndex: 6,
      background: TOKENS.card,
      border: "1px solid " + TOKENS.line,
      borderRadius: 12,
      boxShadow: "0 12px 40px rgba(16, 30, 40, 0.16)",
      padding: "18px 20px",
      minWidth: 520,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 14,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: TOKENS.ink }}>Filters</div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none",
            color: TOKENS.ink, cursor: "pointer",
            padding: 4, borderRadius: 6,
            display: "inline-flex",
          }}
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
      {children}
    </div>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <div style={{
        fontWeight: 700, fontSize: 13, marginBottom: 8, color: TOKENS.ink,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <label style={{
      display: "flex", gap: 8, alignItems: "center",
      fontSize: 14, color: TOKENS.ink,
      marginBottom: 8, cursor: "pointer", fontWeight: 600,
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ cursor: "pointer" }}
      />
      {label}
    </label>
  );
}

function FilterFooter({ onClear, onApply }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", marginTop: 20,
    }}>
      <button
        onClick={onClear}
        style={{
          fontFamily: "inherit", fontWeight: 700, fontSize: 14,
          borderRadius: 10, padding: "10px 16px", cursor: "pointer",
          background: "white", border: "1px solid " + TOKENS.lineStrong,
          color: TOKENS.ink,
        }}
      >
        Clear all
      </button>
      <button
        onClick={onApply}
        style={{
          fontFamily: "inherit", fontWeight: 700, fontSize: 14,
          borderRadius: 10, padding: "10px 16px", cursor: "pointer",
          border: "1px solid transparent",
          boxShadow: "0 1px 2px rgba(16, 30, 40, 0.06)",
          background: TOKENS.teal, color: "white",
        }}
      >
        Apply
      </button>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
const toolbarStyle = {
  display: "flex", alignItems: "center", gap: 8, marginTop: 16,
  position: "relative", flexWrap: "wrap",
};

function MetricTile({ label, value }) {
  return (
    <div style={{
      background: TOKENS.card, border: "1px solid " + TOKENS.line,
      borderRadius: 12, padding: "16px 18px",
    }}>
      <div style={{ fontSize: 13, color: TOKENS.dark, fontWeight: 600 }}>{label}</div>
      <div style={{
        fontSize: 26, fontWeight: 700, marginTop: 3,
        color: TOKENS.ink, fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
    </div>
  );
}

function ToolbarBtn({ icon, label, bordered, onClick, active }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        background: bordered ? (active ? "#EEF1F4" : "white") : (hover ? "#EEF1F4" : "transparent"),
        border: bordered ? "1px solid " + TOKENS.lineStrong : "none",
        color: TOKENS.ink,
        fontFamily: "inherit", fontSize: 13, cursor: "pointer",
        padding: "8px 11px", borderRadius: 8, fontWeight: 700,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionHead({ label, count }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, color: TOKENS.dark,
      letterSpacing: "0.6px", textTransform: "uppercase",
      margin: "26px 0 10px", display: "flex", alignItems: "center", gap: 8,
    }}>
      {label}
      {count !== undefined && (
        <span style={{
          background: TOKENS.slateHead, color: "white",
          borderRadius: 999, minWidth: 20, height: 20,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, padding: "0 6px", fontWeight: 700,
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

function ObligationCard({
  title, sub, status, dueDate, amount,
  breakdownOpen, onToggleBreakdown,
}) {
  const pillMeta =
    status === "ready_to_pay" ? { bg: TOKENS.tealTint, color: TOKENS.tealInk, icon: <CheckCircle2 size={14} strokeWidth={2.5} />, text: "Ready to pay" } :
    status === "overdue"       ? { bg: TOKENS.amberTint, color: TOKENS.amberText, icon: <AlertTriangle size={14} strokeWidth={2.5} />, text: "Overdue" } :
                                 { bg: TOKENS.neutralPill, color: TOKENS.dark, icon: <Clock size={14} strokeWidth={2.5} />, text: "Waiting" };

  return (
    <div style={{
      background: TOKENS.card,
      border: "1px solid " + TOKENS.line,
      borderLeft: "4px solid " + TOKENS.teal,
      borderRadius: 12, padding: "16px 18px",
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20,
    }}>
      <div style={{ flex: 1, minWidth: 170 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: TOKENS.ink }}>{title}</div>
        <div style={{ fontSize: 13, color: TOKENS.dark, fontWeight: 600 }}>{sub}</div>
        <div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, padding: "4px 10px", borderRadius: 999,
            fontWeight: 700, marginTop: 8,
            background: pillMeta.bg, color: pillMeta.color,
          }}>
            {pillMeta.icon}
            {pillMeta.text}
          </span>
        </div>
      </div>

      <div style={{ marginRight: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: TOKENS.ink }}>Due {dueDate}</div>
        <div style={{ fontSize: 12, color: TOKENS.dark, fontWeight: 600 }}>Pay by {dueDate}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 36 }}>
        <button
          onClick={onToggleBreakdown}
          style={{
            background: "none", border: "none", color: TOKENS.dark,
            cursor: "pointer", padding: 2,
            display: "inline-flex",
            transition: "transform 0.15s ease",
            transform: breakdownOpen ? "rotate(90deg)" : "rotate(0deg)",
          }}
          aria-label={breakdownOpen ? "Hide breakdown" : "Show breakdown"}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
        <span style={{
          fontSize: 20, fontWeight: 700,
          color: TOKENS.ink, fontVariantNumeric: "tabular-nums",
        }}>
          {amount}
        </span>
      </div>

      <button
        style={{
          fontFamily: "inherit", fontWeight: 700, fontSize: 14,
          borderRadius: 10, padding: "10px 16px", cursor: "pointer",
          border: "1px solid transparent",
          boxShadow: "0 1px 2px rgba(16, 30, 40, 0.06)",
          display: "inline-flex", alignItems: "center", gap: 7,
          background: TOKENS.teal, color: "white",
          marginLeft: 8,
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = TOKENS.tealHover}
        onMouseLeave={(e) => e.currentTarget.style.background = TOKENS.teal}
      >
        Pay and file
        <ChevronDown size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function BreakdownPanel({ rows, total }) {
  return (
    <div style={{
      background: "#F7F9FA",
      border: "1px solid " + TOKENS.line,
      borderRadius: 10,
      margin: "8px 0 0 4px",
      padding: "12px 18px",
    }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between",
          padding: "4px 0", color: TOKENS.dark,
          fontSize: 13, fontWeight: 600,
        }}>
          <span>{r.label}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{money(r.amount)}</span>
        </div>
      ))}
      <div style={{
        display: "flex", justifyContent: "space-between",
        padding: "8px 0 4px", color: TOKENS.ink,
        fontSize: 13, fontWeight: 700,
        borderTop: "1px solid " + TOKENS.line, marginTop: 4,
      }}>
        <span>Total</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{money(total)}</span>
      </div>
    </div>
  );
}

function FilingCard({ title, sub, dueDate, method, onPreview }) {
  return (
    <div style={{
      background: TOKENS.card,
      border: "1px solid " + TOKENS.line,
      borderLeft: "4px solid " + TOKENS.teal,
      borderRadius: 12, padding: "16px 18px",
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20,
    }}>
      <div style={{ flex: 1, minWidth: 190 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: TOKENS.ink }}>{title}</div>
        <div style={{ fontSize: 13, color: TOKENS.dark, fontWeight: 600 }}>{sub}</div>
        <div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, padding: "4px 10px", borderRadius: 999,
            fontWeight: 700, marginTop: 8,
            background: TOKENS.neutralPill, color: TOKENS.dark,
          }}>
            <Clock size={14} strokeWidth={2.5} />
            Not due yet
          </span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: TOKENS.ink }}>Due {dueDate}</div>
        <div style={{ fontSize: 12, color: TOKENS.dark, fontWeight: 600 }}>{method}</div>
      </div>
      <button
        onClick={onPreview}
        style={{
        fontFamily: "inherit", fontWeight: 700, fontSize: 14,
        borderRadius: 10, padding: "10px 16px", cursor: "pointer",
        border: "1px solid " + TOKENS.lineStrong,
        background: "white", color: TOKENS.ink,
      }}>
        Preview
      </button>
    </div>
  );
}

function EmptyBox({ text }) {
  return (
    <div style={{
      background: TOKENS.card, border: "1px dashed " + TOKENS.lineStrong,
      borderRadius: 12, padding: 26, textAlign: "center",
      color: TOKENS.dark, fontWeight: 600,
    }}>
      {text}
    </div>
  );
}

function ErrorStrip({ text }) {
  return (
    <div style={{
      background: "#FEF2F2", border: "1px solid #FCA5A5",
      borderRadius: 8, padding: "10px 12px", marginTop: 14,
      color: "#991B1B", fontSize: 13, fontWeight: 600,
    }}>
      {text}
    </div>
  );
}

function ResourceLinkList({ items }) {
  return (
    <div style={{ marginTop: 6 }}>
      {items.map((item, i) => (
        <a key={i} onClick={item.onClick} style={{
          display: "block", marginBottom: 18,
          cursor: item.onClick ? "pointer" : "default",
          textDecoration: "none",
        }}>
          <span style={{
            color: TOKENS.tealInk, fontWeight: 700,
            fontSize: 15, display: "block",
          }}>
            {item.title}
          </span>
          <span style={{
            color: TOKENS.dark, fontSize: 13, marginTop: 2,
            display: "block", fontWeight: 600,
          }}>
            {item.desc}
          </span>
        </a>
      ))}
    </div>
  );
}