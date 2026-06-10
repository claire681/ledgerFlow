import React from "react";
import { X } from "lucide-react";
import { colors, typography, spacing, radius, shadow, motion } from "../tokens";

export default function Modal({
  isOpen, onClose, title, children, footer, width = 480,
  closeOnOverlayClick = true,
}) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={closeOnOverlayClick ? onClose : undefined}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(2px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing[4],
        animation: `novalaFadeIn ${motion.fast}`,
      }}
    >
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: width,
          background: colors.bgCard,
          borderRadius: radius.cardLg,
          boxShadow: shadow.modal,
          fontFamily: typography.fontFamily,
          animation: `novalaModalIn ${motion.modal}`,
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        <div style={{
          padding: `${spacing[5]}px ${spacing[6]}px`,
          borderBottom: `1px solid ${colors.borderDefault}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}>
          <h2 style={{ ...typography.h2, color: colors.textPrimary, margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 4, display: "flex", color: colors.textSecondary,
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: spacing[6] }}>
          {children}
        </div>
        {footer && (
          <div style={{
            padding: `${spacing[4]}px ${spacing[6]}px`,
            borderTop: `1px solid ${colors.borderDefault}`,
          }}>
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes novalaModalIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
