import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PayStub from "../components/payroll/PayStub";
import { Search, ChevronDown, Check, MoreVertical, Filter, Download, Printer, Eye, Mail, RotateCcw, FileText, X as XIcon, Lock, Play } from "lucide-react";
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
  grey: "#6B7280",
  greyBg: "#F3F4F6",
  err: "#DC2626",
  errBg: "#FEE2E2",
  page: "#F4F6F8",
  card: "#FFFFFF",
  line: "#E7EAF0",
  lineSoft: "#F1F3F7",
  chequePaper: "#FFFEF7",
  chequeBorder: "#C7CBD1",
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

function numberToWords(n) {
  // Convert number to English words for cheque
  const num = Math.floor(Math.abs(n));
  const cents = Math.round((Math.abs(n) - num) * 100);
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function under1000(x) {
    if (x < 20) return ones[x];
    if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? "-" + ones[x % 10].toLowerCase() : "");
    return ones[Math.floor(x / 100)] + " hundred" + (x % 100 ? " " + under1000(x % 100).toLowerCase() : "");
  }
  let words = "";
  if (num === 0) words = "Zero";
  else if (num < 1000) words = under1000(num);
  else if (num < 1000000) {
    words = under1000(Math.floor(num / 1000)) + " thousand";
    if (num % 1000) words += " " + under1000(num % 1000).toLowerCase();
  } else {
    words = under1000(Math.floor(num / 1000000)) + " million";
    if (Math.floor((num % 1000000) / 1000)) words += " " + under1000(Math.floor((num % 1000000) / 1000)).toLowerCase() + " thousand";
    if (num % 1000) words += " " + under1000(num % 1000).toLowerCase();
  }
  return words + " and " + String(cents).padStart(2, "0") + "/100 DOLLARS";
}

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { Authorization: "Bearer " + t, "Content-Type": "application/json" };
}

function initialsOf(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
}

export default function PaychequeList() {
  const navigate = useNavigate();
  const [paycheques, setPaycheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [methodFilter, setMethodFilter] = useState("all");
  const [privacy, setPrivacy] = useState(localStorage.getItem("novala_privacy") === "on");
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [openKebabId, setOpenKebabId] = useState(null);
  const [editingChq, setEditingChq] = useState(null); // stub_id being edited
  const queryClient = useQueryClient();
  const [chqInput, setChqInput] = useState("");
  const [savingChq, setSavingChq] = useState(false);
  const [chequeModal, setChequeModal] = useState(null); // stub object
  const [printTarget, setPrintTarget] = useState(null); // paycheque to print
  const [voidTarget, setVoidTarget] = useState(null); // paycheque being voided
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [company, setCompany] = useState({ name: "", address: "" });

  const filterRef = useRef(null);
  const exportRef = useRef(null);
  const moreRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(function() {
    function onClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
      if (!e.target.closest(".row-kebab")) setOpenKebabId(null);
    }
    function onEsc(e) {
      if (e.key === "Escape") {
        setFilterOpen(false); setExportOpen(false); setMoreOpen(false); setOpenKebabId(null);
        setEditingChq(null); setChequeModal(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return function() {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // React Query: paycheques list
  const { data: paychequesData, isLoading: paychequesLoading, error: paychequesError } = useQuery({
    queryKey: ["paycheques"],
    queryFn: async function() {
      const res = await apiFetch("/api/v1/payroll/paycheques", { headers: authHeaders() });
      if (!res.ok) throw new Error("Could not load paycheques");
      const data = await res.json();
      return Array.isArray(data) ? data : (data.paycheques || data.items || []);
    },
    refetchOnWindowFocus: false,
  });

  useEffect(function() {
    if (paychequesData) setPaycheques(paychequesData);
    setLoading(paychequesLoading);
    if (paychequesError) setError(paychequesError.message);
  }, [paychequesData, paychequesLoading, paychequesError]);

  function fetchPaycheques() {
    queryClient.invalidateQueries({ queryKey: ["paycheques"] });
  }

  // React Query: company settings
  const { data: companyData } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async function() {
      const res = await apiFetch("/api/v1/payroll/settings", { headers: authHeaders() });
      if (!res.ok) return null;
      return await res.json();
    },
    refetchOnWindowFocus: false,
  });

  useEffect(function() {
    if (companyData) {
      setCompany({
        name: companyData.company_name || localStorage.getItem("company_name") || "",
        address: companyData.company_address || "",
      });
    }
  }, [companyData]);

  function fetchCompany() {
    queryClient.invalidateQueries({ queryKey: ["company-settings"] });
  }

  function togglePrivacy() {
    const next = !privacy;
    setPrivacy(next);
    localStorage.setItem("novala_privacy", next ? "on" : "off");
  }

  const counts = useMemo(function() {
    return {
      all: paycheques.length,
      issued: paycheques.filter(function(p) { return p.status === "issued"; }).length,
      pending: paycheques.filter(function(p) { return (p.status || "pending") === "pending"; }).length,
      paid: paycheques.filter(function(p) { return p.status === "paid"; }).length,
      voided: paycheques.filter(function(p) { return p.status === "voided"; }).length,
    };
  }, [paycheques]);

  const filtered = useMemo(function() {
    let list = paycheques.slice();
    if (tab !== "all") list = list.filter(function(p) {
      const s = p.status || "pending";
      return s === tab;
    });
    if (methodFilter !== "all") {
      list = list.filter(function(p) {
        const m = (p.payment_method || p.pay_method || "").toLowerCase();
        if (methodFilter === "cheque") return m.includes("cheque") || m.includes("check");
        if (methodFilter === "direct") return m.includes("direct") || m.includes("deposit");
        return true;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(function(p) {
        const name = (p.employee_name || "").toLowerCase();
        const chq = String(p.cheque_number || "").toLowerCase();
        return name.includes(q) || chq.includes(q);
      });
    }
    if (sort === "newest") list.sort(function(a, b) { return new Date(b.pay_date || 0) - new Date(a.pay_date || 0); });
    else if (sort === "oldest") list.sort(function(a, b) { return new Date(a.pay_date || 0) - new Date(b.pay_date || 0); });
    else if (sort === "net-high") list.sort(function(a, b) { return Number(b.net_pay || 0) - Number(a.net_pay || 0); });
    else if (sort === "net-low") list.sort(function(a, b) { return Number(a.net_pay || 0) - Number(b.net_pay || 0); });
    else if (sort === "name-az") list.sort(function(a, b) { return (a.employee_name || "").localeCompare(b.employee_name || ""); });
    return list;
  }, [paycheques, tab, methodFilter, search, sort]);

  const sectionTitle = tab === "pending" ? "Pending paycheques" : tab === "issued" ? "Issued paycheques" : tab === "paid" ? "Paid paycheques" : tab === "voided" ? "Voided paycheques" : "Paycheque history";

  async function saveChequeNumber(stubId, value) {
    // Client-side validation
    const trimmed = String(value || "").trim();
    if (trimmed) {
      if (!/^\d+$/.test(trimmed)) {
        alert("Cheque number must contain only digits (0-9). No letters, spaces, or dashes.");
        return;
      }
      if (trimmed.length < 3) {
        alert("Cheque number must be at least 3 digits.");
        return;
      }
      if (trimmed.length > 10) {
        alert("Cheque number cannot be more than 10 digits.");
        return;
      }
      if (parseInt(trimmed, 10) === 0) {
        alert("Cheque number cannot be zero.");
        return;
      }
    }
    setSavingChq(true);
    try {
      const res = await apiFetch("/api/v1/payroll/paycheques/" + stubId + "/cheque-number", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ cheque_number: trimmed || null }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(function() { return {}; });
        throw new Error(errData.detail || "Save failed");
      }
      const data = await res.json();
      setPaycheques(function(prev) {
        return prev.map(function(p) {
          return p.id === stubId ? Object.assign({}, p, { cheque_number: data.cheque_number }) : p;
        });
      });
      setEditingChq(null);
      setChqInput("");
    } catch (e) {
      alert("Could not save: " + e.message);
    } finally { setSavingChq(false); }
  }

  function printPayStub(p) {
    setOpenKebabId(null);
    // Get token from localStorage and open direct URL - Chrome PDF viewer will show proper filename
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const pdfUrl = API_URL + "/api/v1/payroll/paycheques/" + p.id + "/pdf?token=" + encodeURIComponent(token);
    window.open(pdfUrl, "_blank");
  }

  async function handleVoid(stubId, reason) {
    setVoiding(true);
    try {
      const res = await apiFetch("/api/v1/payroll/paycheques/" + stubId + "/void", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Void failed");
      }
      setVoidTarget(null);
      setVoidReason("");
      await fetchPaycheques();
    } catch (e) {
      alert("Could not void: " + e.message);
    } finally { setVoiding(false); }
  }

  function openCheque(p) {
    setChequeModal(p);
    setOpenKebabId(null);
  }

  function isCheque(p) {
    const m = (p.payment_method || p.pay_method || "").toLowerCase();
    return m.includes("cheque") || m.includes("check");
  }

  function handleExportCSV() {
    const header = ["Pay date", "Employee", "Gross pay", "Net pay", "Method", "Cheque/Ref", "Status"];
    const rows = filtered.map(function(p) {
      return [
        fmtDate(p.pay_date),
        p.employee_name || "",
        Number(p.gross_pay || 0).toFixed(2),
        Number(p.net_pay || 0).toFixed(2),
        p.payment_method || p.pay_method || "",
        p.cheque_number || "",
        p.status || "pending",
      ];
    });
    const csv = [header, ...rows].map(function(r) {
      return r.map(function(v) { return String(v).indexOf(",") >= 0 ? "\"" + v + "\"" : v; }).join(",");
    }).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paycheques_" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }

  const outlineBtn = { padding: "6px 12px", background: "transparent", border: "1.5px solid " + C.ink, borderRadius: 8, color: C.ink, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6 };
  const outlineBtnLarger = Object.assign({}, outlineBtn, { padding: "10px 14px", borderRadius: 10, fontSize: 13 });
  const footerBtn = { padding: "12px 18px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT };
  const menuItem = { display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", fontSize: 13, color: C.ink, cursor: "pointer", border: "none", background: "transparent", width: "100%", textAlign: "left", fontFamily: FONT };

  function tabStyle(active) {
    return {
      padding: "10px 16px", fontSize: 14, fontWeight: 700, color: C.ink,
      background: "transparent", border: "none",
      borderBottom: active ? "2px solid " + C.brand : "2px solid transparent",
      marginBottom: -1, cursor: "pointer", fontFamily: FONT, opacity: active ? 1 : 0.7,
    };
  }

  return (
    <div style={{ background: C.page, minHeight: "100vh", fontFamily: FONT, color: C.ink, padding: "28px 32px 100px", boxSizing: "border-box" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.ink, marginBottom: 14 }}>
        <span style={{ fontWeight: 600, opacity: 0.7, cursor: "pointer" }} onClick={function() { navigate("/payroll/overview"); }}>Payroll</span>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ fontWeight: 700 }}>Paycheques</span>
      </div>

      {/* Title + top-right actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>Paycheques</h1>
          <div style={{ fontSize: 14, color: C.ink, fontWeight: 500, marginTop: 4 }}>All employee paycheques from finalized pay runs.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          {/* Privacy */}
          <button onClick={togglePrivacy} style={Object.assign({}, outlineBtnLarger, { background: privacy ? C.brandBg : "transparent", borderColor: privacy ? C.brand : C.ink })}>
            <div style={{ width: 32, height: 18, borderRadius: 10, background: privacy ? C.brand : "#D1D5DB", position: "relative", transition: "0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: privacy ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "0.2s" }} />
            </div>
            {privacy ? "Privacy on" : "Privacy"}
          </button>

          {/* Export */}
          <div ref={exportRef} style={{ position: "relative" }}>
            <button onClick={function() { setExportOpen(!exportOpen); setMoreOpen(false); }} style={outlineBtnLarger}>Export <ChevronDown size={12} /></button>
            {exportOpen && (
              <div style={{ position: "absolute", top: 46, right: 0, background: C.card, border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", padding: "6px 0", minWidth: 200, zIndex: 100 }}>
                <button onClick={handleExportCSV} style={menuItem}><FileText size={14} /> Export to CSV</button>
                <button onClick={function() { window.print(); setExportOpen(false); }} style={menuItem}><Printer size={14} /> Save as PDF</button>
              </div>
            )}
          </div>

          {/* More menu */}
          <div ref={moreRef} style={{ position: "relative" }}>
            <button onClick={function() { setMoreOpen(!moreOpen); setExportOpen(false); }} style={{ width: 40, height: 40, background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <MoreVertical size={16} />
            </button>
            {moreOpen && (
              <div style={{ position: "absolute", top: 46, right: 0, background: C.card, border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", padding: "6px 0", minWidth: 220, zIndex: 100 }}>
                <button disabled style={Object.assign({}, menuItem, { opacity: 0.4, cursor: "not-allowed" })}><RotateCcw size={14} /> Bulk void selected</button>
                <button onClick={function() { setMoreOpen(false); navigate("/tools/audit-log"); }} style={menuItem}><FileText size={14} /> View audit log</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 500 }}>
        <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.ink }} />
        <input ref={searchRef} type="text" value={search} onChange={function(e) { setSearch(e.target.value); }}
          placeholder="Search by employee name or cheque number..."
          style={{ width: "100%", padding: "12px 14px 12px 44px", border: "1.5px solid " + C.ink, borderRadius: 10, fontFamily: FONT, fontSize: 14, color: C.ink, background: C.card, fontWeight: 500, boxSizing: "border-box", outline: "none" }} />
        {search && (
          <button onClick={function() { setSearch(""); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: C.ink, color: "#fff", border: "none", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}>
            <XIcon size={14} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: "1px solid " + C.line }}>
        <button onClick={function() { setTab("all"); }} style={tabStyle(tab === "all")}>All <span style={{ color: C.ink, fontWeight: 700, marginLeft: 4 }}>{counts.all}</span></button>
        <button onClick={function() { setTab("pending"); }} style={tabStyle(tab === "pending")}>Pending <span style={{ color: C.ink, fontWeight: 700, marginLeft: 4 }}>{counts.pending}</span></button>
          <button onClick={function() { setTab("issued"); }} style={tabStyle(tab === "issued")}>Issued <span style={{ color: C.ink, fontWeight: 700, marginLeft: 4 }}>{counts.issued}</span></button>
        <button onClick={function() { setTab("paid"); }} style={tabStyle(tab === "paid")}>Paid <span style={{ color: C.ink, fontWeight: 700, marginLeft: 4 }}>{counts.paid}</span></button>
        <button onClick={function() { setTab("voided"); }} style={tabStyle(tab === "voided")}>Voided <span style={{ color: C.ink, fontWeight: 700, marginLeft: 4 }}>{counts.voided}</span></button>
      </div>

      {/* Section header + filter */}
      <div style={{ paddingBottom: 8, borderBottom: "1.5px solid " + C.ink, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink }}>{sectionTitle}</h2>
        <div ref={filterRef} style={{ position: "relative" }}>
          <button onClick={function() { setFilterOpen(!filterOpen); }} style={outlineBtn}>Filter <ChevronDown size={10} /></button>
          {filterOpen && (
            <div style={{ position: "absolute", top: 36, right: 0, background: C.card, border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", padding: "10px 0", minWidth: 240, zIndex: 100 }}>
              <div style={{ padding: "4px 14px 8px", fontSize: 10, fontWeight: 700, color: C.ink, letterSpacing: "0.1em", textTransform: "uppercase" }}>Sort by</div>
              {[["newest", "Newest first"], ["oldest", "Oldest first"], ["net-high", "Net pay, highest first"], ["net-low", "Net pay, lowest first"], ["name-az", "Employee A to Z"]].map(function(opt) {
                return (
                  <button key={opt[0]} onClick={function() { setSort(opt[0]); }} style={Object.assign({}, menuItem, { justifyContent: "space-between" })}>
                    <span>{opt[1]}</span>
                    {sort === opt[0] && <Check size={14} style={{ color: C.brand }} strokeWidth={3} />}
                  </button>
                );
              })}
              <div style={{ height: 1, background: C.line, margin: "6px 0" }} />
              <div style={{ padding: "4px 14px 8px", fontSize: 10, fontWeight: 700, color: C.ink, letterSpacing: "0.1em", textTransform: "uppercase" }}>Payment method</div>
              {[["all", "All methods"], ["cheque", "Cheque only"], ["direct", "Direct deposit only"]].map(function(opt) {
                return (
                  <button key={opt[0]} onClick={function() { setMethodFilter(opt[0]); }} style={Object.assign({}, menuItem, { justifyContent: "space-between" })}>
                    <span>{opt[1]}</span>
                    {methodFilter === opt[0] && <Check size={14} style={{ color: C.brand }} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {loading && <div style={{ padding: "48px 20px", textAlign: "center", color: C.ink, fontSize: 14 }}>Loading paycheques...</div>}

      {error && !loading && (
        <div style={{ padding: 16, background: C.errBg, border: "1px solid #F87171", borderRadius: 10, color: "#991B1B", fontSize: 13 }}>
          <strong>Could not load:</strong> {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <FileText size={48} style={{ color: C.ink, opacity: 0.4, marginBottom: 12 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
            {search ? "No matches" : paycheques.length === 0 ? "No paycheques yet" : "Nothing to show"}
          </div>
          <div style={{ fontSize: 14, color: C.ink, maxWidth: 400, margin: "0 auto" }}>
            {search ? ("No paycheques match \"" + search + "\".") : paycheques.length === 0 ? "Paycheques appear here after a pay run is finalized." : "Try switching tabs or adjusting filters."}
          </div>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr>
              <th style={thStyle}><input type="checkbox" style={{ cursor: "pointer" }} /></th>
              <th style={thStyle}>PAY DATE</th>
              <th style={thStyle}>EMPLOYEE</th>
              <th style={{ ...thStyle, textAlign: "right" }}>GROSS PAY</th>
              <th style={{ ...thStyle, textAlign: "right" }}>NET PAY</th>
              <th style={thStyle}>METHOD</th>
              <th style={thStyle}>CHEQUE / REF NO</th>
              <th style={thStyle}>STATUS</th>
              <th style={{ ...thStyle, textAlign: "right", width: 60 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(function(p) {
              const status = p.status || "pending";
              const isVoided = status === "voided";
              const isCheq = isCheque(p);
              const isEditingThis = editingChq === p.id;
              const menuOpen = openKebabId === p.id;

              return (
                <tr key={p.id} style={{ borderBottom: "1px solid " + C.lineSoft, opacity: isVoided ? 0.6 : 1 }}>
                  <td style={tdStyle}><input type="checkbox" onClick={function(e) { e.stopPropagation(); }} style={{ cursor: "pointer" }} /></td>
                  <td style={{ ...tdStyle, ...TABULAR, cursor: "pointer" }} onClick={function() { navigate("/payroll/paycheques/" + p.id); }}>{fmtDate(p.pay_date)}</td>
                  <td style={{ ...tdStyle, cursor: "pointer" }} onClick={function() { navigate("/payroll/paycheques/" + p.id); }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.brandBg, color: C.brandDark, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>{initialsOf(p.employee_name)}</div>
                      <span style={{ color: C.ink, fontWeight: 600 }}>{p.employee_name || "Unnamed"}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", ...TABULAR }}>
                    {privacy ? <span style={{ letterSpacing: 4 }}>••••</span> : fmtMoney(p.gross_pay)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, ...TABULAR }}>
                    {privacy ? <span style={{ letterSpacing: 4 }}>••••</span> : fmtMoney(p.net_pay)}
                  </td>
                  <td style={tdStyle}>{p.payment_method || p.pay_method || ""}</td>
                  <td style={tdStyle}>
                    {isEditingThis ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="text" value={chqInput}
                          onChange={function(e) { setChqInput(e.target.value.replace(/[^\d]/g, "").slice(0, 10)); }}
                          onKeyDown={function(e) {
                            if (e.key === "Enter") saveChequeNumber(p.id, chqInput);
                            if (e.key === "Escape") { setEditingChq(null); setChqInput(""); }
                          }}
                          autoFocus
                          disabled={savingChq}
                          placeholder="1042"
                          maxLength={10}
                          inputMode="numeric"
                          style={{ width: 100, padding: "6px 8px", border: "1.5px solid " + C.brand, borderRadius: 6, fontFamily: FONT, fontSize: 13, color: C.ink, outline: "none", fontVariantNumeric: "tabular-nums" }}
                        />
                        <button onClick={function() { saveChequeNumber(p.id, chqInput); }} disabled={savingChq} style={{ padding: "4px 8px", background: C.brand, border: "none", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{savingChq ? "..." : "Save"}</button>
                      </div>
                    ) : p.cheque_number ? (
                      <span onClick={function(e) { e.stopPropagation(); openCheque(p); }} style={{ color: C.brandDark, fontWeight: 700, cursor: "pointer", textDecoration: "underline", ...TABULAR }}>{p.cheque_number}</span>
                    ) : isCheq ? (
                      <span onClick={function(e) { e.stopPropagation(); setEditingChq(p.id); setChqInput(""); }} style={{ color: C.brandDark, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>+ Add cheque number</span>
                    ) : (
                      <span style={{ color: C.ink }}>Direct deposit</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: (status === "paid" || status === "issued") ? C.brandDark : status === "voided" ? C.grey : C.amber, background: (status === "paid" || status === "issued") ? C.brandBg : status === "voided" ? C.greyBg : C.amberBg, padding: "3px 10px", borderRadius: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      <span style={{ width: 6, height: 6, background: (status === "paid" || status === "issued") ? C.brandDark : status === "voided" ? C.grey : C.amber, borderRadius: "50%" }} />
                      {status === "paid" ? "Paid" : status === "issued" ? "Issued" : status === "voided" ? "Voided" : "Pending"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", position: "relative", width: 60 }} className="row-kebab">
                    <button onClick={function(e) { e.stopPropagation(); setOpenKebabId(menuOpen ? null : p.id); }} style={{ width: 30, height: 30, border: "none", background: "transparent", borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.ink }}>
                      <MoreVertical size={16} />
                    </button>
                    {menuOpen && (
                      <div className="row-kebab" style={{ position: "absolute", top: 40, right: 10, background: C.card, border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", padding: "6px 0", minWidth: 200, zIndex: 50, textAlign: "left" }}>
                        <button onClick={function() { setOpenKebabId(null); navigate("/payroll/paycheques/" + p.id); }} style={menuItem}><Eye size={14} /> View pay stub</button>
                        <button onClick={function() { printPayStub(p); }} style={menuItem}><Printer size={14} /> Print pay stub</button>
                        {isCheq && p.cheque_number && (
                          <button onClick={function() { openCheque(p); }} style={menuItem}><FileText size={14} /> View cheque</button>
                        )}
                        {isCheq && !p.cheque_number && (
                          <button onClick={function() { setOpenKebabId(null); setEditingChq(p.id); setChqInput(""); }} style={Object.assign({}, menuItem, { color: C.brandDark, fontWeight: 700 })}>+ Add cheque number</button>
                        )}
                        {status !== "voided" && (
                          <>
                            <div style={{ height: 1, background: C.line, margin: "4px 0" }} />
                            <button onClick={function() { setOpenKebabId(null); setVoidTarget(p); setVoidReason(""); }} style={Object.assign({}, menuItem, { color: C.err })}><RotateCcw size={14} /> Void this paycheque</button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Void confirmation modal */}
      {voidTarget && (
        <div onClick={function() { if (!voiding) setVoidTarget(null); }} style={{ position: "fixed", inset: 0, background: "rgba(18,38,43,0.5)", zIndex: 250, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: C.card, borderRadius: 14, padding: "24px 22px", width: 460, maxWidth: "94vw", boxShadow: "0 24px 60px rgba(18,26,43,0.28)", fontFamily: FONT }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.errBg, display: "grid", placeItems: "center" }}>
                <RotateCcw size={20} style={{ color: C.err }} />
              </div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.ink }}>Void this paycheque?</h3>
            </div>
            <div style={{ fontSize: 13.5, color: C.ink, marginBottom: 16, lineHeight: 1.5 }}>
              This will mark {voidTarget.employee_name}'s paycheque for <strong>{fmtDate(voidTarget.pay_date)}</strong> as voided. This reverses their YTD totals and cannot be undone.
            </div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Reason for voiding</label>
            <textarea value={voidReason} onChange={function(e) { setVoidReason(e.target.value); }} disabled={voiding}
              placeholder="e.g. Wrong hours entered, employee received duplicate payment..."
              rows={3}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid " + C.ink, borderRadius: 8, fontFamily: FONT, fontSize: 13, color: C.ink, resize: "vertical", boxSizing: "border-box", marginBottom: 16, outline: "none" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={function() { setVoidTarget(null); }} disabled={voiding} style={{ padding: "10px 16px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: voiding ? "not-allowed" : "pointer", opacity: voiding ? 0.5 : 1, fontFamily: FONT }}>Cancel</button>
              <button onClick={function() { handleVoid(voidTarget.id, voidReason); }} disabled={voiding || !voidReason.trim()} style={{ padding: "10px 16px", background: C.err, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: (voiding || !voidReason.trim()) ? "not-allowed" : "pointer", opacity: (voiding || !voidReason.trim()) ? 0.5 : 1, fontFamily: FONT }}>
                {voiding ? "Voiding..." : "Void paycheque"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cheque modal */}
      {chequeModal && (
        <div onClick={function() { setChequeModal(null); }} style={{ position: "fixed", inset: 0, background: "rgba(18,38,43,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="cheque-print-target" onClick={function(e) { e.stopPropagation(); }} style={{ background: C.chequePaper, border: "1px solid " + C.chequeBorder, borderRadius: 4, boxShadow: "0 24px 60px rgba(0,0,0,0.3)", width: 720, maxWidth: "94vw", maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ padding: "32px 40px", fontFamily: "Georgia, serif", color: C.ink }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{company.name || "Company"}</div>
                  <div style={{ fontSize: 12, whiteSpace: "pre-line" }}>{company.address}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontFamily: FONT }}>Cheque no</div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums lining-nums" }}>{chequeModal.cheque_number || ""}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 32, marginBottom: 32 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontFamily: FONT }}>Pay to the order of</div>
                  <div style={{ fontSize: 18, fontWeight: 600, borderBottom: "1px solid " + C.ink, paddingBottom: 6 }}>{chequeModal.employee_name}</div>
                </div>
                <div style={{ width: 220 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontFamily: FONT }}>Date</div>
                  <div style={{ fontSize: 16, fontWeight: 600, borderBottom: "1px solid " + C.ink, paddingBottom: 6, fontVariantNumeric: "tabular-nums lining-nums" }}>{fmtDate(chequeModal.pay_date)}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 40 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontStyle: "italic", borderBottom: "1px solid " + C.ink, paddingBottom: 6 }}>{numberToWords(chequeModal.net_pay)}</div>
                </div>
                <div style={{ minWidth: 180, border: "2px solid " + C.ink, padding: "10px 16px", textAlign: "right" }}>
                  <span style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums lining-nums" }}>{fmtMoney(chequeModal.net_pay)}</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                <div style={{ flex: 1, marginRight: 40 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontFamily: FONT }}>Memo</div>
                  <div style={{ fontSize: 13, fontStyle: "italic", borderBottom: "1px solid " + C.ink, paddingBottom: 6 }}>Payroll paycheque</div>
                </div>
                <div style={{ width: 260 }}>
                  <div style={{ height: 24, borderBottom: "1px solid " + C.ink }} />
                  <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 6, textAlign: "center", fontFamily: FONT }}>Authorized signature</div>
                </div>
              </div>
            </div>
            <div className="no-print-in-cheque" style={{ padding: "16px 40px 24px", borderTop: "1px solid " + C.line, background: "#FFFFFF", display: "flex", gap: 10, justifyContent: "center", fontFamily: FONT }}>
              <button onClick={function() { document.body.classList.add("printing-cheque"); setTimeout(function() { window.print(); document.body.classList.remove("printing-cheque"); }, 50); }} style={{ padding: "12px 24px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Print cheque</button>
              <button onClick={function() {
              const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
              const url = API_URL + "/api/v1/payroll/paycheques/" + chequeModal.id + "/cheque-pdf?token=" + encodeURIComponent(token);
              window.open(url, "_blank");
            }} style={{ padding: "12px 24px", background: C.brand, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Save as PDF</button>
              <button onClick={function() { setChequeModal(null); }} style={{ padding: "12px 24px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Print CSS for cheque */}
      <style>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          body.printing-cheque * { visibility: hidden !important; }
          body.printing-cheque .cheque-print-target,
          body.printing-cheque .cheque-print-target * { visibility: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          body.printing-cheque .no-print-in-cheque,
          body.printing-cheque .no-print-in-cheque * { visibility: hidden !important; display: none !important; }
          body.printing-cheque .cheque-print-target { position: absolute !important; left: 0 !important; top: 0 !important; right: 0 !important; margin: 0 auto !important; width: 100% !important; max-width: 7.5in !important; max-height: none !important; height: auto !important; overflow: visible !important; background: white !important; box-shadow: none !important; border: none !important; padding: 0 !important; }
        }
      `}</style>

      {/* Fixed footer */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.card, padding: "16px 32px", borderTop: "1px solid " + C.line, boxShadow: "0 -4px 12px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 90 }}>
        <button onClick={function() { navigate("/payroll/overview"); }} style={footerBtn}>&larr; Back to Payroll</button>
        <button onClick={handleExportCSV} style={footerBtn}>Export all</button>
      </div>
    </div>
  );
}

const thStyle = { textAlign: "left", padding: "12px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#12262B", borderBottom: "1px solid #E7EAF0" };
const tdStyle = { padding: "14px 10px", color: "#12262B", fontWeight: 500 };
