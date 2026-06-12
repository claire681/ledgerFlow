import React, { useState, useMemo, useEffect } from "react";
import {
  X, Search, ThumbsUp, ThumbsDown, Star, GripVertical,
  Play, UserPlus, Sliders, Settings, MapPin, Calculator,
  FileText, Shield,
} from "lucide-react";

const BRAND = "#0F9599";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const BORDER = "#E5E7EB";
const STAR_GRAY = "#D1D5DB";

export const ACTION_CATALOG = [
  { id: "run_payroll", label: "Run payroll", icon: Play, category: "Payroll" },
  { id: "add_employee", label: "Add employee", icon: UserPlus, category: "Payroll" },
  { id: "edit_payroll_items", label: "Edit payroll items", icon: Sliders, category: "Payroll" },
  { id: "update_payroll_settings", label: "Update payroll settings", icon: Settings, category: "Payroll" },
  { id: "update_work_location", label: "Update work location", icon: MapPin, category: "Payroll" },
  { id: "update_accounting_preferences", label: "Update accounting preferences", icon: Calculator, category: "Payroll" },
  { id: "view_paycheque_list", label: "View paycheque list", icon: FileText, category: "Payroll" },
  { id: "add_workers_comp", label: "Add workers comp", icon: Shield, category: "Payroll" },
];

export const MAX_FAVOURITES = 10;

export default function CreateActionsDrawer({ open, onClose, favourites, onSave }) {
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(favourites || []);
  const [error, setError] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);

  useEffect(() => {
    if (open) {
      setDraft(favourites || []);
      setError(null);
      setSearch("");
    }
  }, [open, favourites]);

  const toggleFavourite = (id) => {
    setError(null);
    if (draft.includes(id)) {
      setDraft(draft.filter((x) => x !== id));
    } else {
      if (draft.length >= MAX_FAVOURITES) {
        setError("Up to " + MAX_FAVOURITES + " favourites");
        return;
      }
      setDraft([...draft, id]);
    }
  };

  const reorder = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const next = [...draft];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setDraft(next);
  };

  const filteredCatalog = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ACTION_CATALOG;
    return ACTION_CATALOG.filter((a) => a.label.toLowerCase().includes(q));
  }, [search]);

  const favouriteActions = draft.map((id) => ACTION_CATALOG.find((a) => a.id === id)).filter(Boolean);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#FFFFFF", width: 420, maxWidth: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "inherit" }}
      >
        <div style={{ padding: "16px 20px 14px", borderBottom: "0.5px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 17, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>Create actions</h2>
          <X size={18} style={{ color: TEXT_SECONDARY, cursor: "pointer" }} onClick={onClose} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: TEXT_SECONDARY }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all Create actions"
              style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 6, border: "0.5px solid " + BORDER, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", color: TEXT_PRIMARY }}
            />
          </div>

          <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.5, marginBottom: 6 }}>
            Choose your favourite actions for the overview. Without customization, the top actions adapt over time.
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>Select up to {MAX_FAVOURITES}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: TEXT_SECONDARY }}>Helpful?</span>
              <ThumbsUp size={14} style={{ color: TEXT_SECONDARY, cursor: "pointer" }} />
              <ThumbsDown size={14} style={{ color: TEXT_SECONDARY, cursor: "pointer" }} />
            </div>
          </div>

          <div style={{ fontSize: 10, fontWeight: 500, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
            Favourites ({draft.length} of {MAX_FAVOURITES})
          </div>

          {favouriteActions.length > 0 ? (
            <div style={{ background: "#F9FAFB", border: "0.5px solid " + BORDER, borderRadius: 8, padding: 4, marginBottom: 16 }}>
              {favouriteActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (dragIdx !== null) reorder(dragIdx, idx); setDragIdx(null); }}
                    onDragEnd={() => setDragIdx(null)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "white", borderRadius: 6, marginBottom: idx < favouriteActions.length - 1 ? 3 : 0, cursor: "grab", opacity: dragIdx === idx ? 0.4 : 1 }}
                  >
                    <GripVertical size={14} style={{ color: "#9CA3AF" }} />
                    <Icon size={14} style={{ color: TEXT_SECONDARY }} />
                    <span style={{ flex: 1, fontSize: 13, color: TEXT_PRIMARY }}>{action.label}</span>
                    <Star size={15} fill={BRAND} style={{ color: BRAND, cursor: "pointer" }} onClick={() => toggleFavourite(action.id)} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: "#F9FAFB", border: "0.5px dashed " + BORDER, borderRadius: 8, padding: 16, textAlign: "center", fontSize: 12, color: TEXT_SECONDARY, marginBottom: 16 }}>
              No favourites yet. Star actions below to add them.
            </div>
          )}

          {error && (
            <div style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 6, padding: "6px 10px", fontSize: 12, marginBottom: 10 }}>{error}</div>
          )}

          <div style={{ fontSize: 10, fontWeight: 500, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>Payroll</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filteredCatalog.map((action) => {
              const Icon = action.icon;
              const isFav = draft.includes(action.id);
              return (
                <div key={action.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6 }}>
                  <Icon size={14} style={{ color: TEXT_SECONDARY }} />
                  <span style={{ flex: 1, fontSize: 13, color: TEXT_PRIMARY }}>{action.label}</span>
                  <Star
                    size={15}
                    fill={isFav ? BRAND : "none"}
                    style={{ color: isFav ? BRAND : STAR_GRAY, cursor: "pointer" }}
                    onClick={() => toggleFavourite(action.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "12px 20px", borderTop: "0.5px solid " + BORDER, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 6, background: "white", color: TEXT_PRIMARY, border: "0.5px solid " + BORDER, cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => onSave(draft)} style={{ fontSize: 13, padding: "8px 18px", borderRadius: 6, background: BRAND, color: "white", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Save</button>
        </div>
      </div>
    </div>
  );
}
