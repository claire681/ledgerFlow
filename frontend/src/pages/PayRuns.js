import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Filter, ChevronDown, Check, Search, ChevronRight, FileText } from "lucide-react";
import apiFetch from "../utils/apiFetch";

const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const C = {
  ink: "#12262B",
  inkDark: "#0E1A1A",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  amber: "#A67312",
  amberBg: "#FEF6E7",
  page: "#F4F6F8",
  card: "#FFFFFF",
  line: "#E7EAF0",
  lineSoft: "#F1F3F7",
};

const TABULAR = { fontVariantNumeric: "tabular-nums" };

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return dd + "/" + mm + "/" + d.getUTCFullYear();
}

function fmtMoney(v) {
  const n = Number(v || 0);
  return "$" + n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { Authorization: "Bearer " + t };
}

export default function PayRuns() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("newest");
  const [period, setPeriod] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [company, setCompany] = useState(localStorage.getItem("company_name") || "");

  useEffect(function() {
    fetchRuns();
  }, []);

  useEffect(function() {
    if (!filterOpen) return;
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
  }, [filterOpen]);

  async function fetchRuns() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/payroll/runs", { headers: authHeaders() });
      if (!res.ok) throw new Error("Could not load pay runs");
      const data = await res.json();
      setRuns(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Could not load pay runs");
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(function() {
    return {
      all: runs.length,
      drafts: runs.filter(function(r) { return r.status === "draft"; }).length,
      finalized: runs.filter(function(r) { return r.status === "finalized"; }).length,
    };
  }, [runs]);

  const filtered = useMemo(function() {
    let list = runs.slice();
    if (tab === "drafts") list = list.filter(function(r) { return r.status === "draft"; });
    else if (tab === "finalized") list = list.filter(function(r) { return r.status === "finalized"; });
    if (period !== "all") {
      const now = new Date();
      let cutoff = null;
      if (period === "this-year") cutoff = new Date(now.getFullYear(), 0, 1);
      else if (period === "last-quarter") { cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 3); }
      else if (period === "this-month") cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
      if (cutoff) list = list.filter(function(r) { return r.pay_date && new Date(r.pay_date) >= cutoff; });
    }
    if (sort === "newest") list.sort(function(a, b) { return new Date(b.pay_date || 0) - new Date(a.pay_date || 0); });
    else if (sort === "oldest") list.sort(function(a, b) { return new Date(a.pay_date || 0) - new Date(b.pay_date || 0); });
    else if (sort === "net-high") list.sort(function(a, b) { return Number(b.total_net || 0) - Number(a.total_net || 0); });
    else if (sort === "net-low") list.sort(function(a, b) { return Number(a.total_net || 0) - Number(b.total_net || 0); });
    return list;
  }, [runs, tab, sort, period]);

  const sectionTitle = tab === "drafts" ? "Drafts to continue" : tab === "finalized" ? "Finalized pay runs" : "Pay run history";

  function handleExportCSV() {
    const header = ["Pay period", "Pay date", "Employees", "Net total", "Status"];
    const rows = filtered.map(function(r) {
      return [
        fmtDate(r.pay_period_start) + " to " + fmtDate(r.pay_period_end),
        fmtDate(r.pay_date),
        r.employee_count || 0,
        fmtMoney(r.total_net),
        r.status,
      ];
    });
    const csv = [header, ...rows].map(function(row) {
      return row.map(function(v) { return String(v).indexOf(",") >= 0 ? "\"" + v + "\"" : v; }).join(",");
    }).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pay_runs_" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const tabBtnStyle = function(active) {
    return {
      padding: "10px 16px",
      fontSize: 14,
      fontWeight: 700,
      color: C.ink,
      background: "transparent",
      border: "none",
      borderBottom: active ? "2px solid " + C.brand : "2px solid transparent",
      marginBottom: -1,
      cursor: "pointer",
      fontFamily: FONT,
      opacity: active ? 1 : 0.7,
    };
  };

  const outlineBtnStyle = { padding: "6px 12px", background: "transparent", border: "1.5px solid " + C.ink, borderRadius: 8, color: C.ink, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6 };
  const footerBtnStyle = { padding: "12px 18px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT };

  const filterOptionStyle = { padding: "8px 14px", fontSize: 13, color: C.ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: FONT, border: "none", background: "transparent", width: "100%", textAlign: "left" };

  return (
    <div style={{ background: C.page, minHeight: "100vh", fontFamily: FONT, color: C.ink, padding: "28px 32px 100px", boxSizing: "border-box" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.ink, marginBottom: 14 }}>
        <span style={{ fontWeight: 600, opacity: 0.7, cursor: "pointer" }} onClick={function() { navigate("/payroll/overview"); }}>Payroll</span>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ fontWeight: 700 }}>Pay runs</span>
      </div>

      {/* Title row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>Pay runs</h1>
          <div style={{ fontSize: 14, color: C.ink, fontWeight: 500, marginTop: 4 }}>
            All payroll runs{company ? " for " + company : ""}.
          </div>
        </div>
        <button onClick={function() { navigate("/payroll/run"); }} style={{ padding: "12px 20px", background: C.brand, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT, boxShadow: "0 1px 2px rgba(21,160,140,0.3)" }}>
          <Play size={16} /> Run payroll
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: "1px solid " + C.line }}>
        <button onClick={function() { setTab("all"); }} style={tabBtnStyle(tab === "all")}>
          All <span style={{ color: C.ink, fontWeight: 700, marginLeft: 4 }}>{counts.all}</span>
        </button>
        <button onClick={function() { setTab("drafts"); }} style={tabBtnStyle(tab === "drafts")}>
          Drafts <span style={{ color: C.ink, fontWeight: 700, marginLeft: 4 }}>{counts.drafts}</span>
        </button>
        <button onClick={function() { setTab("finalized"); }} style={tabBtnStyle(tab === "finalized")}>
          Finalized <span style={{ color: C.ink, fontWeight: 700, marginLeft: 4 }}>{counts.finalized}</span>
        </button>
      </div>

      {/* Section header */}
      <div style={{ paddingBottom: 8, borderBottom: "1.5px solid " + C.ink, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink }}>{sectionTitle}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }} ref={filterRef}>
          <button onClick={function() { setFilterOpen(!filterOpen); }} style={outlineBtnStyle}>
            <Filter size={12} /> Filter <ChevronDown size={10} />
          </button>
          {filterOpen && (
            <div style={{ position: "absolute", top: 40, right: 90, background: C.card, border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "10px 0", minWidth: 220, zIndex: 100 }}>
              <div style={{ padding: "4px 14px 8px", fontSize: 10, fontWeight: 700, color: C.ink, letterSpacing: "0.1em", textTransform: "uppercase" }}>Sort by</div>
              {[["newest", "Newest first"], ["oldest", "Oldest first"], ["net-high", "Net total, highest first"], ["net-low", "Net total, lowest first"]].map(function(opt) {
                return (
                  <button key={opt[0]} onClick={function() { setSort(opt[0]); }} style={filterOptionStyle}>
                    <span>{opt[1]}</span>
                    {sort === opt[0] && <Check size={14} style={{ color: C.brand }} strokeWidth={3} />}
                  </button>
                );
              })}
              <div style={{ height: 1, background: C.line, margin: "6px 0" }} />
              <div style={{ padding: "4px 14px 8px", fontSize: 10, fontWeight: 700, color: C.ink, letterSpacing: "0.1em", textTransform: "uppercase" }}>Pay period</div>
              {[["all", "All periods"], ["this-year", "This year"], ["last-quarter", "Last 3 months"], ["this-month", "This month"]].map(function(opt) {
                return (
                  <button key={opt[0]} onClick={function() { setPeriod(opt[0]); }} style={filterOptionStyle}>
                    <span>{opt[1]}</span>
                    {period === opt[0] && <Check size={14} style={{ color: C.brand }} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          )}
          <button onClick={handleExportCSV} style={outlineBtnStyle}>Export CSV</button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: "48px 20px", textAlign: "center", color: C.ink, fontSize: 14 }}>Loading pay runs...</div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ padding: 16, background: "#FEE2E2", border: "1px solid #F87171", borderRadius: 10, color: "#991B1B", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><strong>Could not load:</strong> {error}</div>
          <button onClick={fetchRuns} style={outlineBtnStyle}>Try again</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <FileText size={48} style={{ color: C.ink, opacity: 0.4, marginBottom: 12 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
            {tab === "drafts" ? "No drafts" : tab === "finalized" ? "No finalized runs yet" : "No pay runs yet"}
          </div>
          <div style={{ fontSize: 14, color: C.ink, maxWidth: 400, margin: "0 auto 16px" }}>
            {tab === "drafts" ? "All your pay runs have been finalized." :
              tab === "finalized" ? "Submit a pay run to see it here." :
              "Create your first pay run to calculate gross pay, taxes, and net pay in one cycle."}
          </div>
          {tab === "all" && (
            <button onClick={function() { navigate("/payroll/run"); }} style={{ padding: "12px 20px", background: C.brand, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Play size={16} /> Run your first payroll
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr>
              <th style={thStyle}>PAY PERIOD</th>
              <th style={thStyle}>PAY DATE</th>
              <th style={{ ...thStyle, textAlign: "right" }}>EMPLOYEES</th>
              <th style={{ ...thStyle, textAlign: "right" }}>NET TOTAL</th>
              <th style={thStyle}>STATUS</th>
              <th style={{ ...thStyle, textAlign: "right" }}>OPEN</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(function(r) {
              const isDraft = r.status === "draft";
              return (
                <tr key={r.id} onClick={function() { navigate("/payroll/run/" + r.id + (isDraft ? "" : "/done")); }} style={{ borderBottom: "1px solid " + C.lineSoft, cursor: "pointer" }}>
                  <td style={tdStyle}>{fmtDate(r.pay_period_start)} to {fmtDate(r.pay_period_end)}</td>
                  <td style={{ ...tdStyle, ...TABULAR }}>{fmtDate(r.pay_date)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", ...TABULAR }}>{r.employee_count || 0}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, ...TABULAR }}>{fmtMoney(r.total_net)}</td>
                  <td style={tdStyle}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: isDraft ? C.amber : C.brandDark, background: isDraft ? C.amberBg : C.brandBg, padding: "3px 10px", borderRadius: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      <span style={{ width: 6, height: 6, background: isDraft ? C.amber : C.brandDark, borderRadius: "50%" }} />
                      {isDraft ? "Draft" : "Finalized"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <Search size={16} style={{ color: C.brand, cursor: "pointer" }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Fixed footer */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.card, padding: "16px 32px", borderTop: "1px solid " + C.line, boxShadow: "0 -4px 12px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 100 }}>
        <button onClick={function() { navigate("/payroll/overview"); }} style={footerBtnStyle}>&larr; Back to Payroll</button>
        <button onClick={handleExportCSV} style={footerBtnStyle}>Export CSV</button>
      </div>
    </div>
  );
}

const thStyle = { textAlign: "left", padding: "12px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#12262B", borderBottom: "1px solid #E7EAF0" };
const tdStyle = { padding: "14px 10px", color: "#12262B", fontWeight: 500 };
