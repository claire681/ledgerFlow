import React from "react";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";
import { colors, typography, radius, shadow, spacing, motion } from "../tokens";

const TOAST_CONFIG = {
  success: { Icon: CheckCircle, color: colors.success },
  error: { Icon: AlertCircle, color: colors.danger },
  info: { Icon: Info, color: colors.info },
};

const ToastContext = React.createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const show = React.useCallback((toast) => {
    const id = Date.now() + Math.random();
    const t = { id, type: "success", duration: 5000, ...toast };
    setToasts((prev) => [...prev, t]);
    if (t.duration && t.type !== "error") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, t.duration);
    }
    return id;
  }, []);

  const dismiss = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div style={{
        position: "fixed",
        bottom: spacing[5],
        right: spacing[5],
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 1000,
        maxWidth: 380,
      }}>
        {toasts.map((t) => {
          const cfg = TOAST_CONFIG[t.type] || TOAST_CONFIG.info;
          const Icon = cfg.Icon;
          return (
            <div
              key={t.id}
              role="alert"
              style={{
                background: colors.bgCard,
                border: `1px solid ${colors.borderDefault}`,
                borderRadius: radius.card,
                padding: spacing[4],
                boxShadow: shadow.toast,
                fontFamily: typography.fontFamily,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                animation: `novalaToastIn ${motion.fast}`,
              }}
            >
              <Icon size={20} color={cfg.color} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <div style={{ ...typography.bodyStrong, color: colors.textPrimary, marginBottom: t.body ? 2 : 0 }}>
                    {t.title}
                  </div>
                )}
                {t.body && (
                  <div style={{ ...typography.caption, color: colors.textSecondary }}>
                    {t.body}
                  </div>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 0, display: "flex", color: colors.textMuted,
                }}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
        <style>{`
          @keyframes novalaToastIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return {
      show: (t) => { if (typeof window !== "undefined") console.log("Toast:", t); },
      dismiss: () => {},
    };
  }
  return ctx;
}
