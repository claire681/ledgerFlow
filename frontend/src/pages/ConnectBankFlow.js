import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || "";
const authHeaders = () => ({ Authorization: "Bearer " + getToken(), "Content-Type": "application/json" });

const C = {
  ink: "#0A1A1E", slate: "#12262B", slate800: "#1A2D32", slate700: "#2A3F45",
  text: "#1B2533", muted: "#5C6A7A", faint: "#8B97A8",
  line: "#E4E8EE", lineSoft: "#EEF1F5", surface: "#FAFBFC", surface2: "#F4F6F8",
  teal: "#15A08C", tealD: "#0F8474", tealInk: "#0B6B5C", tealSoft: "#EAF6F3",
  green: "#0D8050", greenSoft: "#E4F5EC",
  amber: "#9C5A0F", amberSoft: "#FBF1DD",
  red: "#B53B2E", redSoft: "#FBEDEC",
};
const FONT = "Inter, system-ui, sans-serif";

const COUNTRIES = [
  { code: "US", iso: "us", name: "United States" },
  { code: "CA", iso: "ca", name: "Canada" },
  { code: "GB", iso: "gb", name: "United Kingdom" },
  { code: "AU", iso: "au", name: "Australia" },
  { code: "NZ", iso: "nz", name: "New Zealand" },
  { code: "SG", iso: "sg", name: "Singapore" },
  { code: "JP", iso: "jp", name: "Japan" },
  { code: "DE", iso: "de", name: "Germany" },
  { code: "FR", iso: "fr", name: "France" },
  { code: "ZA", iso: "za", name: "South Africa" },
  { code: "OTHER", iso: "un", name: "Other country" },
];

const FIELDS_BY_COUNTRY = {
  CA: { help: "Find these on a cheque or in your online banking under direct deposit info.", fields: [
    { type: "row", children: [
      { key: "transit", label: "Transit number", placeholder: "00000", maxLength: 5, format: "5 digits", mono: true },
      { key: "institution", label: "Institution number", placeholder: "000", maxLength: 3, format: "3 digits", mono: true },
    ]},
    { key: "account", label: "Account number", placeholder: "0000000", type: "password", mono: true },
  ]},
  US: { help: "ABA routing number, also called the bank routing number.", fields: [
    { key: "routing", label: "Routing number", placeholder: "000000000", maxLength: 9, format: "9 digits", mono: true },
    { key: "account", label: "Account number", placeholder: "00000000", type: "password", mono: true },
  ]},
  GB: { help: "Sort code identifies your bank branch in the UK.", fields: [
    { key: "sort_code", label: "Sort code", placeholder: "00-00-00", maxLength: 8, format: "XX-XX-XX", mono: true },
    { key: "account", label: "Account number", placeholder: "00000000", maxLength: 8, format: "8 digits", type: "password", mono: true },
  ]},
  AU: { help: "Bank-State-Branch code, found on Australian bank statements.", fields: [
    { key: "bsb", label: "BSB number", placeholder: "000-000", maxLength: 7, format: "XXX-XXX", mono: true },
    { key: "account", label: "Account number", placeholder: "00000000", type: "password", mono: true },
  ]},
  NZ: { help: "New Zealand uses a single 15-16 digit format including bank, branch, and account.", fields: [
    { key: "account", label: "Bank account number", placeholder: "12-3456-7891011-00", maxLength: 18, format: "XX-XXXX-XXXXXXX-XX", mono: true },
  ]},
  SG: { help: "Singapore banks use a separate bank code and branch code.", fields: [
    { type: "row", children: [
      { key: "bank_code", label: "Bank code", placeholder: "0000", maxLength: 4, mono: true },
      { key: "branch_code", label: "Branch code", placeholder: "000", maxLength: 3, mono: true },
    ]},
    { key: "account", label: "Account number", placeholder: "Account number", type: "password", mono: true },
  ]},
  JP: { help: "Japanese banks distinguish between ordinary and checking accounts.", fields: [
    { type: "row", children: [
      { key: "bank_code", label: "Bank code", placeholder: "0000", maxLength: 4, format: "4 digits", mono: true },
      { key: "branch_code", label: "Branch code", placeholder: "000", maxLength: 3, format: "3 digits", mono: true },
    ]},
    { key: "account_type", label: "Account type", select: ["Ordinary", "Checking"] },
    { key: "account", label: "Account number", placeholder: "0000000", type: "password", mono: true },
  ]},
  DE: { help: "Germany uses IBAN and BIC for SEPA payments.", fields: [
    { key: "iban", label: "IBAN", placeholder: "DE00 0000 0000 0000 0000 00", format: "22 characters", mono: true },
    { key: "bic", label: "BIC / SWIFT", placeholder: "ABCDDEFFXXX", maxLength: 11, format: "8 or 11 characters", mono: true },
  ]},
  FR: { help: "France uses IBAN and BIC for SEPA payments.", fields: [
    { key: "iban", label: "IBAN", placeholder: "FR00 0000 0000 0000 0000 0000 000", format: "27 characters", mono: true },
    { key: "bic", label: "BIC / SWIFT", placeholder: "ABCDFRPPXXX", maxLength: 11, format: "8 or 11 characters", mono: true },
  ]},
  ZA: { help: "South African banks use a 6-digit branch code with the account number.", fields: [
    { key: "branch_code", label: "Branch code", placeholder: "000000", maxLength: 6, format: "6 digits", mono: true },
    { key: "account", label: "Account number", placeholder: "0000000000", type: "password", mono: true },
    { key: "account_type", label: "Account type", select: ["Cheque / Current", "Savings", "Transmission", "Bond"] },
  ]},
  OTHER: { help: "Enter whatever format your country's banks use. We will add native support for your country soon.", fields: [
    { key: "iban_or_account", label: "IBAN or account identifier", placeholder: "Enter your IBAN, SWIFT, or local format", mono: true },
    { key: "swift_bic", label: "SWIFT / BIC code (optional)", placeholder: "For international transfers", mono: true },
  ]},
};

// LocalStorage keys for draft data between steps
const DRAFT_KEY = "novala_bank_connect_draft";

function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); } catch (e) { return {}; }
}
function saveDraft(d) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch (e) {}
}
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }

// ============ MAIN ROUTER COMPONENT ============
export default function ConnectBankFlow() {
  const location = useLocation();
  const path = location.pathname;
  let step = 1;
  if (path.endsWith("/review")) step = 2;
  else if (path.endsWith("/submitted")) step = 3;
  else if (path.endsWith("/verify")) step = 4;

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: FONT, color: C.text }}>
      <TopBar />
      <ProgressStrip step={step} />
      {step === 1 && <Step1Details />}
      {step === 2 && <Step2Review />}
      {step === 3 && <Step3Submitted />}
      {step === 4 && <Step4Verify />}
    </div>
  );
}

// ============ TOP BAR ============
function TopBar() {
  const navigate = useNavigate();
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid " + C.line, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo512.png" alt="Novala" style={{ width: 26, height: 26, borderRadius: 5, background: "#fff", padding: 2, border: "1px solid " + C.line }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, letterSpacing: "-0.01em" }}>Novala</span>
        </div>
        <div style={{ width: 1, height: 22, background: C.line }} />
        <div style={{ fontSize: 13.5, fontWeight: 500, color: C.muted }}>
          <strong style={{ color: C.ink, fontWeight: 600 }}>Connect bank account</strong> · Payroll setup
        </div>
      </div>
      <button onClick={() => navigate("/payroll/settings/bank")} style={{ background: "#fff", color: C.text, border: "1px solid " + C.line, borderRadius: 6, padding: "7px 13px", fontWeight: 500, fontSize: 12.5, cursor: "pointer", fontFamily: FONT }}>
        Save & exit
      </button>
    </div>
  );
}

// ============ PROGRESS STRIP ============
function ProgressStrip({ step }) {
  const dot = (n, label, title) => {
    const done = step > n;
    const active = step === n;
    const bg = done ? C.green : active ? C.ink : "#fff";
    const border = done ? C.green : active ? C.ink : C.line;
    const color = (done || active) ? "#fff" : C.faint;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 11, flex: 1 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid " + border, background: bg, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600, color, flex: "0 0 28px" }}>
          {done ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> : n}
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: done ? C.green : active ? C.ink : C.faint, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: active ? C.ink : C.text }}>{title}</span>
        </div>
      </div>
    );
  };
  const line = (n) => (
    <div style={{ flex: "0 0 60px", height: 1.5, background: step > n ? C.green : C.line, margin: "0 4px" }} />
  );
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid " + C.line, padding: "20px 28px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
        {dot(1, "Step 1", "Bank details")}
        {line(1)}
        {dot(2, "Step 2", "Review")}
        {line(2)}
        {dot(3, "Step 3", "Verification")}
      </div>
    </div>
  );
}

// ============ TRUST SIDEBAR ============
function TrustSidebar({ variant = "default" }) {
  const items = variant === "verify" ? [
    { icon: "check", title: "You see the deposits, only you", desc: "Only the real account holder can see these test amounts. Entering them correctly proves you control this account." },
    { icon: "clock", title: "3 attempts to get it right", desc: "If you enter wrong amounts 3 times, the account is locked for security. You will need to restart verification." },
    { icon: "gift", title: "Test deposits stay with you", desc: "The two small deposits are yours to keep. Total under $2. They confirm ownership, not a charge." },
    { icon: "lock", title: "Encrypted submission", desc: "Amounts you enter are encrypted in transit and never logged in plain text." },
  ] : variant === "submitted" ? [
    { icon: "lock", title: "Encrypted everywhere", desc: "256-bit TLS in transit, AES-256 at rest. Industry-standard for financial software." },
    { icon: "check", title: "You authorize every pay run", desc: "Novala never moves money without your approval. You confirm each pay run." },
    { icon: "home", title: "Hosted on regulated infrastructure", desc: "AWS in Canada and US regions. Backups encrypted. Audit logs retained." },
  ] : [
    { icon: "lock", title: "Encrypted in transit and at rest", desc: "256-bit TLS during entry. AES-256 in our database. Industry-standard for financial software." },
    { icon: "check", title: "You authorize every pay run", desc: "Novala never moves money without your explicit approval. No background sweeps. No surprise debits." },
    { icon: "settings", title: "Micro-deposit verification", desc: "Two small test deposits confirm ownership before any payroll funds move. Takes 1 to 2 business days." },
    { icon: "home", title: "Hosted in Canada and the US", desc: "Your data lives on AWS infrastructure in regulated regions. Backups encrypted, audit logs retained." },
  ];

  const iconSvg = (kind) => {
    if (kind === "lock") return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    if (kind === "check") return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>;
    if (kind === "settings") return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>;
    if (kind === "home") return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
    if (kind === "clock") return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    if (kind === "gift") return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 12h18M12 8v13M8 8a3 3 0 0 1 0-6c2 0 4 4 4 6M16 8a3 3 0 0 0 0-6c-2 0-4 4-4 6"/></svg>;
    return null;
  };

  const heading = variant === "verify" ? { title: "Why this step matters", sub: "Confirming you own the account" }
                : variant === "submitted" ? { title: "Your data is protected", sub: "How Novala keeps banking info secure" }
                : { title: "Your data is protected", sub: "How Novala keeps banking info secure" };

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "22px 24px", position: "sticky", top: 106 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 18, borderBottom: "1px solid " + C.lineSoft, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: C.tealSoft, color: C.tealInk, display: "grid", placeItems: "center", flex: "0 0 38px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.ink, letterSpacing: "-0.005em", lineHeight: 1.3 }}>{heading.title}</h3>
            <p style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>{heading.sub}</p>
          </div>
        </div>
        {items.map((item, i) => (
          <div key={i} style={{ padding: "11px 0", display: "flex", alignItems: "flex-start", gap: 11, borderBottom: i === items.length - 1 ? "none" : "1px solid " + C.lineSoft, fontSize: 12.5, lineHeight: 1.5 }}>
            <div style={{ width: 24, height: 24, borderRadius: 5, background: C.surface2, color: C.slate700, display: "grid", placeItems: "center", flex: "0 0 24px", border: "1px solid " + C.line, marginTop: 1 }}>
              {iconSvg(item.icon)}
            </div>
            <div>
              <strong style={{ display: "block", color: C.ink, fontWeight: 600, fontSize: 12.5, marginBottom: 3, letterSpacing: "-0.005em" }}>{item.title}</strong>
              <span style={{ color: C.muted, fontSize: 11.5, lineHeight: 1.55 }}>{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ STEP 1: BANK DETAILS ============
function Step1Details() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => {
    const d = loadDraft();
    return {
      country: d.country || "CA",
      bank_name: d.bank_name || "",
      account_holder: d.account_holder || "",
      fields: d.fields || {},
    };
  });
  const [countryOpen, setCountryOpen] = useState(false);

  const cfg = FIELDS_BY_COUNTRY[draft.country] || FIELDS_BY_COUNTRY.OTHER;
  const c = COUNTRIES.find(x => x.code === draft.country) || COUNTRIES[1];

  const setField = (k, v) => setDraft(d => ({ ...d, fields: { ...d.fields, [k]: v } }));

  const canContinue = draft.bank_name.trim() && draft.account_holder.trim() &&
    cfg.fields.some(f => f.type === "row" ? f.children.every(c => draft.fields[c.key]) : draft.fields[f.key]);

  const onContinue = () => {
    saveDraft(draft);
    navigate("/payroll/bank/connect/review");
  };

  const inputStyle = { width: "100%", fontFamily: FONT, fontSize: 14, color: C.ink, padding: "11px 14px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none" };
  const monoStyle = { ...inputStyle, fontFamily: "JetBrains Mono, monospace", fontVariantNumeric: "tabular-nums", letterSpacing: "0.03em" };

  const renderField = (f) => {
    if (f.type === "row") {
      return (
        <div key={f.children.map(c=>c.key).join("-")} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          {f.children.map(renderField)}
        </div>
      );
    }
    if (f.select) {
      return (
        <div key={f.key} style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, display: "block", marginBottom: 6 }}>{f.label}</label>
          <select value={draft.fields[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} style={inputStyle}>
            <option value="">Select...</option>
            {f.select.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div key={f.key} style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          {f.label}
          {f.format && <span style={{ fontSize: 10.5, color: C.faint, fontFamily: "JetBrains Mono, monospace", background: C.surface2, padding: "2px 6px", borderRadius: 4, fontWeight: 500, letterSpacing: "0.02em" }}>{f.format}</span>}
        </label>
        <input type={f.type || "text"} value={draft.fields[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder || ""} maxLength={f.maxLength} style={f.mono ? monoStyle : inputStyle} />
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 28px 60px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 36 }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: C.ink, letterSpacing: "-0.018em", marginBottom: 6 }}>Connect your business bank account</h1>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 32, maxWidth: 560 }}>This is the account Novala will draw from when you run payroll. We use the same encryption standards as your bank, and your data is never shared.</p>

        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "28px 32px", marginBottom: 18 }}>
          {/* Country */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid " + C.lineSoft }}>Location</div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 6, display: "block" }}>Country where the bank operates</label>
            <button onClick={() => setCountryOpen(!countryOpen)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", cursor: "pointer", fontFamily: FONT, width: "100%", textAlign: "left" }}>
              <img src={"https://flagcdn.com/w40/" + c.iso + ".png"} alt="" style={{ width: 26, height: 19, borderRadius: 3, objectFit: "cover" }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: C.ink, flex: 1 }}>{c.name}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: C.muted, transform: countryOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.18s" }}><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {countryOpen && (
              <div style={{ marginTop: 6, maxHeight: 320, overflowY: "auto", border: "1px solid " + C.line, borderRadius: 6 }}>
                {COUNTRIES.map(cc => (
                  <div key={cc.code} onClick={() => { setDraft(d => ({ ...d, country: cc.code, fields: {} })); setCountryOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", cursor: "pointer", fontSize: 13.5, color: cc.code === draft.country ? C.tealInk : C.ink, fontWeight: cc.code === draft.country ? 600 : 500, borderBottom: "1px solid " + C.lineSoft, background: cc.code === draft.country ? C.tealSoft : "#fff" }}>
                    <img src={"https://flagcdn.com/w40/" + cc.iso + ".png"} alt="" style={{ width: 24, height: 17, borderRadius: 2, objectFit: "cover" }} />
                    <span>{cc.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account holder */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid " + C.lineSoft }}>Account holder</div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, display: "block", marginBottom: 6 }}>Bank name</label>
              <input value={draft.bank_name} onChange={(e) => setDraft(d => ({ ...d, bank_name: e.target.value }))} placeholder="For example, Royal Bank of Canada" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, display: "block", marginBottom: 6 }}>Legal account holder name</label>
              <input value={draft.account_holder} onChange={(e) => setDraft(d => ({ ...d, account_holder: e.target.value }))} placeholder="Your registered business name" style={inputStyle} />
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>Must match the name registered with your bank. Used to verify ownership.</div>
            </div>
          </div>

          {/* Country-specific fields */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid " + C.lineSoft }}>Account identifiers</div>
            {cfg.fields.map(renderField)}
            {cfg.help && <div style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.5, fontStyle: "italic" }}>{cfg.help}</div>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 24 }}>
          <button onClick={() => { clearDraft(); navigate("/payroll/settings/bank"); }} style={{ background: "#fff", color: C.text, border: "1px solid " + C.line, borderRadius: 6, padding: "10px 18px", fontWeight: 500, fontSize: 13.5, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 7 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6"/></svg>
            Cancel
          </button>
          <button onClick={onContinue} disabled={!canContinue} style={{ background: canContinue ? C.ink : C.line, color: canContinue ? "#fff" : C.faint, border: "none", borderRadius: 6, padding: "10px 22px", fontWeight: 500, fontSize: 13.5, cursor: canContinue ? "pointer" : "not-allowed", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 7 }}>
            Continue to review
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>

      <TrustSidebar variant="default" />
    </div>
  );
}

// ============ STEP 2: REVIEW ============
function Step2Review() {
  const navigate = useNavigate();
  const [draft] = useState(() => loadDraft());
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Guard: if no draft, send back to step 1
  useEffect(() => {
    if (!draft.country) navigate("/payroll/bank/connect");
  }, []);

  const c = COUNTRIES.find(x => x.code === draft.country) || COUNTRIES[1];
  const cfg = FIELDS_BY_COUNTRY[draft.country] || FIELDS_BY_COUNTRY.OTHER;

  // Build review rows from country fields
  const reviewRows = [];
  reviewRows.push({ label: "Country", value: <><img src={"https://flagcdn.com/w40/" + c.iso + ".png"} alt="" style={{ width: 18, height: 13, borderRadius: 2, display: "inline-block", verticalAlign: "-2px", marginRight: 7 }} />{c.name}</> });
  reviewRows.push({ label: "Bank name", value: draft.bank_name });
  reviewRows.push({ label: "Account holder", value: draft.account_holder });

  const flatFields = [];
  cfg.fields.forEach(f => {
    if (f.type === "row") f.children.forEach(c => flatFields.push(c));
    else flatFields.push(f);
  });

  flatFields.forEach(f => {
    let v = draft.fields[f.key] || "";
    let mono = f.mono;
    let masked = false;
    if (f.type === "password" && v) {
      v = "•••• •••• " + v.slice(-4);
      masked = true;
    }
    reviewRows.push({ label: f.label, value: v, mono, masked });
  });

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      // Pack into bank_details JSONB
      const accountLast4 = (draft.fields.account || draft.fields.iban_or_account || "").slice(-4);
      const payload = {
        company_bank_name: draft.bank_name,
        bank_details: {
          country: draft.country,
          account_holder: draft.account_holder,
          fields: draft.fields,
          account_last4: accountLast4,
          verification: {
            status: "verifying",
            attempts_used: 0,
            submitted_at: new Date().toISOString(),
          },
        },
      };
      const res = await fetch(API_URL + "/api/v1/payroll/settings", {
        method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Don't clear draft yet; Step 3 reads from it for confirmation display
        navigate("/payroll/bank/connect/submitted");
      } else {
        const err = await res.text();
        alert("Submission failed: " + err);
      }
    } catch (e) { alert("Submission failed: " + e.message); }
    setSubmitting(false);
  };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 28px 60px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 36 }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: C.ink, letterSpacing: "-0.018em", marginBottom: 6 }}>Review your bank details</h1>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 32, maxWidth: 560 }}>Check everything carefully before we send a verification request to your bank. You can still go back to edit any field.</p>

        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "28px 32px", marginBottom: 18 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid " + C.lineSoft, display: "flex", justifyContent: "space-between" }}>
              <span>Bank account</span>
              <span onClick={() => navigate("/payroll/bank/connect")} style={{ fontSize: 11.5, fontWeight: 500, color: C.tealInk, cursor: "pointer", textTransform: "none", letterSpacing: 0 }}>Edit ›</span>
            </div>
            {reviewRows.map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 18, padding: "10px 0", borderBottom: i === reviewRows.length - 1 ? "none" : "1px solid " + C.lineSoft }}>
                <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500 }}>{r.label}</div>
                <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500, letterSpacing: "-0.005em", fontFamily: (r.mono || r.masked) ? "JetBrains Mono, monospace" : FONT, fontVariantNumeric: r.mono ? "tabular-nums" : undefined, letterSpacing: r.masked ? "0.04em" : "-0.005em" }}>{r.value}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid " + C.lineSoft }}>Authorization</div>
            <div style={{ background: C.surface2, border: "1px solid " + C.line, borderRadius: 8, padding: "18px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 10, letterSpacing: "-0.005em" }}>Permission to verify and debit</div>
              <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>By connecting this account, you authorize Novala to make small test deposits for verification and to debit this account for each payroll run that you approve. You can revoke this permission at any time by disconnecting the account.</div>

              {[
                { state: check1, set: setCheck1, text: "I confirm I am an authorized signer on this account and that the details above are correct." },
                { state: check2, set: setCheck2, text: <>I agree to the <a href="#" style={{ color: C.tealInk, fontWeight: 500, textDecoration: "none" }}>Bank Account Authorization Agreement</a> and Novala's <a href="#" style={{ color: C.tealInk, fontWeight: 500, textDecoration: "none" }}>Terms of Service</a>.</> },
              ].map((cb, i) => (
                <div key={i} onClick={() => cb.set(!cb.state)} style={{ display: "flex", alignItems: "flex-start", gap: 11, cursor: "pointer", fontSize: 12.5, color: C.text, lineHeight: 1.55, padding: "8px 0" }}>
                  <div style={{ width: 16, height: 16, border: "1.5px solid " + (cb.state ? C.ink : C.line), borderRadius: 4, background: cb.state ? C.ink : "#fff", display: "grid", placeItems: "center", flex: "0 0 16px", marginTop: 1, color: "#fff" }}>
                    {cb.state && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  <span>{cb.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 24 }}>
          <button onClick={() => navigate("/payroll/bank/connect")} style={{ background: "#fff", color: C.text, border: "1px solid " + C.line, borderRadius: 6, padding: "10px 18px", fontWeight: 500, fontSize: 13.5, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 7 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6"/></svg>
            Back to bank details
          </button>
          <button onClick={onSubmit} disabled={!check1 || !check2 || submitting} style={{ background: (check1 && check2 && !submitting) ? C.ink : C.line, color: (check1 && check2 && !submitting) ? "#fff" : C.faint, border: "none", borderRadius: 6, padding: "10px 22px", fontWeight: 500, fontSize: 13.5, cursor: (check1 && check2 && !submitting) ? "pointer" : "not-allowed", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 7 }}>
            {submitting ? "Connecting..." : "Connect and verify"}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>

      <TrustSidebar variant="default" />
    </div>
  );
}

// ============ STEP 3: SUBMITTED ============
function Step3Submitted() {
  const navigate = useNavigate();
  const [draft] = useState(() => loadDraft());
  const c = COUNTRIES.find(x => x.code === draft.country) || COUNTRIES[1];
  const last4 = (draft.fields && (draft.fields.account || draft.fields.iban_or_account) || "").slice(-4);

  // Compact account chip data
  const fields = draft.fields || {};
  let chipInfo = "";
  if (draft.country === "CA") chipInfo = `${fields.transit || ""} · ${fields.institution || ""} · ••${last4}`;
  else if (draft.country === "US") chipInfo = `${fields.routing || ""} · ••${last4}`;
  else if (draft.country === "GB") chipInfo = `${fields.sort_code || ""} · ••${last4}`;
  else if (draft.country === "AU") chipInfo = `${fields.bsb || ""} · ••${last4}`;
  else chipInfo = `••${last4}`;

  const onDone = () => {
    clearDraft();
    navigate("/payroll/settings/bank");
  };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 28px 60px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 36 }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: C.ink, letterSpacing: "-0.018em", marginBottom: 6 }}>Verification underway</h1>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 28, maxWidth: 560 }}>Your bank account has been securely connected. We're now confirming ownership before any payroll funds move.</p>

        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "40px 36px", marginBottom: 18, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: C.greenSoft, color: C.green, display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: C.ink, letterSpacing: "-0.018em", marginBottom: 8 }}>Bank account submitted for verification</h2>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 480, margin: "0 auto 20px" }}>Two small test deposits (under $1 each) will appear in your account within 1 to 2 business days. We'll let you know when verification is complete.</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 11, padding: "10px 16px", background: C.surface2, border: "1px solid " + C.line, borderRadius: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "#fff", color: C.slate800, display: "grid", placeItems: "center", border: "1px solid " + C.line, flex: "0 0 30px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 10l9-6 9 6"/><path d="M3 10h18"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9"/><path d="M3 21h18"/></svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{draft.bank_name || "Your bank"}</div>
              <div style={{ fontSize: 11.5, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginTop: 1 }}>{chipInfo}</div>
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "24px 28px", marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 18 }}>What happens next</h3>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 13, top: 14, bottom: 14, width: 1.5, background: C.line }} />
            {[
              { state: "done", title: "Account details submitted", desc: "Your bank info was encrypted and sent for verification.", time: "Just now" },
              { state: "now", title: "Test deposits sent", desc: "Two small deposits (under $1 each) are being processed. They will appear in your account within 1 to 2 business days.", time: "1 to 2 business days" },
              { state: "future", n: 3, title: "Confirm the deposit amounts", desc: "Once they land, come back here and enter the two amounts to confirm you own the account." },
              { state: "future", n: 4, title: "Ready for payroll", desc: "Once verified, your account is connected and you can run payroll with direct deposit." },
            ].map((item, i) => {
              const isDone = item.state === "done";
              const isNow = item.state === "now";
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "8px 0 16px", position: "relative" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: isDone ? C.green : isNow ? C.ink : "#fff", border: "1.5px solid " + (isDone ? C.green : isNow ? C.ink : C.line), display: "grid", placeItems: "center", flex: "0 0 28px", zIndex: 1, color: (isDone || isNow) ? "#fff" : C.faint, boxShadow: isNow ? "0 0 0 4px rgba(10,26,30,.08)" : "none" }}>
                    {isDone ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                     : isNow ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                     : item.n}
                  </div>
                  <div style={{ flex: 1, paddingTop: 3 }}>
                    <div style={{ fontSize: 13.5, fontWeight: (isDone || isNow) ? 600 : 500, color: (isDone || isNow) ? C.ink : C.muted, marginBottom: 3, letterSpacing: "-0.005em" }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{item.desc}</div>
                    {item.time && <span style={{ fontSize: 11, fontWeight: 500, color: isNow ? C.ink : C.faint, fontVariantNumeric: "tabular-nums", marginTop: 4, display: "inline-block" }}>{item.time}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: C.tealSoft, border: "1px solid #C9E5DD", borderRadius: 10, padding: "20px 24px", marginBottom: 18, display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fff", color: C.tealInk, display: "grid", placeItems: "center", flex: "0 0 36px", border: "1px solid #C9E5DD" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: 13.5, fontWeight: 600, color: C.tealInk, marginBottom: 4 }}>We'll email you when the deposits arrive</h4>
            <p style={{ fontSize: 12.5, color: C.tealInk, opacity: 0.85, lineHeight: 1.55 }}>No need to check back. We'll send a confirmation to your account email so you know when to finish verifying.</p>
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: C.faint, lineHeight: 1.5, fontStyle: "italic", textAlign: "center", marginTop: 4, marginBottom: 24 }}>
          Bank verification is currently in preview. Real bank transfers are launching with our payment partner soon.
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <button onClick={() => navigate("/payroll/settings/bank")} style={{ background: "#fff", color: C.text, border: "1px solid " + C.line, borderRadius: 6, padding: "10px 18px", fontWeight: 500, fontSize: 13.5, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 7 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6"/></svg>
            Back to Payroll Settings
          </button>
          <button onClick={onDone} style={{ background: C.ink, color: "#fff", border: "none", borderRadius: 6, padding: "10px 22px", fontWeight: 500, fontSize: 13.5, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 7 }}>
            Done for now
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>

      <TrustSidebar variant="submitted" />
    </div>
  );
}

// ============ STEP 4: VERIFY DEPOSITS ============
function Step4Verify() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [amount1, setAmount1] = useState("");
  const [amount2, setAmount2] = useState("");
  const [error, setError] = useState(null);
  const [locked, setLocked] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetch(API_URL + "/api/v1/payroll/settings", { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setSettings(d);
          const bd = d.bank_details || {};
          const v = bd.verification || {};
          setAttemptsUsed(v.attempts_used || 0);
          setLocked(v.status === "locked");
        }
      })
      .catch(() => {});
  }, []);

  const formatAmount = (val, setter) => {
    let v = val.replace(/[^\d.]/g, "");
    const parts = v.split(".");
    if (parts.length > 2) v = parts[0] + "." + parts[1];
    if (parts[1] && parts[1].length > 2) v = parts[0] + "." + parts[1].slice(0, 2);
    if (v.length > 4) v = v.slice(0, 4);
    setter(v);
  };

  const onVerify = async () => {
    setVerifying(true);
    setError(null);
    // Stub verification - in real flow this would compare to deposits sent
    // For now we accept any two positive amounts < $1.00
    const a1 = parseFloat(amount1);
    const a2 = parseFloat(amount2);
    if (a1 > 0 && a1 < 1 && a2 > 0 && a2 < 1) {
      // Mark as verified
      const bd = settings.bank_details || {};
      const payload = {
        bank_details: {
          ...bd,
          verification: {
            ...(bd.verification || {}),
            status: "verified",
            verified_at: new Date().toISOString(),
            attempts_used: attemptsUsed,
          },
        },
      };
      try {
        const res = await fetch(API_URL + "/api/v1/payroll/settings", {
          method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
        });
        if (res.ok) {
          clearDraft();
          navigate("/payroll/settings/bank");
        } else { alert("Verification save failed"); }
      } catch (e) { alert("Verification save failed: " + e.message); }
    } else {
      const newAttempts = attemptsUsed + 1;
      setAttemptsUsed(newAttempts);
      setError(newAttempts >= 3
        ? "Verification locked. You have used all 3 attempts. Restart verification with a new bank connection."
        : "Those amounts don't match. Check your bank statement and try again. You have " + (3 - newAttempts) + " attempt" + ((3 - newAttempts) === 1 ? "" : "s") + " remaining.");
      if (newAttempts >= 3) setLocked(true);

      // Persist attempt count to backend
      const bd = settings.bank_details || {};
      const payload = {
        bank_details: {
          ...bd,
          verification: {
            ...(bd.verification || {}),
            status: newAttempts >= 3 ? "locked" : "verifying",
            attempts_used: newAttempts,
          },
        },
      };
      try {
        await fetch(API_URL + "/api/v1/payroll/settings", {
          method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
        });
      } catch (e) {}
    }
    setVerifying(false);
  };

  if (!settings) return <div style={{ padding: 32, color: C.muted }}>Loading...</div>;

  const bd = settings.bank_details || {};
  const country = bd.country || "CA";
  const c = COUNTRIES.find(x => x.code === country) || COUNTRIES[1];
  const last4 = bd.account_last4 || "";
  const fields = bd.fields || {};
  let chipInfo = "";
  if (country === "CA") chipInfo = `${fields.transit || ""} · ${fields.institution || ""} · ••${last4}`;
  else if (country === "US") chipInfo = `${fields.routing || ""} · ••${last4}`;
  else chipInfo = `••${last4}`;

  const canVerify = !locked && amount1.trim() && amount2.trim() && parseFloat(amount1) > 0 && parseFloat(amount2) > 0;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 28px 60px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 36 }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: C.ink, letterSpacing: "-0.018em", marginBottom: 6 }}>Confirm the deposit amounts</h1>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 28, maxWidth: 560 }}>Your two test deposits have arrived. Open your bank statement, find the deposits from <strong style={{ color: C.ink }}>NOVALA VERIFY</strong>, and enter both amounts below to confirm you own this account.</p>

        <div style={{ background: C.surface2, border: "1px solid " + C.line, borderRadius: 8, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: "#fff", color: C.slate800, display: "grid", placeItems: "center", border: "1px solid " + C.line, flex: "0 0 32px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 10l9-6 9 6"/><path d="M3 10h18"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9"/><path d="M3 21h18"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, letterSpacing: "-0.005em" }}>{settings.company_bank_name || "Your bank"}</div>
            <div style={{ fontSize: 11.5, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginTop: 1 }}>{chipInfo}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: locked ? C.red : C.amber, background: locked ? C.redSoft : C.amberSoft, padding: "3px 8px", borderRadius: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {locked ? "Locked" : "Awaiting verification"}
          </span>
        </div>

        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "28px 32px", marginBottom: 18 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid " + C.lineSoft }}>How to find the deposits</div>
            <div style={{ background: C.tealSoft, border: "1px solid #C9E5DD", borderRadius: 8, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10, color: C.tealInk, fontSize: 12.5, fontWeight: 600 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                Where to look in your bank statement
              </div>
              <ol style={{ margin: 0, padding: "0 0 0 22px", fontSize: 12.5, color: C.tealInk, lineHeight: 1.7 }}>
                <li>Sign in to your <strong>{settings.company_bank_name || "bank"}</strong> online banking or app</li>
                <li>Open the account ending in <strong style={{ fontFamily: "JetBrains Mono, monospace" }}>••{last4}</strong></li>
                <li>Look for two small deposits (under $1.00 each) from this source:</li>
              </ol>
              <div style={{ marginTop: 8, paddingLeft: 22 }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", background: "#fff", padding: "2px 7px", borderRadius: 4, fontSize: 11.5, fontWeight: 500, color: C.ink, border: "1px solid #C9E5DD", display: "inline-block" }}>NOVALA VERIFY</span>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid " + C.lineSoft }}>Enter the two amounts</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { value: amount1, set: setAmount1, label: "Amount of first deposit", help: "Example: 0.12 or 0.47" },
                { value: amount2, set: setAmount2, label: "Amount of second deposit", help: "Order doesn't matter" },
              ].map((f, i) => (
                <div key={i}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 8, display: "block" }}>{f.label}</label>
                  <div style={{ display: "flex", alignItems: "stretch", border: "1.5px solid " + (error && !locked ? C.red : C.line), borderRadius: 8, background: "#fff", overflow: "hidden" }}>
                    <div style={{ padding: "0 14px 0 16px", fontSize: 18, fontWeight: 600, color: C.muted, fontFamily: "JetBrains Mono, monospace", borderRight: "1px solid " + C.line, display: "flex", alignItems: "center" }}>$</div>
                    <input value={f.value} onChange={(e) => formatAmount(e.target.value, f.set)} placeholder="0.00" maxLength={4} inputMode="decimal" disabled={locked}
                      style={{ flex: 1, border: "none", outline: "none", padding: "14px 14px", fontSize: 22, fontWeight: 600, color: C.ink, fontFamily: "JetBrains Mono, monospace", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em", background: "transparent", width: "100%", opacity: locked ? 0.5 : 1 }}
                    />
                  </div>
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>{f.help}</div>
                </div>
              ))}
            </div>

            {error && !locked && (
              <div style={{ marginTop: 12, fontSize: 11.5, color: C.red, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 17h.01"/></svg>
                {error}
              </div>
            )}

            {locked && (
              <div style={{ marginTop: 14, padding: "12px 14px", background: C.redSoft, borderRadius: 6, display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: "0 0 13px", marginTop: 2, color: C.red }}><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 17h.01"/></svg>
                <span style={{ flex: 1, color: C.red, fontSize: 12.5 }}>
                  <strong style={{ fontWeight: 600, display: "block", marginBottom: 2 }}>Verification locked</strong>
                  You've used all 3 attempts. To protect your account, restart verification with a new bank connection. <span onClick={() => navigate("/payroll/bank/connect")} style={{ color: C.red, textDecoration: "underline", cursor: "pointer", fontWeight: 500 }}>Start over</span>
                </span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, padding: "10px 14px", background: C.surface2, borderRadius: 6, fontSize: 12 }}>
              <span style={{ color: C.muted }}>Verification attempts</span>
              <span style={{ color: C.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{attemptsUsed} of 3 used</span>
            </div>

            <div style={{ marginTop: 20, padding: "14px 16px", background: "#fff", border: "1px dashed " + C.line, borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 11, fontSize: 12.5, lineHeight: 1.55 }}>
              <div style={{ width: 24, height: 24, borderRadius: 5, background: C.surface2, color: C.slate700, display: "grid", placeItems: "center", border: "1px solid " + C.line, flex: "0 0 24px", marginTop: 1 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 17h.01"/></svg>
              </div>
              <div style={{ flex: 1, color: C.muted }}>
                <strong style={{ color: C.ink, fontWeight: 600, display: "block", marginBottom: 2 }}>Don't see the deposits yet?</strong>
                They can take up to 2 business days to appear. <a href="#" style={{ color: C.tealInk, fontWeight: 500 }}>Resend deposits</a> if it's been longer, or <a href="#" style={{ color: C.tealInk, fontWeight: 500 }}>contact support</a>.
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <button onClick={() => navigate("/payroll/settings/bank")} style={{ background: "#fff", color: C.text, border: "1px solid " + C.line, borderRadius: 6, padding: "10px 18px", fontWeight: 500, fontSize: 13.5, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 7 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6"/></svg>
            Back to Payroll Settings
          </button>
          <button onClick={onVerify} disabled={!canVerify || verifying} style={{ background: canVerify ? C.ink : C.line, color: canVerify ? "#fff" : C.faint, border: "none", borderRadius: 6, padding: "10px 22px", fontWeight: 500, fontSize: 13.5, cursor: canVerify ? "pointer" : "not-allowed", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 7 }}>
            {verifying ? "Verifying..." : "Verify and finish"}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>

      <TrustSidebar variant="verify" />
    </div>
  );
}
