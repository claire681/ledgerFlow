import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, CalendarClock, MessageSquare, ChevronDown, ChevronRight, Check } from "lucide-react";
import EditModal from "./EditModal";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const C = {
  ink: "#0E1A1A",
  muted: "#12262B",
  line: "#E7EAF0",
  page: "#F8F9FA",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  danger: "#A32D2D",
};

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

// Presets for known pay types: how the rate unit reads and its display multiplier logic.
const RATE_UNITS = {
  "Overtime": { unit: "x base pay", defaultRate: 1.5, locked: true },
  "Double Overtime Pay": { unit: "x base pay", defaultRate: 2.0, locked: true },
  "Statutory holiday pay": { unit: "x base pay", defaultRate: 1.0, locked: true },
  "Stat pay ADW": { unit: "auto calculated", defaultRate: null, locked: true, hideAmount: true },
  "Vacation pay": { unit: "% of gross", defaultRate: 4.0, locked: false },
  "Bonus": { unit: "flat amount ($)", defaultRate: null, locked: false, money: true },
  "Commission": { unit: "flat amount ($)", defaultRate: null, locked: false, money: true },
  "Hourly 2": { unit: "$ per hour", defaultRate: null, locked: false, money: true },
  "Controlled Tips": { unit: "flat amount ($)", defaultRate: null, locked: false, money: true },
  "Mileage reimbursement": { unit: "$ per km", defaultRate: null, locked: false, money: true },
};

function fmtDateInput(iso) {
  if (!iso) return "";
  try {
    var d = new Date(iso);
    var dd = String(d.getDate()).padStart(2, "0");
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var yyyy = d.getFullYear();
    return dd + "/" + mm + "/" + yyyy;
  } catch (e) { return ""; }
}

// T4 / RL box parsing: catalog stores comma-separated in t4_box (e.g. "14,24,26,56").
function splitBoxes(str) {
  if (!str) return [];
  return String(str).split(",").map(function(s) { return s.trim(); }).filter(Boolean);
}

// Default RL (Relevé) boxes when catalog doesn't provide them explicitly.
// For general employment income: A. If pensionable: G. If insurable: I. Adjust as needed.
function inferReleveBoxes(pt) {
  var boxes = [];
  if (pt.federal_taxable !== false) boxes.push("A");
  if (pt.cpp_contributable) boxes.push("G");
  if (pt.ei_insurable) boxes.push("I");
  return boxes;
}

export default function EditPayTypeModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const item = props.item || null;
  const employee = props.employee || {};
  const navigate = useNavigate();

  const [rateOverride, setRateOverride] = useState("");
  const [effectiveOn, setEffectiveOn] = useState("immediately");
  const [taxOpen, setTaxOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [confirmUnassign, setConfirmUnassign] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  const pt = (item && item.pay_type) || {};
  const preset = RATE_UNITS[pt.name] || { unit: "", defaultRate: null, locked: false };
  const isRequired = !!pt.is_required_by_law;

  const initialRate = useMemo(function() {
    if (!item) return "";
    if (item.rate_override != null) return String(item.rate_override);
    if (pt.default_rate != null) return String(pt.default_rate);
    if (preset.defaultRate != null) return String(preset.defaultRate);
    return "";
  }, [item, pt.default_rate, preset.defaultRate]);

  useEffect(function() {
    if (isOpen) {
      setRateOverride(initialRate);
      setEffectiveOn("immediately");
      setTaxOpen(false);
      setSaving(false);
      setSaveError(null);
      setConfirmUnassign(false);
      setUnassigning(false);
    }
  }, [isOpen, initialRate]);

  // If a kebab-menu Unassign fires the confirm-unassign event, jump straight
  // into the confirm view for THIS item.
  useEffect(function() {
    function handleConfirm(e) {
      var it = e && e.detail;
      if (!it || !item) return;
      if (String(it.id) === String(item.id)) {
        setConfirmUnassign(true);
      }
    }
    window.addEventListener("novala:confirmUnassignPayItem", handleConfirm);
    return function() { window.removeEventListener("novala:confirmUnassignPayItem", handleConfirm); };
  }, [item]);

  const hasChanges = rateOverride !== initialRate;

  async function handleSave() {
    if (!item) return;
    setSaving(true);
    setSaveError(null);
    var body = {};
    if (!preset.hideAmount) {
      body.rate_override = rateOverride === "" ? null : Number(rateOverride);
      if (isNaN(body.rate_override)) body.rate_override = null;
    }
    try {
      const r = await fetch(API + "/api/v1/employee-pay-items/" + item.id, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error("Save failed: " + (txt || r.status));
      }
      setSaving(false);
      onSaved && onSaved();
    } catch (e) {
      setSaving(false);
      setSaveError(e.message || "Save failed");
    }
  }

  async function handleUnassign() {
    if (!item) return;
    setUnassigning(true);
    try {
      const r = await fetch(API + "/api/v1/employee-pay-items/" + item.id, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!r.ok && r.status !== 204) {
        const txt = await r.text();
        throw new Error("Unassign failed: " + (txt || r.status));
      }
      setUnassigning(false);
      setConfirmUnassign(false);
      onSaved && onSaved();
    } catch (e) {
      setUnassigning(false);
      setSaveError(e.message || "Unassign failed");
    }
  }

  const employeeName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "this employee";
  const positionRaw = employee.position_title || "";
  const subtitle = positionRaw ? (employeeName + " \u00b7 " + positionRaw) : employeeName;

  if (!item) {
    return (
      <EditModal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit pay type"
        subtitle={subtitle}
        iconLetter="+"
        saving={false}
        saveDisabled={true}
        hasUnsavedChanges={false}
        saveLabel="Save"
      >
        <div style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>No pay item selected.</div>
      </EditModal>
    );
  }

  const t4Boxes = splitBoxes(pt.t4_box);
  const releveBoxes = inferReleveBoxes(pt);

  const footerContent = (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <CalendarClock size={18} color={C.ink} />
        <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Effective on</span>
      </div>
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 12 }}>
        When should this change start?
      </div>
      <select
        value={effectiveOn}
        onChange={function(e) { setEffectiveOn(e.target.value); }}
        style={{
          width: "100%", boxSizing: "border-box", height: 44,
          padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10,
          fontSize: 14, color: C.ink, background: "#FFFFFF",
          cursor: "pointer", fontFamily: FONT, fontWeight: 500,
        }}
      >
        <option value="immediately">Immediately</option>
        <option value="next_period">Next pay period</option>
      </select>
      {!isRequired && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid " + C.line, display: "flex", justifyContent: "flex-start" }}>
          <button
            onClick={function() { setConfirmUnassign(true); }}
            style={{
              height: 38, padding: "0 16px", background: "#FFFFFF", color: C.danger,
              border: "1px solid " + C.danger, borderRadius: 10,
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
            }}
          >
            Unassign this pay type
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <EditModal
        isOpen={isOpen && !confirmUnassign}
        onClose={onClose}
        onSave={handleSave}
        title={"Edit " + (pt.name || "pay type")}
        subtitle={subtitle}
        iconLetter="+"
        saving={saving}
        saveError={saveError}
        saveDisabled={!hasChanges || saving}
        hasUnsavedChanges={hasChanges}
        saveLabel="Save changes"
        footerContent={footerContent}
        secondaryAction={
          <a
            href="mailto:support@getnovala.com?subject=Feedback%20on%20Edit%20pay%20type"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.brandDark, textDecoration: "underline", fontWeight: 700 }}
          >
            <MessageSquare size={15} /> Give feedback
          </a>
        }
      >
        {/* Pay type (locked) */}
        <FormLabel>Pay type</FormLabel>
        <div style={{
          display: "flex", alignItems: "center", height: 44, padding: "0 14px",
          border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF", marginBottom: 16,
        }}>
          <Lock size={14} color={C.muted} style={{ marginRight: 10 }} />
          <span style={{ fontSize: 14, color: C.ink, flex: 1, fontWeight: 500 }}>{pt.name || "-"}</span>
          {isRequired && (
            <span style={{ padding: "2px 8px", background: C.brandBg, color: C.brandDark, borderRadius: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3 }}>REQUIRED</span>
          )}
        </div>

        {/* Rate / Amount */}
        {!preset.hideAmount && (
          <>
            <FormLabel>Rate / Amount</FormLabel>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{
                flex: 1, display: "flex", alignItems: "center", height: 44, padding: "0 14px",
                border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF",
              }}>
                {preset.money && <span style={{ color: C.muted, marginRight: 8, fontWeight: 600 }}>$</span>}
                <input
                  type="text"
                  value={rateOverride}
                  disabled={preset.locked}
                  onChange={function(e) { setRateOverride(e.target.value); }}
                  style={{
                    border: 0, outline: "none", fontSize: 14, color: C.ink,
                    flex: 1, fontFamily: FONT, fontVariantNumeric: "tabular-nums", fontWeight: 500,
                    background: "transparent", opacity: preset.locked ? 0.7 : 1,
                  }}
                />
              </div>
              <div style={{
                flex: 1.2, display: "flex", alignItems: "center", height: 44, padding: "0 14px",
                border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF",
              }}>
                <span style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>{preset.unit || "unit"}</span>
              </div>
            </div>
            {preset.locked && (
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: -6, marginBottom: 16, fontWeight: 500 }}>
                This rate is set by the pay type catalog and cannot be changed per employee.
              </div>
            )}
          </>
        )}

        {preset.hideAmount && (
          <div style={{
            padding: "12px 14px", background: C.brandBg, borderRadius: 10,
            marginBottom: 16, fontSize: 12.5, color: C.ink, fontWeight: 500, lineHeight: 1.5,
          }}>
            {pt.name} is auto calculated based on the employee's earnings history. No manual amount is set here.
          </div>
        )}

        {/* Effective date (display only, editable via footer) */}
        <FormLabel>Effective date</FormLabel>
        <div style={{
          display: "flex", alignItems: "center", height: 44, padding: "0 14px",
          border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF", marginBottom: 16,
        }}>
          <CalendarClock size={14} color={C.muted} style={{ marginRight: 10 }} />
          <span style={{ fontSize: 14, color: C.ink, flex: 1, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
            {fmtDateInput(item.created_at) || "-"}
          </span>
        </div>

        {/* Account mapping */}
        <FormLabel>Account mapping</FormLabel>
        <div style={{
          display: "flex", alignItems: "center", height: 44, padding: "0 14px",
          border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF",
        }}>
          <Lock size={14} color={C.muted} style={{ marginRight: 10 }} />
          <span style={{ fontSize: 14, color: C.ink, flex: 1, fontWeight: 500 }}>Payroll Expenses: Wages</span>
        </div>
        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
          Used to categorize and map your payroll transactions. To edit, see Accounting under{" "}
          <a
            onClick={function() { if (onClose) onClose(); navigate("/payroll/settings"); }}
            style={{ color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
          >
            Payroll settings
          </a>
          .
        </div>

        {/* Collapsible tax settings (read only) */}
        <div style={{ marginTop: 20, border: "1px solid " + C.line, borderRadius: 10, overflow: "hidden" }}>
          <div
            onClick={function() { setTaxOpen(!taxOpen); }}
            style={{ display: "flex", alignItems: "center", padding: "14px 16px", cursor: "pointer" }}
          >
            {taxOpen ? <ChevronDown size={16} color={C.muted} style={{ marginRight: 10 }} /> : <ChevronRight size={16} color={C.muted} style={{ marginRight: 10 }} />}
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, flex: 1 }}>
              {taxOpen ? "Hide tax settings" : "Show tax settings"}
            </span>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Read only</span>
          </div>
          {taxOpen && (
            <div style={{ padding: "6px 16px 18px 42px", borderTop: "1px solid " + C.line }}>
              <div style={{ fontSize: 12.5, color: C.muted, margin: "12px 0", fontWeight: 500, lineHeight: 1.5 }}>
                Tax settings for {pt.name} are defined at the pay type level and cannot be changed here.
                To edit, go to{" "}
                <a
                  onClick={function() { if (onClose) onClose(); navigate("/payroll/settings/pay-types"); }}
                  style={{ color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
                >Pay types</a>{" "}
                in Payroll settings.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", marginBottom: 14 }}>
                <ReadOnlyCheck label="Taxable" checked={pt.federal_taxable !== false} />
                <ReadOnlyCheck label="Insurable" checked={!!pt.ei_insurable} />
                <ReadOnlyCheck label="Pensionable" checked={!!pt.cpp_contributable} />
                <ReadOnlyCheck label="Taxable (Qu\u00e9bec)" checked={pt.federal_taxable !== false} />
              </div>

              {t4Boxes.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 700, marginBottom: 6 }}>T4 Boxes</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {t4Boxes.map(function(b) {
                      return <BoxChip key={b} label={b} />;
                    })}
                  </div>
                </div>
              )}

              {releveBoxes.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 700, marginBottom: 6 }}>Relev\u00e9 Boxes</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {releveBoxes.map(function(b) {
                      return <BoxChip key={b} label={b} />;
                    })}
                  </div>
                </div>
              )}

              <div style={{ borderTop: "1px solid " + C.line, paddingTop: 12 }}>
                <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 700, marginBottom: 10 }}>
                  Show on Record of Employment as:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
                  <ReadOnlyCheck label="Insurable earnings" checked={!!pt.ei_insurable} />
                  <ReadOnlyCheck label="Insurable hours" checked={!!pt.ei_insurable} />
                  <ReadOnlyCheck label="Pay dates" checked={false} />
                  <ReadOnlyCheck label="Pay period end date" checked={true} />
                </div>
              </div>
            </div>
          )}
        </div>
      </EditModal>

      {/* Unassign confirm - shown as a small centered modal on top */}
      {confirmUnassign && (
        <div
          onClick={function() { if (!unassigning) setConfirmUnassign(false); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(14,26,26,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000,
            fontFamily: FONT,
          }}
        >
          <div
            onClick={function(e) { e.stopPropagation(); }}
            style={{
              width: 440, maxWidth: "92%", background: "#FFFFFF", borderRadius: 14, overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ padding: "22px 24px 18px" }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, background: "#FBEAEA", color: C.danger,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <path d="M12 9v4M12 17h.01"/>
                </svg>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                Unassign {pt.name} from {employee.first_name || "this employee"}?
              </div>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, lineHeight: 1.55 }}>
                This pay type will no longer appear on future pay runs. Past pay runs are not affected. You can reassign it anytime.
              </div>
              {saveError && (
                <div style={{ marginTop: 10, fontSize: 12.5, color: C.danger, fontWeight: 600 }}>{saveError}</div>
              )}
            </div>
            <div style={{ padding: "14px 24px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={function() { setConfirmUnassign(false); }}
                disabled={unassigning}
                style={{
                  height: 40, padding: "0 20px", background: "#FFFFFF", border: "1px solid " + C.line,
                  borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: C.ink, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUnassign}
                disabled={unassigning}
                style={{
                  height: 40, padding: "0 20px", background: C.danger, color: "#FFFFFF", border: 0,
                  borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                  opacity: unassigning ? 0.7 : 1,
                }}
              >
                {unassigning ? "Unassigning..." : "Yes, unassign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- Sub-components ---

function FormLabel(props) {
  return (
    <label style={{
      display: "block", fontSize: 13, fontWeight: 700,
      color: "#12262B", marginBottom: 7,
    }}>
      {props.children}
    </label>
  );
}

function ReadOnlyCheck(props) {
  const checked = props.checked;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4,
        background: checked ? "#15A08C" : "#FFFFFF",
        border: checked ? "0" : "1.5px solid #E7EAF0",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {checked && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
      </div>
      <span style={{ fontSize: 13, color: checked ? "#0E1A1A" : "#12262B", fontWeight: 500 }}>{props.label}</span>
    </div>
  );
}

function BoxChip(props) {
  return (
    <span style={{
      padding: "3px 10px", background: "#E1F5EE", color: "#0F6E56",
      borderRadius: 6, fontSize: 12, fontWeight: 700,
    }}>
      {props.label}
    </span>
  );
}