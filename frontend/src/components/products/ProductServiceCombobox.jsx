import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus } from "lucide-react";

const PRODUCTS_KEY = "novala_products_v1";

export const getStoredProducts = () => {
  try {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveStoredProducts = (products) => {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch {}
};

export function ProductServiceCombobox({ value, onChange, onSelect, onAddNew }) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) setProducts(getStoredProducts());
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredProducts = value
    ? products.filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
    : products;

  const handleSelect = (product) => {
    if (onSelect) onSelect(product);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={value || ""}
          onChange={onChange}
          onFocus={() => setIsOpen(true)}
          style={{ width: "100%", padding: "6px 28px 6px 8px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box" }}
        />
        <button type="button" onClick={() => setIsOpen(o => !o)} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: 4, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><ChevronDown size={14} color="#64748B" /></button>
      </div>

      {isOpen && (
        <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, minWidth: 280, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 30, maxHeight: 320, overflowY: "auto" }}>
          <button type="button" onClick={() => { setIsOpen(false); if (onAddNew) onAddNew(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "#fff", border: "none", borderBottom: "1px solid #f1f5f9", fontSize: 13, fontWeight: 500, color: "#0F9599", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
            <Plus size={14} /> Add new
          </button>

          {filteredProducts.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
              No products yet. Click + Add new to create one.
            </div>
          ) : (
            filteredProducts.map((product, idx) => (
              <button key={product.id || idx} type="button" onClick={() => handleSelect(product)} style={{ display: "block", width: "100%", padding: "10px 14px", background: "#fff", border: "none", borderBottom: idx < filteredProducts.length - 1 ? "1px solid #f1f5f9" : "none", textAlign: "left", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                <div style={{ fontWeight: 500, color: "#0F172A" }}>{product.name}</div>
                {product.description && <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{product.description}</div>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
