import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Wrench, X } from "lucide-react";

const BRAND = "#0F9599";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const BORDER = "#E5E7EB";
const WARN_TEXT = "#92400E";
const WARN_SOFT = "#FEF3C7";

export default function RunPayrollGuardModal({
  open,
  onClose,
  blockingEmployees = [],
  readyCount = 0,
  totalCount = 0
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const fixEmployee = (emp) => {
    if (!emp) return;
    if (onClose) onClose();
    const section = emp.missingSection || "profile";
    navigate("/payroll/employees/" + emp.id + "?section=" + section);
  };

  const fixAndContinue = () => {
    if (blockingEmployees.length > 0) fixEmployee(blockingEmployees[0]);
  };

  const runAnyway = () => {
    if (onClose) onClose();
    navigate("/payroll/runs/new");
  };

  const empLabel = (emp) => {
    if (!emp) return "Employee";
    if (emp.name) return emp.name;
    const first = emp.first_name || "";
    const last = emp.last_name || "";
    const combined = (first + " " + last).trim();
    return combined || ("Employee " + (emp.id || ""));
  };

  const missingLabel = (emp) => {
    if (!emp || !emp.missing) return null;
    if (Array.isArray(emp.missing)) return emp.missing.length > 0 ? emp.missing.join(", ") : null;
    return String(emp.missing);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "inherit"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 12,
          maxWidth: 540,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 24px 48px rgba(15,23,42,0.18)",
          position: "relative"
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            color: TEXT_SECONDARY,
            fontFamily: "inherit"
          }}
        >
          <X size={18} />
        </button>

        <div style={{ padding: "24px 24px 0" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 52,
            height: 52,
            borderRadius: 12,
            background: WARN_SOFT,
            color: WARN_TEXT,
            marginBottom: 14
          }}>
            <AlertTriangle size={26} />
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY }}>
            Some employees are not ready
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
            {readyCount} of {totalCount} employees are ready to be paid. Fix the missing setup below, or run payroll only for the ready ones.
          </p>
        </div>

        {blockingEmployees.length > 0 && (
          <div style={{ padding: "0 24px 16px" }}>
            <div style={{ border: "1px solid " + BORDER, borderRadius: 10 }}>
              {blockingEmployees.map((emp, i) => {
                const missing = missingLabel(emp);
                return (
                  <div key={(emp && emp.id) || i} style={{
                    padding: "12px 14px",
                    borderBottom: i < blockingEmployees.length - 1 ? "1px solid " + BORDER : "none",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>
                        {empLabel(emp)}
                      </div>
                      {missing && (
                        <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>
                          Missing: {missing}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fixEmployee(emp)}
                      style={{
                        background: "transparent",
                        border: "1px solid " + BRAND,
                        color: BRAND,
                        padding: "5px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        whiteSpace: "nowrap",
                        flexShrink: 0
                      }}
                    >
                      Fix profile
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid " + BORDER,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <button
            onClick={runAnyway}
            style={{
              background: "transparent",
              border: "none",
              color: TEXT_SECONDARY,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              textDecoration: "underline",
              padding: 0
            }}
          >
            Run for ready employees only
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "1px solid " + BORDER,
                color: TEXT_PRIMARY,
                padding: "9px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              Cancel
            </button>
            <button
              onClick={fixAndContinue}
              disabled={blockingEmployees.length === 0}
              style={{
                background: BRAND,
                border: "none",
                color: "#fff",
                padding: "9px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: blockingEmployees.length === 0 ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: blockingEmployees.length === 0 ? 0.5 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Wrench size={14} />
              Fix and continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
