import React from "react";
import { X } from "lucide-react";
import { colors, typography, spacing, radius, shadow, motion, breakpoints } from "../tokens";

export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = 520,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" && window.innerWidth < breakpoints.mobile
  );

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoints.mobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, closeOnEscape]);

  React.useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={closeOnOverlayClick ? onClose : undefined}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          zIndex: 100,
          animation: `novalaFadeIn ${motion.fast}`,
        }}
      />
      <div
        role="dialog"
        aria-label={title}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: isMobile ? "100%" : width,
          background: colors.bgCard,
          boxShadow: shadow.drawer,
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          fontFamily: typography.fontFamily,
          animation: `novalaSlideInRight ${motion.slow}`,
        }}
      >
        <div
          style={{
            padding: `${spacing[5]}px ${spacing[6]}px`,
            borderBottom: `1px solid ${colors.borderDefault}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <h2 style={{ ...typography.h2, color: colors.textPrimary, margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 4, display: "flex", alignItems: "center",
              color: colors.textSecondary,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: spacing[6] }}>
          {children}
        </div>

        {footer && (
          <div
            style={{
              padding: `${spacing[4]}px ${spacing[6]}px`,
              borderTop: `1px solid ${colors.borderDefault}`,
              background: colors.bgCard,
            }}
          >
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes novalaFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes novalaSlideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
