import React, { useState, useRef, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Plus, Image as ImageIcon, Lock, Unlock, Info, PlayCircle } from "lucide-react";

const TEAL = "#0F9599";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#e2e8f0";
const SUBTLE_BG = "#f1f5f9";
const PANEL_BG = "#f8fafc";

const DEFAULT_INCOME_ACCOUNTS = [
  { name: "Accounts Receivable (A/R)", type: "Accounts Receivable" },
  { name: "BrightCare-RBC Chequing", type: "Bank" },
  { name: "Cost of Goods Sold", type: "Cost Of Goods Sold" },
  { name: "Cost of Labour - COS", type: "Cost Of Goods Sold" },
  { name: "Freight and delivery - COS", type: "Cost Of Goods Sold" },
  { name: "Other Costs - COS", type: "Cost Of Goods Sold" },
  { name: "Purchases - COS", type: "Cost Of Goods Sold" },
  { name: "Services", type: "Services" },
];

const ACCOUNTS_KEY = "novala_income_accounts_v1";
const CATEGORIES_KEY = "novala_product_categories_v1";

const labelStyle = { display: "block", fontSize: 13, color: TEXT, fontWeight: 500, marginBottom: 6 };
const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid " + BORDER, borderRadius: 4, fontSize: 14, fontFamily: "inherit", color: TEXT, outline: "none", boxSizing: "border-box", background: "#fff" };
const selectStyle = { ...inputStyle, appearance: "none", backgroundImage: "none", paddingRight: 36, cursor: "pointer" };
const sectionPanelStyle = { background: PANEL_BG, border: "1px solid " + BORDER, borderRadius: 8, padding: 20, marginBottom: 16 };
const sectionHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, cursor: "pointer", userSelect: "none" };
const sectionTitleStyle = { fontSize: 15, fontWeight: 600, color: TEXT };
const linkStyle = { background: "none", border: "none", color: TEAL, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 };

function SectionHeader({ title, open, onToggle }) {
  return (
    <div style={sectionHeaderStyle} onClick={onToggle}>
      <div style={sectionTitleStyle}>{title}</div>
      {open ? <ChevronUp size={18} color={MUTED} /> : <ChevronDown size={18} color={MUTED} />}
    </div>
  );
}

function CustomDropdown({ value, onChange, options, placeholder, onAddNew, renderOption }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ ...selectStyle, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: value ? TEXT : MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || placeholder}</span>
        <ChevronDown size={16} color={MUTED} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid " + BORDER, borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 30, maxHeight: 280, overflowY: "auto" }}>
          {onAddNew && (
            <button type="button" onClick={() => { setOpen(false); onAddNew(); }} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left", padding: "10px 14px", background: "#fff", border: "none", color: TEAL, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", borderBottom: "1px solid " + BORDER }}>
              <Plus size={14} /> Add new
            </button>
          )}
          {options.length === 0 && !onAddNew && (
            <div style={{ padding: "10px 14px", fontSize: 13, color: MUTED }}>No options</div>
          )}
          {options.map((opt, i) => (
            <button key={i} type="button" onClick={() => { onChange(opt); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: "#fff", border: "none", fontSize: 14, color: TEXT, cursor: "pointer", fontFamily: "inherit" }}>
              {renderOption ? renderOption(opt) : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewAccountModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [acctType, setAcctType] = useState("");
  const [detailType, setDetailType] = useState("");
  const [isSub, setIsSub] = useState(false);
  const [desc, setDesc] = useState("");
  const [locked, setLocked] = useState(false);

  const ACCT_TYPES = ["Bank", "Accounts Receivable", "Other Current Assets", "Fixed Assets", "Other Assets", "Accounts Payable", "Credit Card", "Other Current Liabilities", "Long Term Liabilities", "Equity", "Income", "Cost Of Goods Sold", "Expenses", "Other Income", "Other Expense"];
  const DETAIL_TYPES = { "Bank": ["Cash on hand", "Checking", "Savings", "Money Market"], "Income": ["Sales of Product Income", "Service/Fee Income", "Other Primary Income"], "Cost Of Goods Sold": ["Supplies & Materials - COGS", "Cost of Labor - COS", "Equipment Rental - COS"], "Expenses": ["Advertising/Promotional", "Office/General Administrative Expenses", "Travel"] };

  const save = () => {
    if (!name.trim() || !acctType) { alert("Account name and type are required"); return; }
    onSave({ name: name.trim(), type: acctType, detailType, isSub, desc, locked });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ width: 720, maxWidth: "100%", height: "100%", background: "#fff", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid " + BORDER }}>
          <div style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 600, color: TEXT }}>New account</div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={20} color={MUTED} /></button>
        </div>
        <div style={{ flex: 1, padding: 28 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Account name *</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div>
              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>Account type * <Info size={13} color={MUTED} /></label>
              <CustomDropdown value={acctType} onChange={v => { setAcctType(v); setDetailType(""); }} options={ACCT_TYPES} placeholder="Select account type" />
            </div>
            <div>
              <label style={labelStyle}>Detail type *</label>
              <CustomDropdown value={detailType} onChange={setDetailType} options={DETAIL_TYPES[acctType] || []} placeholder="Select detail type" />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: TEXT, cursor: "pointer" }}>
              <input type="checkbox" checked={isSub} onChange={e => setIsSub(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
              Make this a subaccount
            </label>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 12, borderTop: "1px solid " + BORDER }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: TEXT, textDecoration: "underline" }}>Lock account</span>
            <button type="button" onClick={() => setLocked(!locked)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              {locked ? <Lock size={16} color={TEXT} /> : <Unlock size={16} color={MUTED} />}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", borderTop: "1px solid " + BORDER, background: "#fff" }}>
          <button type="button" style={{ ...linkStyle, color: TEAL }}><PlayCircle size={16} /> Video tutorials</button>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", background: "#fff", border: "1px solid " + BORDER, borderRadius: 4, fontSize: 14, fontWeight: 500, color: TEXT, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button type="button" onClick={save} style={{ padding: "10px 20px", background: TEAL, border: "none", borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddNewServiceModal({ isOpen = true, onClose, onSave, onSaved }) {
  if (!isOpen) return null;
  const emit = onSaved || onSave;
  const [basicOpen, setBasicOpen] = useState(true);
  const [salesOpen, setSalesOpen] = useState(true);
  const [purchOpen, setPurchOpen] = useState(true);

  const [name, setName] = useState("");
  const [itemType, setItemType] = useState("Service");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [priceRate, setPriceRate] = useState("");
  const [incomeAccount, setIncomeAccount] = useState("Services");
  const [purchaseFromSupplier, setPurchaseFromSupplier] = useState(false);

  const [accounts, setAccounts] = useState(() => {
    try { const s = localStorage.getItem(ACCOUNTS_KEY); return s ? JSON.parse(s) : DEFAULT_INCOME_ACCOUNTS; } catch { return DEFAULT_INCOME_ACCOUNTS; }
  });
  const [categories, setCategories] = useState(() => {
    try { const s = localStorage.getItem(CATEGORIES_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [showCatPrompt, setShowCatPrompt] = useState(false);
  const [catDraft, setCatDraft] = useState("");
  const fileRef = useRef(null);

  const handleImage = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImageUrl(r.result);
    r.readAsDataURL(f);
  };

  const handleAddCategory = () => { setCatDraft(""); setShowCatPrompt(true); };
  const confirmAddCategory = () => {
    const v = catDraft.trim();
    if (!v) { setShowCatPrompt(false); return; }
    const next = [...categories, v];
    setCategories(next);
    try { localStorage.setItem(CATEGORIES_KEY, JSON.stringify(next)); } catch {}
    setCategory(v);
    setShowCatPrompt(false);
  };

  const handleSaveAccount = (acct) => {
    const next = [...accounts, { name: acct.name, type: acct.type }];
    setAccounts(next);
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next)); } catch {}
    setIncomeAccount(acct.name);
    setShowNewAccount(false);
  };

  const submit = (closeAfter) => {
    if (!name.trim()) { alert("Name is required"); return; }
    if (!incomeAccount) { alert("Income account is required"); return; }
    const product = {
      id: "p_" + Date.now(),
      name: name.trim(),
      itemType,
      sku,
      category,
      imageUrl,
      description,
      price_rate: priceRate ? Number(priceRate) : 0,
      priceRate: priceRate ? Number(priceRate) : 0,
      incomeAccount,
      purchaseFromSupplier,
    };
    if (emit) emit(product, !closeAfter);
    if (closeAfter && onClose) onClose();
    if (!closeAfter) {
      setName(""); setSku(""); setCategory(""); setImageUrl(""); setDescription(""); setPriceRate(""); setPurchaseFromSupplier(false);
    }
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: 880, maxWidth: "100%", height: "100%", background: "#fff", overflowY: "auto", display: "flex", flexDirection: "column" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid " + BORDER }}>
            <div style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 600, color: TEXT }}>Add a new service</div>
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={20} color={MUTED} /></button>
          </div>

          <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>

            <div style={sectionPanelStyle}>
              <SectionHeader title="Basic info" open={basicOpen} onToggle={() => setBasicOpen(!basicOpen)} />
              {basicOpen && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 24 }}>
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>Name *</label>
                      <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>Item type</label>
                      <CustomDropdown value={itemType} onChange={setItemType} options={["Service", "Inventory", "Non-inventory"]} placeholder="Select item type" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>SKU</label>
                      <input value={sku} onChange={e => setSku(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <CustomDropdown value={category} onChange={setCategory} options={categories} placeholder="" onAddNew={handleAddCategory} />
                    </div>
                  </div>
                  <div>
                    <div onClick={() => fileRef.current && fileRef.current.click()} style={{ border: "1px dashed " + BORDER, borderRadius: 6, padding: 24, textAlign: "center", cursor: "pointer", background: "#fff", minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 10 }}>
                      {imageUrl ? (
                        <img src={imageUrl} alt="Service" style={{ maxWidth: "100%", maxHeight: 160, objectFit: "contain" }} />
                      ) : (
                        <>
                          <ImageIcon size={40} color={MUTED} strokeWidth={1.5} />
                          <span style={{ color: TEAL, fontSize: 14, fontWeight: 500 }}>Add an image</span>
                        </>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
                  </div>
                </div>
              )}
            </div>

            <div style={sectionPanelStyle}>
              <SectionHeader title="Sales" open={salesOpen} onToggle={() => setSalesOpen(!salesOpen)} />
              {salesOpen && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Price/rate</label>
                      <input type="number" value={priceRate} onChange={e => setPriceRate(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Income account *</label>
                      <CustomDropdown
                        value={incomeAccount}
                        onChange={setIncomeAccount}
                        options={accounts}
                        placeholder="Select account"
                        onAddNew={() => setShowNewAccount(true)}
                        renderOption={(opt) => (
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <span>{opt.name}</span>
                            <span style={{ color: MUTED, fontStyle: "italic", fontSize: 13 }}>{opt.type}</span>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={sectionPanelStyle}>
              <SectionHeader title="Purchasing" open={purchOpen} onToggle={() => setPurchOpen(!purchOpen)} />
              {purchOpen && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: TEXT, cursor: "pointer" }}>
                  <input type="checkbox" checked={purchaseFromSupplier} onChange={e => setPurchaseFromSupplier(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                  I purchase this service from a supplier
                </label>
              )}
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", borderTop: "1px solid " + BORDER, background: "#fff" }}>
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: TEXT, fontSize: 14, fontWeight: 500, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Cancel</button>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={() => submit(false)} style={{ padding: "10px 20px", background: "#fff", border: "1px solid " + BORDER, borderRadius: 4, fontSize: 14, fontWeight: 500, color: TEXT, cursor: "pointer", fontFamily: "inherit" }}>Save and new</button>
              <button type="button" onClick={() => submit(true)} style={{ padding: "10px 20px", background: TEAL, border: "none", borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Save and close</button>
            </div>
          </div>

        </div>
      </div>

      {showNewAccount && <NewAccountModal onClose={() => setShowNewAccount(false)} onSave={handleSaveAccount} />}

      {showCatPrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 300, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 440, background: "#fff", borderRadius: 8, boxShadow: "0 12px 32px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 8px", fontSize: 16, fontWeight: 600, color: TEXT }}>Add new category</div>
            <div style={{ padding: "0 24px 16px" }}>
              <label style={{ display: "block", fontSize: 13, color: MUTED, marginBottom: 8 }}>Category name</label>
              <input
                autoFocus
                value={catDraft}
                onChange={e => setCatDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirmAddCategory(); if (e.key === "Escape") setShowCatPrompt(false); }}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "12px 24px 20px" }}>
              <button type="button" onClick={() => setShowCatPrompt(false)} style={{ padding: "10px 20px", background: "#fff", border: "1px solid " + BORDER, borderRadius: 4, fontSize: 14, fontWeight: 500, color: TEXT, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button type="button" onClick={confirmAddCategory} style={{ padding: "10px 20px", background: TEAL, border: "none", borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddNewServiceModal;
