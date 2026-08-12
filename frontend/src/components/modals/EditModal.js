import React, { useEffect, useRef, useState } from "react";

const C = {
  ink: "#0E1A1A",
  muted: "#12262B",
  faint: "#66748B",
  line: "#E7EAF0",
  lineSoft: "#F1F3F7",
  page: "#F8F9FA",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  danger: "#A32D2D",
  amber: "#854F0B",
  amberBg: "#FAEEDA",
};

const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * EditModal - reusable full-screen modal shell.
 *
 * Props:
 *   isOpen         boolean, whether to render
 *   onClose        function called when user closes (X, Escape, or Cancel)
 *   onSave         function called when user clicks Save
 *   title          string, header title
 *   subtitle       string (optional), header subtitle
 *   iconLetter     string (optional), letter/symbol in header icon square
 *   saving         boolean, disables Save + shows "Saving..." label
 *   saveError      string (optional), shown as red error below footer buttons
 *   saveDisabled   boolean, disables Save button
 *   hasUnsavedChanges  boolean, if true, Cancel + Escape confirm before closing
 *   footerContent  ReactNode (optional), rendered above the Cancel/Save row
 *   secondaryAction ReactNode (optional), rendered to the left of Cancel (e.g. Unassign)
 *   saveLabel      string (optional, default "Save"), the save button label
 *   children       ReactNode, scrollable body content (usually CollapsibleSection components)
 */
export default function EditModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSave = props.onSave;
  const title = props.title || "Edit";
  const subtitle = props.subtitle;
  const iconLetter = props.iconLetter;
  const saving = props.saving;
  const saveError = props.saveError;
  const saveDisabled = props.saveDisabled;
  const hasUnsavedChanges = props.hasUnsavedChanges;
  const footerContent = props.footerContent;
  const secondaryAction = props.secondaryAction;
  const saveLabel = props.saveLabel || "Save";
  const children = props.children;

  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  // Lock body scroll while open
  useEffect(function() {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return function() {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(function() {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === "Escape") {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return function() {
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, hasUnsavedChanges]);

  function handleClose() {
    if (saving) return;
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Discard and close?");
      if (!confirmed) return;
    }
    onClose && onClose();
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(14, 26, 26, 0.55)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: FONT,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          background: "white",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: 720,
          maxHeight: "calc(100vh - 40px)",
        }}
      >
        {/* Sticky header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid " + C.line,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "white",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            {iconLetter && (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: C.brandBg,
                  color: C.brandDark,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {iconLetter}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: C.ink,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </div>
              {subtitle && (
                <div
                  style={{
                    fontSize: 12,
                    color: C.faint,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "transparent",
              border: "1px solid " + C.line,
              color: C.muted,
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: 18,
              display: "grid",
              placeItems: "center",
              opacity: saving ? 0.5 : 1,
              fontFamily: FONT,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrolling body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            background: C.page,
          }}
        >
          {children}
        </div>

        {/* Sticky footer */}
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid " + C.line,
            background: "white",
            flexShrink: 0,
          }}
        >
          {footerContent && (
            <div style={{ marginBottom: 14 }}>{footerContent}</div>
          )}
          {saveError && (
            <div
              style={{
                background: "#FCE9E9",
                color: C.danger,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 12.5,
                marginBottom: 12,
              }}
            >
              {saveError}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center" }}>
            {secondaryAction && (
              <div style={{ marginRight: "auto" }}>{secondaryAction}</div>
            )}
            <button
              onClick={handleClose}
              disabled={saving}
              style={{
                background: "white",
                color: C.muted,
                border: "1px solid " + C.line,
                padding: "10px 18px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.5 : 1,
                fontFamily: FONT,
              }}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving || saveDisabled}
              style={{
                background: C.ink,
                color: "white",
                border: "1px solid transparent",
                padding: "10px 22px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: (saving || saveDisabled) ? "not-allowed" : "pointer",
                opacity: (saving || saveDisabled) ? 0.5 : 1,
                fontFamily: FONT,
              }}
            >
              {saving ? "Saving..." : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CollapsibleSection - a reusable card with header + body that toggles open/closed.
 *
 * Props:
 *   title      string
 *   subtitle   string (optional)
 *   defaultOpen boolean (default true)
 *   children   ReactNode - body content
 */
export function CollapsibleSection(props) {
  const title = props.title;
  const subtitle = props.subtitle;
  const defaultOpen = props.defaultOpen !== false;
  const children = props.children;
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        background: "white",
        border: "1px solid " + C.line,
        borderRadius: 12,
        marginBottom: 14,
      }}
    >
      <div
        onClick={function() { setOpen(!open); }}
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        <span style={{ color: C.faint, fontSize: 13 }}>
          {open ? "▼" : "▸"}
        </span>
      </div>
      {open && (
        <div style={{ padding: "0 20px 20px" }}>
          {children}
        </div>
      )}
    </div>
  );
}