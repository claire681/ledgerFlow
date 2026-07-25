import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MessageSquare, HelpCircle } from "lucide-react";
import EditModal from "./EditModal";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const C = {
  ink: "#0E1A1A",
  muted: "#12262B",
  line: "#E7EAF0",
  page: "#F8F9FA",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
};

// Pay type NAMES we do not offer here (base pay + already-required).
const OMIT_FROM_ADD_LIST = new Set([
  "Salary",
  "Hourly wage",
  "Statutory holiday pay",
  "Stat pay ADW",
]);

// Human-friendly subtitles for known catalog names.
const SUBTITLES = {
  "Overtime": "1.5x base pay for hours over the threshold",
  "Double Overtime Pay": "2x base pay for extended overtime",
  "Bonus": "One-time or recurring bonus payment",
  "Commission": "Sales or performance-based earnings",
  "Hourly 2": "Second hourly rate for a different role",
  "Controlled Tips": "Tips distributed by the employer",
  "Vacation pay": "Vacation accrual or payout",
  "Mileage reimbursement": "Reimburse mileage on personal vehicle",
};

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

export default function AddPayTypeModal(props) {
  const navigate = useNavigate();
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const employee = props.employee || {};
  const alreadyAssignedIds = new Set(props.alreadyAssignedPayTypeIds || []);

  const [catalog, setCatalog] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(function() {
    if (!isOpen) return;
    setQuery(""); setSelectedId(null); setSaveError(null);
    setLoading(true); setLoadError(null);
    fetch(API + "/api/v1/pay-types", { headers: authHeaders() })
      .then(function(r) { if (!r.ok) throw new Error("Failed to load pay types"); return r.json(); })
      .then(function(data) {
        var list = Array.isArray(data) ? data : (data.items || []);
        var filtered = list.filter(function(pt) {
          if (!pt || !pt.name) return false;
          if (OMIT_FROM_ADD_LIST.has(pt.name)) return false;
          if (alreadyAssignedIds.has(pt.id)) return false;
          if (pt.is_active === false) return false;
          return true;
        });
        setCatalog(filtered);
        setLoading(false);
      })
      .catch(function(e) { setLoadError(e.message || "Load failed"); setLoading(false); });
  }, [isOpen]);

  const filtered = useMemo(function() {
    if (!query) return catalog;
    var q = query.toLowerCase();
    return catalog.filter(function(pt) { return (pt.name || "").toLowerCase().indexOf(q) >= 0; });
  }, [catalog, query]);

  const selected = useMemo(function() {
    return catalog.find(function(pt) { return pt.id === selectedId; }) || null;
  }, [catalog, selectedId]);

  const saveDisabled = !selected || saving;

  async function handleSave() {
    if (!selected || !employee.id) return;
    setSaving(true);
    setSaveError(null);
    try {
      const r = await fetch(API + "/api/v1/employee-pay-items", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          employee_id: employee.id,
          pay_type_id: selected.id,
        }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error("Assign failed: " + (txt || r.status));
      }
      setSaving(false);
      onSaved && onSaved();
    } catch (e) {
      setSaving(false);
      setSaveError(e.message || "Assign failed");
    }
  }

  function requestNewPayType() {
    if (onClose) onClose();
    // route by tab if the settings page supports it, else fall back to root
    navigate("/payroll/settings/pay-types");
  }

  const employeeName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "this employee";
  const positionRaw = employee.position_title || "";
  const subtitle = positionRaw ? (employeeName + " \u00b7 " + positionRaw) : employeeName;

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="Assign a pay type"
      subtitle={subtitle}
      iconLetter="+"
      saving={saving}
      saveError={saveError}
      saveDisabled={saveDisabled}
      hasUnsavedChanges={!!selected}
      saveLabel="Continue"
      secondaryAction={
        <a
          href="mailto:support@getnovala.com?subject=Feedback%20on%20pay%20type%20assignment"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.brandDark, textDecoration: "underline", fontWeight: 700 }}
        >
          <MessageSquare size={15} /> Give feedback
        </a>
      }
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 18 }}>
        Which pay type would you like to add?
      </div>

      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#12262B", marginBottom: 7 }}>Pay type</label>

      {/* Search input */}
      <div style={{
        display: "flex", alignItems: "center", height: 44, padding: "0 14px",
        border: selected ? "2px solid " + C.brand : "1px solid " + C.line,
        borderRadius: 10, background: "#FFFFFF",
      }}>
        <Search size={14} color={C.muted} style={{ marginRight: 10 }} />
        <input
          type="text"
          value={query}
          placeholder="Select or type to search"
          onChange={function(e) { setQuery(e.target.value); }}
          style={{
            border: 0, outline: "none", fontSize: 14, color: C.ink,
            flex: 1, fontFamily: FONT, fontWeight: 500, background: "transparent",
          }}
        />
      </div>

      {/* Options list */}
      <div style={{
        border: "1px solid " + C.line, borderRadius: 10, marginTop: 8,
        background: "#FFFFFF", overflow: "hidden",
      }}>
        {loading && (
          <div style={{ padding: "18px 14px", color: C.muted, fontSize: 13, fontWeight: 500 }}>
            Loading pay types...
          </div>
        )}
        {loadError && (
          <div style={{ padding: "18px 14px", color: "#A32D2D", fontSize: 13, fontWeight: 600 }}>
            {loadError}
          </div>
        )}

        {!loading && !loadError && (
          <>
            {/* Fixed first row: New pay type */}
            <div
              onClick={requestNewPayType}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", cursor: "pointer",
                borderBottom: "1px solid " + C.line,
              }}
            >
              <Plus size={16} color={C.brandDark} strokeWidth={2.5} />
              <span style={{ fontSize: 13.5, color: C.brandDark, fontWeight: 700 }}>New pay type</span>
              <span style={{ marginLeft: "auto", fontSize: 11.5, color: C.muted, fontWeight: 500 }}>
                Create a custom pay type
              </span>
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: "18px 14px", color: C.muted, fontSize: 13, fontWeight: 500 }}>
                No matching pay types.
              </div>
            )}

            {filtered.map(function(pt, i) {
              const isSel = pt.id === selectedId;
              const isLast = i === filtered.length - 1;
              return (
                <div
                  key={pt.id}
                  onClick={function() { setSelectedId(pt.id); }}
                  style={{
                    display: "flex", alignItems: "flex-start", padding: "10px 14px",
                    cursor: "pointer",
                    borderBottom: isLast ? "0" : "1px solid " + C.line,
                    background: isSel ? C.brandBg : "#FFFFFF",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 700 }}>{pt.name}</div>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 2 }}>
                      {SUBTITLES[pt.name] || pt.description || ""}
                    </div>
                  </div>
                  {isSel && (
                    <div style={{
                      width: 20, height: 20, borderRadius: 10, background: C.brand,
                      display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 10,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div style={{ marginTop: 14, fontSize: 12.5, color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>
        Cannot find the pay type you need?{" "}
        <a
          onClick={requestNewPayType}
          style={{ color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
        >
          Manage payroll items
        </a>{" "}
        to create a custom one.
      </div>
    </EditModal>
  );
}