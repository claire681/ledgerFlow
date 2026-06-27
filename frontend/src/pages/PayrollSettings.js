import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, Building2, Calendar, FileText, Landmark,
  Plus, MapPin, CheckCircle2, AlertTriangle,
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || "";
const authHeaders = () => ({ Authorization: "Bearer " + getToken(), "Content-Type": "application/json" });

const C = {
  ink: "#0A1A1E", slate: "#12262B", text: "#1B2533", muted: "#5C6A7A", faint: "#8B97A8",
  line: "#E4E8EE", lineSoft: "#EEF1F5", surface: "#FAFBFC",
  teal: "#15A08C", tealD: "#0F8474", tealInk: "#0B6B5C", tealSoft: "#EAF6F3",
  green: "#0D8050", greenSoft: "#E4F5EC", amber: "#9C5A0F", amberSoft: "#FBF1DD",
};
const FONT = "Inter, system-ui, sans-serif";

const COUNTRIES = [
  { iso: "us", name: "United States", currency: "USD" },
  { iso: "ca", name: "Canada", currency: "CAD" },
  { iso: "gb", name: "United Kingdom", currency: "GBP" },
  { iso: "au", name: "Australia", currency: "AUD" },
  { iso: "nz", name: "New Zealand", currency: "NZD" },
  { iso: "sg", name: "Singapore", currency: "SGD" },
  { iso: "jp", name: "Japan", currency: "JPY" },
  { iso: "de", name: "Germany", currency: "EUR" },
  { iso: "fr", name: "France", currency: "EUR" },
  { iso: "za", name: "South Africa", currency: "ZAR" },
];

const SECTIONS = [
  { id: "company", group: "Setup", label: "Company details", Icon: Building2 },
  { id: "schedule", group: "Setup", label: "Pay schedule", Icon: Calendar },
  { id: "tax", group: "Setup", label: "Tax registration", Icon: FileText },
  { id: "bank", group: "Setup", label: "Bank account", Icon: Landmark, comingSoon: true },
  { id: "items", group: "Payroll items", label: "Pay types & deductions", Icon: Plus, comingSoon: true },
  { id: "locations", group: "Payroll items", label: "Work locations", Icon: MapPin, comingSoon: true },
  { id: "review", group: "Final step", label: "Review & authorize", Icon: CheckCircle2, comingSoon: true },
];

export default function PayrollSettings() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeId = SECTIONS.find(s => s.id === section)?.id || "company";
  // Lifted country state shared between Company details and Tax registration
  const [businessCountry, setBusinessCountry] = useState("ca");

  const grouped = {};
  SECTIONS.forEach(s => { (grouped[s.group] = grouped[s.group] || []).push(s); });

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: FONT, color: C.text }}>
      {/* Top bar */}
      <div style={{ padding: "24px 32px 16px", borderBottom: "1px solid " + C.lineSoft, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted, marginBottom: 10 }}>
          <span onClick={() => navigate("/payroll/overview")} style={{ color: C.tealInk, cursor: "pointer", fontWeight: 500 }}>Payroll</span>
          <ChevronRight size={11} style={{ color: C.faint }} />
          <span>Settings</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: "-0.018em" }}>Payroll settings</h1>
      </div>

      {/* Two-pane layout */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
        {/* Section nav */}
        <div style={{ width: 240, flex: "0 0 240px", background: "#fff", borderRight: "1px solid " + C.line, padding: "18px 12px", overflowY: "auto" }}>
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", padding: "0 10px", marginBottom: 6 }}>{group}</div>
              {items.map(s => {
                const Icon = s.Icon;
                const isActive = s.id === activeId;
                return (
                  <div key={s.id} onClick={() => navigate("/payroll/settings/" + s.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", fontSize: 13, color: isActive ? C.tealInk : C.text, fontWeight: isActive ? 600 : 500, borderRadius: 6, cursor: "pointer", marginBottom: 1, position: "relative", background: isActive ? C.tealSoft : "transparent" }}>
                    {isActive && <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: "0 2px 2px 0", background: C.teal }}></span>}
                    <Icon size={14} style={{ flex: "0 0 14px", color: isActive ? C.tealInk : C.faint }} />
                    <span style={{ flex: 1 }}>{s.label}</span>
                    {s.comingSoon && <span style={{ fontSize: 9.5, fontWeight: 700, color: C.amber, background: C.amberSoft, padding: "1px 6px", borderRadius: 4, letterSpacing: "0.04em" }}>SOON</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px 60px", minWidth: 0, background: C.surface }}>
          {activeId === "company" && <CompanyDetailsSection businessCountry={businessCountry} setBusinessCountry={setBusinessCountry} />}
          {activeId === "schedule" && <PayScheduleSection />}
          {activeId === "tax" && <TaxRegistrationSection businessCountry={businessCountry} />}
          {(activeId === "bank" || activeId === "items" || activeId === "locations" || activeId === "review") && <ComingSoonSection title={SECTIONS.find(s => s.id === activeId)?.label} />}
        </div>
      </div>
    </div>
  );
}

// =============== SECTION COMPONENTS ===============

function SectionHead({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: "-0.015em", marginBottom: 4 }}>{title}</h2>
      <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.55, maxWidth: 560 }}>{subtitle}</p>
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.ink, display: "block", marginBottom: 5 }}>{label}</label>
      {children}
      {help && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 5, lineHeight: 1.5 }}>{help}</div>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", maxLength }) {
  return (
    <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
      style={{ width: "100%", fontFamily: FONT, fontSize: 13.5, color: C.ink, padding: "9px 12px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none" }}
      onFocus={(e) => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = "0 0 0 3px " + C.tealSoft; }}
      onBlur={(e) => { e.target.style.borderColor = C.line; e.target.style.boxShadow = "none"; }}
    />
  );
}

function SelectInput({ value, onChange, children }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", fontFamily: FONT, fontSize: 13.5, color: C.ink, padding: "9px 12px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none", cursor: "pointer" }}>
      {children}
    </select>
  );
}

function CardSection({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid " + C.lineSoft }}>{label}</div>
      {children}
    </div>
  );
}

function SaveBar({ dirty, saving, onSave, onDiscard, label = "Save" }) {
  return (
    <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid " + C.line, padding: "14px 26px", margin: "24px -26px -24px", borderRadius: "0 0 10px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
      <span style={{ fontSize: 12.5, color: dirty ? C.amber : C.muted }}>
        {saving ? "Saving..." : dirty ? "You have unsaved changes" : "All changes saved"}
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onDiscard} disabled={!dirty || saving} style={{ background: "#fff", color: dirty ? C.text : C.faint, border: "1px solid " + C.line, borderRadius: 6, padding: "8px 16px", fontWeight: 500, fontSize: 13, cursor: dirty ? "pointer" : "not-allowed", fontFamily: FONT }}>Discard</button>
        <button onClick={onSave} disabled={!dirty || saving} style={{ background: dirty ? C.teal : C.line, color: dirty ? "#fff" : C.faint, border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 500, fontSize: 13, cursor: dirty && !saving ? "pointer" : "not-allowed", fontFamily: FONT }}>
          {saving ? "Saving..." : label}
        </button>
      </div>
    </div>
  );
}

// === Company details section ===
function CompanyDetailsSection({ businessCountry, setBusinessCountry }) {
  const [data, setData] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(API_URL + "/api/v1/company/profile", { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          const initial = {
            company_name: d.company_name || "",
            address: d.address || "",
            country: (d.country || "US").toLowerCase(),
            province_state: d.province_state || "",
            currency: d.currency || "USD",
            fiscal_year_start: d.fiscal_year_start || 1,
            phone: d.phone || "",
            industry: d.industry || "",
            website: d.website || "",
          };
          setData(initial); setOriginal(initial);
          setBusinessCountry(initial.country);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const dirty = JSON.stringify(data) !== JSON.stringify(original);

  const onSave = async () => {
    setSaving(true);
    try {
      // Backend expects country uppercase (e.g. "CA") and accepts only fields on CompanyProfile
      const payload = {
        company_name: data.company_name,
        address: data.address,
        country: (data.country || "").toUpperCase(),
        province_state: data.province_state,
        currency: data.currency,
        fiscal_year_start: parseInt(data.fiscal_year_start) || 1,
        phone: data.phone,
        industry: data.industry,
        website: data.website,
      };
      const res = await fetch(API_URL + "/api/v1/company/profile", {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        const refreshed = {
          company_name: updated.company_name || "",
          address: updated.address || "",
          country: (updated.country || "US").toLowerCase(),
          province_state: updated.province_state || "",
          currency: updated.currency || "USD",
          fiscal_year_start: updated.fiscal_year_start || 1,
          phone: updated.phone || "",
          industry: updated.industry || "",
          website: updated.website || "",
        };
        setData(refreshed);
        setOriginal(refreshed);
        setBusinessCountry(refreshed.country);
      } else {
        const err = await res.text();
        alert("Save failed: " + err);
      }
    } catch (e) { alert("Save failed: " + e.message); }
    setSaving(false);
  };
  const onDiscard = () => setData(original);
  const set = (k, v) => setData(s => ({ ...s, [k]: v }));

  if (loading) return <div style={{ color: C.muted, fontSize: 13 }}>Loading...</div>;

  const country = COUNTRIES.find(c => c.iso === (data.country || "").toLowerCase()) || COUNTRIES[1];

  return (
    <>
      <SectionHead title="Company details" subtitle="Your registered business information. Novala uses this across payroll, tax filings, and on every paycheque." />
      <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "24px 26px" }}>
        <CardSection label="Business">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <Field label="Company name">
              <TextInput value={data.company_name} onChange={v => set("company_name", v)} placeholder="Your registered business name" />
            </Field>
            <Field label="Industry">
              <TextInput value={data.industry} onChange={v => set("industry", v)} placeholder="What industry you operate in" />
            </Field>
          </div>
          <Field label="Business address" help="Physical address only. We use this to determine your tax responsibilities.">
            <TextInput value={data.address} onChange={v => set("address", v)} placeholder="Street, city, province or state, postal code" />
          </Field>
        </CardSection>

        <CardSection label="Location and currency">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Country">
              <SelectInput value={(data.country || "").toLowerCase()} onChange={v => { set("country", v); const c = COUNTRIES.find(x => x.iso === v); if (c) set("currency", c.currency); setBusinessCountry(v); }}>
                {COUNTRIES.map(c => <option key={c.iso} value={c.iso}>{c.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Base currency">
              <SelectInput value={data.currency} onChange={v => set("currency", v)}>
                <option value="USD">USD - US Dollar</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="NZD">NZD - New Zealand Dollar</option>
                <option value="SGD">SGD - Singapore Dollar</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="ZAR">ZAR - South African Rand</option>
              </SelectInput>
            </Field>
          </div>
        </CardSection>

        <CardSection label="Fiscal year and time zone">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Fiscal year start month" help="Used for year-end payroll reporting. Most businesses use January.">
              <SelectInput value={String(data.fiscal_year_start || 1)} onChange={v => set("fiscal_year_start", parseInt(v))}>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </SelectInput>
            </Field>
            <Field label="Phone (optional)">
              <TextInput value={data.phone} onChange={v => set("phone", v)} placeholder="Business phone number" />
            </Field>
          </div>
        </CardSection>

        <SaveBar dirty={dirty} saving={saving} onSave={onSave} onDiscard={onDiscard} label="Save company details" />
      </div>
    </>
  );
}

// === Pay schedule section ===
function PayScheduleSection() {
  const [data, setData] = useState({ frequency: "bi_weekly", first_payday: "", period_end: "" });
  const [original, setOriginal] = useState({ frequency: "bi_weekly", first_payday: "", period_end: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(API_URL + "/api/v1/payroll/settings", { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.pay_schedule) {
          const initial = {
            frequency: d.pay_schedule.frequency || "bi_weekly",
            first_payday: d.pay_schedule.first_payday || d.pay_schedule.anchorPayDate || "",
            period_end: d.pay_schedule.period_end || "",
          };
          setData(initial); setOriginal(initial);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const dirty = JSON.stringify(data) !== JSON.stringify(original);

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(API_URL + "/api/v1/payroll/settings", {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ pay_schedule: data }),
      });
      if (res.ok) { setOriginal(data); }
    } catch (e) {}
    setSaving(false);
  };
  const onDiscard = () => setData(original);
  const set = (k, v) => setData(s => ({ ...s, [k]: v }));

  if (loading) return <div style={{ color: C.muted, fontSize: 13 }}>Loading...</div>;

  const FREQS = [
    { id: "weekly", name: "Weekly", desc: "52 paydays per year" },
    { id: "bi_weekly", name: "Bi-weekly", desc: "26 paydays per year" },
    { id: "semi_monthly", name: "Semi-monthly", desc: "24 paydays per year (15th and end of month)" },
    { id: "monthly", name: "Monthly", desc: "12 paydays per year" },
  ];

  return (
    <>
      <SectionHead title="Pay schedule" subtitle="How often paydays happen and what time period each pay run covers. Used to count down to payday and lock the correct pay period." />
      <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "24px 26px" }}>
        <CardSection label="Pay frequency">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {FREQS.map(f => (
              <div key={f.id} onClick={() => set("frequency", f.id)}
                style={{ padding: 14, border: "1px solid " + (data.frequency === f.id ? C.teal : C.line), borderRadius: 8, cursor: "pointer", background: data.frequency === f.id ? C.tealSoft : "#fff", transition: "0.12s" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 3 }}>{f.name}</div>
                <div style={{ fontSize: 11.5, color: C.muted }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </CardSection>

        <CardSection label="First payday and period">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="First payday on Novala" help="The first day employees will be paid on this schedule.">
              <TextInput type="date" value={data.first_payday} onChange={v => set("first_payday", v)} />
            </Field>
            <Field label="Pay period end (anchor date)" help="The last day of the period this first payday covers.">
              <TextInput type="date" value={data.period_end} onChange={v => set("period_end", v)} />
            </Field>
          </div>
        </CardSection>

        <SaveBar dirty={dirty} saving={saving} onSave={onSave} onDiscard={onDiscard} label="Save pay schedule" />
      </div>
    </>
  );
}

// === Tax registration section ===
function TaxRegistrationSection({ businessCountry }) {
  const country = (businessCountry || "ca").toLowerCase();
  // Tax registration is stored locally for now (no backend column yet)
  const STORAGE_KEY = "novala_tax_registration";
  const [data, setData] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setData(parsed); setOriginal(parsed);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  const dirty = JSON.stringify(data) !== JSON.stringify(original);

  const onSave = () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setOriginal(data);
    } catch (e) { alert("Save failed: " + e.message); }
    setSaving(false);
  };
  const onDiscard = () => setData(original);
  const set = (k, v) => setData(s => ({ ...s, [k]: v }));

  if (loading) return <div style={{ color: C.muted, fontSize: 13 }}>Loading...</div>;

  const FIELDS_BY_COUNTRY = {
    ca: [
      { key: "cra_bn", label: "CRA Business Number (BN)", help: "9 digits from the CRA, appears on your tax notices.", ph: "123456789" },
      { key: "cra_payroll", label: "CRA Payroll account number", help: "Your Business Number followed by RP and a 4-digit suffix.", ph: "123456789RP0001" },
      { key: "rq_account", label: "Revenu Quebec payroll account (optional)", help: "Only required if you have employees in Quebec.", ph: "Leave blank if not applicable" },
    ],
    us: [
      { key: "ein", label: "Federal EIN", help: "Federal Employer Identification Number.", ph: "12-3456789" },
      { key: "state_tax_id", label: "State tax ID", help: "Required for each state where you have employees.", ph: "Your state tax ID" },
      { key: "sui_rate", label: "State Unemployment Insurance rate", ph: "e.g. 2.5" },
    ],
    gb: [
      { key: "paye_ref", label: "PAYE reference number", help: "From HMRC, format like 123/AB45678", ph: "123/AB45678" },
      { key: "accounts_office_ref", label: "Accounts Office reference", help: "13-character reference from HMRC.", ph: "123PA00012345" },
      { key: "tax_office", label: "Tax office name", ph: "Your HMRC tax office" },
    ],
    au: [
      { key: "abn", label: "Australian Business Number (ABN)", help: "11 digits.", ph: "12 345 678 901" },
      { key: "wpn", label: "Withholding payer number (WPN)", help: "Only if you don't have an ABN.", ph: "Leave blank if you have an ABN" },
      { key: "stp_bms_id", label: "Single Touch Payroll BMS ID", help: "From the ATO portal." },
    ],
    nz: [
      { key: "ird_number", label: "IRD number for your business", help: "From Inland Revenue.", ph: "12-345-678" },
      { key: "esct_rate", label: "Employer ESCT rate", help: "Employer Superannuation Contribution Tax rate." },
    ],
    sg: [
      { key: "uen", label: "Company UEN", help: "Unique Entity Number.", ph: "201912345A" },
      { key: "cpf_employer", label: "CPF employer number" },
      { key: "iras_tax_ref", label: "IRAS Tax Reference Number" },
    ],
    jp: [
      { key: "hojin_bango", label: "Corporate number (Hojin Bango)", help: "13 digits from the Tax Agency.", ph: "1234567890123" },
      { key: "withholding_office", label: "Withholding tax office", help: "Tax office where you submit withholding." },
    ],
    de: [
      { key: "steuernummer", label: "Steuernummer", help: "Your business tax number." },
      { key: "betriebsnummer", label: "Betriebsnummer", help: "From Bundesagentur für Arbeit." },
      { key: "ust_idnr", label: "USt-IdNr (VAT ID)", help: "Optional, only if you are VAT-registered." },
    ],
    fr: [
      { key: "siret", label: "SIRET number", help: "14 digits identifying your business.", ph: "12345678901234" },
      { key: "ape_naf", label: "APE/NAF code", ph: "62.01Z" },
      { key: "urssaf_account", label: "URSSAF account number" },
      { key: "convention_collective", label: "Convention collective code", help: "Your industry's collective agreement code." },
    ],
    za: [
      { key: "paye_ref", label: "PAYE reference", help: "10 digits from SARS.", ph: "7012345678" },
      { key: "uif_ref", label: "UIF reference number" },
      { key: "sdl_ref", label: "SDL reference (if applicable)", help: "Skills Development Levy reference." },
    ],
  };

  const fields = FIELDS_BY_COUNTRY[country] || FIELDS_BY_COUNTRY.ca;
  const countryName = COUNTRIES.find(c => c.iso === country)?.name || "your country";

  return (
    <>
      <SectionHead title="Tax registration" subtitle={"Your business tax IDs and filing cadence with the tax authority. Fields below are based on " + countryName + "."} />
      <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "24px 26px" }}>
        <CardSection label="Tax identifiers">
          {fields.map(f => (
            <Field key={f.key} label={f.label} help={f.help}>
              <TextInput value={data[f.key]} onChange={v => set(f.key, v)} placeholder={f.ph || ""} />
            </Field>
          ))}
        </CardSection>

        <CardSection label="Filing cadence">
          <Field label="How often do you remit payroll taxes?" help="This affects when remittance deadlines appear on your payroll overview.">
            <SelectInput value={data.filing_cadence} onChange={v => set("filing_cadence", v)}>
              <option value="">Select cadence</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </SelectInput>
          </Field>
        </CardSection>

        <div style={{ background: C.tealSoft, borderLeft: "2px solid " + C.teal, borderRadius: "0 6px 6px 0", padding: "12px 14px", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.tealInk, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Why this matters</div>
          <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.55 }}>Novala uses these IDs to calculate correct tax remittances and to file with the tax authority on your behalf. Keep them current; if your business gets a new account or moves, update here first.</div>
        </div>

        <SaveBar dirty={dirty} saving={saving} onSave={onSave} onDiscard={onDiscard} label="Save tax registration" />
      </div>
    </>
  );
}

// === Coming soon stub ===
function ComingSoonSection({ title }) {
  return (
    <>
      <SectionHead title={title} subtitle="This section is being built and will be available soon." />
      <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "48px 40px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.tealSoft, color: C.tealInk, display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
          <AlertTriangle size={24} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 8 }}>Coming soon</div>
        <div style={{ fontSize: 13, color: C.muted, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
          We are building this section now. The other Payroll Settings sections are fully functional and you can configure them in the meantime.
        </div>
      </div>
    </>
  );
}
