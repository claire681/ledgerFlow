import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { COUNTRIES, flagEmoji } from "../data/countries";

const TEAL = "#0F9599";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const MUTED = "#9AA8A8";
const BORDER = "#E2E8E8";
const BG = "#FFFFFF";
const BG_TINT = "#F9FAFA";

export default function PhoneCountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const searchRef = useRef(null);

  const selected = COUNTRIES.find(c => c.iso2 === value) || COUNTRIES[0];

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    if (open) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
      setTimeout(() => searchRef.current && searchRef.current.focus(), 50);
    }
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.iso2.toLowerCase().includes(q))
    : COUNTRIES;

  const pick = (c) => { onChange(c.iso2); setOpen(false); setQuery(""); };

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button type="button" onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "13px 10px 13px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: 14, color: INK, minWidth: 110, transition: "border-color 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = SUB}
        onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{flagEmoji(selected.iso2)}</span>
        <span style={{ fontWeight: 600 }}>{selected.dial}</span>
        <ChevronDown size={14} strokeWidth={2.4} color={SUB} style={{ marginLeft: 2 }} />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: 340, maxHeight: 400, background: BG, border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: "0 12px 32px -8px rgba(14,26,26,0.18)", zIndex: 50, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: 10, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 8, background: BG_TINT }}>
            <Search size={16} color={SUB} strokeWidth={2.2} />
            <input ref={searchRef} type="text" placeholder="Search country or code" value={query} onChange={e => setQuery(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, color: INK }} />
            {query && (
              <button type="button" onClick={() => setQuery("")} style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "flex", color: MUTED }} aria-label="Clear">
                <X size={14} />
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "16px 14px", color: MUTED, fontSize: 13.5 }}>No countries match "{query}"</div>
            ) : (
              filtered.map((c) => {
                const isSel = c.iso2 === selected.iso2 && c.dial === selected.dial;
                return (
                  <button key={c.iso2 + c.dial} type="button" onClick={() => pick(c)}
                    onMouseEnter={e => e.currentTarget.style.background = BG_TINT}
                    onMouseLeave={e => e.currentTarget.style.background = isSel ? "rgba(15,149,153,0.06)" : "transparent"}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: isSel ? "rgba(15,149,153,0.06)" : "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, color: INK, textAlign: "left", transition: "background 0.1s" }}>
                    <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{flagEmoji(c.iso2)}</span>
                    <span style={{ flex: 1, fontWeight: isSel ? 600 : 500 }}>{c.name}</span>
                    <span style={{ color: SUB, fontVariantNumeric: "tabular-nums" }}>{c.dial}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
