import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, PlayCircle, MessageSquare, ChevronDown, ChevronUp, X, HelpCircle } from "lucide-react";
import InvoicePreview from "../components/InvoicePreview";
import EditCompanyDrawer, { getStoredProfile } from "../components/company/EditCompanyDrawer";
import { NewCustomerDrawer } from "../components/customers/NewCustomerDrawer";

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
const LINK = "#2563eb";

const CUSTOMIZATION_HEADER_FIELDS = [
  { key: "showShipTo", label: "Ship to" },
  { key: "showInvoiceNo", label: "Invoice no." },
  { key: "showInvoiceDate", label: "Invoice date" },
  { key: "showDueDate", label: "Due date" },
  { key: "showTerms", label: "Terms" },
  { key: "showCustomerEmail", label: "Customer email" },
  { key: "showCustomerContact", label: "Customer contact info" }
];

const TABLE_CONTENT_FIELDS = [
  { key: "tblNumber", label: "#" },
  { key: "tblServiceDate", label: "Service date" },
  { key: "tblProductService", label: "Product/service" },
  { key: "tblSku", label: "SKU" },
  { key: "tblDescription", label: "Description" },
  { key: "tblQty", label: "Qty" },
  { key: "tblRate", label: "Rate" },
  { key: "tblAmount", label: "Amount" }
];

const MORE_OPTIONS_FIELDS = [
  { key: "moInvoiceTotal", label: "Invoice total" },
  { key: "moDeposit", label: "Deposit", hasManage: true },
  { key: "moDiscount", label: "Discount" },
  { key: "moShippingFee", label: "Shipping fee" }
];

const PAYMENT_METHODS = [
  { key: "applePay", label: "Pay", style: { background: "#000", color: "#fff" } },
  { key: "visa", label: "VISA", style: { background: "#1a1f71", color: "#fff", fontWeight: 700 } },
  { key: "mastercard", label: "MC", style: { background: "#fff", color: "#eb001b", fontWeight: 700, border: "1px solid " + BORDER } },
  { key: "discover", label: "DISCOVER", style: { background: "#fff", color: "#ff6000", fontSize: 8, fontWeight: 700, border: "1px solid " + BORDER } },
  { key: "amex", label: "AMEX", style: { background: "#2e77bb", color: "#fff", fontSize: 9, fontWeight: 700 } },
  { key: "jcb", label: "JCB", style: { background: "linear-gradient(90deg,#0066b2 33%,#cc0000 33%,#cc0000 66%,#0a8b3c 66%)", color: "#fff", fontWeight: 700, fontSize: 9 } },
  { key: "bank", label: "BANK", style: { background: "#fff", color: TEXT, border: "1px solid " + BORDER, fontWeight: 600 } }
];

const PALETTE = [
  "#475569", "#1e293b", "#94a3b8", "#334155", "#84cc16", "#0e909a",
  "#2563eb", "#a3a635", "#15803d", "#7c2d12", "#c2410c", "#7c2d40",
  "#581c87", "#be185d", "#6b21a8", "#312e81"
];

const FONTS = ["Helvetica Neue", "Avenir Next", "Open Sans", "Overpass", "Source Sans Pro"];

const TEMPLATES = [
  { key: "modern", label: "Modern" },
  { key: "standard", label: "Standard" }
];

const buildEmptyInvoice = () => {
  const p = (typeof window !== "undefined") ? getStoredProfile() : {};
  return {
    from_name: p.name || "",
    from_bn: p.business_number || "",
    from_email: p.email || "",
    from_phone: p.phone || "",
    from_website: p.website || "",
    from_address: p.address || "",
    to_name: "",
    invoice_number: "",
    date: new Date().toISOString().slice(0, 10),
    due_date: "",
    terms: "Net 30",
    items: [],
    status: "draft"
  };
};

const EMPTY_INVOICE = {
  from_name: "",
  to_name: "",
  invoice_number: "",
  date: new Date().toISOString().slice(0, 10),
  due_date: "",
  terms: "Net 30",
  items: [],
  status: "draft"
};

const Toggle = ({ on, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: 38,
      height: 22,
      borderRadius: 11,
      position: "relative",
      background: on ? BRAND : "#cbd5e1",
      border: "none",
      cursor: "pointer",
      transition: "background 0.2s",
      flexShrink: 0
    }}
  >
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#fff",
        position: "absolute",
        top: 3,
        left: on ? 19 : 3,
        transition: "left 0.2s",
        boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
      }}
    />
  </button>
);

const topBtn = (isMobile) => ({
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: isMobile ? "6px 8px" : "6px 12px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  color: SUBTLE
});

export default function InvoiceEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState("edit");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [openSections, setOpenSections] = useState({
    customization: true,
    payment: false,
    design: false,
    scheduling: false
  });

  const [invoice, setInvoice] = useState(buildEmptyInvoice());
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [customization, setCustomization] = useState({
    showShipTo: false,
    showInvoiceNo: true,
    showInvoiceDate: true,
    showDueDate: true,
    showTerms: true,
    showCustomerEmail: false,
    showCustomerContact: false,
    tblNumber: true,
    tblServiceDate: false,
    tblProductService: true,
    tblSku: false,
    tblDescription: true,
    tblQty: true,
    tblRate: true,
    tblAmount: true
  });

  const [paymentOptions, setPaymentOptions] = useState({
    moInvoiceTotal: true,
    moDeposit: true,
    moDiscount: true,
    moShippingFee: false,
    moMulticurrency: false,
    moLateFees: false
  });

  const [scheduling, setScheduling] = useState({
    printLater: false,
    sendLater: false,
    invoiceReminders: false
  });

  const [accentColor, setAccentColor] = useState(BRAND);
  const [hexInput, setHexInput] = useState(BRAND);
  const [printerFriendly, setPrinterFriendly] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Helvetica Neue");
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);

  useEffect(() => {
    if (!invoice.date || !invoice.terms) return;

    const t = String(invoice.terms).toLowerCase().trim();
    let daysToAdd = null;

    if (t === "net 30" || t === "net30") daysToAdd = 30;
    else if (t === "net 15" || t === "net15") daysToAdd = 15;
    else if (t === "net 60" || t === "net60") daysToAdd = 60;
    else if (t === "net 7" || t === "net7") daysToAdd = 7;
    else if (t === "net 45" || t === "net45") daysToAdd = 45;
    else if (t.includes("due on receipt") || t === "receipt") daysToAdd = 0;

    if (daysToAdd === null) return;

    const base = new Date(invoice.date + "T00:00:00");
    base.setDate(base.getDate() + daysToAdd);

    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, "0");
    const dd = String(base.getDate()).padStart(2, "0");

    const newDue = yyyy + "-" + mm + "-" + dd;

    if (newDue !== invoice.due_date) {
      setInvoice(prev => ({ ...prev, due_date: newDue }));
    }
  }, [invoice.date, invoice.terms]);

  const [templateChoice, setTemplateChoice] = useState("modern");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saveDropdownOpen, setSaveDropdownOpen] = useState(false);
  const [reviewDropdownOpen, setReviewDropdownOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);

  useEffect(() => {
    if (!id || id === "new") {
      setInvoice(EMPTY_INVOICE);
      return;
    }

    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token") || localStorage.getItem("access_token");

    fetch("https://api.getnovala.com/api/v1/invoices/" + id, {
      headers: { Authorization: "Bearer " + token }
    })
      .then(r => {
        if (!r.ok) throw new Error("Failed to load invoice (" + r.status + ")");
        return r.json();
      })
      .then(data => {
        setInvoice(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  const toggleSection = (k) => setOpenSections(s => ({ ...s, [k]: !s[k] }));
  const toggleField = (k) => setCustomization(s => ({ ...s, [k]: !s[k] }));
  const togglePaymentOption = (k) => setPaymentOptions(s => ({ ...s, [k]: !s[k] }));
  const toggleScheduling = (k) => setScheduling(s => ({ ...s, [k]: !s[k] }));

  const handleEditTotalsClick = () => {
    setSidebarOpen(true);
    setOpenSections({ customization: false, payment: true, design: false, scheduling: false });
  };

  const handleHexChange = (val) => {
    setHexInput(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      setAccentColor(val);
    }
  };

  const handleSwatchClick = (color) => {
    setAccentColor(color);
    setHexInput(color);
  };

  const handleFieldChange = (field, value) =>
    setInvoice(prev => ({ ...prev, [field]: value }));

  const handleCustomerSelect = (c) => {
    setSelectedCustomer(c);
    setInvoice(prev => ({
      ...prev,
      to_name: c.name,
      to_email: c.email,
      to_address: c.address
    }));
  };

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditingCustomer(selectedCustomer);
      setEditCustomerOpen(true);
    }
  };

  const handleEditCustomerSave = async (customerData) => {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    const id = editingCustomer && editingCustomer.id;

    if (id && token) {
      try {
        const res = await fetch(
          "https://api.getnovala.com/api/v1/customers/" + id,
          {
            method: "PATCH",
            headers: {
              Authorization: "Bearer " + token,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(customerData)
          }
        );

        if (res.ok) {
          const updated = await res.json();
          setInvoice(prev => ({
            ...prev,
            to_name: updated.name || prev.to_name,
            to_email: updated.email || prev.to_email,
            to_address: updated.address || prev.to_address
          }));
          setSelectedCustomer(updated);
        }
      } catch (e) {
        console.error("Edit customer failed:", e);
      }
    }

    setEditCustomerOpen(false);
  };

  const handleItemChange = (i, field, value) =>
    setInvoice(prev => {
      const items = [...(prev.items || prev.line_items || [])];
      items[i] = {
        ...items[i],
        [field]: (field === "qty" || field === "rate") ? Number(value) : value
      };
      return { ...prev, items };
    });

  const handleAddItem = () =>
    setInvoice(prev => {
      const items = [...(prev.items || prev.line_items || [])];
      items.push({ description: "", qty: 1, rate: 0 });
      return { ...prev, items };
    });

  const handleDeleteItem = (i) =>
    setInvoice(prev => {
      const items = [...(prev.items || prev.line_items || [])];
      items.splice(i, 1);
      return { ...prev, items };
    });

  const handleClearItems = () =>
    setInvoice(prev => ({ ...prev, items: [] }));

  const handleSaveCompany = async (data) => {
    setInvoice(prev => ({ ...prev, ...data }));
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");

    if (id && id !== "new") {
      const res = await fetch(
        "https://api.getnovala.com/api/v1/invoices/" + id,
        {
          method: "PATCH",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        }
      );
      if (!res.ok) throw new Error("Save failed (" + res.status + ")");
    }

    try {
      await fetch("https://api.getnovala.com/api/v1/businesses/me", {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: data.from_name,
          email: data.from_email,
          phone: data.from_phone,
          address: data.from_address,
          business_number: data.from_bn,
          website: data.from_website
        })
      });
    } catch (e) {}

    setSaveMessage({ type: "success", text: "Company info updated" });
  };

  const handleSave = async () => {
    const isNew = !id || id === "new";
    setSaving(true);
    setSaveMessage(null);

    const token = localStorage.getItem("token") || localStorage.getItem("access_token");

    try {
      const url = isNew
        ? "https://api.getnovala.com/api/v1/invoices/"
        : "https://api.getnovala.com/api/v1/invoices/" + id;

      const method = isNew ? "POST" : "PATCH";

      const body = isNew
        ? JSON.stringify({
            invoice_number: invoice.invoice_number || "",
            date: invoice.date || new Date().toISOString().slice(0, 10),
            due_date: invoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            terms: invoice.terms || "Net 30",
            from_name: invoice.from_name || "",
            to_name: invoice.to_name || "",
            items: invoice.items || [],
            status: "draft"
          })
        : JSON.stringify({
            to_name: invoice.to_name,
            to_email: invoice.to_email,
            to_address: invoice.to_address,
            invoice_number: invoice.invoice_number,
            terms: invoice.terms,
            date: invoice.date,
            due_date: invoice.due_date,
            items: invoice.items || invoice.line_items || [],
            note: invoice.note || ""
          });

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
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

  const sectionLabelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: SUBTLE,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 10
  };

  const fieldRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0"
  };

  const fieldLabelStyle = { fontSize: 13, color: TEXT };
  const inlineLinkStyle = { fontSize: 12, color: LINK, marginLeft: 6, cursor: "pointer" };
  const rightLinkStyle = { fontSize: 12, color: LINK, cursor: "pointer" };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: PAGE_BG,
        fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif"
      }}
    >
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 8 : 24 }}>
          <div style={{ maxWidth: 1500, margin: "0 auto", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", minHeight: 800, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: SUBTLE, fontSize: 14 }}>
                Loading invoice...
              </div>
            ) : error ? (
              <div style={{ padding: 40, textAlign: "center", color: "#dc2626", fontSize: 14 }}>
                Error: {error}
              </div>
            ) : (
              <InvoicePreview
                inv={invoice}
                customization={customization}
                accentColor={accentColor}
                template={templateChoice}
                onFieldChange={handleFieldChange}
                onCustomerSelect={handleCustomerSelect}
                onItemChange={handleItemChange}
                onAddItem={handleAddItem}
                onDeleteItem={handleDeleteItem}
                onClearItems={handleClearItems}
                onEditCompany={() => setEditCompanyOpen(true)}
                onEditCustomer={handleEditCustomer}
                onEditTotals={handleEditTotalsClick}
              />
            )}
          </div>
        </div>

        {sidebarOpen && (
          <div
            style={{
              width: isMobile ? "100%" : 380,
              background: "#fff",
              borderLeft: isMobile ? "none" : "1px solid " + BORDER,
              borderTop: isMobile ? "1px solid " + BORDER : "none",
              overflowY: "auto",
              padding: 16
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, alignItems: "center", marginBottom: 12, color: SUBTLE, fontSize: 13 }}>
              <button style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 5, cursor: "pointer", color: SUBTLE, fontSize: 13 }}>
                <Settings size={15} /> Manage
              </button>
              <button style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 5, cursor: "pointer", color: SUBTLE, fontSize: 13 }}>
                <PlayCircle size={15} /> Take tour
              </button>
              <button style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 5, cursor: "pointer", color: SUBTLE, fontSize: 13 }}>
                <MessageSquare size={15} /> Feedback
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 2 }}>Invoice {headerNumber}</div>
                <button style={{ background: "none", border: "none", color: LINK, fontSize: 13, padding: 0, cursor: "pointer" }}>Edit default settings</button>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: SUBTLE, padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ height: 1, background: BORDER, margin: "14px 0" }} />

            {/* CUSTOMIZATION */}
            <div style={{ border: "1px solid " + BORDER, borderRadius: 8, padding: "14px 14px", marginBottom: 10 }}>
              <button
                onClick={() => toggleSection("customization")}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 15, fontWeight: 600, color: TEXT }}
              >
                <span>Customization</span>
                {openSections.customization ? <ChevronUp size={18} color={SUBTLE} /> : <ChevronDown size={18} color={SUBTLE} />}
              </button>

              {openSections.customization && (
                <div style={{ marginTop: 14 }}>
                  <div style={sectionLabelStyle}>Header fields</div>
                  {CUSTOMIZATION_HEADER_FIELDS.map(f => (
                    <div key={f.key} style={fieldRowStyle}>
                      <span style={fieldLabelStyle}>{f.label}</span>
                      <Toggle on={customization[f.key]} onClick={() => toggleField(f.key)} />
                    </div>
                  ))}

                  <div style={{ height: 1, background: BORDER, margin: "14px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ ...sectionLabelStyle, marginBottom: 0 }}>Table content</div>
                    <button style={{ background: "none", border: "none", color: LINK, fontSize: 12, cursor: "pointer", padding: 0 }}>Edit labels</button>
                  </div>
                  {TABLE_CONTENT_FIELDS.map(f => (
                    <div key={f.key} style={fieldRowStyle}>
                      <span style={fieldLabelStyle}>{f.label}</span>
                      <Toggle on={customization[f.key]} onClick={() => toggleField(f.key)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PAYMENT OPTIONS */}
            <div style={{ border: "1px solid " + BORDER, borderRadius: 8, padding: "14px 14px", marginBottom: 10 }}>
              <button
                onClick={() => toggleSection("payment")}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 15, fontWeight: 600, color: TEXT }}
              >
                <span>Payment options</span>
                {openSections.payment ? <ChevronUp size={18} color={SUBTLE} /> : <ChevronDown size={18} color={SUBTLE} />}
              </button>

              {openSections.payment && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Accepted payment methods</div>
                    <button style={{ background: "none", border: "none", color: LINK, fontSize: 12, cursor: "pointer", padding: 0 }}>Set up</button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {PAYMENT_METHODS.map(pm => (
                      <div key={pm.key} style={{ padding: "5px 9px", borderRadius: 4, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 38, height: 24, ...pm.style }}>
                        {pm.label}
                      </div>
                    ))}
                  </div>

                  <div style={{ height: 1, background: BORDER, margin: "10px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Payment details</div>
                    <button style={{ background: "none", border: "none", color: LINK, fontSize: 12, cursor: "pointer", padding: 0 }}>Manage</button>
                  </div>

                  <div style={{ height: 1, background: BORDER, margin: "10px 0" }} />

                  <div style={{ ...sectionLabelStyle, textTransform: "none", letterSpacing: 0, fontSize: 13, fontWeight: 600, color: TEXT, marginTop: 6 }}>More options</div>

                  {MORE_OPTIONS_FIELDS.map(f => (
                    <div key={f.key} style={fieldRowStyle}>
                      <span style={fieldLabelStyle}>
                        {f.label}
                        {f.hasManage && <span style={inlineLinkStyle}>· Manage</span>}
                      </span>
                      <Toggle on={paymentOptions[f.key]} onClick={() => togglePaymentOption(f.key)} />
                    </div>
                  ))}

                  <div style={fieldRowStyle}>
                    <span style={fieldLabelStyle}>Multicurrency</span>
                    <button style={{ background: "none", border: "none", color: LINK, fontSize: 12, cursor: "pointer", padding: 0 }}>Set up</button>
                  </div>

                  <div style={fieldRowStyle}>
                    <span style={fieldLabelStyle}>
                      Late fees<span style={inlineLinkStyle}>· Manage</span>
                    </span>
                    <Toggle on={paymentOptions.moLateFees} onClick={() => togglePaymentOption("moLateFees")} />
                  </div>

                  <div style={{ background: "#eef2f7", padding: "10px 12px", borderRadius: 6, fontSize: 12, color: SUBTLE, marginTop: 12, lineHeight: 1.45 }}>
                    You can make changes in your default settings or customise them in Customers.
                  </div>
                </div>
              )}
            </div>

            {/* DESIGN */}
            <div style={{ border: "1px solid " + BORDER, borderRadius: 8, padding: "14px 14px", marginBottom: 10 }}>
              <button
                onClick={() => toggleSection("design")}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 15, fontWeight: 600, color: TEXT }}
              >
                <span>Design</span>
                {openSections.design ? <ChevronUp size={18} color={SUBTLE} /> : <ChevronDown size={18} color={SUBTLE} />}
              </button>

              {openSections.design && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Modernized template</div>
                    <button style={{ background: "none", border: "none", color: LINK, fontSize: 12, cursor: "pointer", padding: 0 }}>Remove default</button>
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer" }}>
                    <input type="radio" checked={templateChoice === "modern"} onChange={() => setTemplateChoice("modern")} style={{ accentColor: BRAND, cursor: "pointer" }} />
                    <span style={fieldLabelStyle}>Modern</span>
                  </label>

                  <div style={{ height: 1, background: BORDER, margin: "12px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: TEXT }}>
                      Other templates <HelpCircle size={13} color={SUBTLE} />
                    </div>
                    <button style={{ background: "none", border: "none", color: LINK, fontSize: 12, cursor: "pointer", padding: 0 }}>Add/Edit</button>
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer" }}>
                    <input type="radio" checked={templateChoice === "standard"} onChange={() => setTemplateChoice("standard")} style={{ accentColor: BRAND, cursor: "pointer" }} />
                    <span style={fieldLabelStyle}>Standard</span>
                  </label>

                  <div style={{ height: 1, background: BORDER, margin: "14px 0" }} />

                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 10 }}>Colour</div>

                  <div style={{ ...fieldRowStyle, padding: "4px 0 12px 0" }}>
                    <span style={fieldLabelStyle}>Printer friendly</span>
                    <Toggle on={printerFriendly} onClick={() => setPrinterFriendly(!printerFriendly)} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: accentColor, border: "2px solid " + accentColor, boxShadow: "inset 0 0 0 2px #fff" }} />
                    <input
                      type="text"
                      value={hexInput}
                      onChange={(e) => handleHexChange(e.target.value)}
                      style={{ flex: 1, padding: "6px 10px", border: "1px solid " + BORDER, borderRadius: 4, fontSize: 13, fontFamily: "monospace", color: TEXT }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 16 }}>
                    {PALETTE.map(color => (
                      <button
                        key={color}
                        onClick={() => handleSwatchClick(color)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: color,
                          cursor: "pointer",
                          border: accentColor === color ? "3px solid " + TEXT : "1px solid " + BORDER,
                          padding: 0
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ height: 1, background: BORDER, margin: "8px 0 14px 0" }} />

                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 8 }}>Font</div>

                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                      style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid " + BORDER, borderRadius: 4, background: "#fff", fontSize: 13, color: TEXT, cursor: "pointer" }}
                    >
                      <span>{selectedFont}</span>
                      <ChevronDown size={16} color={SUBTLE} />
                    </button>

                    {fontDropdownOpen && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", border: "1px solid " + BORDER, borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 10, maxHeight: 240, overflowY: "auto" }}>
                        {FONTS.map(font => (
                          <button
                            key={font}
                            onClick={() => { setSelectedFont(font); setFontDropdownOpen(false); }}
                            style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: selectedFont === font ? "#f1f5f9" : "#fff", border: "none", fontSize: 13, color: TEXT, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                          >
                            {selectedFont === font && <span style={{ color: BRAND }}>✓</span>}
                            <span style={{ marginLeft: selectedFont === font ? 0 : 18 }}>{font}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SCHEDULING */}
            <div style={{ border: "1px solid " + BORDER, borderRadius: 8, padding: "14px 14px", marginBottom: 10 }}>
              <button
                onClick={() => toggleSection("scheduling")}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 15, fontWeight: 600, color: TEXT }}
              >
                <span>Scheduling</span>
                {openSections.scheduling ? <ChevronUp size={18} color={SUBTLE} /> : <ChevronDown size={18} color={SUBTLE} />}
              </button>

              {openSections.scheduling && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 6 }}>
                    More options <HelpCircle size={13} color={SUBTLE} />
                  </div>

                  <div style={fieldRowStyle}>
                    <span style={fieldLabelStyle}>Print later</span>
                    <Toggle on={scheduling.printLater} onClick={() => toggleScheduling("printLater")} />
                  </div>

                  <div style={fieldRowStyle}>
                    <span style={fieldLabelStyle}>Send later</span>
                    <Toggle on={scheduling.sendLater} onClick={() => toggleScheduling("sendLater")} />
                  </div>

                  <div style={{ height: 1, background: BORDER, margin: "12px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                    <span style={fieldLabelStyle}>Automatic invoice reminders</span>
                    <button style={{ background: "none", border: "none", color: LINK, fontSize: 12, cursor: "pointer", padding: 0 }}>Manage</button>
                  </div>

                  <div style={fieldRowStyle}>
                    <span style={fieldLabelStyle}>Invoice Reminders</span>
                    <Toggle on={scheduling.invoiceReminders} onClick={() => toggleScheduling("invoiceReminders")} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "12px 16px" : "14px 24px",
          background: "#fff",
          borderTop: "1px solid " + BORDER
        }}
      >
        <button style={{ background: "none", border: "none", color: SUBTLE, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
          Print or download
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 14px",
              background: "#fff",
              border: "1px solid " + BORDER,
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              color: TEXT,
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            onClick={() => {
              if (!id || id === "new") {
                alert("Save the invoice first");
                return;
              }
              navigate("/invoices/" + id + "/send");
            }}
            style={{
              padding: "8px 16px",
              background: BRAND,
              border: "1px solid " + BRAND,
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            Review and send
          </button>
        </div>
      </div>

      <EditCompanyDrawer
        open={editCompanyOpen}
        onClose={() => setEditCompanyOpen(false)}
        initialData={invoice}
        onSave={handleSaveCompany}
      />

      <NewCustomerDrawer
        isOpen={editCustomerOpen}
        onClose={() => setEditCustomerOpen(false)}
        onSave={handleEditCustomerSave}
        initialData={editingCustomer}
      />

      {saveMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            right: 24,
            padding: "10px 16px",
            background: saveMessage.type === "success" ? "#10b981" : "#dc2626",
            color: "#fff",
            borderRadius: 6,
            fontSize: 14,
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          {saveMessage.text}
        </div>
      )}
    </div>
  );
}
