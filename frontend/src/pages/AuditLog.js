import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Check, Filter, Search, X as XIcon, Archive, RotateCcw, CheckCircle2, Plus, FileText, DollarSign, Settings, User } from "lucide-react";
import apiFetch from "../utils/apiFetch";

const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const C = {
  ink: "#12262B",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  amber: "#A67312",
  amberBg: "#FEF6E7",
  grey: "#6B7280",
  greyBg: "#F3F4F6",
  err: "#DC2626",
  errBg: "#FEE2E2",
  page: "#F4F6F8",
  card: "#FFFFFF",
  line: "#E7EAF0",
  lineSoft: "#F1F3F7",
};

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { Authorization: "Bearer " + t, "Content-Type": "application/json" };
}

function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return dd + "-" + mm + "-" + yyyy + " · " + hh + ":" + mi;
}

// Event type -> icon, color, human title
const EVENT_META = {
  "pay_run.finalize": { icon: CheckCircle2, bg: C.brandBg, color: C.brandDark, title: "Pay run finalized" },
  "pay_run.void": { icon: RotateCcw, bg: C.errBg, color: C.err, title: "Pay run voided" },
  "paycheque.void": { icon: RotateCcw, bg: C.errBg, color: C.err, title: "Paycheque voided" },
  "paycheque.cheque_number": { icon: Plus, bg: C.brandBg, color: C.brandDark, title: "Cheque number added" },
  "paycheque.adjust": { icon: DollarSign, bg: C.amberBg, color: C.amber, title: "Adjustment created" },
  "form.archive": { icon: Archive, bg: C.greyBg, color: C.grey, title: "Form archived" },
  "form.unarchive": { icon: Archive, bg: C.brandBg, color: C.brandDark, title: "Form unarchived" },
  "settings.update": { icon: Settings, bg: C.greyBg, color: C.grey, title: "Settings updated" },
  "employee.create": { icon: User, bg: C.brandBg, color: C.brandDark, title: "Employee added" },
  "employee.update": { icon: User, bg: C.greyBg, color: C.grey, title: "Employee updated" },
  "employee.deactivate": { icon: User, bg: C.errBg, color: C.err, title: "Employee deactivated" },
};

function metaFor(eventType) {
  return EVENT_META[eventType] || { icon: FileText, bg: C.greyBg, color: C.grey, title: eventType || "Event" };
}

function describeEvent(ev) {
  const d = ev.details || {};
  const type = ev.event_type;
  if (type === "pay_run.finalize") {
    return "Pay run for " + (d.pay_date || "unknown date") + " finalized. " + (d.employee_count || "?") + " employees, total net $" + (d.total_net || "0.00") + ".";
  }
  if (type === "pay_run.void") {
    return "Pay run for " + (d.pay_date || "unknown date") + " voided (was " + (d.prior_status || "?") + "). Reason: \"" + (d.reason || "") + "\"";
  }
  if (type === "paycheque.void") {
    return (d.employee_name || "Employee") + "'s paycheque voided. Net pay of $" + (d.net_pay_reversed || "0.00") + " reversed from YTD.";
  }
  if (type === "paycheque.cheque_number") {
    if (d.old_cheque_number && d.new_cheque_number) {
      return "Cheque number changed from " + d.old_cheque_number + " to " + d.new_cheque_number + " for " + (d.employee_name || "employee") + ".";
    } else if (d.new_cheque_number) {
      return "Cheque " + d.new_cheque_number + " assigned to " + (d.employee_name || "employee") + "'s paycheque.";
    } else {
      return "Cheque number cleared for " + (d.employee_name || "employee") + "'s paycheque.";
    }
  }
  if (type === "form.archive") {
    return (d.form_name || "Form") + " archived.";
  }
  // Generic fallback
  return JSON.stringify(d);
}

function reasonFor(ev) {
  const d = ev.details || {};
  return d.reason || d.notes || null;
}

export default function AuditLog() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [rangeFilter, setRangeFilter] = useState("30d");
  const [typeFilter, setTypeFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(function() {
    setLoading(true);
    setError("");
    apiFetch("/api/v1/payroll/audit-events?limit=200", { headers: authHeaders() })
      .then(function(r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function(data) {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(function(e) {
        setError("Could not load audit events: " + e.message);
        setLoading(false);
      });
  }, []);

  useEffect(function() {
    function onClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    }
    function onEsc(e) { if (e.key === "Escape") setFilterOpen(false); }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return function() {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const filtered = useMemo(function() {
    let list = events.slice();
    // Range filter
    if (rangeFilter !== "all") {
      const now = Date.now();
      const days = rangeFilter === "7d" ? 7 : rangeFilter === "30d" ? 30 : rangeFilter === "90d" ? 90 : 365;
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      list = list.filter(function(ev) { return new Date(ev.created_at).getTime() >= cutoff; });
    }
    // Type filter
    if (typeFilter !== "all") {
      list = list.filter(function(ev) {
        if (typeFilter === "pay_runs") return ev.entity_type === "pay_run";
        if (typeFilter === "paycheques") return ev.entity_type === "paycheque" || ev.entity_type === "pay_stub";
        if (typeFilter === "forms") return ev.entity_type === "form";
        return true;
      });
    }
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(function(ev) {
        const desc = describeEvent(ev).toLowerCase();
        return desc.includes(q) || (ev.event_type || "").toLowerCase().includes(q);
      });
    }
    return list;
  }, [events, rangeFilter, typeFilter, search]);

  const outlineBtn = { padding: "6px 12px", background: "transparent", border: "1.5px solid " + C.ink, borderRadius: 8, color: C.ink, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6 };
  const footerBtn = { padding: "12px 18px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT };
  const menuItem = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", fontSize: 13, color: C.ink, cursor: "pointer", border: "none", background: "transparent", width: "100%", textAlign: "left", fontFamily: FONT };

  return (
    <div style={{ background: C.page, minHeight: "100vh", fontFamily: FONT, color: C.ink, padding: "28px 32px 100px", boxSizing: "border-box" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.ink, marginBottom: 14 }}>
        <span style={{ fontWeight: 600, opacity: 0.7, cursor: "pointer" }} onClick={function() { navigate("/payroll/overview"); }}>Payroll</span>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ fontWeight: 700 }}>Audit log</span>
      </div>

      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>Audit log</h1>
          <div style={{ fontSize: 14, color: C.ink, fontWeight: 500, marginTop: 4 }}>Every change made to paycheques, pay runs, and settings.</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 500 }}>
        <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.ink }} />
        <input type="text" value={search} onChange={function(e) { setSearch(e.target.value); }}
          placeholder="Search events..."
          style={{ width: "100%", padding: "12px 14px 12px 44px", border: "1.5px solid " + C.ink, borderRadius: 10, fontFamily: FONT, fontSize: 14, color: C.ink, background: C.card, fontWeight: 500, boxSizing: "border-box", outline: "none" }} />
        {search && (
          <button onClick={function() { setSearch(""); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: C.ink, color: "#fff", border: "none", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}>
            <XIcon size={14} />
          </button>
        )}
      </div>

      {/* Section header + filter */}
      <div style={{ paddingBottom: 8, borderBottom: "1.5px solid " + C.ink, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink }}>Recent activity</h2>
        <div ref={filterRef} style={{ position: "relative" }}>
          <button onClick={function() { setFilterOpen(!filterOpen); }} style={outlineBtn}>Filter <ChevronDown size={10} /></button>
          {filterOpen && (
            <div style={{ position: "absolute", top: 36, right: 0, background: C.card, border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", padding: "10px 0", minWidth: 240, zIndex: 100 }}>
              <div style={{ padding: "4px 14px 8px", fontSize: 10, fontWeight: 700, color: C.ink, letterSpacing: "0.1em", textTransform: "uppercase" }}>Date range</div>
              {[["7d", "Last 7 days"], ["30d", "Last 30 days"], ["90d", "Last 90 days"], ["year", "This year"], ["all", "All time"]].map(function(opt) {
                return (
                  <button key={opt[0]} onClick={function() { setRangeFilter(opt[0]); }} style={menuItem}>
                    <span>{opt[1]}</span>
                    {rangeFilter === opt[0] && <Check size={14} style={{ color: C.brand }} strokeWidth={3} />}
                  </button>
                );
              })}
              <div style={{ height: 1, background: C.line, margin: "6px 0" }} />
              <div style={{ padding: "4px 14px 8px", fontSize: 10, fontWeight: 700, color: C.ink, letterSpacing: "0.1em", textTransform: "uppercase" }}>Activity type</div>
              {[["all", "All activity"], ["pay_runs", "Pay runs only"], ["paycheques", "Paycheques only"], ["forms", "Forms only"]].map(function(opt) {
                return (
                  <button key={opt[0]} onClick={function() { setTypeFilter(opt[0]); }} style={menuItem}>
                    <span>{opt[1]}</span>
                    {typeFilter === opt[0] && <Check size={14} style={{ color: C.brand }} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {loading && <div style={{ padding: "48px 20px", textAlign: "center", color: C.ink, fontSize: 14 }}>Loading audit log...</div>}

      {error && !loading && (
        <div style={{ padding: 16, background: C.errBg, border: "1px solid #F87171", borderRadius: 10, color: "#991B1B", fontSize: 13 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <FileText size={48} style={{ color: C.ink, opacity: 0.4, marginBottom: 12 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
            {search || rangeFilter !== "30d" ? "No matches" : "No audit events yet"}
          </div>
          <div style={{ fontSize: 14, color: C.ink, maxWidth: 400, margin: "0 auto" }}>
            {events.length === 0 ? "Events will appear here as you finalize pay runs, void paycheques, or make other changes." : "Try adjusting the filter or search."}
          </div>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ background: C.card, border: "1px solid " + C.line, borderRadius: 12, overflow: "hidden" }}>
          {filtered.map(function(ev, i) {
            const meta = metaFor(ev.event_type);
            const Icon = meta.icon;
            const desc = describeEvent(ev);
            const reason = reasonFor(ev);
            const isLast = i === filtered.length - 1;
            return (
              <div key={ev.id || i} style={{ display: "flex", gap: 14, padding: "16px 20px", borderBottom: isLast ? "none" : "1px solid " + C.lineSoft }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: meta.bg, color: meta.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{meta.title}</div>
                    <div style={{ fontSize: 11, color: C.ink, opacity: 0.7, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{fmtDateTime(ev.created_at)}</div>
                  </div>
                  <div style={{ fontSize: 13, color: C.ink, marginBottom: 4, lineHeight: 1.5 }}>{desc}</div>
                  {reason && (
                    <div style={{ fontSize: 12, color: C.ink, marginBottom: 4, fontStyle: "italic", padding: "6px 10px", background: C.amberBg, borderRadius: 6, borderLeft: "3px solid " + C.amber }}>
                      Reason: "{reason}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fixed footer */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.card, padding: "16px 32px", borderTop: "1px solid " + C.line, boxShadow: "0 -4px 12px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 90 }}>
        <button onClick={function() { navigate("/payroll/overview"); }} style={footerBtn}>&larr; Back to Payroll</button>
        <div style={{ fontSize: 12, color: C.ink, opacity: 0.7 }}>{filtered.length} event{filtered.length !== 1 ? "s" : ""}</div>
      </div>
    </div>
  );
}
