import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ShieldCheck, Wrench, X } from "lucide-react";

const BRAND = "#0F9599";
const BRAND_DARK = "#0F6E56";
const BRAND_SOFT = "#E1F5EE";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const BORDER = "#E5E7EB";
const WARNING = "#D97706";

const AVATAR_COLORS = ["#0F9599", "#6366F1", "#DC2626", "#B45309", "#7C3AED", "#0891B2", "#DB2777", "#65A30D"];
const avatarColor = (emp) => {
  const seed = String(emp.id || emp.email || "x");
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash * 31) + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initials = (emp) => {
  const f = (emp.first_name || "").trim();
  const l = (emp.last_name || "").trim();
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  if (l) return l.slice(0, 2).toUpperCase();
  return "??";
};

const displayName = (emp) => {
  const last = (emp.last_name || "").trim();
  const first = (emp.first_name || "").trim();
  if (last && first) return last + ", " + first;
  return emp.email || "Unnamed";
};

export default function RunPayrollGuardModal({ open, onClose, blockingEmployees = [], readyCount = 0, totalCount = 0 }) {
  const navigate = useNavigate();
  if (!open) return null;

  const fixEmployee = (emp) => {
    const missing = (emp._readiness && emp._readiness.missing) || [];
    const section = (missing[0] && missing[0].section) || "personal";
    navigate("/payroll/employees/" + emp.id + "?section=" + section);
    onClose();
  };

  const fixAndContinue = () => {
    if (blockingEmployees[0]) fixEmployee(blockingEmployees[0]);
  };

  const runAnyway = () => {
    onClose();
    navigate("/payroll/runs/new");
  };

  const n = blockingEmployees.length;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "white", width: 460, maxWidth: "100%", borderRadius: 10, fontFamily: "inherit" }}
      >
        <div style={{ padding: "18px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#FEF3C7", color: "#92400E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AlertTriangle size={19} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>
                {n} employee{n === 1 ? " isn't" : "s aren't"} ready
              </h2>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 3 }}>Running now means missing or wrong pay for them.</div>
            </div>
            <X size={16} style={{ color: TEXT_SECONDARY, cursor: "pointer", flexShrink: 0 }} onClick={onClose} />
          </div>

          <div style={{ background: "#F9FAFB", border: "0.5px solid " + BORDER, borderRadius: 8, padding: 6, marginBottom: 12, maxHeight: 220, overflowY: "auto" }}>
            {blockingEmployees.map((emp) => {
              const missing = ((emp._readiness && emp._readiness.missing) || []).map((m) => m.label).join(", ");
              return (
                <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px" }}>
                  <div style={{ position: "relative", width: 32, height: 32, flexShrink: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: avatarColor(emp), color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500 }}>
                      {initials(emp)}
                    </div>
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%", background: "#F59E0B", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AlertTriangle size={7} color="white" />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }}>{displayName(emp)}</div>
                    <div style={{ fontSize: 11, color: WARNING }}>Missing {missing}</div>
                  </div>
                  <span onClick={() => fixEmployee(emp)} style={{ fontSize: 12, color: BRAND, fontWeight: 500, cursor: "pointer", flexShrink: 0 }}>Fix profile</span>
                </div>
              );
            })}
          </div>

          {readyCount > 0 && (
            <div style={{ background: BRAND_SOFT, borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={16} style={{ color: BRAND_DARK, flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: BRAND_DARK }}>
                {readyCount} of {totalCount} employees are ready and can still be paid on time.
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 22px 16px", borderTop: "0.5px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span onClick={runAnyway} style={{ fontSize: 12, color: TEXT_SECONDARY, cursor: "pointer" }}>Run anyway</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 6, background: "white", color: TEXT_PRIMARY, border: "0.5px solid " + BORDER, cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={fixAndContinue} style={{ fontSize: 13, padding: "8px 18px", borderRadius: 6, background: BRAND, color: "white", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Wrench size={13} />
              Fix and continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
