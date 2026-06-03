import React from "react";
import ReactDOM from "react-dom";
import { X, AlertCircle } from "lucide-react";

const AMBER = "#F59E0B";
const AMBER_TINT = "#FEF3C7";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const BORDER = "#DDE5E5";
const BRAND = "#0F5959";

/**
 * Reusable unsaved-changes confirmation dialog.
 * Parent tracks `dirty` and decides when to open this dialog.
 *
 * Props:
 *   open       — boolean, conditionally renders
 *   heading    — defaults to "Save changes?"
 *   bodyText   — defaults to generic copy; tax screens pass a specific message
 *   onClose    — X clicked: dismiss dialog, RETURN TO EDITING (no close of edit screen)
 *   onDontSave — discard changes, close the edit screen
 *   onSave     — save the form, close the edit screen
 *
 * Stacks at z-index 100500 (above edit overlays at 99500).
 */
export function SaveChangesDialog({
  open,
  heading = "Save changes?",
  bodyText = "You haven't saved your changes — they'll be lost.",
  onClose,
  onDontSave,
  onSave,
}) {
  if (!open) return null;

  const node = (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(14,26,26,0.45)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      zIndex: 100500,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      animation: "scFade 0.2s ease-out",
    }}>
      <style>{`
        @keyframes scFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scIn   { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: none; } }
      `}</style>

      <div style={{
        position: "relative",
        background: "#fff",
        borderRadius: 20,
        border: "1px solid rgba(14,26,26,0.05)",
        boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 32px 64px -24px rgba(11,55,57,0.35)",
        padding: "40px 32px 28px",
        width: 460, maxWidth: "100%",
        animation: "scIn 0.28s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* X — dismiss dialog, return to editing */}
        <button onClick={onClose} aria-label="Close" style={{
          position: "absolute", top: 14, right: 14,
          width: 34, height: 34, borderRadius: 999,
          background: "transparent", border: "none", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: SUB, transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F5"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        {/* Amber warning medallion */}
        <div style={{
          width: 64, height: 64, borderRadius: 999,
          background: AMBER_TINT,
          margin: "0 auto 18px",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(245,158,11,0.25)",
        }}>
          <AlertCircle size={32} strokeWidth={2} color={AMBER} />
        </div>

        {/* Heading */}
        <h2 style={{
          margin: "0 0 12px 0",
          fontSize: 22, fontWeight: 700, color: INK,
          textAlign: "center", letterSpacing: "-0.01em",
        }}>
          {heading}
        </h2>

        {/* Body */}
        <p style={{
          margin: "0 auto 28px",
          fontSize: 14.5, color: SUB,
          textAlign: "center", lineHeight: 1.55,
          maxWidth: 380,
        }}>
          {bodyText}
        </p>

        {/* Buttons */}
        <div style={{display: "flex", gap: 12, justifyContent: "center"}}>
          <button onClick={onDontSave} style={{
            padding: "11px 22px", borderRadius: 10,
            background: "#fff", border: `1.5px solid ${BORDER}`,
            color: INK, fontWeight: 600, fontSize: 14.5,
            cursor: "pointer", fontFamily: "inherit",
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFA"; e.currentTarget.style.borderColor = "#C9D4D4"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = BORDER; }}
          >
            Don't save
          </button>
          <button onClick={onSave} style={{
            padding: "11px 28px", borderRadius: 10,
            background: BRAND, border: "none",
            color: "#fff", fontWeight: 700, fontSize: 14.5,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 6px 14px -6px rgba(15,89,89,0.5)",
          }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(node, document.body);
}
