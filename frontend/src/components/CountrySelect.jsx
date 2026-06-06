// src/components/CountrySelect.jsx
// Reusable searchable country selector for Novala forms.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, codeToFlag, getCountry } from "../data/countries";

const TEAL = "#0F9599";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const MUTED = "#9AA8A8";
const BORDER = "#DDE5E5";
const FOCUS_RING = "0 0 0 4px rgba(15,149,153,0.14)";
const HOVER_BG = "#F1F5F5";
const CARD_BORDER = "1px solid rgba(14,26,26,0.05)";
const CARD_SHADOW = "0 1px 2px rgba(16,24,40,0.06), 0 16px 40px -12px rgba(11,55,57,0.25)";
const FONT_STACK = "'Plus Jakarta Sans', system-ui, sans-serif";

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CountrySelect({ value, onChange, mode = "country", defaultCode = "CA", placeholder, ariaLabel }) {
  const activeCode = (value || defaultCode || "CA").toUpperCase();
  const selected = getCountry(activeCode) || getCountry(defaultCode) || COUNTRIES[0];

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [triggerFocused, setTriggerFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const wrapRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setHighlight(0);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    const dialQuery = q.replace(/^\+/, "");
    return COUNTRIES.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.code.toLowerCase().includes(q)) return true;
      if (mode === "phone") {
        const dial = c.dialCode.replace("+", "");
        if (dial.startsWith(dialQuery)) return true;
      }
      return false;
    });
  }, [search, mode]);

  useEffect(() => {
    if (highlight >= filtered.length) setHighlight(0);
  }, [filtered.length, highlight]);

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const node = listRef.current.querySelector(`[data-idx="${highlight}"]`);
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "nearest" });
    }
  }, [highlight, isOpen]);

  function emitSelection(c) {
    if (!c) return;
    if (typeof onChange === "function") {
      onChange({ code: c.code, name: c.name, dialCode: c.dialCode, flag: codeToFlag(c.code) });
    }
    setIsOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") { e.preventDefault(); setIsOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(filtered.length - 1, h + 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(0, h - 1)); return; }
    if (e.key === "Enter") { e.preventDefault(); emitSelection(filtered[highlight]); }
  }

  const showDial = mode === "phone";
  const selectedFlag = selected ? codeToFlag(selected.code) : "";
  const triggerBorder = isOpen || triggerFocused ? TEAL : BORDER;
  const triggerShadow = isOpen || triggerFocused ? FOCUS_RING : "none";

  return (
    <div ref={wrapRef} style={{ position: "relative", fontFamily: FONT_STACK, width: "100%" }}>
      <button type="button" aria-haspopup="listbox" aria-expanded={isOpen} aria-label={ariaLabel || (showDial ? "Select country and dial code" : "Select country")} onClick={() => setIsOpen((v) => !v)} onFocus={() => setTriggerFocused(true)} onBlur={() => setTriggerFocused(false)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", background: "#fff", border: `1.6px solid ${triggerBorder}`, borderRadius: 13, boxShadow: triggerShadow, color: INK, fontSize: 14.5, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s, box-shadow 0.15s", outline: "none", boxSizing: "border-box" }}>
        <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden="true">{selectedFlag}</span>
        <span style={{ flex: 1, color: selected ? INK : MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {selected ? selected.name : (placeholder || "Select a country")}
        </span>
        {showDial && selected ? (<span style={{ color: SUB, fontWeight: 600, fontSize: 14 }}>{selected.dialCode}</span>) : null}
        <span style={{ color: MUTED, marginLeft: 4, display: "inline-flex" }}><ChevronIcon open={isOpen} /></span>
      </button>

      {isOpen ? (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: CARD_BORDER, borderRadius: 16, boxShadow: CARD_SHADOW, zIndex: 50, overflow: "hidden" }} onKeyDown={handleKeyDown}>
          <div style={{ padding: "12px 12px 8px 12px" }}>
            <div style={{ position: "relative" }}>
              <span aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: MUTED, display: "inline-flex", pointerEvents: "none" }}><SearchIcon /></span>
              <input ref={searchRef} value={search} onChange={(e) => { setSearch(e.target.value); setHighlight(0); }} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} placeholder={showDial ? "Search country or dial code" : "Search countries"} style={{ width: "100%", padding: "10px 12px 10px 36px", border: `1.6px solid ${searchFocused ? TEAL : BORDER}`, borderRadius: 11, fontSize: 14, fontFamily: "inherit", color: INK, outline: "none", boxShadow: searchFocused ? FOCUS_RING : "none", boxSizing: "border-box", transition: "border-color 0.15s, box-shadow 0.15s", background: "#fff" }} />
            </div>
          </div>

          <div ref={listRef} role="listbox" aria-label="Countries" style={{ maxHeight: 320, overflowY: "auto", padding: "4px 0 8px 0" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "20px 16px", color: MUTED, fontSize: 14, textAlign: "center" }}>No matches.</div>
            ) : (
              filtered.map((c, idx) => {
                const isSelected = selected && c.code === selected.code;
                const isHighlight = idx === highlight;
                return (
                  <div key={c.code} data-idx={idx} role="option" aria-selected={isSelected} onMouseEnter={() => setHighlight(idx)} onMouseDown={(e) => { e.preventDefault(); emitSelection(c); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", background: isHighlight ? HOVER_BG : "transparent", color: isSelected ? TEAL : INK, fontWeight: isSelected ? 700 : 500, fontSize: 14, transition: "background 0.1s", minHeight: 40, boxSizing: "border-box" }}>
                    <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden="true">{codeToFlag(c.code)}</span>
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                    {showDial ? (<span style={{ color: isSelected ? TEAL : SUB, fontWeight: 600, fontSize: 13.5 }}>{c.dialCode}</span>) : null}
                    {isSelected ? (<span style={{ color: TEAL, display: "inline-flex", marginLeft: 4 }}><CheckIcon /></span>) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CountrySelect;
