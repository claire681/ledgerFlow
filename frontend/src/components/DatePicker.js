import React, { useState, useRef, useEffect } from "react";

const C = {
  ink: "#0E1A1A", muted: "#12262B", faint: "#94A0B2",
  line: "#E7EAF0", brand: "#15A08C", brandBg: "#E1F5EE",
  brandDark: "#0F6E56", panelBg: "#FFFFFF", hover: "#F8F9FA",
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

export default function DatePicker(props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("day"); // "day" | "month" | "year"
  const [text, setText] = useState(function() {
    var dt = parseISO(props.value);
    return dt ? fmtDisplay(dt) : "";
  });
  const [viewDate, setViewDate] = useState(function() {
    var dt = parseISO(props.value) || new Date();
    return new Date(dt.getFullYear(), dt.getMonth(), 1);
  });
  const [yearPageStart, setYearPageStart] = useState(function() {
    var y = (parseISO(props.value) || new Date()).getFullYear();
    return Math.floor(y / 12) * 12;
  });

  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Sync when props.value changes
  useEffect(function() {
    var dt = parseISO(props.value);
    setText(dt ? fmtDisplay(dt) : "");
    if (dt) {
      setViewDate(new Date(dt.getFullYear(), dt.getMonth(), 1));
      setYearPageStart(Math.floor(dt.getFullYear() / 12) * 12);
    }
  }, [props.value]);

  // Close on outside click
  useEffect(function() {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setMode("day");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return function() { document.removeEventListener("mousedown", onDoc); };
  }, []);

  // ESC to close
  useEffect(function() {
    function onKey(e) {
      if (e.key === "Escape") { setOpen(false); setMode("day"); }
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      return function() { document.removeEventListener("keydown", onKey); };
    }
  }, [open]);

  function handleTextChange(v) {
    setText(v);
    var dt = parseDisplay(v);
    if (dt) {
      props.onChange && props.onChange(toISO(dt));
      setViewDate(new Date(dt.getFullYear(), dt.getMonth(), 1));
    } else if (!v) {
      props.onChange && props.onChange("");
    }
  }

  function selectDay(dt) {
    setText(fmtDisplay(dt));
    props.onChange && props.onChange(toISO(dt));
    setOpen(false);
    setMode("day");
  }

  function prevMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  }
  function pickMonth(mIdx) {
    setViewDate(new Date(viewDate.getFullYear(), mIdx, 1));
    setMode("day");
  }
  function pickYear(y) {
    setViewDate(new Date(y, viewDate.getMonth(), 1));
    setMode("month"); // after picking year, let user pick month
  }
  function prevYearPage() { setYearPageStart(function(s) { return s - 12; }); }
  function nextYearPage() { setYearPageStart(function(s) { return s + 12; }); }

  // Build day grid for current view month
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startWeekday = firstOfMonth.getDay(); // 0 Sun
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const prevMonthDays = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();
  const cells = [];
  for (var i = 0; i < startWeekday; i++) {
    cells.push({ day: prevMonthDays - startWeekday + 1 + i, otherMonth: true, monthOffset: -1 });
  }
  for (var d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, otherMonth: false, monthOffset: 0 });
  }
  var trailing = 7 - (cells.length % 7);
  if (trailing < 7) {
    for (var td = 1; td <= trailing; td++) {
      cells.push({ day: td, otherMonth: true, monthOffset: 1 });
    }
  }

  const selectedDate = parseISO(props.value);
  const today = new Date();
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
          onFocus={function() { setOpen(true); setMode("day"); }}
          style={{
            border: 0, outline: "none", fontSize: 14, color: C.ink,
            flex: 1, fontFamily: FONT, fontWeight: 500, background: "transparent",
          }}
        />
        <button
          type="button"
          onClick={function() { setOpen(!open); setMode("day"); inputRef.current && inputRef.current.focus(); }}
          disabled={!!props.disabled}
          style={{ background: "transparent", border: 0, cursor: "pointer", padding: 4, color: C.muted, fontSize: 16 }}
          aria-label="Open calendar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/>
          </svg>
        </button>
      </div>

      {open && !props.disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
          background: C.panelBg, border: "1px solid " + C.line, borderRadius: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)", padding: 12, width: 280,
        }}>
          {mode === "day" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <button type="button" onClick={prevMonth} style={arrowBtnStyle} aria-label="Previous month">&lsaquo;</button>
                <button type="button" onClick={function() { setMode("month"); }} style={pillStyle}>
                  <span>{MONTHS_SHORT[viewDate.getMonth()]}</span>
                  <span style={{ color: C.faint, fontSize: 10, marginLeft: 4 }}>▾</span>
                </button>
                <button type="button" onClick={function() { setMode("year"); setYearPageStart(Math.floor(viewDate.getFullYear() / 12) * 12); }} style={pillStyle}>
                  <span>{viewDate.getFullYear()}</span>
                  <span style={{ color: C.faint, fontSize: 10, marginLeft: 4 }}>▾</span>
                </button>
                <button type="button" onClick={nextMonth} style={arrowBtnStyle} aria-label="Next month">&rsaquo;</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                {WEEKDAYS.map(function(w, i) {
                  return <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.muted, padding: "6px 0" }}>{w}</div>;
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {cells.map(function(c, i) {
                  const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + c.monthOffset, c.day);
                  const isSelected = selectedDate && isSameDay(cellDate, selectedDate);
                  const isToday = isSameDay(cellDate, today);
                  var color = c.otherMonth ? "#C4CDD8" : C.ink;
                  var bg = "transparent";
                  var fontWeight = 400;
                  if (isSelected) { bg = C.ink; color = "#fff"; fontWeight = 600; }
                  var border = isToday && !isSelected ? "1.5px solid " + C.brand : "0";
                  return (
                    <div
                      key={i}
                      onClick={function() { selectDay(cellDate); }}
                      onMouseEnter={function(e) { if (!isSelected) e.currentTarget.style.background = C.hover; }}
                      onMouseLeave={function(e) { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                      style={{
                        textAlign: "center", padding: "8px 0", fontSize: 13, color: color,
                        cursor: "pointer", borderRadius: 6, background: bg, fontWeight: fontWeight,
                        border: border, boxSizing: "border-box",
                      }}
                    >{c.day}</div>
                  );
                })}
              </div>
            </>
          )}

          {mode === "month" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px", marginBottom: 8 }}>
                <button type="button" onClick={function() { setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1)); }} style={yearNavBtnStyle} aria-label="Previous year">&lsaquo;</button>
                <button type="button" onClick={function() { setMode("year"); setYearPageStart(Math.floor(viewDate.getFullYear() / 12) * 12); }} style={{ ...yearRangeStyle, cursor: "pointer", border: 0, background: "transparent", fontFamily: FONT }}>{viewDate.getFullYear()}</button>
                <button type="button" onClick={function() { setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1)); }} style={yearNavBtnStyle} aria-label="Next year">&rsaquo;</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, padding: "8px 0" }}>
                {MONTHS_SHORT.map(function(m, i) {
                  var isCurrent = viewDate.getMonth() === i;
                  return (
                    <div key={i} onClick={function() { pickMonth(i); }}
                      onMouseEnter={function(e) { if (!isCurrent) e.currentTarget.style.background = C.hover; }}
                      onMouseLeave={function(e) { if (!isCurrent) e.currentTarget.style.background = C.brandBg; if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
                      style={{
                        padding: "12px 0", textAlign: "center", fontSize: 13,
                        color: isCurrent ? C.brandDark : C.ink, cursor: "pointer",
                        borderRadius: 6, fontWeight: isCurrent ? 700 : 500,
                        background: isCurrent ? C.brandBg : "transparent",
                      }}
                    >{m}</div>
                  );
                })}
              </div>
            </>
          )}

          {mode === "year" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px", marginBottom: 8 }}>
                <button type="button" onClick={prevYearPage} style={yearNavBtnStyle} aria-label="Previous years">&lsaquo;</button>
                <span style={yearRangeStyle}>{yearPageStart} - {yearPageStart + 11}</span>
                <button type="button" onClick={nextYearPage} style={yearNavBtnStyle} aria-label="Next years">&rsaquo;</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, padding: "8px 0" }}>
                {Array.from({ length: 12 }).map(function(_, i) {
                  var y = yearPageStart + i;
                  var isCurrent = viewDate.getFullYear() === y;
                  return (
                    <div key={y} onClick={function() { pickYear(y); }}
                      onMouseEnter={function(e) { if (!isCurrent) e.currentTarget.style.background = C.hover; }}
                      onMouseLeave={function(e) { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
                      style={{
                        padding: "10px 0", textAlign: "center", fontSize: 13,
                        color: isCurrent ? C.brandDark : C.ink, cursor: "pointer",
                        borderRadius: 6, fontWeight: isCurrent ? 700 : 500,
                        background: isCurrent ? C.brandBg : "transparent",
                      }}
                    >{y}</div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const arrowBtnStyle = {
  width: 28, height: 28, border: "1px solid " + C.line, borderRadius: 6,
  background: "#FFFFFF", cursor: "pointer", fontSize: 14, color: C.muted,
  display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT,
};
const pillStyle = {
  flex: 1, height: 30, padding: "0 10px",
  border: "1px solid " + C.line, borderRadius: 6,
  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.ink,
  background: "#FFFFFF", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const yearNavBtnStyle = {
  border: 0, background: "transparent", cursor: "pointer",
  color: C.muted, fontSize: 18, padding: "4px 8px", fontFamily: FONT,
};
const yearRangeStyle = {
  fontSize: 13, fontWeight: 700, color: C.ink,
};