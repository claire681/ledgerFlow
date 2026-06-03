import React, { useState } from "react";
import ReactDOM from "react-dom";
import { X, HelpCircle } from "lucide-react";
import NovalaVerifyModal from "../components/NovalaVerifyModal";
import { SaveChangesDialog } from "../components/SaveChangesDialog";

const BRAND = "#0F5959";
const TEAL_LINK = "#0F9599";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const BORDER = "#DDE5E5";
const MUTED_BG = "#F4F5F8";
const RED = "#D9453C";

// Frontend-only persistence stub. TODO: wire to a /company-settings backend endpoint.
const LS_KEY = "novala_federal_tax_info";
// TODO: replace with real OTP send + server-side verification against current user
const DEMO_CODE = "123456";
const TAX_BODY = "You haven't saved the changes you made to your tax info. If any numbers are missing or incorrect, it can result in late payments or notices.";

const FORM_OPTIONS = ["PD7A", "PD7A-RB", "PD7A(TM)"];
const FREQUENCY_OPTIONS = ["Monthly", "Quarterly", "Annually", "Bi-weekly", "Semi-monthly"];

function loadDefaults() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    business_number: "",
    reference_number: "",
    sin_owner_1: "",
    sin_owner_2: "",
    rac: "",
    form_type: "PD7A",
    payment_frequency: "Monthly",
    effective_date: "",
    schedules: [
      { form: "Form PD7A", schedule: "Monthly (current schedule)", effective_date: "01/01/2026" }
    ]
  };
}

const iconBtnStyle = {
  width: 36, height: 36, borderRadius: 999,
  background: "transparent", border: "none", cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  color: SUB, transition: "background 0.15s",
};
const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 600,
  color: SUB, marginBottom: 6,
};
const inputStyle = {
  width: "100%", padding: "11px 14px", fontSize: 14.5,
  border: `1.6px solid ${BORDER}`, borderRadius: 10,
  background: "#fff", color: INK, outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};
const maskedInputStyle = {
  ...inputStyle,
  background: MUTED_BG, color: SUB,
  letterSpacing: "0.15em", cursor: "not-allowed",
};
const linkStyle = {
  color: TEAL_LINK, background: "none", border: "none",
  fontWeight: 600, fontSize: 14, cursor: "pointer",
  padding: 0, textDecoration: "none",
};
const thStyle = {
  textAlign: "left", padding: "12px 16px", fontSize: 12,
  fontWeight: 700, color: SUB, textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const tdStyle = { padding: "12px 16px", fontSize: 14, color: INK };

export function FederalTaxInfo({ onClose }) {
  const [f, setF] = useState(loadDefaults);
  const [verified, setVerified] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setDirty(true); };

  const handleVerified = () => {
    setVerified(true);
    setShowVerify(false);
  };

  const deleteSchedule = (idx) => {
    setF(p => ({ ...p, schedules: p.schedules.filter((_, i) => i !== idx) }));
    setDirty(true);
  };

  const handleClose = () => {
    if (dirty) setShowSaveDialog(true);
    else onClose();
  };

  const save = () => {
    setSaving(true);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(f));
      setDirty(false);
      setShowSaveDialog(false);
      setTimeout(() => onClose(), 250);
    } catch (e) {
      setSaving(false);
      alert("Failed to save: " + e.message);
    }
  };

  const node = (
    <div style={{
      position: "fixed", inset: 0, background: "#fff",
      zIndex: 99500, overflow: "auto",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      animation: "ftIn 0.28s cubic-bezier(0.16,1,0.3,1)",
    }}>
      <style>{`@keyframes ftIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, background: "#F7F8F9",
        borderBottom: `1px solid ${BORDER}`, zIndex: 99501,
        padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <h2 style={{margin: 0, fontSize: 17, fontWeight: 700, color: INK}}>Federal tax info</h2>
        <div style={{display: "flex", gap: 6}}>
          <button aria-label="Help" title="Help" style={iconBtnStyle}>
            <HelpCircle size={20} strokeWidth={1.9} />
          </button>
          <button onClick={handleClose} aria-label="Close" style={iconBtnStyle}>
            <X size={20} strokeWidth={2.1} />
          </button>
        </div>
      </div>

      {/* Body (left-aligned per Novala edit-overlay convention) */}
      <div style={{maxWidth: 1100, margin: 0, padding: "32px 40px 120px"}}>
        <h1 style={{margin: "0 0 12px 0", fontSize: 26, fontWeight: 700, color: INK, letterSpacing: "-0.01em"}}>
          Federal tax info
        </h1>
        <p style={{fontSize: 14.5, color: SUB, lineHeight: 1.55, margin: "0 0 32px 0", maxWidth: 720}}>
          Once you have your tax info, you can correctly pay your federal taxes. You can find what you need in letters and tax notices you have received from the CRA.
        </p>

        {/* CRA payroll number section header */}
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, maxWidth: 720}}>
          <h3 style={{margin: 0, fontSize: 16, fontWeight: 700, color: INK}}>CRA payroll number</h3>
          <button style={linkStyle} onClick={() => alert("Help — coming soon.")}>Don't have it?</button>
        </div>

        {/* Business Number + RP + Reference Number row */}
        <div style={{display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 20, maxWidth: 720}}>
          <div style={{flex: "2 1 0"}}>
            <label style={labelStyle}>Business Number</label>
            {verified ? (
              <input type="text" value={f.business_number} onChange={(e) => set("business_number", e.target.value)} placeholder="123456789" style={inputStyle} />
            ) : (
              <input value="•••••••••" readOnly style={maskedInputStyle} />
            )}
          </div>
          <div style={{padding: "11px 8px", fontSize: 14, fontWeight: 700, color: INK, alignSelf: "flex-end", marginBottom: 1}}>RP</div>
          <div style={{flex: "1 1 0"}}>
            <label style={labelStyle}>Reference Number</label>
            {verified ? (
              <input type="text" value={f.reference_number} onChange={(e) => set("reference_number", e.target.value)} placeholder="0001" style={inputStyle} />
            ) : (
              <input value="••••" readOnly style={maskedInputStyle} />
            )}
          </div>
          {!verified && (
            <button style={{...linkStyle, paddingBottom: 12, whiteSpace: "nowrap"}} onClick={() => setShowVerify(true)}>
              View/Edit
            </button>
          )}
        </div>

        {/* SIN Owner 1 */}
        <div style={{marginBottom: 16, maxWidth: 720}}>
          <label style={labelStyle}>SIN: Owner 1</label>
          {verified ? (
            <input type="text" value={f.sin_owner_1} onChange={(e) => set("sin_owner_1", e.target.value)} placeholder="123-456-789" style={inputStyle} />
          ) : (
            <input value="•••-•••-•••" readOnly style={maskedInputStyle} />
          )}
        </div>

        {/* SIN Owner 2 */}
        <div style={{marginBottom: 16, maxWidth: 720}}>
          <label style={labelStyle}>SIN: Owner 2</label>
          {verified ? (
            <input type="text" value={f.sin_owner_2} onChange={(e) => set("sin_owner_2", e.target.value)} placeholder="123-456-789" style={inputStyle} />
          ) : (
            <input value="•••-•••-•••" readOnly style={maskedInputStyle} />
          )}
        </div>

        {/* RAC */}
        <div style={{marginBottom: 32, maxWidth: 720}}>
          <label style={labelStyle}>Representative Identifier (RAC)</label>
          {verified ? (
            <input type="text" value={f.rac} onChange={(e) => set("rac", e.target.value)} placeholder="XXXXXXX" style={inputStyle} />
          ) : (
            <input value="•••••••" readOnly style={maskedInputStyle} />
          )}
        </div>

        {/* Payment schedule section */}
        <div style={{borderTop: `1px solid ${BORDER}`, paddingTop: 28, maxWidth: 900}}>
          <h3 style={{margin: "0 0 14px 0", fontSize: 16, fontWeight: 700, color: INK}}>
            How often do you pay your taxes?
          </h3>

          {!editingSchedule ? (
            <div style={{display: "flex", alignItems: "center", gap: 12, fontSize: 14.5, color: SUB}}>
              <span>Form {f.form_type || "PD7A"}, paying {(f.payment_frequency || "monthly").toLowerCase()} since {f.schedules[0]?.effective_date || "01/01/2026"}</span>
              <button style={linkStyle} onClick={() => setEditingSchedule(true)}>Edit</button>
            </div>
          ) : (
            <div>
              <div style={{marginBottom: 18}}>
                <label style={labelStyle}>This is the form used to calculate and submit your payroll taxes to the CRA.</label>
                <select value={f.form_type} onChange={(e) => set("form_type", e.target.value)} style={{...inputStyle, maxWidth: 400}}>
                  <option value="">Select one</option>
                  {FORM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div style={{marginBottom: 18}}>
                <label style={labelStyle}>How often do you pay your taxes?</label>
                <select value={f.payment_frequency} onChange={(e) => set("payment_frequency", e.target.value)} style={{...inputStyle, maxWidth: 400}}>
                  <option value="">Select one</option>
                  {FREQUENCY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div style={{marginBottom: 24}}>
                <label style={labelStyle}>Effective date</label>
                <input type="date" value={f.effective_date} onChange={(e) => set("effective_date", e.target.value)} style={{...inputStyle, maxWidth: 400}} />
              </div>

              <div style={{marginTop: 24, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden"}}>
                <table style={{width: "100%", borderCollapse: "collapse", fontSize: 14}}>
                  <thead>
                    <tr style={{background: MUTED_BG}}>
                      <th style={thStyle}>FORM</th>
                      <th style={thStyle}>PAYMENT SCHEDULE</th>
                      <th style={thStyle}>EFFECTIVE DATE</th>
                      <th style={thStyle}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.schedules.length === 0 ? (
                      <tr><td colSpan={4} style={{padding: 20, textAlign: "center", color: SUB}}>No schedules</td></tr>
                    ) : f.schedules.map((s, i) => (
                      <tr key={i} style={{borderTop: `1px solid ${BORDER}`}}>
                        <td style={tdStyle}>{s.form}</td>
                        <td style={tdStyle}>{s.schedule}</td>
                        <td style={tdStyle}>{s.effective_date}</td>
                        <td style={tdStyle}><button style={{...linkStyle, color: RED}} onClick={() => deleteSchedule(i)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{marginTop: 16}}>
                <button style={linkStyle} onClick={() => setEditingSchedule(false)}>Collapse</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: `1px solid ${BORDER}`,
        padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center",
        zIndex: 99501,
      }}>
        <button onClick={handleClose} style={{
          background: "none", border: "none", color: INK,
          fontWeight: 600, fontSize: 15, cursor: "pointer", padding: "10px 12px",
        }}>
          Cancel
        </button>
        <button onClick={save} disabled={saving} style={{
          padding: "11px 28px", borderRadius: 10, border: "none",
          background: saving ? "#9CA3AF" : BRAND, color: "#fff",
          fontWeight: 700, fontSize: 15, cursor: saving ? "default" : "pointer",
          boxShadow: saving ? "none" : "0 6px 14px -6px rgba(15,89,89,0.5)",
        }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Unsaved-changes guard — fires on X/Cancel when dirty */}
      <SaveChangesDialog
        open={showSaveDialog}
        bodyText={TAX_BODY}
        onClose={() => setShowSaveDialog(false)}
        onDontSave={() => { setShowSaveDialog(false); setDirty(false); onClose(); }}
        onSave={() => { setShowSaveDialog(false); save(); }}
      />

      {/* Verification modal — reused from Screen 2b. Stacks on top per §0.5. */}
      {showVerify && (
        <NovalaVerifyModal
          correctCode={DEMO_CODE}
          onClose={() => setShowVerify(false)}
          onVerified={handleVerified}
        />
      )}
    </div>
  );

  return ReactDOM.createPortal(node, document.body);
}
