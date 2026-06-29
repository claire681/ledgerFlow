import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, Building2, Calendar, FileText, Landmark,
  Plus, MapPin, CheckCircle2, AlertTriangle, Search, Shield,
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

// Custom SVG icons for the settings nav - more specific than generic lucide
const IconBriefcase = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M2 13h20"/></svg>
);
const IconCalendarCheck = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M9 15l2 2 4-4"/></svg>
);
const IconReceipt = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 2h12a1 1 0 0 1 1 1v18l-3-2-3 2-3-2-3 2-3-2V3a1 1 0 0 1 1-1z"/><path d="M8 8h8M8 12h6M8 16h4"/></svg>
);
const IconBankColumns = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 10l9-6 9 6"/><path d="M3 10h18"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9"/><path d="M3 21h18"/></svg>
);
const IconStackedCoins = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="6" rx="8" ry="2.5"/><path d="M4 6v4c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5V6"/><path d="M4 10v4c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5v-4"/><path d="M4 14v4c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5v-4"/></svg>
);
const IconOfficeBuilding = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/><path d="M10 21v-4h4v4"/></svg>
);
const IconClipboardSign = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="4" width="14" height="18" rx="1.5"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 4h6"/><path d="M9 11h6M9 14h6"/><path d="M9 18c1-1 2.5-1 3.5 0s2.5 1 3.5 0"/></svg>
);

const SECTIONS = [
  { id: "company", group: "Setup", label: "Company details", Icon: IconBriefcase },
  { id: "schedule", group: "Setup", label: "Pay schedule", Icon: IconCalendarCheck },
  { id: "tax", group: "Setup", label: "Tax registration", Icon: IconReceipt },
  { id: "bank", group: "Setup", label: "Bank account", Icon: IconBankColumns },
  { id: "items", group: "Payroll items", label: "Pay types & deductions", Icon: IconStackedCoins },
  { id: "locations", group: "Payroll items", label: "Work locations", Icon: IconOfficeBuilding },
  { id: "review", group: "Final step", label: "Review & authorize", Icon: IconClipboardSign, comingSoon: true },
];


// ===== Country config for 11 countries =====
const COUNTRY_CONFIG = {
  CA: { name: "Canada", iso: "ca", subdivLabel: "Province or territory",
    subdivisions: ["Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Nova Scotia","Ontario","Prince Edward Island","Quebec","Saskatchewan","Northwest Territories","Nunavut","Yukon"],
    postalLabel: "Postal code", postalFormat: "A1A 1A1", postalPlaceholder: "T5J 3K1",
    streetPlaceholder: "10145 109 Street NW", cityPlaceholder: "Edmonton", phonePlaceholder: "+1 (780) 555-0100" },
  US: { name: "United States", iso: "us", subdivLabel: "State",
    subdivisions: ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"],
    postalLabel: "ZIP code", postalFormat: "12345", postalPlaceholder: "94103",
    streetPlaceholder: "1455 Market Street", cityPlaceholder: "San Francisco", phonePlaceholder: "+1 (415) 555-0100" },
  GB: { name: "United Kingdom", iso: "gb", subdivLabel: "Nation",
    subdivisions: ["England","Scotland","Wales","Northern Ireland"],
    postalLabel: "Postcode", postalFormat: "SW1A 1AA", postalPlaceholder: "SW1A 1AA",
    streetPlaceholder: "10 Downing Street", cityPlaceholder: "London", phonePlaceholder: "+44 20 7946 0100" },
  AU: { name: "Australia", iso: "au", subdivLabel: "State or territory",
    subdivisions: ["Australian Capital Territory","New South Wales","Northern Territory","Queensland","South Australia","Tasmania","Victoria","Western Australia"],
    postalLabel: "Postcode", postalFormat: "4 digits", postalPlaceholder: "2000",
    streetPlaceholder: "1 Macquarie Street", cityPlaceholder: "Sydney", phonePlaceholder: "+61 2 9374 4000" },
  NZ: { name: "New Zealand", iso: "nz", subdivLabel: "Region",
    subdivisions: ["Auckland","Bay of Plenty","Canterbury","Gisborne","Hawke's Bay","Manawatu-Whanganui","Marlborough","Nelson","Northland","Otago","Southland","Taranaki","Tasman","Waikato","Wellington","West Coast"],
    postalLabel: "Postcode", postalFormat: "4 digits", postalPlaceholder: "1010",
    streetPlaceholder: "1 Queen Street", cityPlaceholder: "Auckland", phonePlaceholder: "+64 9 379 2020" },
  SG: { name: "Singapore", iso: "sg", subdivLabel: "Region (optional)",
    subdivisions: ["Central Region","East Region","North Region","North-East Region","West Region"],
    postalLabel: "Postal code", postalFormat: "6 digits", postalPlaceholder: "238859",
    streetPlaceholder: "1 Marina Boulevard", cityPlaceholder: "Singapore", phonePlaceholder: "+65 6688 1234" },
  JP: { name: "Japan", iso: "jp", subdivLabel: "Prefecture",
    subdivisions: ["Hokkaido","Aomori","Iwate","Miyagi","Akita","Yamagata","Fukushima","Ibaraki","Tochigi","Gunma","Saitama","Chiba","Tokyo","Kanagawa","Niigata","Toyama","Ishikawa","Fukui","Yamanashi","Nagano","Gifu","Shizuoka","Aichi","Mie","Shiga","Kyoto","Osaka","Hyogo","Nara","Wakayama","Tottori","Shimane","Okayama","Hiroshima","Yamaguchi","Tokushima","Kagawa","Ehime","Kochi","Fukuoka","Saga","Nagasaki","Kumamoto","Oita","Miyazaki","Kagoshima","Okinawa"],
    postalLabel: "Postal code", postalFormat: "XXX-XXXX", postalPlaceholder: "100-0001",
    streetPlaceholder: "1-1 Chiyoda", cityPlaceholder: "Chiyoda City, Tokyo", phonePlaceholder: "+81 3 1234 5678" },
  DE: { name: "Germany", iso: "de", subdivLabel: "State (Bundesland)",
    subdivisions: ["Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen","Hamburg","Hessen","Mecklenburg-Vorpommern","Niedersachsen","Nordrhein-Westfalen","Rheinland-Pfalz","Saarland","Sachsen","Sachsen-Anhalt","Schleswig-Holstein","Thüringen"],
    postalLabel: "PLZ", postalFormat: "5 digits", postalPlaceholder: "10115",
    streetPlaceholder: "Unter den Linden 77", cityPlaceholder: "Berlin", phonePlaceholder: "+49 30 12345678" },
  FR: { name: "France", iso: "fr", subdivLabel: "Region",
    subdivisions: ["Auvergne-Rhône-Alpes","Bourgogne-Franche-Comté","Bretagne","Centre-Val de Loire","Corse","Grand Est","Hauts-de-France","Île-de-France","Normandie","Nouvelle-Aquitaine","Occitanie","Pays de la Loire","Provence-Alpes-Côte d'Azur"],
    postalLabel: "Code postal", postalFormat: "5 digits", postalPlaceholder: "75001",
    streetPlaceholder: "55 Rue du Faubourg Saint-Honoré", cityPlaceholder: "Paris", phonePlaceholder: "+33 1 42 92 81 00" },
  ZA: { name: "South Africa", iso: "za", subdivLabel: "Province",
    subdivisions: ["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","North West","Northern Cape","Western Cape"],
    postalLabel: "Postal code", postalFormat: "4 digits", postalPlaceholder: "8001",
    streetPlaceholder: "1 Adderley Street", cityPlaceholder: "Cape Town", phonePlaceholder: "+27 21 555 0100" },
  OTHER: { name: "Other country", iso: "un", subdivLabel: "Region or state (optional)",
    subdivisions: null,
    postalLabel: "Postal code", postalFormat: "Any format", postalPlaceholder: "Enter postal code",
    streetPlaceholder: "Street and number", cityPlaceholder: "City or locality", phonePlaceholder: "+XX phone" },
};

function WorkLocationsSection({ businessCountry = "CA" }) {
  const [locations, setLocations] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [confirmIntlChange, setConfirmIntlChange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state for drawer
  const initialForm = { name: "", street_address: "", suite: "", municipality: "", province: "", postal_code: "", phone: "", country: businessCountry, is_primary: false, is_international: false };
  const [form, setForm] = useState(initialForm);
  const [intlMode, setIntlMode] = useState(false);

  // === Load locations ===
  const loadLocations = async () => {
    try {
      const res = await fetch(API_URL + "/api/v1/work-locations", { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLocations(data || []);
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { loadLocations(); }, []);

  useEffect(() => {
    fetch(API_URL + "/api/v1/company/profile", { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.company_name) setCompanyName(d.company_name); })
      .catch(() => {});
  }, []);

  // === Open drawer for new ===
  const openNew = () => {
    setForm({ ...initialForm, country: businessCountry, is_international: false });
    setIntlMode(false);
    setEditingId(null);
    setDrawerOpen(true);
  };

  // === Open drawer for edit ===
  const openEdit = (loc) => {
    setForm({
      name: loc.name || "",
      street_address: loc.street_address || "",
      suite: loc.suite || "",
      municipality: loc.municipality || "",
      province: loc.province || "",
      postal_code: loc.postal_code || "",
      phone: loc.phone || "",
      country: loc.country || businessCountry,
      is_primary: loc.is_primary || false,
      is_international: loc.is_international || false,
    });
    setIntlMode(loc.is_international || (loc.country && loc.country.toUpperCase() !== (businessCountry || "CA").toUpperCase()));
    setEditingId(loc.id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setEditingId(null); };

  // === Save ===
  const onSave = async () => {
    if (!form.name?.trim()) { alert("Location name is required"); return; }
    // Validate province matches selected country
    const activeCountry = (intlMode ? form.country : businessCountry || "CA").toUpperCase();
    const activeConfig = COUNTRY_CONFIG[activeCountry] || COUNTRY_CONFIG.OTHER;
    if (activeConfig.subdivisions && form.province && !activeConfig.subdivisions.includes(form.province)) {
      alert("The selected " + activeConfig.subdivLabel.toLowerCase() + " (" + form.province + ") is not valid for " + activeConfig.name + ". Please pick from the dropdown.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        country: intlMode ? form.country : businessCountry,
        is_international: intlMode,
      };
      const url = editingId
        ? API_URL + "/api/v1/work-locations/" + editingId
        : API_URL + "/api/v1/work-locations";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) { await loadLocations(); closeDrawer(); }
      else { alert("Could not save location. Please try again."); }
    } catch (e) { alert("Could not save location."); }
    setSaving(false);
  };

  // === Delete ===
  const onDelete = async (id) => {
    try {
      const res = await fetch(API_URL + "/api/v1/work-locations/" + id, { method: "DELETE", headers: authHeaders() });
      if (res.ok || res.status === 204) { await loadLocations(); setConfirmDelete(null); closeDrawer(); }
    } catch (e) {}
  };

  // === Filter by search ===
  const filtered = locations.filter(loc => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (loc.name || "").toLowerCase().includes(q)
      || (loc.municipality || "").toLowerCase().includes(q)
      || (loc.province || "").toLowerCase().includes(q)
      || (loc.street_address || "").toLowerCase().includes(q);
  });

  const config = COUNTRY_CONFIG[(intlMode ? (form.country || "US") : businessCountry || "CA").toUpperCase()] || COUNTRY_CONFIG.OTHER;
  const companyConfig = COUNTRY_CONFIG[(businessCountry || "CA").toUpperCase()] || COUNTRY_CONFIG.OTHER;

  if (loading) return <div style={{ color: C.muted, fontSize: 13, padding: 20 }}>Loading work locations...</div>;

  return (
    <>
      <SectionHead title="Work locations" subtitle="Physical workplaces where your employees report. Used to determine provincial tax rates, workers' compensation, and where each employee's payroll is processed." />

      {/* Company context strip */}
      <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 8, padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 11, fontSize: 12, color: C.muted }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase" }}>Your company</span>
        <strong style={{ color: C.ink, fontWeight: 600 }}>{companyName || "Your company"}</strong>
        <span style={{ fontSize: 11.5, color: C.muted }}>· {companyConfig.name}</span>
        <span style={{ marginLeft: "auto", fontSize: 11.5, color: C.tealInk, cursor: "pointer", fontWeight: 500 }} onClick={() => window.location.href = "/payroll/settings/company"}>Change in Company details ›</span>
      </div>

      {/* Why this matters */}
      <div style={{ background: C.tealSoft, borderLeft: "2px solid " + C.teal, borderRadius: "0 8px 8px 0", padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "flex-start", gap: 11 }}>
        <div style={{ width: 24, height: 24, borderRadius: 5, background: "#fff", color: C.tealInk, display: "grid", placeItems: "center", flex: "0 0 24px", marginTop: 1, border: "1px solid #C9E5DD" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>
        </div>
        <div style={{ flex: 1, fontSize: 12.5, color: C.tealInk, lineHeight: 1.6 }}>
          <strong style={{ color: C.tealInk, fontWeight: 600, display: "block", marginBottom: 3 }}>Why work locations matter for payroll</strong>
          Tax rates and workers' compensation vary by region. New locations default to your company country ({companyConfig.name}). For international locations, use the override link inside the add form.
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.ink, letterSpacing: "0.06em", textTransform: "uppercase" }}>All locations</span>
          <span style={{ fontSize: 12, color: C.faint, fontVariantNumeric: "tabular-nums" }}>{filtered.length} of {locations.length}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint, pointerEvents: "none" }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search locations..." style={{ padding: "8px 12px 8px 36px", border: "1px solid " + C.line, borderRadius: 6, fontFamily: "inherit", fontSize: 12.5, color: C.ink, width: 220, outline: "none", background: "#fff" }} />
          </div>
          <button onClick={openNew} style={{ background: C.ink, color: "#fff", border: 0, borderRadius: 6, padding: "8px 14px", fontWeight: 500, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
            Add location
          </button>
        </div>
      </div>

      {/* Empty state OR table */}
      {locations.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "48px 24px", textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 13, background: C.surface2 || "#F4F6F8", color: C.slate700 || "#2A3F45", display: "grid", placeItems: "center", margin: "0 auto 18px", border: "1px solid " + C.line }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/><path d="M10 21v-4h4v4"/></svg>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 6, letterSpacing: "-0.005em" }}>No work locations yet</h3>
          <p style={{ fontSize: 12.5, color: C.muted, maxWidth: 420, margin: "0 auto 18px", lineHeight: 1.6 }}>Add the physical address where employees report. Most businesses have one location to start. You can add more as you grow.</p>
          <button onClick={openNew} style={{ background: C.ink, color: "#fff", border: 0, borderRadius: 6, padding: "9px 18px", fontWeight: 500, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
            Add your first location
          </button>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px 140px 130px 60px", gap: 14, padding: "11px 18px", background: C.surface2 || "#F4F6F8", borderBottom: "1px solid " + C.line, fontSize: 10.5, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            <div>Location</div><div>Address</div><div>Region</div><div>Headcount</div><div></div>
          </div>
          {filtered.map(loc => {
            const isIntl = loc.is_international;
            return (
              <div key={loc.id} onClick={() => openEdit(loc)} style={{ display: "grid", gridTemplateColumns: "1fr 280px 140px 130px 60px", gap: 14, padding: "14px 18px", borderBottom: "1px solid " + C.lineSoft, alignItems: "center", cursor: "pointer", background: isIntl ? "rgba(156,90,15,0.03)" : "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: C.surface2 || "#F4F6F8", color: "#1A2D32", display: "grid", placeItems: "center", flex: "0 0 36px", border: "1px solid " + C.line }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/><path d="M10 21v-4h4v4"/></svg>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {loc.name || "(Unnamed location)"}
                      {loc.is_primary && <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, background: C.ink, color: "#fff" }}>Primary</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 500 }}>Work location</div>
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5, minWidth: 0 }}>
                  <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{loc.street_address || ""}{loc.suite ? ", " + loc.suite : ""}</span>
                  <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: C.muted, fontSize: 11.5 }}>{loc.municipality || ""}{loc.province ? ", " + loc.province : ""} {loc.postal_code || ""}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: C.text, fontWeight: 500, minWidth: 0 }}>
                  
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{loc.province || ""}{isIntl && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: "#9C5A0F", background: "#FBF1DD", padding: "1px 5px", borderRadius: 3, marginLeft: 6 }}>INTL</span>}</span>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.ink, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: C.faint, flex: "0 0 14px" }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {(loc.assigned_employees || []).length} {(loc.assigned_employees || []).length === 1 ? "employee" : "employees"}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  <button style={{ background: "none", border: "1px solid transparent", borderRadius: 5, width: 28, height: 28, cursor: "pointer", color: C.muted, display: "grid", placeItems: "center" }} title="Edit">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && createPortal(
        <>
          <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(10,26,30,.42)", zIndex: 1000 }} />
          <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: "min(520px, 96vw)", background: "#fff", boxShadow: "-12px 0 40px rgba(10,26,30,.18)", display: "flex", flexDirection: "column", zIndex: 1001 }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid " + C.line, display: "flex", alignItems: "center", justifyContent: "space-between", flex: "0 0 auto" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{editingId ? "Edit work location" : "Add work location"}</h3>
              <button onClick={closeDrawer} style={{ background: "none", border: "1px solid " + C.line, borderRadius: 5, width: 28, height: 28, cursor: "pointer", color: C.muted, display: "grid", placeItems: "center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", minHeight: 0 }}>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid " + C.lineSoft }}>Basics</div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, display: "block", marginBottom: 6 }}>Location name <span style={{ color: "#B53B2E", fontSize: 11, fontWeight: 500 }}>required</span></label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="For example, Edmonton head office" style={{ width: "100%", fontFamily: "inherit", fontSize: 13.5, color: C.ink, padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none" }} />
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>A friendly name your team will recognize.</div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid " + C.lineSoft }}>Address</div>

                {/* Country indicator (default) or override panel */}
                {!intlMode ? null : (
                  <div style={{ background: "#FBF1DD", border: "1px solid #E8C896", borderRadius: 8, padding: "14px 16px", marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <strong style={{ fontSize: 12.5, color: "#9C5A0F", fontWeight: 600 }}>International location</strong>
                      <span onClick={() => { setIntlMode(false); setForm({ ...form, country: businessCountry, province: "" }); }} style={{ fontSize: 11, color: C.muted, cursor: "pointer" }}>Cancel override</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: C.text, lineHeight: 1.55, marginBottom: 12 }}>
                      Use for locations outside <strong>{companyConfig.name}</strong>. Address fields will adapt to the chosen country's format and tax jurisdiction.
                    </div>
                    <select value={form.country || "US"} onChange={(e) => setForm({ ...form, country: e.target.value, province: "" })} style={{ width: "100%", fontFamily: "inherit", fontSize: 13.5, color: C.ink, padding: "9px 12px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none" }}>
                      {Object.keys(COUNTRY_CONFIG).filter(k => k !== (businessCountry || "CA").toUpperCase()).map(k => <option key={k} value={k}>{COUNTRY_CONFIG[k].name}</option>)}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, display: "block", marginBottom: 6 }}>Street address <span style={{ color: "#B53B2E", fontSize: 11, fontWeight: 500 }}>required</span></label>
                  <input type="text" value={form.street_address} onChange={(e) => setForm({ ...form, street_address: e.target.value })} placeholder={config.streetPlaceholder} style={{ width: "100%", fontFamily: "inherit", fontSize: 13.5, color: C.ink, padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none" }} />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, display: "block", marginBottom: 6 }}>Apt, suite, or unit (optional)</label>
                  <input type="text" value={form.suite} onChange={(e) => setForm({ ...form, suite: e.target.value })} placeholder="Suite 200" style={{ width: "100%", fontFamily: "inherit", fontSize: 13.5, color: C.ink, padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, display: "block", marginBottom: 6 }}>City <span style={{ color: "#B53B2E", fontSize: 11, fontWeight: 500 }}>required</span></label>
                    <input type="text" value={form.municipality} onChange={(e) => setForm({ ...form, municipality: e.target.value })} placeholder={config.cityPlaceholder} style={{ width: "100%", fontFamily: "inherit", fontSize: 13.5, color: C.ink, padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, display: "block", marginBottom: 6 }}>{config.subdivLabel} <span style={{ color: "#B53B2E", fontSize: 11, fontWeight: 500 }}>required</span></label>
                    {config.subdivisions ? (
                      <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} style={{ width: "100%", fontFamily: "inherit", fontSize: 13.5, color: C.ink, padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none" }}>
                        <option value="">Select...</option>
                        {config.subdivisions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="Enter region or state" style={{ width: "100%", fontFamily: "inherit", fontSize: 13.5, color: C.ink, padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none" }} />
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>{config.postalLabel} <span style={{ color: "#B53B2E", fontSize: 11, fontWeight: 500 }}>required</span> <span style={{ fontSize: 10.5, color: C.faint, fontFamily: "JetBrains Mono, monospace", background: C.surface2 || "#F4F6F8", padding: "2px 6px", borderRadius: 4, fontWeight: 500 }}>{config.postalFormat}</span></label>
                    <input type="text" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} placeholder={config.postalPlaceholder} style={{ width: "100%", fontFamily: "JetBrains Mono, monospace", fontSize: 13.5, color: C.ink, padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, display: "block", marginBottom: 6 }}>Phone (optional)</label>
                    <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={config.phonePlaceholder} style={{ width: "100%", fontFamily: "JetBrains Mono, monospace", fontSize: 13.5, color: C.ink, padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none" }} />
                  </div>
                </div>

                {/* International override link (only shown if not already in intlMode) */}
                {!intlMode && (
                  <div style={{ textAlign: "center", marginTop: 14, padding: "10px 0", fontSize: 11.5, color: C.muted }}>
                    Located outside <strong style={{ color: C.ink }}>{companyConfig.name}</strong>? <span onClick={() => { if (editingId) { setConfirmIntlChange(true); } else { const newCountry = (businessCountry || "CA").toUpperCase() === "CA" ? "US" : "CA"; setIntlMode(true); setForm({ ...form, country: newCountry, province: "" }); } }} style={{ color: C.tealInk, cursor: "pointer", fontWeight: 500 }}>Add as international location ›</span>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid " + C.lineSoft }}>Settings</div>
                <div style={{ background: C.surface2 || "#F4F6F8", border: "1px solid " + C.line, borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 2 }}>Set as primary location</div>
                    <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>The primary location is used when no other location is assigned to an employee.</div>
                  </div>
                  <div onClick={() => setForm({ ...form, is_primary: !form.is_primary })} style={{ width: 38, height: 22, background: form.is_primary ? C.ink : C.line, borderRadius: 11, position: "relative", cursor: "pointer", flex: "0 0 38px", transition: ".18s" }}>
                    <div style={{ width: 16, height: 16, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, left: form.is_primary ? 19 : 3, boxShadow: "0 1px 2px rgba(0,0,0,.15)", transition: ".18s" }} />
                  </div>
                </div>
              </div>

            </div>

            <div style={{ padding: "14px 24px", borderTop: "1px solid " + C.line, background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flex: "0 0 auto" }}>
              {editingId && (
                <button onClick={() => setConfirmDelete(editingId)} style={{ background: "#fff", color: "#B53B2E", border: "1px solid " + C.line, borderRadius: 6, padding: "9px 14px", fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, marginRight: "auto" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  Delete
                </button>
              )}
              <button onClick={closeDrawer} style={{ background: "#fff", color: C.text, border: "1px solid " + C.line, borderRadius: 6, padding: "9px 16px", fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginLeft: editingId ? 0 : "auto" }}>Cancel</button>
              <button onClick={onSave} disabled={saving} style={{ background: C.ink, color: "#fff", border: 0, borderRadius: 6, padding: "9px 20px", fontWeight: 500, fontSize: 13, cursor: saving ? "wait" : "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : "Save location"}
                {!saving && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6L9 17l-5-5"/></svg>}
              </button>
            </div>
          </div>
        </>, document.body)}

      {/* International change confirmation modal */}
      {confirmIntlChange && createPortal(
        <div onClick={() => setConfirmIntlChange(false)} style={{ position: "fixed", inset: 0, background: "rgba(10,26,30,.42)", zIndex: 2000, display: "grid", placeItems: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", maxWidth: 460, width: "90%", boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 8 }}>Change this location to international?</h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.55 }}>You are about to change this location from {companyConfig.name} to a different country. The province/state and postal code will need to be re-entered to match the new country.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmIntlChange(false)} style={{ background: "#fff", color: C.text, border: "1px solid " + C.line, borderRadius: 6, padding: "9px 16px", fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Keep as {companyConfig.name}</button>
              <button onClick={() => { const newCountry = (businessCountry || "CA").toUpperCase() === "CA" ? "US" : "CA"; setIntlMode(true); setForm({ ...form, country: newCountry, province: "", postal_code: "" }); setConfirmIntlChange(false); }} style={{ background: C.ink, color: "#fff", border: 0, borderRadius: 6, padding: "9px 20px", fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Yes, change to international</button>
            </div>
          </div>
        </div>, document.body)}

      {/* Delete confirmation modal */}
      {confirmDelete && createPortal(
        <div onClick={() => setConfirmDelete(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,26,30,.42)", zIndex: 2000, display: "grid", placeItems: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", maxWidth: 420, width: "90%", boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 8 }}>Delete this location?</h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.55 }}>Any employees assigned to this location will need to be reassigned. This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ background: "#fff", color: C.text, border: "1px solid " + C.line, borderRadius: 6, padding: "9px 16px", fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={() => onDelete(confirmDelete)} style={{ background: "#B53B2E", color: "#fff", border: 0, borderRadius: 6, padding: "9px 20px", fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Delete location</button>
            </div>
          </div>
        </div>, document.body)}
    </>
  );
}


// ===== Pay Types & Deductions section (read-only catalog v1, drawer coming) =====
function PayTypesSection({ businessCountry = "CA" }) {
  const [payTypes, setPayTypes] = React.useState([]);
  const [deductions, setDeductions] = React.useState([]);
  const [companyProvince, setCompanyProvince] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("earnings");
  const [search, setSearch] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerMode, setDrawerMode] = React.useState("add");
  const [drawerCategory, setDrawerCategory] = React.useState("earning");
  const [editingId, setEditingId] = React.useState(null);
  const [draft, setDraft] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [editingIsDefault, setEditingIsDefault] = React.useState(false);
  const [kebabOpenId, setKebabOpenId] = React.useState(null);

  React.useEffect(function() {
    async function load() {
      try {
        const [ptRes, dtRes, cpRes] = await Promise.all([
          fetch(API_URL + "/api/v1/pay-types", { headers: authHeaders() }),
          fetch(API_URL + "/api/v1/deduction-types", { headers: authHeaders() }),
          fetch(API_URL + "/api/v1/company/profile", { headers: authHeaders() }),
        ]);
        if (ptRes.ok) setPayTypes(await ptRes.json());
        if (dtRes.ok) setDeductions(await dtRes.json());
        if (cpRes.ok) {
          const cp = await cpRes.json();
          setCompanyProvince(cp.province_state || cp.province || "");
        }
      } catch (err) {
        console.error("Failed to load pay types", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const businessCountryUpper = (businessCountry || "CA").toUpperCase();
  const companyConfig = COUNTRY_CONFIG[businessCountryUpper] || COUNTRY_CONFIG.CA;

  // Filter by search term
  const filterFn = function(item) {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (item.name || "").toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q);
  };
  const filteredPayTypes = payTypes.filter(filterFn);
  const filteredDeductions = deductions.filter(filterFn);

  const defaultPayTypeCount = payTypes.filter(function(p) { return p.is_default; }).length;
  const customPayTypeCount = payTypes.length - defaultPayTypeCount;
  const defaultDeductionCount = deductions.filter(function(d) { return d.is_default; }).length;
  const customDeductionCount = deductions.length - defaultDeductionCount;

  // Format calc method for display
  function formatCalc(item, isDeduction) {
    const method = item.calc_method;
    const rate = isDeduction ? item.default_amount : item.default_rate;
    const unit = item.unit_label || "";

    if (method === "fixed") {
      return rate != null ? { main: Number(rate).toFixed(2), suffix: unit } : { main: "Fixed", suffix: "" };
    }
    if (method === "rate_hours") {
      return rate != null ? { main: Number(rate).toFixed(2), suffix: unit || "per hour" } : { main: "Rate", suffix: "x hours" };
    }
    if (method === "rate_units") {
      return rate != null ? { main: Number(rate).toFixed(2), suffix: unit } : { main: "Rate", suffix: "x units" };
    }
    if (method === "percent_gross") {
      return rate != null ? { main: Number(rate).toFixed(2), suffix: "% of gross" } : { main: "%", suffix: "of gross" };
    }
    return { main: "Variable", suffix: "" };
  }

  // Format tax treatment as prose
  function formatTaxTreatment(pt) {
    const flags = [];
    if (pt.federal_taxable) flags.push("Federal");
    if (pt.cpp_contributable) flags.push("CPP");
    if (pt.ei_insurable) flags.push("EI");
    if (pt.vacationable) flags.push("Vacation");

    if (flags.length === 0) {
      return { primary: "Non-taxable reimbursement", secondary: null, nonTax: true };
    }
    if (pt.federal_taxable && pt.cpp_contributable && pt.ei_insurable && pt.vacationable) {
      return { primary: "Fully taxable", secondary: "Federal, CPP, EI, Vacation", nonTax: false };
    }
    if (pt.federal_taxable && pt.cpp_contributable && pt.ei_insurable && !pt.vacationable) {
      return { primary: "Taxable, non-vacationable", secondary: "Federal, CPP, EI", nonTax: false };
    }
    return { primary: "Partially taxable", secondary: flags.join(", "), nonTax: false };
  }

  function formatDeductionTreatment(d) {
    const parts = [];
    if (d.is_pre_tax) parts.push("Pre-tax");
    else parts.push("Post-tax");
    if (d.employer_matched) {
      parts.push(d.calc_method === "fixed" ? "employer shared" : "employer matched");
    }
    const secondary = d.is_pre_tax ? "Reduces federal taxable income" : null;
    return { primary: parts.join(", "), secondary: secondary };
  }

  function openAddDrawer(category) {
    setDrawerCategory(category);
    setDrawerMode("add");
    setEditingId(null);
    setEditingIsDefault(false);
    setDraft({
      name: "",
      description: "",
      calc_method: "fixed",
      default_rate: "",
      unit_label: "",
      federal_taxable: true,
      cpp_contributable: true,
      ei_insurable: true,
      vacationable: true,
      wcb_reportable: true,
      t4_box: "14",
      is_pre_tax: false,
      employer_matched: false,
      default_amount: "",
    });
    setSaveError(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(item, category) {
    setDrawerCategory(category);
    setDrawerMode("edit");
    setEditingId(item.id);
    setEditingIsDefault(!!item.is_default);
    setDraft({
      name: item.name || "",
      description: item.description || "",
      calc_method: item.calc_method || "fixed",
      default_rate: item.default_rate != null ? String(item.default_rate) : "",
      default_amount: item.default_amount != null ? String(item.default_amount) : "",
      unit_label: item.unit_label || "",
      federal_taxable: item.federal_taxable !== undefined ? item.federal_taxable : true,
      cpp_contributable: item.cpp_contributable !== undefined ? item.cpp_contributable : true,
      ei_insurable: item.ei_insurable !== undefined ? item.ei_insurable : true,
      vacationable: item.vacationable !== undefined ? item.vacationable : true,
      wcb_reportable: item.wcb_reportable !== undefined ? item.wcb_reportable : true,
      t4_box: item.t4_box || "14",
      is_pre_tax: item.is_pre_tax || false,
      employer_matched: item.employer_matched || false,
    });
    setSaveError(null);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
    setDraft({});
    setSaveError(null);
  }

  async function onSave() {
    if (!draft.name || !draft.name.trim()) {
      setSaveError("Name is required");
      return;
    }
    setSaving(true);
    setSaveError(null);

    const isEarning = drawerCategory === "earning";
    const endpoint = isEarning ? "/api/v1/pay-types" : "/api/v1/deduction-types";
    const url = drawerMode === "add" ? endpoint : endpoint + "/" + editingId;
    const method = drawerMode === "add" ? "POST" : "PATCH";

    const body = {
      name: draft.name,
      description: draft.description || null,
      calc_method: draft.calc_method,
      unit_label: draft.unit_label || null,
    };

    if (isEarning) {
      body.default_rate = draft.default_rate ? Number(draft.default_rate) : null;
      body.federal_taxable = draft.federal_taxable;
      body.cpp_contributable = draft.cpp_contributable;
      body.ei_insurable = draft.ei_insurable;
      body.vacationable = draft.vacationable;
      body.wcb_reportable = draft.wcb_reportable;
      body.t4_box = draft.t4_box || null;
    } else {
      body.default_amount = draft.default_amount ? Number(draft.default_amount) : null;
      body.is_pre_tax = draft.is_pre_tax;
      body.employer_matched = draft.employer_matched;
    }

    try {
      const res = await fetch(API_URL + url, {
        method: method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(function() { return {}; });
        setSaveError(errData.detail || "Save failed (status " + res.status + ")");
        setSaving(false);
        return;
      }

      const saved = await res.json();
      // Refresh the list
      if (isEarning) {
        if (drawerMode === "add") {
          setPayTypes(function(prev) { return prev.concat([saved]); });
        } else {
          setPayTypes(function(prev) { return prev.map(function(p) { return p.id === saved.id ? saved : p; }); });
        }
      } else {
        if (drawerMode === "add") {
          setDeductions(function(prev) { return prev.concat([saved]); });
        } else {
          setDeductions(function(prev) { return prev.map(function(d) { return d.id === saved.id ? saved : d; }); });
        }
      }

      closeDrawer();
    } catch (err) {
      setSaveError("Network error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!editingId) return;
    setDeleting(true);
    const isEarning = drawerCategory === "earning";
    const endpoint = isEarning ? "/api/v1/pay-types/" : "/api/v1/deduction-types/";
    try {
      const res = await fetch(API_URL + endpoint + editingId, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok && res.status !== 204) {
        const errData = await res.json().catch(function() { return {}; });
        setSaveError(errData.detail || "Delete failed");
        setDeleting(false);
        setConfirmDelete(false);
        return;
      }
      if (isEarning) {
        setPayTypes(function(prev) { return prev.filter(function(p) { return p.id !== editingId; }); });
      } else {
        setDeductions(function(prev) { return prev.filter(function(d) { return d.id !== editingId; }); });
      }
      setConfirmDelete(false);
      closeDrawer();
    } catch (err) {
      setSaveError("Network error: " + err.message);
    } finally {
      setDeleting(false);
    }
  }

  // Compute the most recent updated_at across pay types and deductions
  const lastUpdated = React.useMemo(function() {
    const allItems = payTypes.concat(deductions);
    if (allItems.length === 0) return null;
    let latest = null;
    allItems.forEach(function(item) {
      if (item.updated_at) {
        const d = new Date(item.updated_at);
        if (!latest || d > latest) latest = d;
      }
    });
    if (!latest) return null;
    const now = new Date();
    const diffMs = now - latest;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return diffMin + " min ago";
    if (diffHr < 24) {
      const isToday = latest.toDateString() === now.toDateString();
      if (isToday) return diffHr + "h ago";
    }
    if (diffDay === 0) return "Today";
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return diffDay + " days ago";
    return latest.toLocaleDateString(undefined, { month: "short", day: "numeric", year: latest.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  }, [payTypes, deductions]);

  function onDuplicate(item, category) {
    setDrawerCategory(category);
    setDrawerMode("add");
    setEditingId(null);
    setEditingIsDefault(false);
    setDraft({
      name: (item.name || "") + " (copy)",
      description: item.description || "",
      calc_method: item.calc_method || "fixed",
      default_rate: item.default_rate != null ? String(item.default_rate) : "",
      default_amount: item.default_amount != null ? String(item.default_amount) : "",
      unit_label: item.unit_label || "",
      federal_taxable: item.federal_taxable !== undefined ? item.federal_taxable : true,
      cpp_contributable: item.cpp_contributable !== undefined ? item.cpp_contributable : true,
      ei_insurable: item.ei_insurable !== undefined ? item.ei_insurable : true,
      vacationable: item.vacationable !== undefined ? item.vacationable : true,
      wcb_reportable: item.wcb_reportable !== undefined ? item.wcb_reportable : true,
      t4_box: item.t4_box || "14",
      is_pre_tax: item.is_pre_tax || false,
      employer_matched: item.employer_matched || false,
    });
    setSaveError(null);
    setKebabOpenId(null);
    setDrawerOpen(true);
  }

  async function onToggleActive(item, category) {
    const isEarning = category === "earning";
    const endpoint = isEarning ? "/api/v1/pay-types/" : "/api/v1/deduction-types/";
    setKebabOpenId(null);
    try {
      const res = await fetch(API_URL + endpoint + item.id, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (isEarning) {
          setPayTypes(function(prev) { return prev.map(function(p) { return p.id === updated.id ? updated : p; }); });
        } else {
          setDeductions(function(prev) { return prev.map(function(d) { return d.id === updated.id ? updated : d; }); });
        }
      }
    } catch (err) {
      console.error("Toggle active failed", err);
    }
  }

  function onKebabDelete(item, category) {
    setDrawerCategory(category);
    setEditingId(item.id);
    setEditingIsDefault(!!item.is_default);
    setDraft({ name: item.name });
    setKebabOpenId(null);
    setConfirmDelete(true);
  }

  // Close kebab on outside click
  React.useEffect(function() {
    if (!kebabOpenId) return;
    function handleClick() { setKebabOpenId(null); }
    document.addEventListener("click", handleClick);
    return function() { document.removeEventListener("click", handleClick); };
  }, [kebabOpenId]);

  if (loading) {
    return React.createElement("div", { style: { padding: 60, textAlign: "center", color: C.muted, fontSize: 13 } }, "Loading pay types...");
  }

  return (
    <div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 8, paddingBottom: 24, borderBottom: "1px solid " + C.line }}>
        <div style={{ flex: 1, maxWidth: 560 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: "-0.018em", marginBottom: 6 }}>Pay types &amp; deductions</h1>
          <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>Define the earnings and deductions that drive every pay run. Each item carries the tax treatment rules Novala applies automatically when you process payroll.</p>
        </div>
        <button onClick={() => openAddDrawer(activeTab === "earnings" ? "earning" : "deduction")} style={{ background: "#0E1A1A", color: "#fff", border: 0, borderRadius: 6, padding: "10px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 7, boxShadow: "0 1px 2px rgba(10,26,30,.08)" }}>
          <Plus size={13} strokeWidth={2.2} />
          New item
        </button>
      </div>

      {/* Context strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0 24px", fontSize: 12, color: C.muted, borderBottom: "1px solid " + C.line, marginBottom: 32 }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#0D8050", flex: "0 0 5px" }}></span>
        <span>Configured for <strong style={{ color: C.ink, fontWeight: 600 }}>{companyConfig.name}</strong>. Tax flags follow CRA payroll rules.</span>
        {companyProvince && (<><span style={{ color: C.line, fontSize: 16, lineHeight: 1 }}>·</span>
        <span>Province: <strong style={{ color: C.ink, fontWeight: 600 }}>{companyProvince}</strong></span></>)}
        <span style={{ color: C.line, fontSize: 16, lineHeight: 1 }}>·</span>
        <span>{payTypes.length + deductions.length} items configured</span>
        {lastUpdated && (<><span style={{ color: C.line, fontSize: 16, lineHeight: 1 }}>·</span>
        <span>Last updated <strong style={{ color: C.ink, fontWeight: 600 }}>{lastUpdated}</strong></span></>)}
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 32 }}>
        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.faint, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>Earnings configured</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, marginBottom: 6 }}>{payTypes.length}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{defaultPayTypeCount} default · {customPayTypeCount} custom</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.faint, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>Deductions configured</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, marginBottom: 6 }}>{deductions.length}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{defaultDeductionCount} default · {customDeductionCount} custom</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.faint, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>In active use</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, marginBottom: 6 }}>{payTypes.filter(function(p) { return p.is_active; }).length + deductions.filter(function(d) { return d.is_active; }).length}</div>
          <div style={{ fontSize: 12, color: C.muted }}>across your employees</div>
        </div>
      </div>

      {/* Segment control */}
      <div style={{ display: "inline-flex", background: C.surface2 || "#F4F6F8", borderRadius: 8, padding: 3, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("earnings")} style={{ padding: "7px 16px", fontSize: 13, fontWeight: activeTab === "earnings" ? 600 : 500, color: activeTab === "earnings" ? C.ink : C.muted, cursor: "pointer", borderRadius: 6, fontFamily: FONT, background: activeTab === "earnings" ? "#fff" : "transparent", border: 0, display: "inline-flex", alignItems: "center", gap: 7, boxShadow: activeTab === "earnings" ? "0 1px 2px rgba(10,26,30,.08)" : "none" }}>
          Earnings <span style={{ fontSize: 11.5, fontWeight: 600, color: activeTab === "earnings" ? C.muted : C.faint, background: C.surface2 || "#F4F6F8", padding: "1px 7px", borderRadius: 10 }}>{payTypes.length}</span>
        </button>
        <button onClick={() => setActiveTab("deductions")} style={{ padding: "7px 16px", fontSize: 13, fontWeight: activeTab === "deductions" ? 600 : 500, color: activeTab === "deductions" ? C.ink : C.muted, cursor: "pointer", borderRadius: 6, fontFamily: FONT, background: activeTab === "deductions" ? "#fff" : "transparent", border: 0, display: "inline-flex", alignItems: "center", gap: 7, boxShadow: activeTab === "deductions" ? "0 1px 2px rgba(10,26,30,.08)" : "none" }}>
          Deductions <span style={{ fontSize: 11.5, fontWeight: 600, color: activeTab === "deductions" ? C.muted : C.faint, background: C.surface2 || "#F4F6F8", padding: "1px 7px", borderRadius: 10 }}>{deductions.length}</span>
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>All {activeTab === "earnings" ? "earnings" : "deductions"}</span>
          <span style={{ fontSize: 12, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
            {activeTab === "earnings" ? filteredPayTypes.length : filteredDeductions.length} items
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint, pointerEvents: "none" }} />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "8px 12px 8px 36px", border: "1px solid " + C.line, borderRadius: 6, fontFamily: FONT, fontSize: 12.5, color: C.ink, width: 240, outline: "none", background: "#fff" }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1.2fr 56px", gap: 18, padding: "13px 22px", background: "#FCFCFD", borderBottom: "1px solid " + C.line, fontSize: 10.5, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          <div>Name</div>
          <div>Calculation</div>
          <div>Tax treatment</div>
          <div></div>
        </div>

        {activeTab === "earnings" && filteredPayTypes.map(function(pt, idx) {
          const calc = formatCalc(pt, false);
          const tax = formatTaxTreatment(pt);
          return (
            <div key={pt.id} onClick={() => openEditDrawer(pt, "earning")} style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1.2fr 56px", gap: 18, padding: "16px 22px", borderBottom: "1px solid " + C.lineSoft, alignItems: "center", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: tax.nonTax ? C.faint : "#0D8050", flex: "0 0 8px" }}></div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 2, letterSpacing: "-0.005em" }}>{pt.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>{pt.description || (pt.is_default ? "" : "Custom")}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.ink, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums" }}>
                {calc.main}{calc.suffix && <span style={{ color: C.faint, fontWeight: 400, fontFamily: FONT, marginLeft: 2, fontSize: 11.5 }}> {calc.suffix}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: C.text }}>
                <span style={{ fontWeight: 500, color: tax.nonTax ? C.muted : C.ink, fontStyle: tax.nonTax ? "italic" : "normal" }}>{tax.primary}</span>
                {tax.secondary && <span style={{ color: C.muted, fontSize: 11.5, marginTop: 2, display: "block" }}>{tax.secondary}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", position: "relative" }} onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => { e.stopPropagation(); setKebabOpenId(kebabOpenId === pt.id ? null : pt.id); }} style={{ background: "none", border: "1px solid transparent", borderRadius: 5, width: 28, height: 28, cursor: "pointer", color: C.faint, display: "grid", placeItems: "center", fontFamily: FONT }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                </button>
                {kebabOpenId === pt.id && (
                  <div style={Object.assign({ position: "absolute", right: 0, background: "#fff", border: "1px solid " + C.line, borderRadius: 8, boxShadow: "0 8px 24px rgba(10,26,30,.12)", minWidth: 160, zIndex: 100, padding: 4 }, idx >= filteredPayTypes.length - 2 ? { bottom: 32 } : { top: 32 })}>
                    <button onClick={(e) => { e.stopPropagation(); setKebabOpenId(null); openEditDrawer(pt, "earning"); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 12px", background: "none", border: 0, fontSize: 13, color: C.ink, cursor: "pointer", borderRadius: 5, fontFamily: FONT, textAlign: "left" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: C.muted, flex: "0 0 13px" }}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDuplicate(pt, "earning"); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 12px", background: "none", border: 0, fontSize: 13, color: C.ink, cursor: "pointer", borderRadius: 5, fontFamily: FONT, textAlign: "left" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: C.muted, flex: "0 0 13px" }}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Duplicate
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onToggleActive(pt, "earning"); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 12px", background: "none", border: 0, fontSize: 13, color: C.ink, cursor: "pointer", borderRadius: 5, fontFamily: FONT, textAlign: "left" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: C.muted, flex: "0 0 13px" }}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
                      {pt.is_active ? "Deactivate" : "Activate"}
                    </button>
                    {!pt.is_default && (
                      <>
                        <div style={{ height: 1, background: C.lineSoft, margin: "4px 8px" }}></div>
                        <button onClick={(e) => { e.stopPropagation(); onKebabDelete(pt, "earning"); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 12px", background: "none", border: 0, fontSize: 13, color: "#B53B2E", cursor: "pointer", borderRadius: 5, fontFamily: FONT, textAlign: "left" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: "0 0 13px" }}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {activeTab === "deductions" && filteredDeductions.map(function(d, idx) {
          const calc = formatCalc(d, true);
          const tax = formatDeductionTreatment(d);
          return (
            <div key={d.id} onClick={() => openEditDrawer(d, "deduction")} style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1.2fr 56px", gap: 18, padding: "16px 22px", borderBottom: "1px solid " + C.lineSoft, alignItems: "center", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "#9C5A0F", flex: "0 0 8px" }}></div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 2, letterSpacing: "-0.005em" }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>{d.description || (d.is_default ? "" : "Custom")}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.ink, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums" }}>
                {calc.main}{calc.suffix && <span style={{ color: C.faint, fontWeight: 400, fontFamily: FONT, marginLeft: 2, fontSize: 11.5 }}> {calc.suffix}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: C.text }}>
                <span style={{ fontWeight: 500, color: C.ink }}>{tax.primary}</span>
                {tax.secondary && <span style={{ color: C.muted, fontSize: 11.5, marginTop: 2, display: "block" }}>{tax.secondary}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", position: "relative" }} onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => { e.stopPropagation(); setKebabOpenId(kebabOpenId === d.id ? null : d.id); }} style={{ background: "none", border: "1px solid transparent", borderRadius: 5, width: 28, height: 28, cursor: "pointer", color: C.faint, display: "grid", placeItems: "center", fontFamily: FONT }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                </button>
                {kebabOpenId === d.id && (
                  <div style={Object.assign({ position: "absolute", right: 0, background: "#fff", border: "1px solid " + C.line, borderRadius: 8, boxShadow: "0 8px 24px rgba(10,26,30,.12)", minWidth: 160, zIndex: 100, padding: 4 }, idx >= filteredDeductions.length - 2 ? { bottom: 32 } : { top: 32 })}>
                    <button onClick={(e) => { e.stopPropagation(); setKebabOpenId(null); openEditDrawer(d, "deduction"); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 12px", background: "none", border: 0, fontSize: 13, color: C.ink, cursor: "pointer", borderRadius: 5, fontFamily: FONT, textAlign: "left" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: C.muted, flex: "0 0 13px" }}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDuplicate(d, "deduction"); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 12px", background: "none", border: 0, fontSize: 13, color: C.ink, cursor: "pointer", borderRadius: 5, fontFamily: FONT, textAlign: "left" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: C.muted, flex: "0 0 13px" }}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Duplicate
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onToggleActive(d, "deduction"); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 12px", background: "none", border: 0, fontSize: 13, color: C.ink, cursor: "pointer", borderRadius: 5, fontFamily: FONT, textAlign: "left" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: C.muted, flex: "0 0 13px" }}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
                      {d.is_active ? "Deactivate" : "Activate"}
                    </button>
                    {!d.is_default && (
                      <>
                        <div style={{ height: 1, background: C.lineSoft, margin: "4px 8px" }}></div>
                        <button onClick={(e) => { e.stopPropagation(); onKebabDelete(d, "deduction"); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 12px", background: "none", border: 0, fontSize: 13, color: "#B53B2E", cursor: "pointer", borderRadius: 5, fontFamily: FONT, textAlign: "left" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: "0 0 13px" }}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>


      {/* Drawer: Add/Edit Pay Type or Deduction */}
      {drawerOpen && createPortal(
        <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(10,26,30,.42)", zIndex: 1500, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 560, height: "100vh", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-20px 0 60px rgba(10,26,30,.18)", overflow: "hidden", fontFamily: FONT }}>

            {/* Header */}
            <div style={{ padding: "24px 32px 20px", borderBottom: "1px solid " + C.line, flex: "0 0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: C.ink, letterSpacing: "-0.015em" }}>
                  {drawerMode === "add" ? "New" : "Edit"} {drawerCategory === "earning" ? "earning" : "deduction"}
                </div>
                <button onClick={closeDrawer} style={{ width: 30, height: 30, borderRadius: 6, border: 0, background: "transparent", color: C.muted, cursor: "pointer", display: "grid", placeItems: "center", fontFamily: FONT }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
                Configure how this item is calculated. Tax treatment options coming next.
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Section: Item type */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", paddingBottom: 8, borderBottom: "1px solid " + C.lineSoft }}>Item type</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div onClick={() => drawerMode === "add" && setDrawerCategory("earning")} style={{ padding: "14px 16px", border: "1.5px solid " + (drawerCategory === "earning" ? C.ink : C.line), borderRadius: 8, cursor: drawerMode === "add" ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 12, background: drawerCategory === "earning" ? "#FAFBFC" : "#fff", opacity: drawerMode === "add" ? 1 : 0.6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: "#0D8050", flex: "0 0 10px" }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 2 }}>Earning</div>
                      <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.45 }}>Money paid to employees</div>
                    </div>
                  </div>
                  <div onClick={() => drawerMode === "add" && setDrawerCategory("deduction")} style={{ padding: "14px 16px", border: "1.5px solid " + (drawerCategory === "deduction" ? C.ink : C.line), borderRadius: 8, cursor: drawerMode === "add" ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 12, background: drawerCategory === "deduction" ? "#FAFBFC" : "#fff", opacity: drawerMode === "add" ? 1 : 0.6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: "#9C5A0F", flex: "0 0 10px" }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 2 }}>Deduction</div>
                      <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.45 }}>Money taken from paycheck</div>
                    </div>
                  </div>
                </div>
                {drawerMode === "edit" && <div style={{ fontSize: 11.5, color: C.muted, fontStyle: "italic" }}>Item type cannot be changed after creation.</div>}
              </div>

              {/* Section: Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", paddingBottom: 8, borderBottom: "1px solid " + C.lineSoft }}>Details</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: C.text }}>Name</label>
                  <input type="text" value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder={drawerCategory === "earning" ? "e.g., Care visit bonus" : "e.g., Parking fee"}
                    style={{ padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 6, fontFamily: FONT, fontSize: 13.5, color: C.ink, background: "#fff", outline: "none", width: "100%" }} />
                  <span style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>Appears on pay stubs and pay runs</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: C.text }}>Description (optional)</label>
                  <input type="text" value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="Brief internal description"
                    style={{ padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 6, fontFamily: FONT, fontSize: 13.5, color: C.ink, background: "#fff", outline: "none", width: "100%" }} />
                </div>
              </div>

              {/* Section: Calculation method */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", paddingBottom: 8, borderBottom: "1px solid " + C.lineSoft }}>Calculation method</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(drawerCategory === "earning" ? [
                    { key: "fixed", name: "Fixed amount", formula: "amount per pay period" },
                    { key: "rate_hours", name: "Rate x hours", formula: "hourly_rate x hours_worked" },
                    { key: "rate_units", name: "Rate x units", formula: "unit_rate x quantity (visits, km, etc.)" },
                    { key: "percent_gross", name: "Percentage of gross", formula: "percentage x gross_pay" },
                  ] : [
                    { key: "fixed", name: "Fixed amount", formula: "amount per pay period" },
                    { key: "percent_gross", name: "Percentage of gross", formula: "percentage x gross_pay" },
                  ]).map(function(opt) {
                    const isActive = draft.calc_method === opt.key;
                    return (
                      <div key={opt.key} onClick={() => setDraft({ ...draft, calc_method: opt.key })} style={{ padding: "12px 14px", border: "1px solid " + (isActive ? C.ink : C.line), borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 11, background: isActive ? "#F7F9FB" : "#fff" }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid " + (isActive ? C.ink : "#C2CCD8"), flex: "0 0 16px", position: "relative" }}>
                          {isActive && <div style={{ position: "absolute", inset: 3, background: C.ink, borderRadius: "50%" }}></div>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 1 }}>{opt.name}</div>
                          <div style={{ fontSize: 11.5, color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>{opt.formula}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Conditional fields based on calc method */}
                {(draft.calc_method === "rate_hours" || draft.calc_method === "rate_units" || draft.calc_method === "percent_gross" || (draft.calc_method === "fixed" && drawerCategory === "deduction")) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 6 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 600, color: C.text }}>
                        {draft.calc_method === "percent_gross" ? "Default percentage" : "Default rate"}
                      </label>
                      <div style={{ position: "relative" }}>
                        {draft.calc_method !== "percent_gross" && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13.5, pointerEvents: "none", fontFamily: "'JetBrains Mono', monospace" }}>$</span>}
                        <input type="text" inputMode="decimal" value={drawerCategory === "earning" ? (draft.default_rate || "") : (draft.default_amount || "")}
                          onChange={(e) => setDraft(drawerCategory === "earning" ? { ...draft, default_rate: e.target.value } : { ...draft, default_amount: e.target.value })}
                          placeholder={draft.calc_method === "percent_gross" ? "5.00" : "25.00"}
                          style={{ padding: draft.calc_method === "percent_gross" ? "10px 12px" : "10px 12px 10px 26px", border: "1px solid " + C.line, borderRadius: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, color: C.ink, background: "#fff", outline: "none", width: "100%" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 600, color: C.text }}>Unit label</label>
                      <input type="text" value={draft.unit_label || ""} onChange={(e) => setDraft({ ...draft, unit_label: e.target.value })}
                        placeholder={draft.calc_method === "percent_gross" ? "% of gross" : (draft.calc_method === "rate_hours" ? "per hour" : "per visit, per km")}
                        style={{ padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 6, fontFamily: FONT, fontSize: 13.5, color: C.ink, background: "#fff", outline: "none", width: "100%" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Tax treatment - EARNINGS */}
              {drawerCategory === "earning" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", paddingBottom: 8, borderBottom: "1px solid " + C.lineSoft }}>Tax treatment · Canada</div>

                  <div style={{ padding: "12px 14px", background: C.tealSoft, borderLeft: "2px solid " + C.teal, borderRadius: "0 6px 6px 0", fontSize: 12, color: C.tealInk, lineHeight: 1.55, display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flex: "0 0 14px", marginTop: 1 }}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>
                    <span>These flags determine how Novala calculates federal tax, CPP, EI, and vacation pay for this item.</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid " + C.line, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                    {[
                      { key: "federal_taxable", name: "Federal taxable", desc: "Counts toward federal and provincial income tax" },
                      { key: "cpp_contributable", name: "CPP contributable", desc: "Counts toward Canada Pension Plan contributions" },
                      { key: "ei_insurable", name: "EI insurable", desc: "Counts toward Employment Insurance premiums" },
                      { key: "vacationable", name: "Vacationable", desc: "Accrues vacation pay on this earning" },
                      { key: "wcb_reportable", name: "WCB reportable", desc: "Counts toward Workers Compensation Board reporting" },
                    ].map(function(flag, idx, arr) {
                      const isOn = !!draft[flag.key];
                      return (
                        <div key={flag.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 14px", borderBottom: idx === arr.length - 1 ? "none" : "1px solid " + C.lineSoft, gap: 14 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 1 }}>{flag.name}</div>
                            <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.45 }}>{flag.desc}</div>
                          </div>
                          <div onClick={() => setDraft({ ...draft, [flag.key]: !isOn })} style={{ position: "relative", width: 38, height: 22, flex: "0 0 38px", cursor: "pointer" }}>
                            <div style={{ position: "absolute", inset: 0, background: isOn ? C.teal : "#D7DCE3", borderRadius: 11, transition: "background .18s" }}></div>
                            <div style={{ position: "absolute", height: 16, width: 16, left: isOn ? 19 : 3, bottom: 3, background: "#fff", borderRadius: "50%", transition: "left .18s", boxShadow: "0 1px 2px rgba(0,0,0,.15)" }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section: Tax treatment - DEDUCTIONS */}
              {drawerCategory === "deduction" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", paddingBottom: 8, borderBottom: "1px solid " + C.lineSoft }}>Tax treatment · Canada</div>

                  <div style={{ padding: "12px 14px", background: C.tealSoft, borderLeft: "2px solid " + C.teal, borderRadius: "0 6px 6px 0", fontSize: 12, color: C.tealInk, lineHeight: 1.55, display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flex: "0 0 14px", marginTop: 1 }}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>
                    <span>Pre-tax deductions reduce the employee's taxable income. Employer-matched means the company contributes too.</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid " + C.line, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                    {[
                      { key: "is_pre_tax", name: "Pre-tax", desc: "Reduces the employee's taxable income before tax is calculated" },
                      { key: "employer_matched", name: "Employer matched", desc: "The company contributes an equivalent or matching amount" },
                    ].map(function(flag, idx, arr) {
                      const isOn = !!draft[flag.key];
                      return (
                        <div key={flag.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 14px", borderBottom: idx === arr.length - 1 ? "none" : "1px solid " + C.lineSoft, gap: 14 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 1 }}>{flag.name}</div>
                            <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.45 }}>{flag.desc}</div>
                          </div>
                          <div onClick={() => setDraft({ ...draft, [flag.key]: !isOn })} style={{ position: "relative", width: 38, height: 22, flex: "0 0 38px", cursor: "pointer" }}>
                            <div style={{ position: "absolute", inset: 0, background: isOn ? C.teal : "#D7DCE3", borderRadius: 11, transition: "background .18s" }}></div>
                            <div style={{ position: "absolute", height: 16, width: 16, left: isOn ? 19 : 3, bottom: 3, background: "#fff", borderRadius: "50%", transition: "left .18s", boxShadow: "0 1px 2px rgba(0,0,0,.15)" }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section: Reporting (earnings only) */}
              {drawerCategory === "earning" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", paddingBottom: 8, borderBottom: "1px solid " + C.lineSoft }}>Reporting</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: C.text }}>T4 box (year-end reporting)</label>
                    <select value={draft.t4_box || "14"} onChange={(e) => setDraft({ ...draft, t4_box: e.target.value })}
                      style={{ padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 6, fontFamily: FONT, fontSize: 13.5, color: C.ink, background: "#fff", outline: "none", width: "100%", cursor: "pointer" }}>
                      <option value="14">Box 14 - Employment income (default)</option>
                      <option value="24">Box 24 - EI insurable earnings</option>
                      <option value="26">Box 26 - CPP pensionable earnings</option>
                      <option value="40">Box 40 - Other taxable allowances and benefits</option>
                      <option value="custom">Custom box</option>
                    </select>
                    <span style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>Used when generating T4 slips at year-end</span>
                  </div>
                </div>
              )}

              {/* Save error */}
              {saveError && (
                <div style={{ padding: "10px 12px", background: "#FBEDEC", border: "1px solid #F0C3BC", borderRadius: 6, fontSize: 12.5, color: "#B53B2E" }}>
                  {saveError}
                </div>
              )}

            </div>

            {/* Footer */}
            <div style={{ padding: "18px 32px", borderTop: "1px solid " + C.line, background: "#fff", display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
              {drawerMode === "edit" && !editingIsDefault && (
                <button onClick={() => setConfirmDelete(true)} disabled={saving || deleting} style={{ padding: "9px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: (saving || deleting) ? "not-allowed" : "pointer", fontFamily: FONT, border: "1px solid #F0C3BC", background: "#fff", color: "#B53B2E", display: "inline-flex", alignItems: "center", gap: 6, marginRight: "auto" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Delete this {drawerCategory}
                </button>
              )}
              {drawerMode === "edit" && editingIsDefault && (
                <span style={{ fontSize: 11.5, color: C.faint, fontStyle: "italic", marginRight: "auto" }}>Default items cannot be deleted</span>
              )}
              <button onClick={closeDrawer} disabled={saving || deleting} style={{ padding: "9px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: (saving || deleting) ? "not-allowed" : "pointer", fontFamily: FONT, border: "1px solid " + C.line, background: "#fff", color: C.ink, marginLeft: drawerMode === "add" ? "auto" : 0 }}>
                Cancel
              </button>
              <button onClick={onSave} disabled={saving || deleting} style={{ padding: "9px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: (saving || deleting) ? "not-allowed" : "pointer", fontFamily: FONT, border: 0, background: (saving || deleting) ? "#94A0B2" : C.ink, color: "#fff", boxShadow: "0 1px 2px rgba(10,26,30,.1)" }}>
                {saving ? "Saving..." : (drawerMode === "add" ? "Create " + drawerCategory : "Save changes")}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && createPortal(
        <div onClick={() => setConfirmDelete(false)} style={{ position: "fixed", inset: 0, background: "rgba(10,26,30,.42)", zIndex: 2000, display: "grid", placeItems: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", maxWidth: 460, width: "90%", boxShadow: "0 24px 60px rgba(0,0,0,.3)", fontFamily: FONT }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 8 }}>Delete this {drawerCategory}?</h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.55 }}>
              This will permanently remove <strong style={{ color: C.ink }}>{draft.name}</strong> from your catalog. Employees currently assigned to this {drawerCategory} will need to be reassigned. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(false)} disabled={deleting} style={{ background: "#fff", color: C.ink, border: "1px solid " + C.line, borderRadius: 6, padding: "9px 16px", fontWeight: 500, fontSize: 13, cursor: deleting ? "not-allowed" : "pointer", fontFamily: FONT }}>
                Cancel
              </button>
              <button onClick={onDelete} disabled={deleting} style={{ background: "#B53B2E", color: "#fff", border: 0, borderRadius: 6, padding: "9px 20px", fontWeight: 500, fontSize: 13, cursor: deleting ? "not-allowed" : "pointer", fontFamily: FONT, opacity: deleting ? 0.7 : 1 }}>
                {deleting ? "Deleting..." : ("Yes, delete " + drawerCategory)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Footer note */}
      <div style={{ marginTop: 24, padding: "18px 22px", background: "#fff", border: "1px solid " + C.line, borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 14, fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.surface2 || "#F4F6F8", color: "#2A3F45", display: "grid", placeItems: "center", flex: "0 0 32px" }}>
          <Shield size={16} strokeWidth={1.8} />
        </div>
        <div>
          <strong style={{ color: C.ink, fontWeight: 600, display: "block", marginBottom: 2 }}>How tax treatment drives your payroll</strong>
          Each item's tax flags tell Novala which earnings count toward CPP, EI, and federal tax, and which deductions reduce taxable income. Default settings match current CRA rules. Add and edit coming soon.
        </div>
      </div>

    </div>
  );
}


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
                    <Icon width={14} height={14} style={{ flex: "0 0 14px", color: isActive ? C.tealInk : C.faint }} />
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
          {activeId === "bank" && <BankAccountSection />}
          {activeId === "locations" && <WorkLocationsSection businessCountry={businessCountry} />}
                    {activeId === "items" && <PayTypesSection businessCountry={businessCountry} />}
          {activeId === "review" && <ComingSoonSection title={SECTIONS.find(s => s.id === activeId)?.label} />}
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
    const initialState = { frequency: "semi_monthly", first_payday: "", config: {} };
    const [data, setData] = useState(initialState);
    const [original, setOriginal] = useState(initialState);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      fetch(API_URL + "/api/v1/payroll/settings", { headers: authHeaders() })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d) {
            const initial = {
              frequency: d.default_pay_schedule || "semi_monthly",
              first_payday: d.pay_period_anchor_date || "",
              config: d.pay_schedule_config || {},
            };
            // Smart defaults for semi-monthly if config is empty
            if (initial.frequency === "semi_monthly" && (!initial.config.first_day && !initial.config.second_day)) {
              initial.config = { first_day: 15, second_day: "last" };
            } else if (initial.frequency === "monthly" && !initial.config.day_of_month) {
              initial.config = { day_of_month: "last_business" };
            } else if ((initial.frequency === "weekly" || initial.frequency === "bi_weekly") && !initial.config.weekday) {
              initial.config = { weekday: "Friday" };
            }
            setData(initial); setOriginal(initial);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, []);

    const dirty = JSON.stringify(data) !== JSON.stringify(original);

    // Determine if all required fields are filled for the selected frequency
    const isComplete = () => {
      if (data.frequency === "weekly" || data.frequency === "bi_weekly") {
        return !!(data.config.weekday && data.first_payday);
      }
      if (data.frequency === "semi_monthly") {
        return !!(data.config.first_day && data.config.second_day);
      }
      if (data.frequency === "monthly") {
        return !!data.config.day_of_month;
      }
      return false;
    };

    const onSave = async () => {
      setSaving(true);
      try {
        const res = await fetch(API_URL + "/api/v1/payroll/settings", {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify({
            default_pay_schedule: data.frequency,
            pay_period_anchor_date: data.first_payday || null,
            pay_schedule_config: data.config || {},
          }),
        });
        if (res.ok) { setOriginal(data); }
      } catch (e) {}
      setSaving(false);
    };

    const onDiscard = () => setData(original);
    const setFreq = (f) => {
      const newConfig = f === "semi_monthly" ? { first_day: 15, second_day: "last" }
                      : f === "monthly" ? { day_of_month: "last_business" }
                      : (f === "weekly" || f === "bi_weekly") ? { weekday: "Friday" }
                      : {};
      setData({ ...data, frequency: f, config: newConfig });
    };
    const setConfig = (k, v) => setData({ ...data, config: { ...data.config, [k]: v } });
    const setFirstPayday = (v) => setData({ ...data, first_payday: v });

    if (loading) return <div style={{ color: C.muted, fontSize: 13 }}>Loading...</div>;

    // === Compute upcoming paydays based on current data ===
    const computeUpcomingPaydays = () => {
      if (!isComplete()) return [];
      const today = new Date();
      const paydays = [];

      if (data.frequency === "semi_monthly") {
        const firstDay = parseInt(data.config.first_day);
        const secondDay = data.config.second_day;
        const cursor = new Date(today.getFullYear(), today.getMonth(), 1);
        for (let i = 0; i < 6 && paydays.length < 3; i++) {
          const m = new Date(cursor.getFullYear(), cursor.getMonth() + i, 1);
          // First payday
          const d1 = new Date(m.getFullYear(), m.getMonth(), firstDay);
          if (d1 >= today) paydays.push(d1);
          if (paydays.length >= 3) break;
          // Second payday
          let d2;
          if (secondDay === "last") {
            d2 = new Date(m.getFullYear(), m.getMonth() + 1, 0); // last day of month
          } else {
            d2 = new Date(m.getFullYear(), m.getMonth(), parseInt(secondDay));
          }
          if (d2 >= today) paydays.push(d2);
        }
      } else if (data.frequency === "monthly") {
        for (let i = 0; i < 6 && paydays.length < 3; i++) {
          const m = new Date(today.getFullYear(), today.getMonth() + i, 1);
          let d;
          if (data.config.day_of_month === "last" || data.config.day_of_month === "last_business") {
            d = new Date(m.getFullYear(), m.getMonth() + 1, 0);
            if (data.config.day_of_month === "last_business") {
              while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
            }
          } else {
            d = new Date(m.getFullYear(), m.getMonth(), parseInt(data.config.day_of_month) || 1);
          }
          if (d >= today) paydays.push(d);
        }
      } else if (data.frequency === "weekly" || data.frequency === "bi_weekly") {
        if (!data.first_payday) return [];
        const interval = data.frequency === "weekly" ? 7 : 14;
        let d = new Date(data.first_payday + "T12:00:00");
        while (d < today) d.setDate(d.getDate() + interval);
        for (let i = 0; i < 3; i++) {
          paydays.push(new Date(d));
          d.setDate(d.getDate() + interval);
        }
      }
      return paydays.slice(0, 3);
    };

    const upcoming = computeUpcomingPaydays();
    const formatDate = (d) => d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
    const formatFullDate = (d) => d.toLocaleDateString("en-US", { weekday: "long", year: "numeric" });
    const daysFromNow = (d) => {
      const today = new Date(); today.setHours(0,0,0,0);
      const target = new Date(d); target.setHours(0,0,0,0);
      const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
      if (diff === 0) return "Today";
      if (diff === 1) return "Tomorrow";
      return "In " + diff + " days";
    };

    const inputStyle = { width: "100%", fontFamily: FONT, fontSize: 14, color: C.ink, padding: "11px 14px", border: "1px solid " + C.line, borderRadius: 6, background: "#fff", outline: "none" };
    const labelStyle = { fontSize: 12.5, fontWeight: 600, color: C.ink, display: "block", marginBottom: 6 };

    const FREQS = [
      { id: "weekly", name: "Weekly", meta: "52 paydays per year · same weekday every week" },
      { id: "bi_weekly", name: "Bi-weekly", meta: "26 paydays per year · every 2 weeks, dates shift" },
      { id: "semi_monthly", name: "Semi-monthly", meta: "24 paydays per year · 2 fixed dates per month" },
      { id: "monthly", name: "Monthly", meta: "12 paydays per year · one date per month" },
    ];

    return (
      <>
        <SectionHead title="Pay schedule" subtitle="How often paydays happen and what dates each pay period covers. Used to count down to payday and calculate the right pay period for each run." />

        {/* Why this matters callout */}
        <div style={{ background: C.tealSoft, borderLeft: "2px solid " + C.teal, borderRadius: "0 8px 8px 0", padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "flex-start", gap: 11 }}>
          <div style={{ width: 24, height: 24, borderRadius: 5, background: "#fff", color: C.tealInk, display: "grid", placeItems: "center", flex: "0 0 24px", marginTop: 1, border: "1px solid #C9E5DD" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>
          </div>
          <div style={{ flex: 1, fontSize: 12.5, color: C.tealInk, lineHeight: 1.6 }}>
            <strong style={{ color: C.tealInk, fontWeight: 600, display: "block", marginBottom: 3 }}>Configure how your company pays employees</strong>
            Pay schedules vary by country and company. Pick the frequency that matches your existing process. If you're starting fresh, semi-monthly (15th &amp; end of month) is the most common in North America.
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "24px 26px" }}>

          {/* Pay frequency cards */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid " + C.lineSoft }}>Pay frequency</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {FREQS.map(f => {
                const selected = data.frequency === f.id;
                return (
                  <div key={f.id} onClick={() => setFreq(f.id)} style={{ background: "#fff", border: "1.5px solid " + (selected ? C.ink : C.line), borderRadius: 10, padding: "18px 20px", cursor: "pointer", transition: ".12s", boxShadow: selected ? "0 0 0 3px rgba(10,26,30,.06)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, letterSpacing: "-0.005em", marginBottom: 2 }}>{f.name}</div>
                        <div style={{ fontSize: 11.5, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{f.meta}</div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid " + (selected ? C.ink : C.line), background: selected ? C.ink : "#fff", flex: "0 0 18px", display: "grid", placeItems: "center", marginTop: 1 }}>
                        {selected && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Frequency-specific inputs */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid " + C.lineSoft }}>
              {data.frequency === "semi_monthly" ? "Semi-monthly schedule" : data.frequency === "monthly" ? "Monthly schedule" : data.frequency === "weekly" ? "Weekly schedule" : "Bi-weekly schedule"}
            </div>

            {(data.frequency === "weekly" || data.frequency === "bi_weekly") && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Payday weekday <span style={{ color: "#B53B2E", fontSize: 11 }}>required</span></label>
                    <select value={data.config.weekday || ""} onChange={(e) => setConfig("weekday", e.target.value)} style={inputStyle}>
                      <option value="">Select day...</option>
                      <option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>First payday under this schedule <span style={{ color: "#B53B2E", fontSize: 11 }}>required</span></label>
                    <input type="date" value={data.first_payday} onChange={(e) => setFirstPayday(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.55 }}>All future paydays fall on the same weekday, {data.frequency === "weekly" ? "7" : "14"} days apart from the first payday.</div>
              </>
            )}

            {data.frequency === "semi_monthly" && (
              <>
                <p style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.55, marginBottom: 14 }}>Pick the two days of the month when paydays happen. Most companies use the 15th and the last day, but you can customize.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>First payday of the month <span style={{ color: "#B53B2E", fontSize: 11 }}>required</span></label>
                    <select value={data.config.first_day || ""} onChange={(e) => setConfig("first_day", e.target.value)} style={{ ...inputStyle, fontFamily: "JetBrains Mono, monospace" }}>
                      <option value="">Select day...</option>
                      {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(n => <option key={n} value={n}>{n}{n===1?"st":n===2?"nd":n===3?"rd":"th"}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Second payday of the month <span style={{ color: "#B53B2E", fontSize: 11 }}>required</span></label>
                    <select value={data.config.second_day || ""} onChange={(e) => setConfig("second_day", e.target.value)} style={{ ...inputStyle, fontFamily: "JetBrains Mono, monospace" }}>
                      <option value="">Select day...</option>
                      {[16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map(n => <option key={n} value={n}>{n}{n===21?"st":n===22?"nd":n===23?"rd":"th"}</option>)}
                      <option value="last">Last day of month</option>
                    </select>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.55, marginTop: 12 }}>If a payday falls on a weekend, money typically moves on the closest preceding business day. Most banks handle this automatically.</div>
              </>
            )}

            {data.frequency === "monthly" && (
              <div>
                <label style={labelStyle}>Payday each month <span style={{ color: "#B53B2E", fontSize: 11 }}>required</span></label>
                <select value={data.config.day_of_month || ""} onChange={(e) => setConfig("day_of_month", e.target.value)} style={inputStyle}>
                  <option value="">Select day...</option>
                  <option value="1">1st of the month</option>
                  <option value="15">15th of the month</option>
                  <option value="last_business">Last business day of the month</option>
                  <option value="last">Last calendar day of the month</option>
                </select>
                <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.55, marginTop: 8 }}>Most companies pay on the last business day. The last calendar day option pays on the actual final day even if it's a weekend.</div>
              </div>
            )}
          </div>

          {/* Pay period & upcoming paydays */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid " + C.lineSoft }}>Pay period &amp; next paydays</div>

            {!isComplete() ? (
              <div style={{ background: "#F4F6F8", border: "1px dashed " + C.line, borderRadius: 8, padding: "24px 22px", textAlign: "center", color: C.muted, fontSize: 12.5, lineHeight: 1.55 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: C.faint, marginBottom: 10 }}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
                <div style={{ color: C.text, fontWeight: 600, marginBottom: 3 }}>Complete the fields above</div>
                <div>We'll calculate your pay periods and show the next 3 paydays here.</div>
              </div>
            ) : (
              <div style={{ background: "linear-gradient(180deg, #fff 0%, #F4F6F8 100%)", border: "1px solid " + C.line, borderRadius: 10, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, letterSpacing: "-0.005em", display: "flex", alignItems: "center", gap: 7 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: C.tealInk }}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
                    Your next {upcoming.length} payday{upcoming.length === 1 ? "" : "s"}
                  </div>
                  <span style={{ fontSize: 11, color: C.muted, fontVariantNumeric: "tabular-nums" }}>Based on your schedule</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(" + Math.min(upcoming.length, 3) + ", 1fr)", gap: 10 }}>
                  {upcoming.map((d, i) => (
                    <div key={i} style={{ background: "#fff", border: "1.5px solid " + (i === 0 ? C.ink : C.line), borderRadius: 8, padding: "14px 16px", position: "relative" }}>
                      {i === 0 && <div style={{ position: "absolute", top: -8, left: 12, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.06em", background: C.ink, color: "#fff", padding: "2px 6px", borderRadius: 3 }}>NEXT</div>}
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: i === 0 ? C.ink : C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Payday {i + 1}</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: C.ink, fontFamily: "JetBrains Mono, monospace", letterSpacing: "-0.01em", marginBottom: 1 }}>{formatDate(d)}</div>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>{formatFullDate(d)}</div>
                      <div style={{ fontSize: 10.5, color: C.tealInk, fontWeight: 500, marginTop: 6, paddingTop: 6, borderTop: "1px dashed " + C.line }}>{daysFromNow(d)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <SaveBar dirty={dirty} saving={saving} onSave={onSave} onDiscard={onDiscard} />
      </>
    );
  }
function TaxRegistrationSection({ businessCountry }) {
  const country = (businessCountry || "ca").toLowerCase();
  const STORAGE_KEY = "novala_tax_registration";
  const [data, setData] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load from backend; migrate any leftover localStorage value if present
    (async () => {
      try {
        const res = await fetch(API_URL + "/api/v1/company/profile", { headers: authHeaders() });
        if (res.ok) {
          const profile = await res.json();
          let initial = profile.tax_registration || {};

          // One-time migration: if DB is empty but localStorage has data, push it up
          if ((!initial || Object.keys(initial).length === 0)) {
            try {
              const stored = localStorage.getItem(STORAGE_KEY);
              if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && Object.keys(parsed).length > 0) {
                  await fetch(API_URL + "/api/v1/company/profile", {
                    method: "PATCH",
                    headers: authHeaders(),
                    body: JSON.stringify({ tax_registration: parsed }),
                  });
                  initial = parsed;
                  localStorage.removeItem(STORAGE_KEY);
                }
              }
            } catch (e) {}
          }

          setData(initial);
          setOriginal(initial);
        }
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const dirty = JSON.stringify(data) !== JSON.stringify(original);

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(API_URL + "/api/v1/company/profile", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ tax_registration: data }),
      });
      if (res.ok) {
        const updated = await res.json();
        const fresh = updated.tax_registration || {};
        setData(fresh);
        setOriginal(fresh);
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

// === Bank account section ===
function BankAccountSection() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(API_URL + "/api/v1/payroll/settings", { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setSettings(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onDisconnect = async () => {
    try {
      await fetch(API_URL + "/api/v1/payroll/settings", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          company_bank_name: null, company_transit_number: null,
          company_institution_number: null, company_routing_number: null,
        }),
      });
      setConfirmDisconnect(false);
      load();
    } catch (e) { alert("Disconnect failed: " + e.message); }
  };

  if (loading) return <div style={{ color: C.muted, fontSize: 13 }}>Loading...</div>;

  const hasAccount = !!(settings && settings.company_bank_name);
  const bankDetails = settings && settings.bank_details ? settings.bank_details : {};
  const verification = bankDetails.verification || {};
  const verificationStatus = verification.status || (hasAccount ? "verified" : null);
  const isVerified = verificationStatus === "verified";
  const isVerifying = verificationStatus === "verifying";
  const isLocked = verificationStatus === "locked";

  return (
    <>
      <div style={{ marginBottom: 6 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: "-0.015em", marginBottom: 4 }}>Bank account</h2>
        <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.55, maxWidth: 560 }}>The business account Novala draws from to fund payroll. You can keep more than one on file in the future; the primary handles every pay run unless you change it.</p>
      </div>

      {/* Security strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, marginBottom: 28, padding: "10px 14px", background: "#fff", border: "1px solid " + C.line, borderRadius: 8, fontSize: 12, flexWrap: "wrap" }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: C.tealSoft, color: C.tealInk, display: "grid", placeItems: "center", flex: "0 0 28px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
        </div>
        <div>
          <strong style={{ color: C.ink, fontWeight: 600 }}>Bank-grade security.</strong>{" "}
          <span style={{ color: C.muted }}>Your account details are encrypted and never stored in plain text.</span>
        </div>
        <div style={{ width: 1, height: 14, background: C.line, margin: "0 6px" }} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.green }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          <span>256-bit TLS</span>
        </span>
        <div style={{ width: 1, height: 14, background: C.line, margin: "0 6px" }} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.green }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          <span>AES-256 at rest</span>
        </span>
      </div>

      {/* Connected accounts section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.ink, letterSpacing: "0.06em", textTransform: "uppercase" }}>Connected accounts</span>
          <span style={{ fontSize: 12, color: C.faint, fontVariantNumeric: "tabular-nums" }}>{hasAccount ? "1 of 1" : "0 of 1"}</span>
        </div>
        {!hasAccount && (
          <button onClick={() => navigate("/payroll/bank/connect")} style={{ background: C.ink, color: "#fff", border: "none", borderRadius: 6, padding: "7px 13px", fontWeight: 500, fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
            Connect account
          </button>
        )}
      </div>

      {hasAccount ? (
        <>
          {/* Account table */}
          <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 130px 110px 60px", gap: 14, padding: "10px 16px", background: "#F4F6F8", borderBottom: "1px solid " + C.line, fontSize: 10.5, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", alignItems: "center" }}>
              <div>Account</div>
              <div>Number</div>
              <div>Status</div>
              <div>Role</div>
              <div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 130px 110px 60px", gap: 14, padding: "14px 16px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F4F6F8", color: "#1A2D32", display: "grid", placeItems: "center", flex: "0 0 36px", border: "1px solid " + C.line }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21h18M5 21V10M19 21V10M3 10l9-6 9 6M9 21v-5h6v5"/></svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, letterSpacing: "-0.005em" }}>{settings.company_bank_name}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>Business account</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12.5, color: C.ink, fontFamily: "JetBrains Mono, monospace", fontVariantNumeric: "tabular-nums" }}>Account on file</div>
                {(settings.company_transit_number || settings.company_institution_number) && (
                  <div style={{ fontSize: 11, color: C.faint, marginTop: 2, fontFamily: "JetBrains Mono, monospace" }}>
                    {settings.company_transit_number || ""}{settings.company_institution_number ? " · " + settings.company_institution_number : ""}
                  </div>
                )}
                {settings.company_routing_number && (
                  <div style={{ fontSize: 11, color: C.faint, marginTop: 2, fontFamily: "JetBrains Mono, monospace" }}>{settings.company_routing_number}</div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: isLocked ? C.red : isVerifying ? C.amber : C.green, fontWeight: 500 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: isLocked ? C.red : isVerifying ? C.amber : C.green, boxShadow: isLocked ? "0 0 0 3px rgba(181,59,46,.12)" : isVerifying ? "0 0 0 3px rgba(156,90,15,.12)" : "0 0 0 3px rgba(13,128,80,.12)", flex: "0 0 7px" }} />
                {isLocked ? "Locked" : isVerifying ? <span onClick={() => navigate("/payroll/bank/verify")} style={{ cursor: "pointer", textDecoration: "underline" }}>Verify now</span> : "Verified"}
              </div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, background: C.ink, color: "#fff" }}>Primary</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setConfirmDisconnect(true)} title="Disconnect" style={{ background: "none", border: "1px solid transparent", borderRadius: 5, width: 28, height: 28, cursor: "pointer", color: C.muted, display: "grid", placeItems: "center" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = C.ink; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.muted; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 8, padding: "48px 24px", textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "#F4F6F8", color: "#2A3F45", display: "grid", placeItems: "center", margin: "0 auto 16px", border: "1px solid " + C.line }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21h18M5 21V10M19 21V10M3 10l9-6 9 6M9 21v-5h6v5"/></svg>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 6, letterSpacing: "-0.005em" }}>No bank account connected</h3>
          <p style={{ fontSize: 12.5, color: C.muted, maxWidth: 380, margin: "0 auto 18px", lineHeight: 1.55 }}>Connect a business bank account so Novala can fund payroll runs. Verification takes 1 to 2 business days.</p>
          <button onClick={() => navigate("/payroll/bank/connect")} style={{ background: C.ink, color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", fontWeight: 500, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
            Connect bank account
          </button>
        </div>
      )}

      {/* Trust footer */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 8 }}>
        {[
          { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z"/></svg>, title: "Verified by micro-deposit", body: "Two small test deposits confirm ownership before any payroll funds move." },
          { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 2l-9.5 9.5M15 7l3 3M11.5 11.5a5 5 0 1 1-7 7 5 5 0 0 1 7-7z"/></svg>, title: "You stay in control", body: "Novala never moves money without a pay run you've authorized." },
          { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6"/></svg>, title: "Encrypted at rest", body: "Bank credentials are encrypted in our PostgreSQL database." },
        ].map((card, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "#F4F6F8", color: "#2A3F45", display: "grid", placeItems: "center", marginBottom: 10, border: "1px solid " + C.line }}>{card.icon}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 4, letterSpacing: "-0.005em" }}>{card.title}</div>
            <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.55 }}>{card.body}</div>
          </div>
        ))}
      </div>

      {/* Disconnect confirm modal */}
      {confirmDisconnect && (
        <div onClick={() => setConfirmDisconnect(false)} style={{ position: "fixed", inset: 0, background: "rgba(10,26,30,0.4)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 10, padding: "28px 32px", maxWidth: 440, boxShadow: "0 20px 50px rgba(10,26,30,0.2)" }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: C.ink, marginBottom: 10 }}>Disconnect this bank account?</h3>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginBottom: 20 }}>You will need to reconnect a bank account before running your next payroll. Payroll history is not affected.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDisconnect(false)} style={{ background: "#fff", color: C.text, border: "1px solid " + C.line, borderRadius: 6, padding: "8px 16px", fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
              <button onClick={onDisconnect} style={{ background: "#B53B2E", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>Disconnect</button>
            </div>
          </div>
        </div>
      )}

      {/* Connect bank stub - opens Payroll Overview to use existing bank connect panel */}
      
    </>
  );
}
