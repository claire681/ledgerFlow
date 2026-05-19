import { useState, useEffect, useRef } from "react";
import {
  X, ChevronUp, ChevronDown, HelpCircle, Plus, Trash2,
  Contact, ShieldCheck, MapPin, Pencil, CreditCard, FileText, Layers,
  Upload as UploadIcon
} from "lucide-react";
import { CompanyPhoneField } from "../CompanyPhoneField";

const GREEN = "#047857";
const GREEN_DARK = "#065f46";
const TEXT = "#0F172A";
const SUBTLE = "#64748b";
const BORDER = "#e2e8f0";
const SUBTLE_BG = "#f8fafc";
const DANGER = "#dc2626";

const labelStyle = { display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 };
const requiredStar = { color: DANGER, marginLeft: 4 };
const inputBaseStyle = {
  width: "100%", height: 40, padding: "0 12px", fontSize: 14,
  border: "1px solid " + BORDER, borderRadius: 6, color: TEXT,
  outline: "none", background: "#fff", fontFamily: "inherit",
  boxSizing: "border-box", transition: "border-color 0.15s, box-shadow 0.15s"
};
const textareaStyle = { ...inputBaseStyle, height: "auto", minHeight: 96, padding: "10px 12px", resize: "vertical" };
const selectStyle = { ...inputBaseStyle, cursor: "pointer" };

const handleFocus = (e) => {
  e.target.style.borderColor = GREEN;
  e.target.style.boxShadow = "0 0 0 3px rgba(4, 120, 87, 0.1)";
};
const handleBlur = (e) => {
  e.target.style.borderColor = BORDER;
  e.target.style.boxShadow = "none";
};

const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
};

function Field({ label, required, children, columns }) {
  return (
    <div style={{ flex: columns || 1, minWidth: 0 }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={requiredStar}>*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type }) {
  return (
    <input type={type || "text"} value={value || ""} onChange={onChange}
      placeholder={placeholder} style={inputBaseStyle}
      onFocus={handleFocus} onBlur={handleBlur} />
  );
}

function SelectInput({ value, onChange, children }) {
  return (
    <select value={value || ""} onChange={onChange} style={selectStyle}
      onFocus={handleFocus} onBlur={handleBlur}>
      {children}
    </select>
  );
}

function Section({ icon: Icon, title, isOpen, onToggle, sectionRef, children }) {
  return (
    <div ref={sectionRef} style={{ borderBottom: "1px solid " + BORDER }}>
      <button type="button" onClick={onToggle} style={{
        width: "100%", padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "none", border: "none", cursor: "pointer", fontFamily: "inherit"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon size={18} color={SUBTLE} />
          <span style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>{title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} color={SUBTLE} /> : <ChevronDown size={18} color={SUBTLE} />}
      </button>
      {isOpen && (
        <div style={{ padding: "0 20px 24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function QuickJumpButton({ icon: Icon, onClick, label }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} style={{
      width: 32, height: 32, borderRadius: 6,
      background: "none", border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", color: SUBTLE
    }}>
      <Icon size={16} />
    </button>
  );
}

function UnsavedChangesDialog({ isOpen, onStay, onLeave }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2500, padding: 16
    }}>
      <div style={{
        background: "#fff", borderRadius: 12,
        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        width: "100%", maxWidth: 480, padding: 24
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: TEXT, margin: 0, paddingRight: 16 }}>
            Save your custom fields before leaving
          </h2>
          <button onClick={onStay} style={{ background: "none", border: "none", cursor: "pointer", color: SUBTLE, flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ fontSize: 14, color: "#475569", margin: 0, marginBottom: 24 }}>
          Your work will be lost if you leave. Do you want to leave without saving?
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onStay} style={{
            padding: "0 24px", height: 40, borderRadius: 8,
            fontSize: 14, fontWeight: 500, color: "#475569",
            background: "#fff", border: "1px solid #cbd5e1",
            cursor: "pointer", fontFamily: "inherit"
          }}>No</button>
          <button type="button" onClick={onLeave} style={{
            padding: "0 24px", height: 40, borderRadius: 8,
            fontSize: 14, fontWeight: 600, color: "#fff",
            background: GREEN, border: "none",
            cursor: "pointer", fontFamily: "inherit"
          }}>Yes</button>
        </div>
      </div>
    </div>
  );
}

function AddCustomFieldModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("customer");
  const [forms, setForms] = useState({
    salesReceipt: false, invoice: false, estimate: false,
    creditMemo: false, refundReceipt: false, expense: false,
    bill: false, cheque: false, supplierCredit: false, creditCardCredit: false
  });
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  if (!isOpen) return null;

  const hasUnsavedChanges =
    name.trim() !== "" || type !== "" || Object.values(forms).some((v) => v === true);

  const resetForm = () => {
    setName(""); setType(""); setCategory("customer");
    setForms({
      salesReceipt: false, invoice: false, estimate: false,
      creditMemo: false, refundReceipt: false, expense: false,
      bill: false, cheque: false, supplierCredit: false, creditCardCredit: false
    });
  };

  const handleAttemptClose = () => {
    if (hasUnsavedChanges) setShowUnsavedDialog(true);
    else onClose();
  };
  const handleConfirmLeave = () => { setShowUnsavedDialog(false); resetForm(); onClose(); };
  const handleStay = () => setShowUnsavedDialog(false);

  const handleSave = () => {
    if (!name.trim() || !type) return;
    onAdd({ name: name.trim(), type, category, forms });
    resetForm();
    onClose();
  };

  const formOptions = [
    { key: "salesReceipt", label: "Sales Receipt" },
    { key: "invoice", label: "Invoice" },
    { key: "estimate", label: "Estimate" },
    { key: "creditMemo", label: "Credit Memo" },
    { key: "refundReceipt", label: "Refund Receipt" },
    { key: "expense", label: "Expense" },
    { key: "bill", label: "Bill" },
    { key: "cheque", label: "Cheque" },
    { key: "supplierCredit", label: "Supplier credit" },
    { key: "creditCardCredit", label: "Credit card credit" }
  ];

  const canSave = name.trim() !== "" && type !== "";

  return (
    <>
      <div onClick={handleAttemptClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 2000, padding: 16
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          background: "#fff", borderRadius: 12,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          width: "100%", maxWidth: 672, padding: 32,
          maxHeight: "90vh", overflowY: "auto"
        }}>
          <div style={{ position: "relative", marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: TEXT, margin: 0, textAlign: "center" }}>
              Add custom field
            </h2>
            <button onClick={handleAttemptClose} style={{
              position: "absolute", top: 0, right: 0,
              background: "none", border: "none", cursor: "pointer", color: SUBTLE
            }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <Field label="Name">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Account number" />
            </Field>
            <Field label="Data type">
              <SelectInput value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Select type here</option>
                <option value="text_or_number">Text or number</option>
                <option value="dropdown">Dropdown</option>
                <option value="date">Date</option>
                <option value="currency">Currency</option>
              </SelectInput>
            </Field>
          </div>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: TEXT, margin: 0, marginBottom: 12 }}>Select category</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: TEXT, cursor: "pointer" }}>
                <input type="radio" name="cf-cat" checked={category === "customer"} onChange={() => setCategory("customer")} style={{ accentColor: GREEN, width: 16, height: 16 }} />
                Customer
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: TEXT, cursor: "pointer" }}>
                <input type="radio" name="cf-cat" checked={category === "transaction"} onChange={() => setCategory("transaction")} style={{ accentColor: GREEN, width: 16, height: 16 }} />
                Transaction
              </label>
            </div>
          </div>

          {category === "transaction" && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: TEXT, margin: 0, marginBottom: 12 }}>Select forms</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {formOptions.map((opt) => (
                  <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: TEXT, cursor: "pointer" }}>
                    <input type="checkbox" checked={forms[opt.key]} onChange={(e) => setForms({ ...forms, [opt.key]: e.target.checked })} style={{ accentColor: GREEN, width: 16, height: 16 }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
            <button type="button" onClick={handleAttemptClose} style={{
              padding: "0 24px", height: 40, borderRadius: 8,
              fontSize: 14, fontWeight: 500, color: "#475569",
              background: "none", border: "none", cursor: "pointer", fontFamily: "inherit"
            }}>Cancel</button>
            <button type="button" onClick={handleSave} disabled={!canSave} style={{
              padding: "0 24px", height: 40, borderRadius: 8,
              fontSize: 14, fontWeight: 600, color: "#fff",
              background: canSave ? GREEN : "#cbd5e1",
              border: "none",
              cursor: canSave ? "pointer" : "not-allowed",
              fontFamily: "inherit"
            }}>Save</button>
          </div>
        </div>
      </div>

      <UnsavedChangesDialog isOpen={showUnsavedDialog} onStay={handleStay} onLeave={handleConfirmLeave} />
    </>
  );
}

const initialState = {
  title: "", firstName: "", middleName: "", lastName: "", suffix: "",
  companyName: "", displayName: "",
  email: "", phone: "", cc: "", bcc: "",
  mobile: "", fax: "", other: "", website: "",
  printOnChequesName: "", isSubCustomer: false,
  emailMarketingConsent: false,
  billingAddress: { street1: "", street2: "", street3: "", street4: "", city: "", province: "", postalCode: "", country: "" },
  showExtraBillingLines: false,
  shippingAddressSameAsBilling: true,
  shippingAddress: { street1: "", street2: "", street3: "", street4: "", city: "", province: "", postalCode: "", country: "" },
  notes: "", attachments: [],
  primaryPaymentMethod: "", terms: "",
  salesFormDeliveryOption: "", language: "English",
  businessNumber: "",
  openingBalance: "",
  openingBalanceAsOf: new Date().toISOString().slice(0, 10),
  customFields: []
};

export function NewCustomerDrawer({ isOpen, onClose, onSave }) {
  const isMobile = useIsMobile();
  const [customer, setCustomer] = useState(initialState);
  const [displayNameTouched, setDisplayNameTouched] = useState(false);
  const [customFieldModalOpen, setCustomFieldModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [openSections, setOpenSections] = useState({
    nameAndContact: true, communicationPermissions: true, addresses: true,
    notesAndAttachments: true, payments: true, additionalInfo: true, customFields: true
  });
  const sectionRefs = {
    nameAndContact: useRef(null),
    communicationPermissions: useRef(null),
    addresses: useRef(null),
    notesAndAttachments: useRef(null),
    payments: useRef(null),
    additionalInfo: useRef(null),
    customFields: useRef(null)
  };

  useEffect(() => {
    if (!displayNameTouched) {
      const autoName = (customer.firstName + " " + customer.lastName).trim();
      setCustomer((prev) => ({ ...prev, displayName: autoName }));
    }
  }, [customer.firstName, customer.lastName, displayNameTouched]);

  useEffect(() => {
    if (!isOpen) {
      setCustomer(initialState);
      setDisplayNameTouched(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const update = (key, value) => setCustomer((prev) => ({ ...prev, [key]: value }));
  const updateBilling = (key, value) => setCustomer((prev) => ({ ...prev, billingAddress: { ...prev.billingAddress, [key]: value } }));
  const updateShipping = (key, value) => setCustomer((prev) => ({ ...prev, shippingAddress: { ...prev.shippingAddress, [key]: value } }));
  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const scrollTo = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      const ref = sectionRefs[key];
      if (ref && ref.current) ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.size <= 20 * 1024 * 1024);
    update("attachments", [...customer.attachments, ...valid]);
  };
  const removeAttachment = (idx) => update("attachments", customer.attachments.filter((_, i) => i !== idx));

  const isFormValid = customer.displayName.trim().length > 0;

  const handleSave = async () => {
    if (!isFormValid || saving) return;
    setSaving(true); setError(null);

    const billingParts = [
      customer.billingAddress.street1, customer.billingAddress.street2,
      customer.billingAddress.city, customer.billingAddress.province,
      customer.billingAddress.postalCode, customer.billingAddress.country
    ].filter(Boolean);
    const addressString = billingParts.join(", ");

    const extraInfo = [];
    if (customer.firstName) extraInfo.push("First: " + customer.firstName);
    if (customer.lastName) extraInfo.push("Last: " + customer.lastName);
    if (customer.mobile) extraInfo.push("Mobile: " + customer.mobile);
    if (customer.website) extraInfo.push("Web: " + customer.website);
    if (customer.businessNumber) extraInfo.push("BN: " + customer.businessNumber);
    const combinedNotes = [customer.notes, extraInfo.join(" | ")].filter(Boolean).join("\n\n");

    const payload = {
      name: customer.displayName.trim(),
      email: customer.email.trim(),
      phone: customer.phone,
      address: addressString,
      company: customer.companyName.trim(),
      notes: combinedNotes
    };

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token") || "";
      const response = await fetch("https://api.getnovala.com/api/v1/customers/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Save failed: " + response.status);
      const newCustomer = await response.json();
      if (typeof onSave === "function") onSave(newCustomer);
      onClose();
    } catch (e) {
      setError("Could not save customer. " + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(2px)", zIndex: 1500
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: isMobile ? "100%" : 720, maxWidth: "100%",
        background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
        zIndex: 1501, display: "flex", flexDirection: "column",
        fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif"
      }}>
        <div style={{
          borderBottom: "1px solid " + BORDER, padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: TEXT, margin: 0 }}>Customer</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <QuickJumpButton icon={Contact} label="Name and contact" onClick={() => scrollTo("nameAndContact")} />
            <QuickJumpButton icon={ShieldCheck} label="Communication" onClick={() => scrollTo("communicationPermissions")} />
            <QuickJumpButton icon={MapPin} label="Addresses" onClick={() => scrollTo("addresses")} />
            <QuickJumpButton icon={Pencil} label="Notes" onClick={() => scrollTo("notesAndAttachments")} />
            <QuickJumpButton icon={CreditCard} label="Payments" onClick={() => scrollTo("payments")} />
            <QuickJumpButton icon={FileText} label="Additional info" onClick={() => scrollTo("additionalInfo")} />
            <QuickJumpButton icon={Layers} label="Custom fields" onClick={() => scrollTo("customFields")} />
            <button type="button" onClick={onClose} aria-label="Close" style={{
              width: 32, height: 32, marginLeft: 8, background: "none", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: SUBTLE, borderRadius: 6
            }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <Section icon={Contact} title="Name and contact" isOpen={openSections.nameAndContact}
            onToggle={() => toggleSection("nameAndContact")} sectionRef={sectionRefs.nameAndContact}>
            <div style={{ display: "flex", gap: 8 }}>
              <Field label="Title" columns={2}><TextInput value={customer.title} onChange={(e) => update("title", e.target.value)} /></Field>
              <Field label="First name" columns={3}><TextInput value={customer.firstName} onChange={(e) => update("firstName", e.target.value)} /></Field>
              <Field label="Middle" columns={2}><TextInput value={customer.middleName} onChange={(e) => update("middleName", e.target.value)} /></Field>
              <Field label="Last name" columns={3}><TextInput value={customer.lastName} onChange={(e) => update("lastName", e.target.value)} /></Field>
              <Field label="Suffix" columns={2}><TextInput value={customer.suffix} onChange={(e) => update("suffix", e.target.value)} /></Field>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Company name"><TextInput value={customer.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Type to search" /></Field>
              <Field label="Customer display name" required>
                <TextInput value={customer.displayName}
                  onChange={(e) => { setDisplayNameTouched(true); update("displayName", e.target.value); }} />
              </Field>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Email"><TextInput type="email" value={customer.email} onChange={(e) => update("email", e.target.value)} /></Field>
              <Field label="Phone number"><CompanyPhoneField value={customer.phone} onChange={(v) => update("phone", v || "")} /></Field>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Cc"><TextInput value={customer.cc} onChange={(e) => update("cc", e.target.value)} /></Field>
              <Field label="Bcc"><TextInput value={customer.bcc} onChange={(e) => update("bcc", e.target.value)} /></Field>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Mobile number"><TextInput value={customer.mobile} onChange={(e) => update("mobile", e.target.value)} /></Field>
              <Field label="Fax"><TextInput value={customer.fax} onChange={(e) => update("fax", e.target.value)} /></Field>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Other"><TextInput value={customer.other} onChange={(e) => update("other", e.target.value)} /></Field>
              <Field label="Website"><TextInput value={customer.website} onChange={(e) => update("website", e.target.value)} /></Field>
            </div>
            <Field label="Name to print on cheques"><TextInput value={customer.printOnChequesName} onChange={(e) => update("printOnChequesName", e.target.value)} /></Field>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: TEXT, cursor: "pointer", paddingTop: 4 }}>
              <input type="checkbox" checked={customer.isSubCustomer} onChange={(e) => update("isSubCustomer", e.target.checked)} style={{ accentColor: GREEN, width: 16, height: 16 }} />
              Is a sub-customer
            </label>
          </Section>

          <Section icon={ShieldCheck} title="Communication permissions" isOpen={openSections.communicationPermissions}
            onToggle={() => toggleSection("communicationPermissions")} sectionRef={sectionRefs.communicationPermissions}>
            {!customer.email ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "24px 16px" }}>
                <ShieldCheck size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "#475569", margin: 0, marginBottom: 4 }}>Enter an email to record customer consent.</p>
                <p style={{ fontSize: 12, color: SUBTLE, margin: 0, maxWidth: 400 }}>If the customer has opted in to receive email marketing communications, acknowledge it here once you have added an email.</p>
              </div>
            ) : (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: TEXT, cursor: "pointer" }}>
                <input type="checkbox" checked={customer.emailMarketingConsent} onChange={(e) => update("emailMarketingConsent", e.target.checked)} style={{ accentColor: GREEN, width: 16, height: 16, marginTop: 2 }} />
                <span>Customer has consented to receive email marketing communications.</span>
              </label>
            )}
          </Section>

          <Section icon={MapPin} title="Addresses" isOpen={openSections.addresses}
            onToggle={() => toggleSection("addresses")} sectionRef={sectionRefs.addresses}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: 0 }}>Billing address</h3>
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Street address 1"><TextInput value={customer.billingAddress.street1} onChange={(e) => updateBilling("street1", e.target.value)} /></Field>
              <Field label="Street address 2"><TextInput value={customer.billingAddress.street2} onChange={(e) => updateBilling("street2", e.target.value)} /></Field>
            </div>
            <button type="button" onClick={() => update("showExtraBillingLines", !customer.showExtraBillingLines)} style={{ background: "none", border: "none", color: GREEN, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, alignSelf: "flex-start" }}>
              {customer.showExtraBillingLines ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Add lines
            </button>
            {customer.showExtraBillingLines && (
              <div style={{ display: "flex", gap: 12 }}>
                <Field label="Street address 3"><TextInput value={customer.billingAddress.street3} onChange={(e) => updateBilling("street3", e.target.value)} /></Field>
                <Field label="Street address 4"><TextInput value={customer.billingAddress.street4} onChange={(e) => updateBilling("street4", e.target.value)} /></Field>
              </div>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="City"><TextInput value={customer.billingAddress.city} onChange={(e) => updateBilling("city", e.target.value)} /></Field>
              <Field label="Province"><TextInput value={customer.billingAddress.province} onChange={(e) => updateBilling("province", e.target.value)} /></Field>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Postal code"><TextInput value={customer.billingAddress.postalCode} onChange={(e) => updateBilling("postalCode", e.target.value)} /></Field>
              <Field label="Country"><TextInput value={customer.billingAddress.country} onChange={(e) => updateBilling("country", e.target.value)} /></Field>
            </div>
            <div style={{ paddingTop: 16, marginTop: 8, borderTop: "1px solid #f1f5f9" }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: 0, marginBottom: 12 }}>Shipping address</h3>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: TEXT, cursor: "pointer", marginBottom: 12 }}>
                <input type="checkbox" checked={customer.shippingAddressSameAsBilling} onChange={(e) => update("shippingAddressSameAsBilling", e.target.checked)} style={{ accentColor: GREEN, width: 16, height: 16 }} />
                Same as billing address
              </label>
              {!customer.shippingAddressSameAsBilling && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Field label="Street address 1"><TextInput value={customer.shippingAddress.street1} onChange={(e) => updateShipping("street1", e.target.value)} /></Field>
                    <Field label="Street address 2"><TextInput value={customer.shippingAddress.street2} onChange={(e) => updateShipping("street2", e.target.value)} /></Field>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Field label="City"><TextInput value={customer.shippingAddress.city} onChange={(e) => updateShipping("city", e.target.value)} /></Field>
                    <Field label="Province"><TextInput value={customer.shippingAddress.province} onChange={(e) => updateShipping("province", e.target.value)} /></Field>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Field label="Postal code"><TextInput value={customer.shippingAddress.postalCode} onChange={(e) => updateShipping("postalCode", e.target.value)} /></Field>
                    <Field label="Country"><TextInput value={customer.shippingAddress.country} onChange={(e) => updateShipping("country", e.target.value)} /></Field>
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Section icon={Pencil} title="Notes and attachments" isOpen={openSections.notesAndAttachments}
            onToggle={() => toggleSection("notesAndAttachments")} sectionRef={sectionRefs.notesAndAttachments}>
            <Field label="Notes">
              <textarea value={customer.notes} onChange={(e) => update("notes", e.target.value)} rows={4} style={textareaStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </Field>
            <Field label="Attachments">
              <div onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{
                border: "2px dashed #cbd5e1", borderRadius: 10, padding: 24, textAlign: "center",
                cursor: "pointer", background: SUBTLE_BG, transition: "all 0.15s"
              }}>
                <UploadIcon size={24} color="#94a3b8" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "#475569", margin: 0, marginBottom: 4 }}>Add attachment</p>
                <p style={{ fontSize: 12, color: SUBTLE, margin: 0 }}>Max file size: 20 MB</p>
                <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} style={{ display: "none" }} />
              </div>
              {customer.attachments.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  {customer.attachments.map((file, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: SUBTLE_BG, padding: "8px 12px", borderRadius: 6 }}>
                      <span style={{ fontSize: 13, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                      <button type="button" onClick={() => removeAttachment(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: SUBTLE, padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>
          </Section>

          <Section icon={CreditCard} title="Payments" isOpen={openSections.payments}
            onToggle={() => toggleSection("payments")} sectionRef={sectionRefs.payments}>
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Primary payment method">
                <SelectInput value={customer.primaryPaymentMethod} onChange={(e) => update("primaryPaymentMethod", e.target.value)}>
                  <option value="">Select a primary payment method</option>
                  <option value="credit_card">Credit card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </SelectInput>
              </Field>
              <Field label="Terms">
                <SelectInput value={customer.terms} onChange={(e) => update("terms", e.target.value)}>
                  <option value="">Select terms</option>
                  <option value="due_on_receipt">Due on receipt</option>
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                  <option value="net_60">Net 60</option>
                </SelectInput>
              </Field>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Sales form delivery options">
                <SelectInput value={customer.salesFormDeliveryOption} onChange={(e) => update("salesFormDeliveryOption", e.target.value)}>
                  <option value="">Select delivery option</option>
                  <option value="email">Email</option>
                  <option value="print">Print</option>
                  <option value="both">Both</option>
                </SelectInput>
              </Field>
              <Field label="Language to use when you send invoices">
                <SelectInput value={customer.language} onChange={(e) => update("language", e.target.value)}>
                  <option value="English">English</option>
                  <option value="French">French</option>
                  <option value="Spanish">Spanish</option>
                </SelectInput>
              </Field>
            </div>
          </Section>

          <Section icon={FileText} title="Additional info" isOpen={openSections.additionalInfo}
            onToggle={() => toggleSection("additionalInfo")} sectionRef={sectionRefs.additionalInfo}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: 0 }}>Sales tax</h3>
            <Field label="Business Number"><TextInput value={customer.businessNumber} onChange={(e) => update("businessNumber", e.target.value)} /></Field>
            <div style={{ paddingTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: 0 }}>Opening balance</h3>
                <span title="The starting balance to carry over from before you started using Novala." style={{ color: SUBTLE, display: "flex" }}>
                  <HelpCircle size={14} />
                </span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Field label="Opening balance"><TextInput type="number" value={customer.openingBalance} onChange={(e) => update("openingBalance", e.target.value)} placeholder="$0.00" /></Field>
                <Field label="As of"><TextInput type="date" value={customer.openingBalanceAsOf} onChange={(e) => update("openingBalanceAsOf", e.target.value)} /></Field>
              </div>
            </div>
          </Section>

          <Section icon={Layers} title="Custom fields" isOpen={openSections.customFields}
            onToggle={() => toggleSection("customFields")} sectionRef={sectionRefs.customFields}>
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>Add customer details. Sort, filter, and track. Create reports your business needs.</p>
            {customer.customFields.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {customer.customFields.map((field, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: SUBTLE_BG, padding: "8px 12px", borderRadius: 6 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: TEXT, margin: 0 }}>{field.name}</p>
                      <p style={{ fontSize: 11, color: SUBTLE, margin: 0, textTransform: "capitalize" }}>{field.type.replace("_", " / ")} - {field.category}</p>
                    </div>
                    <button type="button" onClick={() => update("customFields", customer.customFields.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", cursor: "pointer", color: SUBTLE, padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setCustomFieldModalOpen(true)} style={{ background: "none", border: "none", color: GREEN, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, alignSelf: "flex-start" }}>
              <Plus size={14} />
              Add custom field
            </button>
          </Section>
        </div>

        {error && (
          <div style={{ padding: "10px 20px", background: "#fef9c3", borderTop: "1px solid #fde68a", color: "#854d0e", fontSize: 13 }}>{error}</div>
        )}

        <div style={{ background: SUBTLE_BG, borderTop: "1px solid " + BORDER, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: GREEN, textDecoration: "none", fontWeight: 500 }}>Privacy</a>
          <button type="button" disabled={!isFormValid || saving} onClick={handleSave} style={{
            padding: "0 24px", height: 40, borderRadius: 8, fontSize: 14, fontWeight: 600,
            color: "#fff", background: (!isFormValid || saving) ? "#cbd5e1" : GREEN,
            border: "none", cursor: (!isFormValid || saving) ? "not-allowed" : "pointer", fontFamily: "inherit"
          }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <AddCustomFieldModal isOpen={customFieldModalOpen}
        onClose={() => setCustomFieldModalOpen(false)}
        onAdd={(field) => update("customFields", [...customer.customFields, field])} />
    </>
  );
}
