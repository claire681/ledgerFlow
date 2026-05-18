import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, PlayCircle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import InvoicePreview from "../components/InvoicePreview";

const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
};

const BRAND = "#0F5959";
const BORDER = "#e2e8f0";
const TEXT = "#0F172A";
const SUBTLE = "#64748B";
const PAGE_BG = "#f8fafc";

const CUSTOMIZATION_FIELDS = [
  { key: "showInvoiceNo", label: "Invoice no." },
  { key: "showInvoiceDate", label: "Invoice date" },
  { key: "showDueDate", label: "Due date" },
  { key: "showTerms", label: "Terms" },
  { key: "showCustomerEmail", label: "Customer email" },
  { key: "showCustomerAddress", label: "Customer address" }
];

const PALETTE = [
  "#0F5959", "#047857", "#1e40af", "#6b21a8",
  "#9d174d", "#b45309", "#1e293b", "#0891b2"
];

const TEMPLATES = [
  { key: "modern", label: "Modern" },
  { key: "standard", label: "Standard" }
];

const EMPTY_INVOICE = {
  from_name: "", to_name: "", invoice_number: "",
  date: new Date().toISOString().slice(0, 10),
  due_date: "", terms: "Net 30", items: [], status: "draft"
};

const Toggle = ({ on, onClick }) => (
  <button onClick={onClick} style={{
    width: 38, height: 22, borderRadius: 11, position: "relative",
    background: on ? BRAND : "#cbd5e1", border: "none", cursor: "pointer",
    transition: "background 0.2s", flexShrink: 0
  }}>
    <div style={{
      width: 16, height: 16, borderRadius: "50%", background: "#fff",
      position: "absolute", top: 3, left: on ? 19 : 3,
      transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
    }} />
  </button>
);

const topBtn = (isMobile) => ({
  display: "flex", alignItems: "center", gap: 6,
  padding: isMobile ? "6px 8px" : "6px 12px",
  background: "none", border: "none", cursor: "pointer",
  fontSize: 13, color: SUBTLE
});

export default function InvoiceEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("edit");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [openSections, setOpenSections] = useState({ customization: true, payment: false, design: false, scheduling: false });
  const [invoice, setInvoice] = useState(EMPTY_INVOICE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customization, setCustomization] = useState({
    showInvoiceNo: true, showInvoiceDate: true, showDueDate: true,
    showTerms: true, showCustomerEmail: true, showCustomerAddress: true
  });
  const [accentColor, setAccentColor] = useState(BRAND);
  const [templateChoice, setTemplateChoice] = useState("modern");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    if (!id || id === "new") { setInvoice(EMPTY_INVOICE); return; }
    setLoading(true); setError(null);
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    fetch("https://api.getnovala.com/api/v1/invoices/" + id, { headers: { Authorization: "Bearer " + token } })
      .then(r => { if (!r.ok) throw new Error("Failed to load invoice (" + r.status + ")"); return r.json(); })
      .then(data => { setInvoice(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  const toggleSection = (k) => setOpenSections(s => ({ ...s, [k]: !s[k] }));
  const toggleField = (k) => setCustomization(s => ({ ...s, [k]: !s[k] }));
  const handleFieldChange = (field, value) => setInvoice(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const isNew = !id || id === "new";
    setSaving(true); setSaveMessage(null);
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    try {
      const url = isNew ? "https://api.getnovala.com/api/v1/invoices/" : "https://api.getnovala.com/api/v1/invoices/" + id;
      const method = isNew ? "POST" : "PATCH";
      const body = isNew ? JSON.stringify({
        invoice_number: invoice.invoice_number || ("DRAFT-" + Date.now()),
        date: invoice.date || new Date().toISOString().slice(0, 10),
        due_date: invoice.due_date || new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 10),
        terms: invoice.terms || "Net 30",
        from_name: invoice.from_name || "",
        to_name: invoice.to_name || "",
        items: invoice.items || [],
        status: "draft"
      }) : JSON.stringify({ to_name: invoice.to_name, to_email: invoice.to_email, to_address: invoice.to_address, invoice_number: invoice.invoice_number, terms: invoice.terms, date: invoice.date, due_date: invoice.due_date });
      const res = await fetch(url, {
        method,
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body
      });
      if (!res.ok) throw new Error("Save failed (" + res.status + ")");
      const data = await res.json();
      setSaveMessage({ type: "success", text: isNew ? "Invoice created" : "Saved" });
      if (isNew && data.id) {
        setTimeout(() => navigate("/invoices/" + data.id + "/edit"), 800);
      }
    } catch (e) {
      setSaveMessage({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (saveMessage) {
      const t = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [saveMessage]);

  const headerNumber = invoice.invoice_number || (id === "new" ? "new" : id);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: PAGE_BG, fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "14px 24px", background: "#fff", borderBottom: "1px solid " + BORDER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/invoices")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
            <ArrowLeft size={20} color={TEXT} />
          </button>
          <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: TEXT }}>Invoice {headerNumber}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 2 : 8 }}>
          <button onClick={() => setSidebarOpen(s => !s)} style={topBtn(isMobile)}><Settings size={16} /><span>{isMobile ? "" : "Manage"}</span></button>
          <button style={topBtn(isMobile)}><PlayCircle size={16} /><span>{isMobile ? "" : "Take tour"}</span></button>
          <button style={topBtn(isMobile)}><MessageSquare size={16} /><span>{isMobile ? "" : "Feedback"}</span></button>
        </div>
      </div>

      <div style={{ display: "flex", padding: isMobile ? "0 16px" : "0 24px", background: "#fff", borderBottom: "1px solid " + BORDER }}>
        {[{ k: "edit", l: "Edit" }, { k: "email", l: "Email view" }, { k: "pdf", l: "PDF view" }].map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)} style={{
            background: "none", border: "none", padding: "12px 16px", cursor: "pointer",
            fontSize: 14, fontWeight: activeTab === t.k ? 600 : 500,
            color: activeTab === t.k ? BRAND : SUBTLE,
            borderBottom: activeTab === t.k ? "2px solid " + BRAND : "2px solid transparent",
            marginBottom: -1
          }}>{t.l}</button>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", flexDirection: isMobile ? "column" : "row" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 32, background: PAGE_BG }}>
          <div style={{ maxWidth: 800, margin: "0 auto", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", minHeight: 400, overflow: "hidden" }}>
            {loading ? <div style={{ padding: 40, textAlign: "center", color: SUBTLE, fontSize: 14 }}>Loading invoice...</div>
              : error ? <div style={{ padding: 40, textAlign: "center", color: "#dc2626", fontSize: 14 }}>Error: {error}</div>
              : <InvoicePreview inv={invoice} customization={customization} accentColor={accentColor} template={templateChoice} onFieldChange={handleFieldChange} />}
          </div>
        </div>

        {sidebarOpen && (
          <div style={{ width: isMobile ? "100%" : 360, background: "#fff", borderLeft: isMobile ? "none" : "1px solid " + BORDER, borderTop: isMobile ? "1px solid " + BORDER : "none", overflowY: "auto", padding: 16 }}>
            {[
              { k: "customization", t: "Customization" },
              { k: "payment", t: "Payment options" },
              { k: "design", t: "Design" },
              { k: "scheduling", t: "Scheduling" }
            ].map(s => (
              <div key={s.k} style={{ borderBottom: "1px solid " + BORDER, padding: "14px 4px" }}>
                <button onClick={() => toggleSection(s.k)} style={{
                  width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  fontSize: 14, fontWeight: 600, color: TEXT
                }}>
                  <span>{s.t}</span>
                  {openSections[s.k] ? <ChevronUp size={16} color={SUBTLE} /> : <ChevronDown size={16} color={SUBTLE} />}
                </button>
                {openSections[s.k] && s.k === "customization" && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: SUBTLE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Header fields</div>
                    {CUSTOMIZATION_FIELDS.map(f => (
                      <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                        <span style={{ fontSize: 13, color: TEXT }}>{f.label}</span>
                        <Toggle on={customization[f.key]} onClick={() => toggleField(f.key)} />
                      </div>
                    ))}
                  </div>
                )}
                {openSections[s.k] && s.k === "design" && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: SUBTLE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Template</div>
                    {TEMPLATES.map(t => (
                      <label key={t.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer" }}>
                        <input type="radio" checked={templateChoice === t.key} onChange={() => setTemplateChoice(t.key)} style={{ accentColor: BRAND, cursor: "pointer" }} />
                        <span style={{ fontSize: 13, color: TEXT }}>{t.label}</span>
                      </label>
                    ))}
                    <div style={{ fontSize: 11, fontWeight: 700, color: SUBTLE, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 16, marginBottom: 10 }}>Color</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: accentColor, border: "1px solid " + BORDER }} />
                      <span style={{ fontSize: 13, color: TEXT, fontFamily: "monospace" }}>{accentColor}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {PALETTE.map(color => (
                        <button key={color} onClick={() => setAccentColor(color)} style={{
                          width: 36, height: 36, borderRadius: "50%", background: color, cursor: "pointer", padding: 0,
                          border: accentColor === color ? "3px solid #0F172A" : "1px solid " + BORDER
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                {openSections[s.k] && s.k !== "customization" && s.k !== "design" && (
                  <div style={{ marginTop: 12, fontSize: 13, color: SUBTLE, lineHeight: 1.5 }}>
                    Controls for {s.t.toLowerCase()} land in a later step.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "14px 24px", background: "#fff", borderTop: "1px solid " + BORDER }}>
        <button style={{ background: "none", border: "none", color: SUBTLE, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>Print or download</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: "8px 14px", background: "#fff", border: "1px solid " + BORDER, borderRadius: 6, fontSize: 14, fontWeight: 500, color: TEXT, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save"}</button>
          <button style={{ padding: "8px 16px", background: BRAND, border: "1px solid " + BRAND, borderRadius: 6, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Review and send</button>
        </div>
      </div>

      {saveMessage && (
        <div style={{ position: "fixed", bottom: 80, right: 24, padding: "10px 16px", background: saveMessage.type === "success" ? "#10b981" : "#dc2626", color: "#fff", borderRadius: 6, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{saveMessage.text}</div>
      )}
    </div>
  );
}
