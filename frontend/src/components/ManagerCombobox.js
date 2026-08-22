/**
 * ManagerCombobox - searchable dropdown for picking an employee's manager.
 * 
 * Uses React Query to fetch employees list, filters as user types.
 * Shows selected manager as a removable chip.
 * 
 * Props:
 *   value: string | null - the current manager_id
 *   onChange: function(managerId | null) - called when selection changes
 *   currentEmployeeId: string - excluded from choices (can't manage self)
 */
import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, ChevronDown } from "lucide-react";
import apiFetch from "../utils/apiFetch";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ManagerCombobox({ value, onChange, currentEmployeeId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async function() {
      const r = await apiFetch("/api/v1/payroll/employees");
      if (!r.ok) throw new Error("Failed to load employees");
      const data = await r.json();
      return Array.isArray(data) ? data : (data.items || data.employees || []);
    },
  });

  // Find the currently selected manager
  const selected = employees.find(e => e.id === value) || null;

  // Filter: exclude current employee, filter by query
  const filtered = employees.filter(e => {
    if (e.id === currentEmployeeId) return false; // can't manage self
    if (!query) return true;
    const name = ((e.first_name || "") + " " + (e.last_name || "")).toLowerCase();
    return name.includes(query.toLowerCase());
  });

  // Close on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }
  }, [isOpen]);

  // Keyboard navigation
  function onKeyDown(e) {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      setHighlightedIndex(i => Math.min(i + 1, filtered.length));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex(i => Math.max(i - 1, -1));
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (highlightedIndex === -1) {
        onChange(null);
      } else if (filtered[highlightedIndex]) {
        onChange(filtered[highlightedIndex].id);
      }
      setIsOpen(false);
      setQuery("");
      e.preventDefault();
    }
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
    setQuery("");
  }

  function handlePick(empId) {
    onChange(empId || null);
    setIsOpen(false);
    setQuery("");
  }

  // Selected chip render
  if (selected && !isOpen) {
    const fullName = [selected.first_name, selected.last_name].filter(Boolean).join(" ") || "Unnamed";
    return (
      <div ref={rootRef} style={{ position: "relative" }}>
        <div
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current && inputRef.current.focus(), 0); }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px 8px 8px",
            background: "#E1F5EE",
            border: "1.5px solid #B4E5D5",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            color: "#0F6E56",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: "#0F6E56", color: "#fff", fontSize: 10, fontWeight: 700,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>{getInitials(fullName)}</div>
          <span>{fullName}</span>
          <button
            onClick={handleClear}
            aria-label="Clear manager"
            style={{
              background: "none", border: 0, color: "#0F6E56",
              cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px",
              opacity: 0.6, fontFamily: "inherit",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
          >×</button>
        </div>
      </div>
    );
  }

  // Combobox (open or empty state)
  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#66748B", pointerEvents: "none" }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setHighlightedIndex(-1); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Type to search or click to browse..."
          style={{
            width: "100%",
            height: 44,
            padding: "0 44px 0 44px",
            border: "1.5px solid " + (isOpen ? "#15A08C" : "#E7EAF0"),
            borderRadius: 10,
            background: "#fff",
            fontSize: 14,
            fontFamily: "inherit",
            color: "#0E1A1A",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
        />
        <ChevronDown size={16} onClick={() => { setIsOpen(!isOpen); inputRef.current && inputRef.current.focus(); }} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#66748B", cursor: "pointer" }} />
      </div>

      {isOpen && (
        <div style={{
          position: "absolute", top: 48, left: 0, right: 0, background: "#fff",
          border: "1px solid #E7EAF0", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(16, 26, 43, 0.08)",
          overflow: "hidden", zIndex: 10, maxHeight: 320, overflowY: "auto",
        }}>
          <div
            onClick={() => handlePick(null)}
            onMouseEnter={() => setHighlightedIndex(-1)}
            style={{
              padding: "12px 16px", cursor: "pointer", fontSize: 14,
              color: "#66748B", fontStyle: "italic",
              background: highlightedIndex === -1 ? "#F8F9FA" : "transparent",
              borderBottom: "1px solid #E7EAF0",
            }}
          >
            No manager (self-managed)
          </div>

          {isLoading && (
            <div style={{ padding: "24px 16px", color: "#66748B", fontSize: 13, textAlign: "center" }}>
              Loading employees...
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div style={{ padding: "24px 16px", color: "#66748B", fontSize: 13, textAlign: "center" }}>
              {query ? "No matches" : "No other employees yet"}
            </div>
          )}

          {filtered.map((e, idx) => {
            const fullName = [e.first_name, e.last_name].filter(Boolean).join(" ") || "Unnamed";
            const role = e.position_title || "";
            const isHl = idx === highlightedIndex;
            return (
              <div
                key={e.id}
                onClick={() => handlePick(e.id)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                style={{
                  padding: "12px 16px", cursor: "pointer", fontSize: 14,
                  color: "#0E1A1A", display: "flex", alignItems: "center", gap: 12,
                  background: isHl ? "#E1F5EE" : "transparent",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "#E1F5EE", color: "#0F6E56",
                  fontSize: 12, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>{getInitials(fullName)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "#0E1A1A" }}>{fullName}</div>
                  {role && <div style={{ fontSize: 12, color: "#66748B", marginTop: 2 }}>{role}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}