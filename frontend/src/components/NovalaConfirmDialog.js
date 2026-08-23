/**
 * NovalaConfirmDialog — the canonical confirm modal for Novala.
 *
 * Usage:
 *   import { useConfirm } from "../utils/useConfirm";
 *   const confirm = useConfirm();
 *
 *   async function onDelete() {
 *     const ok = await confirm({
 *       title: "Unassign RRSP from Krysta?",
 *       subtitle: "This will no longer appear on future pay runs.",
 *       confirmLabel: "Unassign",
 *       danger: true,
 *     });
 *     if (ok) doDelete();
 *   }
 */
import React, { useEffect, useRef } from "react";
import { AlertTriangle, Info } from "lucide-react";

const BRAND_INK = "#0E1A1A";
const TEXT = "#12262B";
const MUTED = "#66748B";
const LINE = "#E7EAF0";
const PAGE = "#F4F6F8";
const RED = "#DC2626";
const RED_SOFT = "rgba(220, 38, 38, 0.10)";
const TEAL_INK = "#0F6E56";
const TEAL_SOFT = "#E1F5EE";
const FONT = "Inter, system-ui, sans-serif";

export default function NovalaConfirmDialog(props) {
  const isOpen = props.isOpen;
  const title = props.title || "Are you sure?";
  const subtitle = props.subtitle || null;
  const message = props.message || null;
  const confirmLabel = props.confirmLabel || "Confirm";
  const cancelLabel = props.cancelLabel || "Cancel";
  const hideCancel = !!props.hideCancel;
  const danger = !!props.danger;
  const onConfirm = props.onConfirm;
  const onCancel = props.onCancel;
  const busy = !!props.busy;

  const cancelRef = useRef(null);

  useEffect(function () {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === "Escape" && !busy) onCancel && onCancel();
    }
    document.addEventListener("keydown", onKey);
    // Focus the cancel button by default (safer)
    setTimeout(function () { if (cancelRef.current) cancelRef.current.focus(); }, 0);
    return function () { document.removeEventListener("keydown", onKey); };
  }, [isOpen, onCancel, busy]);

  if (!isOpen) return null;

  const iconColor = danger ? RED : TEAL_INK;
  const iconBg = danger ? RED_SOFT : TEAL_SOFT;
  const Icon = danger ? AlertTriangle : Info;

  const primaryStyle = {
    padding: "10px 18px",
    borderRadius: 10,
    background: danger ? RED : BRAND_INK,
    color: "#fff",
    border: 0,
    fontWeight: 600,
    cursor: busy ? "wait" : "pointer",
    fontFamily: FONT,
    fontSize: 14,
    opacity: busy ? 0.7 : 1,
  };

  return (
    <div
      onClick={function () { if (!busy) onCancel && onCancel(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 10000,
        fontFamily: FONT,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="novala-confirm-title"
    >
      <div
        onClick={function (e) { e.stopPropagation(); }}
        style={{
          background: "#fff",
          borderRadius: 14,
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.18)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "22px 24px 16px", display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: iconBg,
              color: iconColor,
            }}
          >
            <Icon size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 id="novala-confirm-title" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: BRAND_INK, lineHeight: 1.3 }}>{title}</h3>
            {subtitle && (
              <p style={{ margin: "4px 0 0", fontSize: 13.5, color: BRAND_INK, lineHeight: 1.5, fontWeight: 500 }}>{subtitle}</p>
            )}
          </div>
        </div>
        {message && (
          <div style={{ padding: "0 24px 20px" }}>
            <p style={{ margin: 0, fontSize: 14, color: BRAND_INK, lineHeight: 1.5, fontWeight: 500 }}>{message}</p>
          </div>
        )}
        <div style={{ padding: "16px 24px", background: PAGE, display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid " + LINE }}>
          {!hideCancel && (
          <button
            ref={cancelRef}
            onClick={function () { if (!busy) onCancel && onCancel(); }}
            disabled={busy}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: "#fff",
              color: TEXT,
              border: "1px solid " + LINE,
              fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
              fontFamily: FONT,
              fontSize: 14,
            }}
          >
            {cancelLabel}
          </button>
          )}
          <button
            onClick={function () { if (!busy) onConfirm && onConfirm(); }}
            disabled={busy}
            style={primaryStyle}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}