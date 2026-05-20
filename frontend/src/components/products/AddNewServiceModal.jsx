import { useState, useEffect } from "react";
import { X } from "lucide-react";

const PRODUCTS_KEY = "novala_products_v1";

const getStoredProducts = () => {
  try { return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]"); } catch { return []; }
};

const saveStoredProducts = (products) => {
  try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); } catch {}
};

const emptyData = {
  name: "", item_type: "service", sku: "", category: "",
  description: "", price_rate: "", income_account: "",
  is_purchased: false, purchase_description: "", purchase_cost: "",
  expense_account: "", preferred_supplier: "",
};

export function AddNewServiceModal({ isOpen, onClose, onSaved }) {
  const [data, setData] = useState(emptyData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) { setData(emptyData); setError(null); }
  }, [isOpen]);

  if (!isOpen) return null;

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const handleSave = (saveAndNew) => {
    if (!data.name.trim()) { setError("Name is required"); return; }
    const newProduct = {
      id: "p_" + Date.now(),
      ...data,
      name: data.name.trim(),
      price_rate: data.price_rate !== "" ? Number(data.price_rate) : "",
      purchase_cost: data.purchase_cost !== "" ? Number(data.purchase_cost) : "",
      created_at: new Date().toISOString(),
    };
    saveStoredProducts([...getStoredProducts(), newProduct]);
    if (onSaved) onSaved(newProduct, saveAndNew);
    if (saveAndNew) { setData(emptyData); setError(null); } else { onClose(); }
  };

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: 13, fontWeight: 500, color: "#1e293b", marginBottom: 6 };
  const sectionH = { fontSize: 14, fontWeight: 600, color: "#0F172A", margin: 0, marginBottom: 16, paddingTop: 16, paddingBottom: 4 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1100, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ width: "min(720px, 95vw)", height: "100vh", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-4px 0 16px rgba(0,0,0,0.15)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#0F172A" }}>Add a new service</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} color="#64748B" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {error && <div style={{ marginBottom: 16, padding: 10, background: "#fee2e2", color: "#991b1b", borderRadius: 6, fontSize: 13 }}>{error}</div>}

          <h3 style={{ ...sectionH, paddingTop: 0 }}>Basic info</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Name <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="text" value={data.name} onChange={e => update("name", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Item type</label>
            <select value={data.item_type} onChange={e => update("item_type", e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
              <option value="service">Service</option>
              <option value="product">Product</option>
              <option value="bundle">Bundle</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>SKU</label>
            <input type="text" value={data.sku} onChange={e => update("sku", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Category</label>
            <input type="text" value={data.category} onChange={e => update("category", e.target.value)} placeholder="None selected" style={inputStyle} />
          </div>

          <h3 style={{ ...sectionH, borderTop: "1px solid #f1f5f9" }}>Sales</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Description</label>
            <textarea value={data.description} onChange={e => update("description", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Price/rate</label>
            <input type="number" step="0.01" value={data.price_rate} onChange={e => update("price_rate", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Income account <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="text" value={data.income_account} onChange={e => update("income_account", e.target.value)} placeholder="None selected" style={inputStyle} />
          </div>

          <h3 style={{ ...sectionH, borderTop: "1px solid #f1f5f9" }}>Purchasing</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1e293b", cursor: "pointer" }}>
              <input type="checkbox" checked={data.is_purchased} onChange={e => update("is_purchased", e.target.checked)} />
              I purchase this service from a supplier
            </label>
          </div>
          {data.is_purchased && (<>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Purchase description</label>
              <textarea value={data.purchase_description} onChange={e => update("purchase_description", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Purchase cost</label>
              <input type="number" step="0.01" value={data.purchase_cost} onChange={e => update("purchase_cost", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Expense account</label>
              <input type="text" value={data.expense_account} onChange={e => update("expense_account", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Preferred supplier</label>
              <input type="text" value={data.preferred_supplier} onChange={e => update("preferred_supplier", e.target.value)} style={inputStyle} />
            </div>
          </>)}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0, background: "#fff" }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 20px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#0F172A", cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={() => handleSave(true)} style={{ padding: "10px 20px", background: "#fff", border: "1px solid #22c55e", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#22c55e", cursor: "pointer" }}>Save and new</button>
          <button type="button" onClick={() => handleSave(false)} style={{ padding: "10px 20px", background: "#22c55e", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Save and close</button>
        </div>
      </div>
    </div>
  );
}
