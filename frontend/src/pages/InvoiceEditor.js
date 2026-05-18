import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, PlayCircle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

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

  const toggleSection = (k) => setOpenSections(s => ({ ...s, [k]: !s[k] }));
  const invoiceNumber = id || "new";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: PAGE_BG, fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "14px 24px", background: "#fff", borderBottom: "1px solid " + BORDER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/invoices")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
            <ArrowLeft size={20} color={TEXT} />
          </button>
          <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: TEXT }}>Invoice {invoiceNumber}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 2 : 8 }}>
          <button onClick={() => setSidebarOpen(s => !s)} style={topBtn(isMobile)}><Settings size={16} /><span>{isMobile ? "" : "Manage"}</span></button>
          <button style={topBtn(isMobile)}><PlayCircle size={16} /><span>{isMobile ? "" : "Take tour"}</span></button>
          <button style={topBtn(isMobile)}><MessageSquare size={16} /><span>{isMobile ? "" : "Feedback"}</span></button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, padding: isMobile ? "0 16px" : "0 24px", background: "#fff", borderBottom: "1px solid " + BORDER }}>
        {[{ k: "edit", l: "Edit" }, { k: "email", l: "Email view" }, { k: "pdf", l: "PDF view" }].map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)} style={{
            background: "none",
            border: "none",
            padding: "12px 16px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: activeTab === t.k ? 600 : 500,
            color: activeTab === t.k ? BRAND : SUBTLE,
            borderBottom: activeTab === t.k ? "2px solid " + BRAND : "2px solid transparent",
            marginBottom: -1
          }}>{t.l}</button>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", flexDirection: isMobile ? "column" : "row" }}>

        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 32, background: PAGE_BG }}>
          <div style={{ maxWidth: 800, margin: "0 auto", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", minHeight: 600, padding: 40, color: SUBTLE, fontSize: 14, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Invoice preview wires in next step.
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
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: TEXT
                }}>
                  <span>{s.t}</span>
                  {openSections[s.k] ? <ChevronUp size={16} color={SUBTLE} /> : <ChevronDown size={16} color={SUBTLE} />}
                </button>
                {openSections[s.k] && (
                  <div style={{ marginTop: 12, fontSize: 13, color: SUBTLE, lineHeight: 1.5 }}>
                    Controls for {s.t.toLowerCase()} land in PR2.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "14px 24px", background: "#fff", borderTop: "1px solid " + BORDER }}>
        <button style={{ background: "none", border: "none", color: SUBTLE, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
          Print or download
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "8px 14px", background: "#fff", border: "1px solid " + BORDER, borderRadius: 6, fontSize: 14, fontWeight: 500, color: TEXT, cursor: "pointer" }}>
            Save ▾
          </button>
          <button style={{ padding: "8px 16px", background: BRAND, border: "1px solid " + BRAND, borderRadius: 6, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            Review and send ▾
          </button>
        </div>
      </div>
    </div>
  );
}
