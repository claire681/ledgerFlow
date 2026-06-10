import React, { useState, useEffect } from "react";
import { X, HelpCircle, Check, Minus, ChevronDown, ChevronUp } from "lucide-react";
import {
  getPayTypesForCountry,
  getPayTypeByKey,
  getTaxSettingsRows,
} from "../../data/payTypeDefinitions";

const TEAL = "#0F9599";
const FONT_FAMILY = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
const BORDER = "#E5E7EB";
const BORDER_LIGHT = "#F3F4F6";
const TEXT = "#0F172A";
const SUBTLE = "#475569";
const MUTED = "#6B7280";

export default function EditPayTypeDrawer({
  isOpen,
  onClose,
  mode,
  initialAssignment,
  onSave,
  onUnassign,
  country = "CA",
}) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 640
  );
  const [selectedPayTypeKey, setSelectedPayTypeKey] = useState("");
  const [accountMapping, setAccountMapping] = useState("Payroll Expenses:Wages");
  const [showTaxSettings, setShowTaxSettings] = useState(false);

  const availableTypes = getPayTypesForCountry(country);
  const selectedDef = selectedPayTypeKey ? getPayTypeByKey(country, selectedPayTypeKey) : null;
  const taxRows = getTaxSettingsRows(country);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedPayTypeKey(initialAssignment?.payTypeKey || "");
      setAccountMapping(initialAssignment?.accountMapping || "Payroll Expenses:Wages");
      setShowTaxSettings(false);
    }
  }, [isOpen, initialAssignment]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (selectedDef) {
      setAccountMapping(selectedDef.defaultAccountMapping || "Payroll Expenses:Wages");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPayTypeKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!selectedPayTypeKey) return;
    const def = getPayTypeByKey(country, selectedPayTypeKey);
    const assignment = {
      id: initialAssignment?.id || `pt_${Date.now()}`,
      payTypeKey: selectedPayTypeKey,
      payTypeLabel: def?.label || selectedPayTypeKey,
      rateAmount: def?.defaultRateAmount || "",
      effectiveDate:
        initialAssignment?.effectiveDate ||
        new Date().toISOString().split("T")[0],
      accountMapping: accountMapping,
    };
    onSave(assignment);
  };

  return (
    <React.Fragment>
      <div
        onClick={onClose}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)", zIndex: 100,
        }}
      />
      <div
        role="dialog"
        aria-label="Edit pay type"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: isMobile ? "100%" : 520,
          background: "#FFFFFF",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          zIndex: 101,
          display: "flex", flexDirection: "column",
          fontFamily: FONT_FAMILY,
        }}
      >
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>
            {mode === "add" ? "Add pay type" : "Edit pay type"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 4, display: "flex", alignItems: "center",
            }}
          >
            <X size={20} color={SUBTLE} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {/* 1. Pay type */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 8,
            }}>
              Pay type
              <HelpCircle size={14} color={MUTED} />
            </label>
            <select
              value={selectedPayTypeKey}
              onChange={(e) => setSelectedPayTypeKey(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px",
                fontSize: 14, fontFamily: FONT_FAMILY,
                border: `1px solid ${BORDER}`, borderRadius: 8,
                background: "#FFFFFF", color: TEXT, cursor: "pointer",
              }}
            >
              <option value="">Select a pay type</option>
              {availableTypes.map((pt) => (
                <option key={pt.key} value={pt.key}>{pt.label}</option>
              ))}
            </select>
          </div>

          {/* 2. Account mapping */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block", fontSize: 14, fontWeight: 600,
              color: TEXT, marginBottom: 8,
            }}>
              Account mapping
            </label>
            <div style={{
              padding: "10px 12px", fontSize: 14,
              border: `1px solid ${BORDER}`, borderRadius: 8,
              background: "#F9FAFB", color: TEXT,
            }}>
              {accountMapping || "Payroll Expenses:Wages"}
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>
              Used to categorize and map payroll transactions. Edit under Accounting in
              
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ color: TEAL, textDecoration: "none", fontWeight: 500, marginLeft: 4 }}
              >
                Payroll settings
              </a>
            </div>
          </div>

          {/* 3. Tax settings (collapsible) */}
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => setShowTaxSettings(!showTaxSettings)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "none", border: "none", padding: 0,
                cursor: "pointer",
                fontSize: 14, fontWeight: 600, color: TEAL,
                fontFamily: FONT_FAMILY,
              }}
            >
              {showTaxSettings ? <ChevronUp size={16} color={TEAL} /> : <ChevronDown size={16} color={TEAL} />}
              {showTaxSettings ? "Hide tax settings" : "Show tax settings"}
            </button>

            {showTaxSettings && (
              <div style={{
                marginTop: 16, padding: 16,
                background: "#F9FAFB",
                border: `1px solid ${BORDER_LIGHT}`,
                borderRadius: 8,
              }}>
                {!selectedDef && (
                  <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
                    Select a pay type above to see its tax treatment.
                  </p>
                )}
                {selectedDef && (
                  <React.Fragment>
                    <div>
                      {taxRows.treatments.map((row) => (
                        <TaxRow
                          key={row.key}
                          label={row.label}
                          value={<BooleanIcon yes={selectedDef.taxSettings[row.key]} />}
                        />
                      ))}
                      {taxRows.boxes.map((row) => {
                        const list = selectedDef.taxSettings[row.key] || [];
                        return (
                          <TaxRow
                            key={row.key}
                            label={row.label}
                            value={
                              list.length > 0 ? (
                                <span style={{ fontSize: 13, color: TEXT }}>{list.join(", ")}</span>
                              ) : (
                                <Minus size={14} color={MUTED} />
                              )
                            }
                          />
                        );
                      })}
                    </div>
                    {taxRows.roeRows.length > 0 && (
                      <div style={{ marginTop: 20 }}>
                        <h3 style={{
                          fontSize: 13, fontWeight: 700, color: TEXT,
                          margin: "0 0 8px 0",
                        }}>
                          Show on Record of Employment as:
                        </h3>
                        {taxRows.roeRows.map((row) => (
                          <TaxRow
                            key={row.key}
                            label={row.label}
                            value={<BooleanIcon yes={selectedDef.taxSettings.roe[row.key]} />}
                          />
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", padding: "8px 4px",
              cursor: "pointer", fontSize: 14, fontWeight: 500,
              color: SUBTLE, fontFamily: FONT_FAMILY,
            }}
          >
            Cancel
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {mode === "edit" && (
              <button
                onClick={onUnassign}
                style={{
                  background: "#FFFFFF", color: "#991B1B",
                  border: `1px solid ${BORDER}`, borderRadius: 8,
                  padding: "9px 16px", fontSize: 14, fontWeight: 600,
                  fontFamily: FONT_FAMILY, cursor: "pointer",
                }}
              >
                Unassign
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!selectedPayTypeKey}
              style={{
                background: selectedPayTypeKey ? TEAL : "#A7F3D0",
                color: "#FFFFFF", border: "none", borderRadius: 8,
                padding: "9px 20px", fontSize: 14, fontWeight: 600,
                fontFamily: FONT_FAMILY,
                cursor: selectedPayTypeKey ? "pointer" : "not-allowed",
                opacity: selectedPayTypeKey ? 1 : 0.6,
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

function TaxRow({ label, value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: `1px solid ${BORDER_LIGHT}`,
      fontSize: 13,
    }}>
      <span style={{ color: SUBTLE }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function BooleanIcon({ yes }) {
  if (yes) return <Check size={16} color="#16A34A" strokeWidth={2.5} />;
  return <Minus size={14} color={MUTED} />;
}
