import React, { useEffect, useState } from "react";
import { Plus, MoreVertical, Banknote } from "lucide-react";

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
  danger: "#A32D2D",
};

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

// Base pay type NAMES that we always hide from this card
// (Salary and Hourly wage are represented by the Base pay section).
const HIDE_NAMES = new Set(["Salary", "Hourly wage"]);

function payTypeOf(item) { return (item && item.pay_type) || {}; }
function nameOf(item) { return payTypeOf(item).name || ""; }
function isRequiredOf(item) { return !!payTypeOf(item).is_required_by_law; }

function fmtDate(iso) {
  if (!iso) return "-";
  try {
    var d = new Date(iso);
    var dd = String(d.getDate()).padStart(2, "0");
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var yyyy = d.getFullYear();
    return dd + "/" + mm + "/" + yyyy;
  } catch (e) { return "-"; }
}

function fmtMoney(v) {
  if (v === null || v === undefined || v === "") return null;
  var s = String(v).replace(/[$,\s]/g, "");
  var n = parseFloat(s);
  if (isNaN(n)) return null;
  var hasCents = Math.round(n * 100) % 100 !== 0;
  var fixed = hasCents ? n.toFixed(2) : String(Math.round(n));
  var parts = fixed.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "$" + parts.join(".");
}

function rateAmountFor(item) {
  var pt = payTypeOf(item);
  var rate = item.rate_override != null ? item.rate_override : pt.default_rate;
  var name = (pt.name || "").toLowerCase();

  if (name === "stat pay adw") return "Auto calculated";
  if (name === "statutory holiday pay") return "1.0x base pay";
  if (name === "overtime") return "1.5x base pay";
  if (name === "double overtime pay") return "2.0x base pay";
  if (name === "vacation pay") return (rate != null ? rate + "%" : "4%");

  var money = fmtMoney(rate);
  if (money) return money;
  return "-";
}

export default function AdditionalPayTypesCard(props) {
  const section = props.section;
  const isOpen = props.isOpen;
  const onToggleOpen = props.onToggleOpen;
  const employeeId = props.employeeId;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpenFor, setMenuOpenFor] = useState(null);

  useEffect(function() {
    if (!employeeId) { setLoading(false); return; }
    setLoading(true);
    fetch(API + "/api/v1/employee-pay-items/employee/" + employeeId, { headers: authHeaders() })
      .then(function(r) { if (!r.ok) throw new Error("Failed to load pay items"); return r.json(); })
      .then(function(data) {
        var list = Array.isArray(data) ? data : (data.items || []);
        var filtered = list.filter(function(it) { return !HIDE_NAMES.has(nameOf(it)); });
        filtered.sort(function(a, b) {
          var ra = isRequiredOf(a) ? 1 : 0;
          var rb = isRequiredOf(b) ? 1 : 0;
          if (ra !== rb) return rb - ra;
          return nameOf(a).localeCompare(nameOf(b));
        });
        setItems(filtered);
        setLoading(false);
        try {
          var ids = list.map(function(it) { return (it.pay_type && it.pay_type.id) || it.pay_type_id; }).filter(Boolean);
          window.dispatchEvent(new CustomEvent("novala:payItemsLoaded", { detail: { assignedPayTypeIds: ids } }));
        } catch (err) { /* noop */ }
      })
      .catch(function(e) { setError(e.message || "Load failed"); setLoading(false); });
  }, [employeeId]);

  useEffect(function() {
    function closeMenu() { setMenuOpenFor(null); }
    window.addEventListener("click", closeMenu);
    return function() { window.removeEventListener("click", closeMenu); };
  }, []);

  function openAdd() { window.dispatchEvent(new CustomEvent("novala:openAddPayTypeModal")); }
  function openEdit(item) { window.dispatchEvent(new CustomEvent("novala:openEditPayTypeModal", { detail: item })); }
  function unassign(item) {
    // Delegate to EditPayTypeModal which handles the styled unassign confirm.
    window.dispatchEvent(new CustomEvent("novala:openEditPayTypeModal", { detail: item }));
    // Signal to the modal that it should open directly into the confirm view
    window.setTimeout(function() {
      window.dispatchEvent(new CustomEvent("novala:confirmUnassignPayItem", { detail: item }));
    }, 0);
  }

  const empty = !loading && items.length === 0;

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 12, marginBottom: 12, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", cursor: "pointer" }} onClick={onToggleOpen}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: isOpen ? C.brandBg : "#E7EAF0", color: isOpen ? C.brandDark : "#000000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginRight: 12 }}></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{section.title}</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 2 }}>Bonus, overtime, stat pay, and other earnings for this employee.</div>
        </div>
        {!empty && (
          <button
            onClick={function(e) { e.stopPropagation(); openAdd(); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", background: C.ink, color: "#FFFFFF", border: 0, borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginRight: 12, fontFamily: FONT }}
          >
            <Plus size={14} /> Add
          </button>
        )}
        <span style={{ color: C.muted, fontSize: 14 }}>{isOpen ? "\u25be" : "\u25b8"}</span>
      </div>

      {/* Body */}
      {isOpen && (
        <div style={{ borderTop: "1px solid " + C.line }}>
          {loading && (
            <div style={{ padding: "24px 20px", color: C.muted, fontSize: 13, fontWeight: 500 }}>Loading pay types...</div>
          )}
          {error && (
            <div style={{ padding: "24px 20px", color: C.danger, fontSize: 13, fontWeight: 600 }}>{error}</div>
          )}

          {!loading && !error && empty && (
            <div style={{ padding: "36px 20px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, margin: "0 auto 12px", borderRadius: 10, background: "#E7EAF0", color: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={20} />
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, marginBottom: 4 }}>No additional pay types yet</div>
              <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, maxWidth: 360, margin: "0 auto 16px", lineHeight: 1.5 }}>
                Assign overtime, bonus, commission, tips, or stat holiday pay to this employee.
              </div>
              <button
                onClick={openAdd}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px", background: C.ink, color: "#FFFFFF", border: 0, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}
              >
                <Plus size={14} /> Assign a pay type
              </button>
            </div>
          )}

          {!loading && !error && !empty && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.6fr 1.4fr 1.1fr 0.9fr", gap: 16, padding: "10px 20px", background: C.page, borderBottom: "1px solid " + C.line }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Pay type</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Name</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Rate / Amount</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Effective date</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, textAlign: "right" }}>Actions</div>
              </div>

              {items.map(function(item) {
                const required = isRequiredOf(item);
                return (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.6fr 1.4fr 1.1fr 0.9fr", gap: 16, padding: "13px 20px", alignItems: "center", borderBottom: "1px solid " + C.line }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 700 }}>{nameOf(item)}</span>
                      {required && (
                        <span style={{ padding: "2px 6px", background: C.brandBg, color: C.brandDark, borderRadius: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3 }}>REQUIRED</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{nameOf(item)}</div>
                    <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{rateAmountFor(item)}</div>
                    <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{fmtDate(item.created_at)}</div>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, position: "relative" }}>
                      <a onClick={function() { openEdit(item); }} style={{ fontSize: 13, color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>Edit</a>
                      {!required && (
                        <>
                          <div
                            onClick={function(e) { e.stopPropagation(); setMenuOpenFor(menuOpenFor === item.id ? null : item.id); }}
                            style={{ padding: "2px 4px", cursor: "pointer", color: C.muted, borderRadius: 4 }}
                          >
                            <MoreVertical size={16} />
                          </div>
                          {menuOpenFor === item.id && (
                            <div style={{ position: "absolute", top: 26, right: 0, width: 180, background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", overflow: "hidden", zIndex: 10 }}>
                              <div
                                onClick={function(e) { e.stopPropagation(); setMenuOpenFor(null); unassign(item); }}
                                style={{ padding: "10px 14px", fontSize: 13, color: C.danger, fontWeight: 700, cursor: "pointer" }}
                              >
                                Unassign
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}