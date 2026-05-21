import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, Sliders, Printer, Share2, X, ChevronDown, HelpCircle } from "lucide-react";

const BORDER = "#e2e8f0";
const TEXT = "#0F172A";
const SUBTLE = "#64748B";
const LINK = "#0F9599";

function formatCurrency(amount, currency) {
  const sym = currency === "CAD" ? "CA$" : (currency === "USD" ? "$" : (currency || "") + "$");
  return sym + Number(amount || 0).toFixed(2);
}

function formatDate(s) {
  if (!s) return "";
  const parts = s.split("-");
  if (parts.length === 3) return parts[2] + "/" + parts[1] + "/" + parts[0];
  return s;
}

export default function InvoicesAll() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [dateRange, setDateRange] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [contact, setContact] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetch("https://api.getnovala.com/api/v1/invoices/", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(r => {
        if (r.status === 401) { window.location.href = "/login"; return null; }
        if (!r.ok) throw new Error("Failed to load (" + r.status + ")");
        return r.json();
      })
      .then(data => {
        if (!data) return;
        const list = Array.isArray(data) ? data : (data.data || data.invoices || data.results || []);
        setInvoices(list);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Apply filters
  let filtered = invoices;
  if (refNumber) filtered = filtered.filter(i => String(i.invoice_number || "").toLowerCase().includes(refNumber.toLowerCase()));
  if (contact) filtered = filtered.filter(i => String(i.to_name || "").toLowerCase().includes(contact.toLowerCase()));
  if (amount) filtered = filtered.filter(i => Math.abs(Number(i.total || 0) - Number(amount)) < 0.01);

  const fieldStyle = {
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

  return (
    <div style={{ padding: "20px 28px", fontFamily: "Inter, -apple-system, sans-serif", background: "#fff", minHeight: "100vh" }}>
      {/* Top breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr) auto auto", gap: 14, alignItems: "end", marginBottom: 18 }}>
        <div>
          <label style={labelStyle}>Date range</label>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={fieldStyle}>
            <option value="">Select...</option>
            <option value="today">Today</option>
            <option value="this_week">This week</option>
            <option value="this_month">This month</option>
            <option value="this_year">This year</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Transaction type</label>
          <select value="invoice" disabled style={fieldStyle}>
            <option value="invoice">Invoice</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Reference number</label>
          <input type="text" value={refNumber} onChange={e => setRefNumber(e.target.value)} placeholder="Type..." style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Contact</label>
          <input type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder="Select..." style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Amount</label>
          <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Select..." style={fieldStyle} />
        </div>
        <button style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid " + BORDER, borderRadius: 6, fontSize: 14, color: TEXT, fontWeight: 500, cursor: "pointer", height: 42, fontFamily: "inherit" }}>
          <Filter size={16} /> Filters
        </button>
        <button style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid " + BORDER, borderRadius: 6, fontSize: 14, color: TEXT, fontWeight: 500, cursor: "pointer", height: 42, fontFamily: "inherit" }}>
          <Sliders size={16} /> Customize <span style={{ background: "#7c3aed", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, marginLeft: 4 }}>NEW</span>
        </button>
      </div>

      {/* Active filter chips */}
      <div style={{ marginBottom: 18 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f1f5f9", padding: "6px 12px", borderRadius: 20, fontSize: 13, color: TEXT }}>
          Transaction type: Invoice
          <button onClick={() => navigate("/transactions")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: SUBTLE }}><X size={14} /></button>
        </span>
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
              <th style={thStyle}>Last Modified Date</th>
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
                    <td style={tdStyle}>{formatDate(inv.date)}</td>
                    <td style={tdStyle}>Invoice</td>
                    <td style={{ ...tdStyle, color: LINK, fontWeight: 500 }}>{inv.invoice_number}</td>
                    <td style={{ ...tdStyle, color: LINK, fontWeight: 500 }}>{inv.to_name || ""}</td>
                    <td style={tdStyle}>{formatDate(inv.due_date)}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{formatCurrency(balance, inv.currency)}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{formatCurrency(inv.total, inv.currency)}</td>
                    <td style={{ ...tdStyle, color: SUBTLE, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{inv.notes || ""}</td>
                    <td style={{ ...tdStyle, color: SUBTLE, fontSize: 12 }}>{inv.updated_at || ""}</td>
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
