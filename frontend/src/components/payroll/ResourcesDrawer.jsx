import React, { useEffect } from "react";
import { X, FolderOpen, Shield, Settings } from "lucide-react";

/**
 * ResourcesDrawer
 * ---------------
 * Slide-out drawer showing resource links, grouped by category.
 * Shared between the Payments and Filings tabs of the Payroll Taxes page.
 *
 * Props:
 * - open: bool
 * - onClose: () => void
 * - onNavigate: (path: string) => void  called when user clicks a link
 * - country: string  e.g. "CA" for future country-specific link swaps
 */
export default function ResourcesDrawer({ open, onClose, onNavigate, country = "CA" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const INK = "#000000";
  const DARK = "#1A2332";
  const LINE = "#E7EAF0";
  const TEAL = "#15A08C";
  const TEAL_INK = "#0B7377";

  const handleNav = (path) => {
    onClose();
    if (onNavigate) onNavigate(path);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(18, 38, 43, 0.55)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        style={{
          background: "white",
          height: "100vh",
          width: 460,
          maxWidth: "92vw",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.10)",
          fontFamily: "Inter, 'Plus Jakarta Sans', sans-serif",
          color: INK,
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid " + LINE,
        }}>
          <div id="drawer-title" style={{ fontSize: 18, fontWeight: 700, color: INK }}>
            Resources
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: DARK,
              cursor: "pointer",
              padding: 6,
              borderRadius: 6,
              display: "inline-flex",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#EEF1F4"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
          <Group icon={<FolderOpen size={14} strokeWidth={2.5} />} label="Filings and forms" first />
          <Card
            title="Archived forms and filings"
            desc="Completed tax filings and forms ready to view and print."
            onClick={() => handleNav("/payroll/taxes/archived")}
          />
          <Card
            title="Record of employment"
            badge="Coming soon"
            desc="The ROEs you have created for your employees."
          />

          <Group icon={<Shield size={14} strokeWidth={2.5} />} label="Compliance and more" />
          <Card
            title="Compliance resources"
            desc="Year-end info and resources to help you stay in compliance."
          />

          <Group icon={<Settings size={14} strokeWidth={2.5} />} label="Tax setup" />
          <Card
            title="Tax setup"
            desc="Edit your federal and provincial tax info in Payroll settings."
            onClick={() => handleNav("/payroll/settings")}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid " + LINE,
          display: "flex",
          justifyContent: "flex-end",
        }}>
          <button
            onClick={onClose}
            style={{
              background: "#0E1A1A",
              color: "white",
              border: "none",
              fontWeight: 700,
              padding: "10px 20px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#000000"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#0E1A1A"}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Group({ icon, label, first }) {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 700,
      color: "#1A2332",
      letterSpacing: "0.4px",
      textTransform: "uppercase",
      display: "flex",
      alignItems: "center",
      gap: 8,
      margin: first ? "0 0 10px" : "20px 0 10px",
    }}>
      {icon}
      {label}
    </div>
  );
}

function Card({ title, desc, badge, onClick }) {
  const clickable = typeof onClick === "function";
  return (
    <div
      onClick={onClick}
      style={{
        border: "1px solid #E7EAF0",
        borderRadius: 12,
        padding: "16px 18px",
        marginBottom: 12,
        cursor: clickable ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        if (clickable) {
          e.currentTarget.style.borderColor = "#15A08C";
          e.currentTarget.style.background = "#F7F9FA";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#E7EAF0";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <div style={{
        fontWeight: 700,
        fontSize: 15,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "#000000",
      }}>
        {title}
        {badge && (
          <span style={{
            background: "#E1F5EE",
            color: "#0B7377",
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 999,
          }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ color: "#1A2332", fontSize: 13, marginTop: 4, fontWeight: 600 }}>
        {desc}
      </div>
    </div>
  );
}