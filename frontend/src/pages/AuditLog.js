import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Archive, RotateCcw, DollarSign, CheckCircle2,
  Settings, User, FileText,
} from "lucide-react";

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
const LINE = "#E7EAF0";
const LINE_STRONG = "#D1D5DB";
const BG = "#F4F6F8";
const CARD = "#FFFFFF";
const TEAL_INK = "#0B7377";

// Event type -> icon + colors + human title
const EVENT_META = {
  "form.archive": {
    icon: Archive,
    bg: "#E1F5EE",
    color: "#0B7377",
    title: (ev) => {
      const d = ev.details || {};
      const label = d.period_label || d.form_type || "form";
      return `Archived ${d.form_type || "form"} for ${label}`;
    },
    desc: (ev) => {
      const d = ev.details || {};
      const country = d.country === "CA" ? "Canada" :
                       d.country === "US" ? "United States" :
                       d.country || "";
      const subtype = d.form_subtype ? d.form_subtype + " " : "";
      return country ? `${country} · ${subtype}source deductions`.trim() : "";
    },
  },
  "paycheque.void": {
    icon: RotateCcw,
    bg: "#FEE2E2",
    color: "#B91C1C",
    title: (ev) => {
      const d = ev.details || {};
      const name = d.employee_name || "paycheque";
      return `Voided paycheque for ${name}`;
    },
    desc: (ev) => {
      const d = ev.details || {};
      const parts = [];
      if (d.pay_date) parts.push("Pay date " + d.pay_date);
      if (d.net_amount) parts.push("Net " + d.net_amount);
      if (d.reason) parts.push("Reason: " + d.reason);
      return parts.join(" · ");
    },
  },
  "paycheque.adjust": {
    icon: DollarSign,
    bg: "#FEF3C7",
    color: "#92400E",
    title: (ev) => {
      const d = ev.details || {};
      const name = d.employee_name || "employee";
      return `Created adjustment cheque for ${name}`;
    },
    desc: (ev) => {
      const d = ev.details || {};
      const parts = [];
      if (d.direction) parts.push(d.direction === "extra_owed" ? "Extra pay owed" : "Overpayment recovery");
      if (d.gross_amount) parts.push("$" + d.gross_amount + " gross");
      if (d.reason) parts.push(d.reason);
      return parts.join(" · ");
    },
  },
  "paycheque.create": {
    icon: CheckCircle2,
    bg: "#DBEAFE",
    color: "#1E40AF",
    title: (ev) => {
      const d = ev.details || {};
      return d.pay_period ? `Finalized pay run for ${d.pay_period}` : "Finalized pay run";
    },
    desc: (ev) => {
      const d = ev.details || {};
      const parts = [];
      if (d.employee_count) parts.push(d.employee_count + " employee" + (d.employee_count === 1 ? "" : "s"));
      if (d.total_gross) parts.push("Total gross " + d.total_gross);
      if (d.total_net) parts.push("Total net " + d.total_net);
      return parts.join(" · ");
    },
  },
  "settings.update": {
    icon: Settings,
    bg: "#EEF1F4",
    color: "#1A2332",
    title: (ev) => {
      const d = ev.details || {};
      return d.setting ? `Updated ${d.setting}` : "Updated settings";
    },
    desc: (ev) => {
      const d = ev.details || {};
      if (d.before !== undefined && d.after !== undefined) {
        return `${d.before} → ${d.after}`;
      }
      return "";
    },
  },
  "employee.create": {
    icon: User,
    bg: "#DBEAFE",
    color: "#1E40AF",
    title: (ev) => {
      const d = ev.details || {};
      return d.employee_name ? `Added employee ${d.employee_name}` : "Added new employee";
    },
    desc: () => "",
  },
};

// Default fallback
const DEFAULT_META = {
  icon: FileText,
  bg: "#EEF1F4",
  color: "#1A2332",
  title: (ev) => ev.event_type,
  desc: () => "",
};

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return diffMin + " min ago";
  if (diffHr < 24 && d.getDate() === now.getDate()) return "Today at " + time;
  if (diffDay < 2) return "Yesterday at " + time;
  if (diffDay < 7) return diffDay + " days ago at " + time;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy} at ${time}`;
}

export default function AuditLog() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("30d");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${API_URL}/api/v1/payroll/audit-events?limit=200`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        setError("Could not load audit events: " + e.message);
        setLoading(false);
      });
  }, []);

  // Client-side filtering
  const filtered = events.filter((ev) => {
    if (eventTypeFilter !== "all" && ev.event_type !== eventTypeFilter) return false;
    if (entityTypeFilter !== "all" && ev.entity_type !== entityTypeFilter) return false;

    if (rangeFilter !== "all") {
      const evDate = new Date(ev.created_at);
      const now = new Date();
      const diffDays = (now - evDate) / (1000 * 60 * 60 * 24);
      if (rangeFilter === "30d" && diffDays > 30) return false;
      if (rangeFilter === "90d" && diffDays > 90) return false;
      if (rangeFilter === "year" && evDate.getFullYear() !== now.getFullYear()) return false;
    }
    return true;
  });

  // Unique event types and entity types for filter options
  const eventTypes = Array.from(new Set(events.map((e) => e.event_type))).sort();
  const entityTypes = Array.from(new Set(events.map((e) => e.entity_type))).sort();

  return (
    <div style={{
      background: BG,
      minHeight: "100vh",
      fontFamily: "Inter, 'Plus Jakarta Sans', sans-serif",
      color: INK,
      fontSize: 14,
      lineHeight: 1.5,
      fontWeight: 500,
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 24px 60px" }}>
        <a
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: TEAL_INK, fontWeight: 700, marginBottom: 14, cursor: "pointer",
          }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          Back
        </a>

        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: INK }}>
          Audit log
        </h1>
        <div style={{ fontSize: 13, color: DARK, marginBottom: 24, fontWeight: 600 }}>
          A record of significant actions in your payroll. Used for compliance and troubleshooting.
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All event types</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All entities</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <div style={{ flex: 1 }} />

          <select
            value={rangeFilter}
            onChange={(e) => setRangeFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="year">This year</option>
            <option value="all">All time</option>
          </select>
        </div>

        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FCA5A5",
            borderRadius: 8, padding: "10px 12px", marginBottom: 14,
            color: "#991B1B", fontSize: 13, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{
            background: CARD, border: "1px solid " + LINE,
            borderRadius: 12, padding: "40px 20px",
            textAlign: "center", color: DARK, fontWeight: 600,
          }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: CARD, border: "1px dashed " + LINE_STRONG,
            borderRadius: 12, padding: "40px 20px",
            textAlign: "center", color: DARK, fontWeight: 600,
          }}>
            {events.length === 0
              ? "No audit events recorded yet."
              : "No events match your filters."}
          </div>
        ) : (
          <div style={{
            background: CARD, border: "1px solid " + LINE,
            borderRadius: 12, overflow: "hidden",
          }}>
            {filtered.map((ev, i) => (
              <EventRow key={ev.id} event={ev} isFirst={i === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const selectStyle = {
  padding: "8px 12px",
  border: "1px solid " + LINE_STRONG,
  borderRadius: 8,
  fontFamily: "inherit",
  fontSize: 13,
  background: "white",
  color: INK,
  cursor: "pointer",
  minWidth: 160,
  fontWeight: 600,
  outline: "none",
};

function EventRow({ event, isFirst }) {
  const meta = EVENT_META[event.event_type] || DEFAULT_META;
  const Icon = meta.icon;
  const title = meta.title(event);
  const desc = meta.desc(event);

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "16px 20px",
        borderTop: isFirst ? "none" : "1px solid " + LINE,
        cursor: "default",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "#FAFBFC"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, background: meta.bg, color: meta.color,
      }}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: INK, fontSize: 14, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          <span style={{
            display: "inline-block",
            background: BG,
            border: "1px solid " + LINE_STRONG,
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 11,
            color: DARK,
            fontFamily: "'SF Mono', Consolas, monospace",
            fontWeight: 700,
          }}>
            {event.event_type}
          </span>
          {title}
        </div>
        {desc && (
          <div style={{ color: DARK, fontSize: 13, marginTop: 3, fontWeight: 600 }}>
            {desc}
          </div>
        )}
        <div style={{
          color: DARK, fontSize: 12, marginTop: 4,
          fontVariantNumeric: "tabular-nums", fontWeight: 600,
        }}>
          {timeAgo(event.created_at)}
        </div>
      </div>
    </div>
  );
}