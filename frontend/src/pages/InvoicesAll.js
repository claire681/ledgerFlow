import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Sliders, Printer, Share2, X, ChevronDown, Calendar, Search } from "lucide-react";

const BORDER = "#e2e8f0";
const TEXT = "#0F172A";
const SUBTLE = "#64748B";
const LINK = "#0F9599";
const BRAND_GREEN = "#0F5959";
const TABULAR = { fontVariantNumeric: "tabular-nums" };

function formatCurrency(amount, currency) {
  const sym = currency === "CAD" ? "CA$" : (currency === "USD" || !currency ? "$" : currency + "$");
  const n = Number(amount || 0);
  return sym + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(s) {
  if (!s) return "";
  const parts = String(s).split("T")[0].split("-");
  if (parts.length === 3) return parts[2] + "/" + parts[1] + "/" + parts[0];
  return s;
}

function isoToday() {
  return new Date().toISOString().split("T")[0];
}
function isoOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function startOfWeek(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + offset);
  return d.toISOString().split("T")[0];
}
function startOfMonth(monthOffset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset, 1);
  return d.toISOString().split("T")[0];
}
function endOfMonth(monthOffset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset + 1, 0);
  return d.toISOString().split("T")[0];
}

const DATE_PRESETS = [
  { value: "custom", label: "Custom" },
  { value: "last7", label: "Last 7 days" },
  { value: "last14", label: "Last 14 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "last3m", label: "Last 3 months" },
  { value: "prevWeek", label: "Previous week" },
  { value: "prevMonth", label: "Previous month" },
  { value: "prevQuarter", label: "Previous quarter" },
  { value: "thisWeek", label: "This week" },
  { value: "thisMonth", label: "This month" },
  { value: "thisQuarter", label: "This quarter" },
  { value: "thisYear", label: "This year" },
  { value: "today", label: "Today" }
];

const TRANSACTION_TYPES = [
  "Invoice",
  "Advance payment",
  "Build assembly",
  "Cash expense",
  "Change order",
  "Credit card",
  "Credit card credit",
  "Credit card payment",
  "Credit memo",
  "Custom",
  "Delayed charge",
  "Delayed credit",
  "Deposit",
  "Estimate",
  "Expense",
  "Inventory adjustment",
  "Invoice payment",
  "Journal entry",
  "Pay bills",
  "Payment",
  "Purchase order",
  "Receive payment",
  "Refund receipt",
  "Sales receipt",
  "Statement charge",
  "Supplier credit",
  "Time activity",
  "Transfer",
  "Vendor bill",
  "Vendor credit"
];

function resolveDateRange(preset, customFrom, customTo) {
  switch (preset) {
    case "today": return { from: isoToday(), to: isoToday() };
    case "last7": return { from: isoOffset(-7), to: isoToday() };
    case "last14": return { from: isoOffset(-14), to: isoToday() };
    case "last30": return { from: isoOffset(-30), to: isoToday() };
    case "last3m": {
      const d = new Date(); d.setMonth(d.getMonth() - 3);
      return { from: d.toISOString().split("T")[0], to: isoToday() };
    }
    case "thisWeek": return { from: startOfWeek(), to: isoToday() };
    case "thisMonth": return { from: startOfMonth(), to: endOfMonth() };
    case "thisQuarter": {
      const d = new Date(); const q = Math.floor(d.getMonth() / 3);
      return { from: startOfMonth(q * 3 - d.getMonth()), to: endOfMonth(q * 3 + 2 - d.getMonth()) };
    }
    case "thisYear": {
      const y = new Date().getFullYear();
      return { from: y + "-01-01", to: y + "-12-31" };
    }
    case "prevWeek": return { from: startOfWeek(-7), to: startOfWeek(-1) };
    case "prevMonth": return { from: startOfMonth(-1), to: endOfMonth(-1) };
    case "prevQuarter": {
      const d = new Date(); const q = Math.floor(d.getMonth() / 3) - 1;
      return { from: startOfMonth(q * 3 - d.getMonth()), to: endOfMonth(q * 3 + 2 - d.getMonth()) };
    }
    case "custom": return { from: customFrom, to: customTo };
    default: return { from: "", to: "" };
  }
}

// Reusable popover wrapper
function FilterField({ label, displayValue, hasValue, onClear, children, popoverRef }) {
  return (
    <div ref={popoverRef} style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
      <label style={{ display: "block", fontSize: 13, color: TEXT, marginBottom: 6, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

export default function InvoicesAll() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [datePreset, setDatePreset] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [refNumber, setRefNumber] = useState("");

  const [selectedTxnType, setSelectedTxnType] = useState("Invoice");
  const [openTxnType, setOpenTxnType] = useState(false);
  const [txnTypeSearch, setTxnTypeSearch] = useState("");
  const txnTypeRef = useRef(null);

  const [selectedContact, setSelectedContact] = useState("");

  const [amountMode, setAmountMode] = useState("equals");
  const [amountValue, setAmountValue] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  // Popover open states
  const [openDate, setOpenDate] = useState(false);
  const [openRef, setOpenRef] = useState(false);
  const [openContact, setOpenContact] = useState(false);
  const [openAmount, setOpenAmount] = useState(false);

  // Temporary inputs (only applied on Apply click)
  const [tmpDatePreset, setTmpDatePreset] = useState("custom");
  const [tmpDateFrom, setTmpDateFrom] = useState("");
  const [tmpDateTo, setTmpDateTo] = useState("");
  const [tmpRef, setTmpRef] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [tmpAmountMode, setTmpAmountMode] = useState("equals");
  const [tmpAmountValue, setTmpAmountValue] = useState("");
  const [tmpAmountMin, setTmpAmountMin] = useState("");
  const [tmpAmountMax, setTmpAmountMax] = useState("");

  // Sub-popover for the Date preset dropdown
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);

  const dateRef = useRef(null);
  const refRef = useRef(null);
  const contactRef = useRef(null);
  const amountRef = useRef(null);

  // Load invoices + customers
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    if (!token) { window.location.href = "/login"; return; }

    Promise.all([
      fetch("https://api.getnovala.com/api/v1/invoices/", { headers: { Authorization: "Bearer " + token } }).then(r => {
        if (r.status === 401) { window.location.href = "/login"; return null; }
        if (!r.ok) throw new Error("Failed to load invoices (" + r.status + ")");
        return r.json();
      }),
      fetch("https://api.getnovala.com/api/v1/customers/", { headers: { Authorization: "Bearer " + token } }).then(r => {
        if (!r.ok) return [];
        return r.json();
      })
    ]).then(([inv, cust]) => {
      if (inv) {
        const list = Array.isArray(inv) ? inv : (inv.data || inv.invoices || inv.results || []);
        setInvoices(list);
      }
      if (cust) {
        const list = Array.isArray(cust) ? cust : (cust.data || cust.customers || cust.results || []);
        setCustomers(list);
      }
      setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    const h = (e) => {
      if (dateRef.current && !dateRef.current.contains(e.target)) { setOpenDate(false); setPresetMenuOpen(false); }
      if (txnTypeRef.current && !txnTypeRef.current.contains(e.target)) setOpenTxnType(false);
      if (refRef.current && !refRef.current.contains(e.target)) setOpenRef(false);
      if (contactRef.current && !contactRef.current.contains(e.target)) setOpenContact(false);
      if (amountRef.current && !amountRef.current.contains(e.target)) setOpenAmount(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Apply filtering
  let filtered = invoices;
  if (datePreset) {
    const { from, to } = resolveDateRange(datePreset, dateFrom, dateTo);
    if (from) filtered = filtered.filter(i => (i.date || "") >= from);
    if (to) filtered = filtered.filter(i => (i.date || "") <= to);
  }
  if (refNumber) filtered = filtered.filter(i => String(i.invoice_number || "").toLowerCase().includes(refNumber.toLowerCase()));
  if (selectedContact) filtered = filtered.filter(i => String(i.to_name || "") === selectedContact);
  if (amountMode === "equals" && amountValue) filtered = filtered.filter(i => Math.abs(Number(i.total || 0) - Number(amountValue)) < 0.01);
  if (amountMode === "lt" && amountValue) filtered = filtered.filter(i => Number(i.total || 0) < Number(amountValue));
  if (amountMode === "gt" && amountValue) filtered = filtered.filter(i => Number(i.total || 0) > Number(amountValue));
  if (amountMode === "between") {
    if (amountMin) filtered = filtered.filter(i => Number(i.total || 0) >= Number(amountMin));
    if (amountMax) filtered = filtered.filter(i => Number(i.total || 0) <= Number(amountMax));
  }

  const dateDisplay = datePreset
    ? (DATE_PRESETS.find(p => p.value === datePreset) || {}).label
    : "";
  const presetLabel = (DATE_PRESETS.find(p => p.value === tmpDatePreset) || {}).label || "Custom";

  // Styles
  const fieldStyle = {
    padding: "10px 12px",
    border: "1px solid " + BORDER,
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: TEXT,
    height: 42
  };
  const inputStyle = {
    padding: "10px 12px",
    border: "1px solid " + BORDER,
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box"
  };
  const labelStyle = { display: "block", fontSize: 13, color: TEXT, marginBottom: 6, fontWeight: 500 };
  const thStyle = { textAlign: "left", padding: "12px 14px", fontSize: 12, fontWeight: 600, color: SUBTLE, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid " + BORDER, background: "#f8fafc", whiteSpace: "nowrap" };
  const tdStyle = { padding: "14px 14px", fontSize: 14, color: TEXT, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" };
  const popoverStyle = { position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid " + BORDER, borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,0.12)", zIndex: 200, padding: 18 };
  const applyBtnStyle = { padding: "8px 18px", background: BRAND_GREEN, color: "#fff", border: "none", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const clearBtnStyle = { padding: "8px 18px", background: "#fff", color: TEXT, border: "1px solid " + BORDER, borderRadius: 4, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };

  return (
    <div style={{ padding: "20px 28px", fontFamily: "Inter, -apple-system, sans-serif", background: "#fff", minHeight: "100vh" }}>
      {/* Top breadcrumb + icons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div style={{ fontSize: 14, color: SUBTLE }}>
          <span onClick={() => navigate("/transactions")} style={{ color: LINK, cursor: "pointer" }}>Go to all transactions</span>
          <span style={{ margin: "0 8px" }}>or</span>
          <span style={{ color: LINK, cursor: "pointer" }}>Send us feedback</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: SUBTLE }} title="Print"><Printer size={20} /></button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: SUBTLE }} title="Share"><Share2 size={20} /></button>
        </div>
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", gap: 12, alignItems: "end", marginBottom: 18, flexWrap: "wrap" }}>
        {/* Date range */}
        <div ref={dateRef} style={{ position: "relative", flex: "1 1 0", minWidth: 160 }}>
          <label style={labelStyle}>Date range</label>
          <div onClick={() => { setOpenDate(o => !o); if (!openDate) { setTmpDatePreset(datePreset || "custom"); setTmpDateFrom(dateFrom); setTmpDateTo(dateTo); } }} style={{ ...fieldStyle, borderColor: openDate ? BRAND_GREEN : BORDER }}>
            <span style={{ color: dateDisplay ? TEXT : SUBTLE }}>{dateDisplay || "Select..."}</span>
            <Calendar size={16} color={SUBTLE} />
          </div>
          {openDate && (
            <div style={{ ...popoverStyle, width: 540 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: TEXT }}>Date range</span>
                <button onClick={() => setOpenDate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: SUBTLE, padding: 2, display: "flex" }}><X size={18} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div style={{ position: "relative" }}>
                  <label style={labelStyle}>Date</label>
                  <div onClick={() => setPresetMenuOpen(o => !o)} style={{ ...fieldStyle, borderColor: presetMenuOpen ? BRAND_GREEN : BORDER }}>
                    <span>{presetLabel}</span>
                    <ChevronDown size={16} color={SUBTLE} />
                  </div>
                  {presetMenuOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid " + BORDER, borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 220, maxHeight: 240, overflowY: "auto" }}>
                      {DATE_PRESETS.map(p => (
                        <div key={p.value} onClick={() => { setTmpDatePreset(p.value); setPresetMenuOpen(false); }} style={{ padding: "8px 14px", cursor: "pointer", fontSize: 14, color: TEXT, display: "flex", alignItems: "center", gap: 8, background: tmpDatePreset === p.value ? "#f1f5f9" : "transparent" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = tmpDatePreset === p.value ? "#f1f5f9" : "transparent"}>
                          {tmpDatePreset === p.value ? <span style={{ color: BRAND_GREEN }}>✓</span> : <span style={{ width: 12 }} />}
                          {p.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>From</label>
                  <input type="date" value={tmpDateFrom} onChange={e => setTmpDateFrom(e.target.value)} disabled={tmpDatePreset !== "custom"} style={{ ...inputStyle, opacity: tmpDatePreset !== "custom" ? 0.5 : 1 }} />
                </div>
                <div>
                  <label style={labelStyle}>To</label>
                  <input type="date" value={tmpDateTo} onChange={e => setTmpDateTo(e.target.value)} disabled={tmpDatePreset !== "custom"} style={{ ...inputStyle, opacity: tmpDatePreset !== "custom" ? 0.5 : 1 }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <button onClick={() => { setTmpDatePreset("custom"); setTmpDateFrom(""); setTmpDateTo(""); }} style={clearBtnStyle}>Clear</button>
                <button onClick={() => { setDatePreset(tmpDatePreset === "custom" && !tmpDateFrom && !tmpDateTo ? "" : tmpDatePreset); setDateFrom(tmpDateFrom); setDateTo(tmpDateTo); setOpenDate(false); }} style={applyBtnStyle}>Apply</button>
              </div>
            </div>
          )}
        </div>

        {/* Transaction type (locked) */}
        <div ref={txnTypeRef} style={{ position: "relative", flex: "1 1 0", minWidth: 160 }}>
          <label style={labelStyle}>Transaction type</label>
          <div onClick={() => { setOpenTxnType(o => !o); setTxnTypeSearch(""); }} style={{ ...fieldStyle, borderColor: openTxnType ? BRAND_GREEN : BORDER }}>
            <span style={{ color: selectedTxnType ? TEXT : SUBTLE }}>{selectedTxnType || "Select..."}</span>
            <ChevronDown size={16} color={SUBTLE} />
          </div>
          {openTxnType && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid " + BORDER, borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,0.12)", zIndex: 200, width: 280, maxHeight: 380, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ overflowY: "auto", flex: 1, padding: "6px 0" }}>
                {TRANSACTION_TYPES.map(t => (
                  <div key={t} onClick={() => { setSelectedTxnType(t); setOpenTxnType(false); }} style={{ padding: "10px 18px", cursor: "pointer", fontSize: 14, color: TEXT, background: selectedTxnType === t ? "#f1f5f9" : "transparent" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = selectedTxnType === t ? "#f1f5f9" : "transparent"}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reference number */}
        <div ref={refRef} style={{ position: "relative", flex: "1 1 0", minWidth: 160 }}>
          <label style={labelStyle}>Reference number</label>
          <div onClick={() => { setOpenRef(o => !o); if (!openRef) setTmpRef(refNumber); }} style={{ ...fieldStyle, borderColor: openRef ? BRAND_GREEN : BORDER }}>
            <span style={{ color: refNumber ? TEXT : SUBTLE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{refNumber || "Type..."}</span>
          </div>
          {openRef && (
            <div style={{ ...popoverStyle, width: 320 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: TEXT }}>Reference number</span>
                <button onClick={() => setOpenRef(false)} style={{ background: "none", border: "none", cursor: "pointer", color: SUBTLE, padding: 2, display: "flex" }}><X size={18} /></button>
              </div>
              <input type="text" autoFocus value={tmpRef} onChange={e => setTmpRef(e.target.value)} placeholder="Type a reference number..." style={inputStyle} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <button onClick={() => setTmpRef("")} style={clearBtnStyle}>Clear</button>
                <button onClick={() => { setRefNumber(tmpRef); setOpenRef(false); }} style={applyBtnStyle}>Apply</button>
              </div>
            </div>
          )}
        </div>

        {/* Contact */}
        <div ref={contactRef} style={{ position: "relative", flex: "1 1 0", minWidth: 160 }}>
          <label style={labelStyle}>Contact</label>
          <div onClick={() => { setOpenContact(o => !o); setContactSearch(""); }} style={{ ...fieldStyle, borderColor: openContact ? BRAND_GREEN : BORDER }}>
            <span style={{ color: selectedContact ? TEXT : SUBTLE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedContact || "Select..."}</span>
            <ChevronDown size={16} color={SUBTLE} />
          </div>
          {openContact && (
            <div style={{ ...popoverStyle, width: 340, padding: 0, maxHeight: 380, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid " + BORDER, display: "flex", alignItems: "center", gap: 8 }}>
                <Search size={14} color={SUBTLE} />
                <input autoFocus type="text" value={contactSearch} onChange={e => {
                  const v = e.target.value;
                  setContactSearch(v);
                  if (v.length === 1) {
                    setTimeout(() => {
                      const target = document.getElementById("contact-letter-" + v.toUpperCase());
                      const list = document.getElementById("contact-scroll-list");
                      if (target && list) list.scrollTop = target.offsetTop - list.offsetTop;
                    }, 50);
                  }
                }} placeholder="Search customers..." style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: "inherit", background: "transparent" }} />
              </div>
              <div id="contact-scroll-list" style={{ overflowY: "auto", flex: 1 }}>
                <div onClick={() => { setSelectedContact(""); setOpenContact(false); }} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, color: SUBTLE, borderBottom: "1px solid #f1f5f9" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  All contacts
                </div>
                {[...customers]
                  .sort((a, b) => {
                    const na = (a.display_name || a.name || ((a.first_name || "") + " " + (a.last_name || ""))).trim().toLowerCase();
                    const nb = (b.display_name || b.name || ((b.first_name || "") + " " + (b.last_name || ""))).trim().toLowerCase();
                    return na.localeCompare(nb);
                  })
                  .filter(c => {
                    const n = (c.display_name || c.name || ((c.first_name || "") + " " + (c.last_name || ""))).trim();
                    return !contactSearch || n.toLowerCase().startsWith(contactSearch.toLowerCase()) || n.toLowerCase().includes(contactSearch.toLowerCase());
                  })
                  .map(c => {
                    const name = (c.display_name || c.name || ((c.first_name || "") + " " + (c.last_name || ""))).trim();
                    const firstLetter = name.charAt(0).toUpperCase();
                    return (
                      <div key={c.id} id={"contact-letter-" + firstLetter} onClick={() => { setSelectedContact(name); setOpenContact(false); }} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, color: TEXT, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <span>{name}</span>
                        <span style={{ fontSize: 12, color: SUBTLE, fontStyle: "italic" }}>Customer</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Amount */}
        <div ref={amountRef} style={{ position: "relative", flex: "1 1 0", minWidth: 160 }}>
          <label style={labelStyle}>Amount</label>
          <div onClick={() => {
            setOpenAmount(o => !o);
            if (!openAmount) {
              setTmpAmountMode(amountMode || "equals"); setTmpAmountValue(amountValue); setTmpAmountMin(amountMin); setTmpAmountMax(amountMax);
            }
          }} style={{ ...fieldStyle, borderColor: openAmount ? BRAND_GREEN : BORDER }}>
            <span style={{ color: (amountValue || amountMin || amountMax) ? TEXT : SUBTLE }}>
              {amountMode === "equals" && amountValue ? "Equals CA$" + amountValue : (amountMode === "lt" && amountValue ? "< CA$" + amountValue : (amountMode === "gt" && amountValue ? "> CA$" + amountValue : (amountMode === "between" && (amountMin || amountMax) ? "CA$" + (amountMin || "0") + " - CA$" + (amountMax || "∞") : "Select...")))}
            </span>
            <ChevronDown size={16} color={SUBTLE} />
          </div>
          {openAmount && (
            <div style={{ ...popoverStyle, width: 440 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: TEXT }}>Amount</span>
                <button onClick={() => setOpenAmount(false)} style={{ background: "none", border: "none", cursor: "pointer", color: SUBTLE, padding: 2, display: "flex" }}><X size={18} /></button>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Amount type</label>
                <select disabled value="line_or_total" style={{ ...inputStyle, background: "#fff", cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36 }}>
                  <option value="line_or_total">Line or total</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Amount</label>
                  <select value={tmpAmountMode} onChange={e => setTmpAmountMode(e.target.value)} style={{ ...inputStyle, cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36 }}>
                    <option value="equals">Equals</option>
                    <option value="lt">Less than</option>
                    <option value="gt">Greater than</option>
                    <option value="between">Between</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Amount</label>
                  {tmpAmountMode === "between" ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <div style={{ flex: 1, position: "relative" }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: SUBTLE, fontSize: 14, pointerEvents: "none" }}>CA$</span>
                        <input type="number" value={tmpAmountMin} onChange={e => setTmpAmountMin(e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: 44 }} />
                      </div>
                      <div style={{ flex: 1, position: "relative" }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: SUBTLE, fontSize: 14, pointerEvents: "none" }}>CA$</span>
                        <input type="number" value={tmpAmountMax} onChange={e => setTmpAmountMax(e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: 44 }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: SUBTLE, fontSize: 14, pointerEvents: "none" }}>CA$</span>
                      <input type="number" value={tmpAmountValue} onChange={e => setTmpAmountValue(e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: 44 }} />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                <button onClick={() => { setTmpAmountValue(""); setTmpAmountMin(""); setTmpAmountMax(""); }} style={clearBtnStyle}>Clear</button>
                <button onClick={() => { setAmountMode(tmpAmountMode); setAmountValue(tmpAmountValue); setAmountMin(tmpAmountMin); setAmountMax(tmpAmountMax); setOpenAmount(false); }} style={applyBtnStyle}>Apply</button>
              </div>
            </div>
          )}
        </div>

        <button style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid " + BORDER, borderRadius: 6, fontSize: 14, color: TEXT, fontWeight: 500, cursor: "pointer", height: 42, fontFamily: "inherit", whiteSpace: "nowrap" }}>
          <Filter size={16} /> Filters
        </button>
        <button style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid " + BORDER, borderRadius: 6, fontSize: 14, color: TEXT, fontWeight: 500, cursor: "pointer", height: 42, fontFamily: "inherit", whiteSpace: "nowrap" }}>
          <Sliders size={16} /> Customize <span style={{ background: "#7c3aed", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, marginLeft: 4 }}>NEW</span>
        </button>
      </div>

      {/* Active filter chips */}
      <div style={{ marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f1f5f9", padding: "6px 12px", borderRadius: 20, fontSize: 13, color: TEXT }}>
          Transaction type: {selectedTxnType}
          <button onClick={() => setSelectedTxnType("Invoice")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: SUBTLE }}><X size={14} /></button>
        </span>
        {datePreset && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f1f5f9", padding: "6px 12px", borderRadius: 20, fontSize: 13, color: TEXT }}>
            Date: {dateDisplay}
            <button onClick={() => { setDatePreset(""); setDateFrom(""); setDateTo(""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: SUBTLE }}><X size={14} /></button>
          </span>
        )}
        {refNumber && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f1f5f9", padding: "6px 12px", borderRadius: 20, fontSize: 13, color: TEXT }}>
            Ref: {refNumber}
            <button onClick={() => setRefNumber("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: SUBTLE }}><X size={14} /></button>
          </span>
        )}
        {selectedContact && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f1f5f9", padding: "6px 12px", borderRadius: 20, fontSize: 13, color: TEXT }}>
            Contact: {selectedContact}
            <button onClick={() => setSelectedContact("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: SUBTLE }}><X size={14} /></button>
          </span>
        )}
        {(amountValue || amountMin || amountMax) && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f1f5f9", padding: "6px 12px", borderRadius: 20, fontSize: 13, color: TEXT }}>
            Amount: {amountMode === "equals" ? "= " + amountValue : (amountMin || "0") + " - " + (amountMax || "∞")}
            <button onClick={() => { setAmountValue(""); setAmountMin(""); setAmountMax(""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: SUBTLE }}><X size={14} /></button>
          </span>
        )}
      </div>

      {/* Table */}
      <div style={{ border: "1px solid " + BORDER, borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Ref No.</th>
              <th style={thStyle}>Contact</th>
              <th style={thStyle}>Due Date</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Balance</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
              <th style={thStyle}>Memo/Description</th>
              <th style={thStyle}>Last Modified</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: SUBTLE, fontSize: 14 }}>Loading invoices...</td></tr>
            ) : error ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#dc2626", fontSize: 14 }}>{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: SUBTLE, fontSize: 14 }}>No invoices match your filters</td></tr>
            ) : (
              filtered.map(inv => {
                const balance = inv.status === "paid" ? 0 : Number(inv.total || 0);
                return (
                  <tr key={inv.id} onClick={() => navigate("/invoices/" + inv.id + "/edit")} style={{ cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ ...tdStyle, ...TABULAR }}>{formatDate(inv.date)}</td>
                    <td style={tdStyle}>Invoice</td>
                    <td style={{ ...tdStyle, color: LINK, fontWeight: 500 }}>{inv.invoice_number}</td>
                    <td style={{ ...tdStyle, color: LINK, fontWeight: 500 }}>{inv.to_name || ""}</td>
                    <td style={{ ...tdStyle, ...TABULAR }}>{formatDate(inv.due_date)}</td>
                    <td style={{ ...tdStyle, textAlign: "right", ...TABULAR }}>{formatCurrency(balance, inv.currency)}</td>
                    <td style={{ ...tdStyle, textAlign: "right", ...TABULAR }}>{formatCurrency(inv.total, inv.currency)}</td>
                    <td style={{ ...tdStyle, color: SUBTLE, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{inv.notes || ""}</td>
                    <td style={{ ...tdStyle, color: SUBTLE, fontSize: 12, ...TABULAR }}>{formatDate(inv.updated_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
