import React, { useState, useRef, useEffect } from "react";

const C = {
  ink: "#0E1A1A", muted: "#12262B", faint: "#94A0B2",
  line: "#E7EAF0", brand: "#15A08C", brandBg: "#E1F5EE",
  brandDark: "#0F6E56", panelBg: "#FFFFFF",
};

const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAYS = ["S","M","T","W","T","F","S"];

function parseISO(iso) {
  if (!iso) return null;
  var s = String(iso).slice(0,10);
  var parts = s.split("-");
  if (parts.length !== 3) return null;
  var y = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  var d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

function toISO(dt) {
  if (!dt) return "";
  var y = dt.getFullYear();
  var m = String(dt.getMonth() + 1).padStart(2, "0");
  var d = String(dt.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function fmtDisplay(dt) {
  if (!dt) return "";
  var d = String(dt.getDate()).padStart(2, "0");
  var m = String(dt.getMonth() + 1).padStart(2, "0");
  var y = dt.getFullYear();
  return d + "/" + m + "/" + y;
}

function parseDisplay(str) {
  if (!str) return null;
  var s = String(str).trim();
  var parts = s.split("/");
  if (parts.length !== 3) return null;
  var d = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  var y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y) || m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
  var dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * DatePicker component
 * Props:
 *  - value: ISO date string ("YYYY-MM-DD") or empty string
 *  - onChange: function(iso) called with new ISO string
 *  - placeholder: optional (default "dd/mm/yyyy")
 *  - error: boolean, red border if true
 *  - disabled: boolean
 */
export default function DatePicker(props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(function() {
    var dt = parseISO(props.value);
    return dt ? fmtDisplay(dt) : "";
  });
  const [viewDate, setViewDate] = useState(function() {
    var dt = parseISO(props.value) || new Date();
    return new Date(dt.getFullYear(), dt.getMonth(), 1);
  });
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Sync when props.value changes
  useEffect(function() {
    var dt = parseISO(props.value);
    setText(dt ? fmtDisplay(dt) : "");
    if (dt) setViewDate(new Date(dt.getFullYear(), dt.getMonth(), 1));
  }, [props.value]);

  // Close on outside click
  useEffect(function() {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return function() { document.removeEventListener("mousedown", onDoc); };
  }, []);

  // ESC to close
  useEffect(function() {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return function() { document.removeEventListener("keydown", onKey); };
  }, [open]);

  const selectedDate = parseISO(props.value);
  const today = new Date();

  function handleTextChange(v) {
    setText(v);
    var dt = parseDisplay(v);
    if (dt) {
      props.onChange && props.onChange(toISO(dt));
      setViewDate(new Date(dt.getFullYear(), dt.getMonth(), 1));
    } else if (v === "") {
      props.onChange && props.onChange("");
    }
  }

  function pickDate(dt) {
    props.onChange && props.onChange(toISO(dt));
    setText(fmtDisplay(dt));
    setViewDate(new Date(dt.getFullYear(), dt.getMonth(), 1));
    setOpen(false);
  }

  function prevMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  }
  function changeMonth(m) {
    setViewDate(new Date(viewDate.getFullYear(), m, 1));
  }
  function changeYear(y) {
    setViewDate(new Date(y, viewDate.getMonth(), 1));
  }

  // Build 6-row day grid
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const firstWeekday = firstOfMonth.getDay(); // 0=Sun
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstWeekday);
  const days = [];
  for (var i = 0; i < 42; i++) {
    var d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  // Year options: current year +/- 20
  const currentYear = viewDate.getFullYear();
  const years = [];
  for (var y = currentYear - 100; y <= currentYear + 20; y++) years.push(y);

  const errored = !!props.error;

  return (
    <div ref={wrapRef} style={{ position: "relative", fontFamily: FONT }}>
      <div style={{
        display: "flex", alignItems: "center",
        height: 44, padding: "0 12px 0 14px",
        border: errored ? "1.5px solid #DC2626" : (open ? "1px solid " + C.brandDark : "1px solid " + C.line),
        borderRadius: 10,
        background: errored ? "#FEF5F5" : "#FFFFFF",
        transition: "border-color 0.15s",
      }}>
        <input
          ref={inputRef}
          type="text"
          value={text}
          placeholder={props.placeholder || "dd/mm/yyyy"}
          disabled={!!props.disabled}
          onChange={function(e) { handleTextChange(e.target.value); }}
          onFocus={function() { setOpen(true); }}
          style={{
            border: 0, outline: "none", fontSize: 14, color: C.ink,
            flex: 1, fontFamily: FONT, fontWeight: 500, background: "transparent",
          }}
        />
        <button
          type="button"
          onClick={function() { setOpen(!open); inputRef.current && inputRef.current.focus(); }}
          disabled={!!props.disabled}
          style={{
            background: "transparent", border: 0, cursor: "pointer",
            padding: 4, color: C.muted, fontSize: 16,
          }}
          aria-label="Open calendar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4"/>
            <path d="M16 2v4"/>
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M3 10h18"/>
            <path d="M8 14h.01"/>
            <path d="M12 14h.01"/>
            <path d="M16 14h.01"/>
            <path d="M8 18h.01"/>
            <path d="M12 18h.01"/>
            <path d="M16 18h.01"/>
          </svg>
        </button>
      </div>

      {open && !props.disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
          background: C.panelBg, border: "1px solid " + C.line, borderRadius: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)", padding: 12, width: 280,
        }}>
          {/* Header: prev, month select, year select, next */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <button type="button" onClick={prevMonth} style={{
              width: 28, height: 28, border: "1px solid " + C.line, borderRadius: 6,
              background: "#FFFFFF", cursor: "pointer", fontSize: 14, color: C.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
            }} aria-label="Previous month">&#8249;</button>

            <select
              value={viewDate.getMonth()}
              onChange={function(e) { changeMonth(parseInt(e.target.value, 10)); }}
              style={{
                flex: 1, height: 30, padding: "0 8px",
                border: "1px solid " + C.line, borderRadius: 6,
                fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.ink,
                background: "#FFFFFF", cursor: "pointer",
              }}
            >
              {MONTHS_SHORT.map(function(m, i) { return <option key={i} value={i}>{m}</option>; })}
            </select>

            <select
              value={viewDate.getFullYear()}
              onChange={function(e) { changeYear(parseInt(e.target.value, 10)); }}
              style={{
                flex: 1, height: 30, padding: "0 8px",
                border: "1px solid " + C.line, borderRadius: 6,
                fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.ink,
                background: "#FFFFFF", cursor: "pointer",
              }}
            >
              {years.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
            </select>

            <button type="button" onClick={nextMonth} style={{
              width: 28, height: 28, border: "1px solid " + C.line, borderRadius: 6,
              background: "#FFFFFF", cursor: "pointer", fontSize: 14, color: C.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
            }} aria-label="Next month">&#8250;</button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {WEEKDAYS.map(function(w, i) {
              return (
                <div key={i} style={{
                  textAlign: "center", fontSize: 11, fontWeight: 700, color: C.muted,
                  height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                }}>{w}</div>
              );
            })}
          </div>

          {/* Day grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {days.map(function(d, i) {
              var inMonth = d.getMonth() === viewDate.getMonth();
              var isToday = isSameDay(d, today);
              var isSelected = selectedDate && isSameDay(d, selectedDate);
              var bgHover = "transparent";
              return (
                <div
                  key={i}
                  onClick={function() { if (inMonth) pickDate(d); }}
                  onMouseEnter={function(e) { if (inMonth && !isSelected) e.currentTarget.style.background = C.brandBg; }}
                  onMouseLeave={function(e) { if (inMonth && !isSelected) e.currentTarget.style.background = "transparent"; }}
                  style={{
                    height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, borderRadius: 6,
                    cursor: inMonth ? "pointer" : "default",
                    color: isSelected ? "#FFFFFF" : (inMonth ? C.ink : C.faint),
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? C.brand : "transparent",
                    border: isToday && !isSelected ? "1px solid " + C.brandDark : "1px solid transparent",
                  }}
                >{d.getDate()}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
