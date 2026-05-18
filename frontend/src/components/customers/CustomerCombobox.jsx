import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Plus } from "lucide-react";

const BRAND = "#0F5959";
const BORDER = "#e2e8f0";
const TEXT = "#0F172A";
const SUBTLE = "#64748B";

const displayNameOf = (c) => {
  if (!c) return "";
  if (c.display_name) return c.display_name;
  if (c.company) return c.company;
  const fl = ((c.first_name || "") + " " + (c.last_name || "")).trim();
  if (fl) return fl;
  return c.name || c.email || "Customer";
};

const addressOf = (c) => {
  if (!c) return "";
  if (typeof c.address === "string") return c.address;
  if (typeof c.billing_address === "string") return c.billing_address;
  const a = c.billing_address || c.address;
  if (a && typeof a === "object") {
    return [a.street1, a.street2, a.city, a.province, a.postal_code, a.country].filter(Boolean).join(", ");
  }
  return "";
};

export default function CustomerCombobox({ value, onSelect }) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!open || customers.length > 0) return;
    setLoading(true); setError(null);
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    fetch("https://api.getnovala.com/api/v1/customers/", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(r => { if (!r.ok) throw new Error("Failed to load (" + r.status + ")"); return r.json(); })
      .then(data => {
        const list = Array.isArray(data) ? data : (data.data || data.customers || data.results || []);
        setCustomers(list);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [open]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return displayNameOf(c).toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", maxWidth: 340 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "10px 14px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
        border: "1px solid " + BORDER, borderRadius: 8, background: "#fff",
        cursor: "pointer", fontSize: 14, color: value ? TEXT : SUBTLE,
        fontFamily: "inherit"
      }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "Add Customer"}</span>
        <ChevronDown size={16} color={SUBTLE} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1px solid " + BORDER, borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)", maxHeight: 360,
          overflow: "hidden", zIndex: 100, display: "flex", flexDirection: "column"
        }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid " + BORDER, display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={14} color={SUBTLE} />
            <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: "inherit", background: "transparent" }} />
          </div>
          <button onClick={() => alert("Add new customer drawer coming in next PR. For now, add customers via the Customers page.")} style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", borderBottom: "1px solid #e2e8f0", cursor: "pointer", fontSize: 14, color: "#0F5959", fontWeight: 500, textAlign: "left", fontFamily: "inherit" }} onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"} onMouseLeave={e => e.currentTarget.style.background = "none"}><Plus size={14} />Add new</button>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: "center", color: SUBTLE, fontSize: 13 }}>Loading customers...</div>
            ) : error ? (
              <div style={{ padding: 20, textAlign: "center", color: "#dc2626", fontSize: 13 }}>{error}</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: SUBTLE, fontSize: 13 }}>{customers.length === 0 ? "No customers yet" : "No matches"}</div>
            ) : (
              filtered.map(c => (
                <button key={c.id} onClick={() => { onSelect && onSelect({ name: displayNameOf(c), email: c.email || "", address: addressOf(c), raw: c }); setOpen(false); setSearch(""); }} style={{
                  width: "100%", padding: "10px 14px", display: "flex",
                  alignItems: "center", justifyContent: "space-between",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 14, color: TEXT, textAlign: "left", fontFamily: "inherit"
                }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayNameOf(c)}</div>
                    {c.email && <div style={{ fontSize: 12, color: SUBTLE, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>}
                  </div>
                  <span style={{ fontSize: 12, color: SUBTLE, flexShrink: 0, marginLeft: 8 }}>Customer</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
