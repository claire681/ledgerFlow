import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle } from "lucide-react";

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

export default function InvoiceReviewSend() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: PAGE_BG, fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "14px 24px", background: "#fff", borderBottom: "1px solid " + BORDER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/invoices/" + id + "/edit")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
            <ArrowLeft size={20} color={TEXT} />
          </button>
          <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: TEXT }}>Invoice {id}</div>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
          <HelpCircle size={18} color={SUBTLE} />
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", flexDirection: isMobile ? "column" : "row" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: PAGE_BG }}>
          <div style={{ maxWidth: 560, margin: "0 auto", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 32, color: SUBTLE, fontSize: 14, textAlign: "center" }}>
            Email compose form lands in PR2
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: PAGE_BG, borderLeft: isMobile ? "none" : "1px solid " + BORDER, borderTop: isMobile ? "1px solid " + BORDER : "none" }}>
          <div style={{ maxWidth: 560, margin: "0 auto", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 32, color: SUBTLE, fontSize: 14, textAlign: "center" }}>
            Email preview lands in PR3
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "14px 24px", background: "#fff", borderTop: "1px solid " + BORDER }}>
        <button onClick={() => navigate("/invoices/" + id + "/edit")} style={{ background: "none", border: "none", color: SUBTLE, fontSize: 14, cursor: "pointer", textDecoration: "underline" }}>
          ← Back
        </button>
        <button disabled style={{ padding: "8px 16px", background: BRAND, color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "not-allowed", opacity: 0.6 }}>
          Send invoice
        </button>
      </div>
    </div>
  );
}
