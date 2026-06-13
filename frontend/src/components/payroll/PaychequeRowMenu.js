import React, { useEffect, useRef } from "react";
import { Eye, Printer, Mail, Edit, RotateCcw, Trash2 } from "lucide-react";

const ITEMS = [
  { id: "view", label: "View pay stub", icon: Eye },
  { id: "print", label: "Print pay stub", icon: Printer },
  { id: "email", label: "Email pay stub", icon: Mail },
  { separator: true },
  { id: "edit", label: "Edit", icon: Edit, gated: true },
  { id: "void", label: "Void", icon: RotateCcw, color: "#B45309" },
  { id: "delete", label: "Delete", icon: Trash2, color: "#DC2626", gated: true },
];

export default function PaychequeRowMenu({ open, onClose, onAction, filedOrRemitted, voided }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      style={{ position: "absolute", right: 0, top: 24, background: "white", border: "0.5px solid #E5E7EB", borderRadius: 8, padding: 4, width: 200, zIndex: 50, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
    >
      {ITEMS.map((item, i) => {
        if (item.separator) {
          return <div key={"sep-" + i} style={{ height: "0.5px", background: "#E5E7EB", margin: "4px 6px" }} />;
        }
        const Icon = item.icon;
        const isBlocked = (item.gated && filedOrRemitted) || (voided && item.id !== "view" && item.id !== "print");
        const baseColor = item.color || "#111827";
        const textColor = isBlocked ? "#9CA3AF" : baseColor;
        const iconColor = isBlocked ? "#9CA3AF" : (item.color || "#6B7280");
        return (
          <div
            key={item.id}
            onClick={isBlocked ? undefined : () => { onAction(item.id); onClose(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 10px",
              borderRadius: 5,
              cursor: isBlocked ? "not-allowed" : "pointer",
              fontSize: 12,
              color: textColor,
            }}
          >
            <Icon size={13} style={{ color: iconColor }} />
            {item.label}
            {item.gated && filedOrRemitted && (
              <span style={{ marginLeft: "auto", fontSize: 9, color: "#6B7280", background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>Filed</span>
            )}
            {item.gated && !filedOrRemitted && (
              <span style={{ marginLeft: "auto", fontSize: 9, color: "#6B7280", background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>Pre-remit</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
