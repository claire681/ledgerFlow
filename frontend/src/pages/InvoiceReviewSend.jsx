import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, X, Paperclip } from "lucide-react";

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

const DEFAULT_BODY = "Dear {client_name},\n\nWe appreciate your business. Please find your invoice details here. Feel free to contact us if you have any questions.\n\nHave a great day!\n{company_name}";

const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid " + BORDER, borderRadius: 6, fontSize: 14, color: TEXT, background: "#fff", boxSizing: "border-box", fontFamily: "inherit", outline: "none" };

const EmailChipInput = ({ emails, onChange, placeholder }) => {
  const [input, setInput] = useState("");
  const addEmail = (val) => {
    const t = val.trim();
    if (t && !emails.includes(t)) onChange([...emails, t]);
    setInput("");
  };
  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      if (input) addEmail(input);
    } else if (e.key === "Backspace" && !input && emails.length > 0) {
      onChange(emails.slice(0, -1));
    }
  };
  return (
    <div style={{ ...inputStyle, padding: "6px 8px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minHeight: 38 }}>
      {emails.map((email, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "#f1f5f9", borderRadius: 4, fontSize: 13 }}>
          {email}
          <button onClick={() => onChange(emails.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <X size={12} color={SUBTLE} />
          </button>
        </span>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} onBlur={() => input && addEmail(input)} placeholder={emails.length === 0 ? placeholder : ""} style={{ flex: 1, minWidth: 120, border: "none", outline: "none", fontSize: 14, background: "transparent", fontFamily: "inherit" }} />
    </div>
  );
};

const FormRow = ({ label, isMobile, children }) => (
  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 4 : 16, alignItems: isMobile ? "stretch" : "flex-start", marginBottom: 16 }}>
    <div style={{ width: isMobile ? "100%" : 100, fontSize: 13, fontWeight: 500, color: TEXT, paddingTop: 8 }}>{label}</div>
    <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
  </div>
);

export default function InvoiceReviewSend() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [from, setFrom] = useState("Your Company");
  const [to, setTo] = useState([]);
  const [cc, setCc] = useState([]);
  const [bcc, setBcc] = useState([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [sendMeCopy, setSendMeCopy] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachPdf, setAttachPdf] = useState(true);

  useEffect(() => {
    if (!id || id === "new") {
      setError("Cannot send a new invoice. Save it first.");
      setLoading(false);
      return;
    }
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    fetch("https://api.getnovala.com/api/v1/invoices/" + id, {
      headers: { Authorization: "Bearer " + token }
    })
      .then(r => { if (!r.ok) throw new Error("Failed to load invoice (" + r.status + ")"); return r.json(); })
      .then(data => {
        setInvoice(data);
        if (data.to_email) setTo([data.to_email]);
        const fromName = data.from_name || "Your Company";
        setFrom(fromName);
        setSubject("Invoice " + (data.invoice_number || "") + " from " + fromName);
        setBody(DEFAULT_BODY.replace("{client_name}", data.to_name || "Customer").replace("{company_name}", fromName));
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: SUBTLE, fontSize: 14 }}>Loading invoice...</div>;

  if (error) return (
    <div style={{ padding: 40, textAlign: "center", color: "#dc2626", fontSize: 14 }}>
      {error}
      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate(-1)} style={{ padding: "8px 16px", background: BRAND, color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Back</button>
      </div>
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: PAGE_BG, fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "14px 24px", background: "#fff", borderBottom: "1px solid " + BORDER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/invoices/" + id + "/edit")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
            <ArrowLeft size={20} color={TEXT} />
          </button>
          <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: TEXT }}>Invoice {invoice && invoice.invoice_number ? invoice.invoice_number : id}</div>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
          <HelpCircle size={18} color={SUBTLE} />
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", flexDirection: isMobile ? "column" : "row" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: PAGE_BG }}>
          <div style={{ maxWidth: 560, margin: "0 auto", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: isMobile ? 16 : 24 }}>

            <FormRow label="From" isMobile={isMobile}>
              <div style={{ ...inputStyle, background: "#f8fafc", color: SUBTLE }}>{from}</div>
              <div style={{ fontSize: 12, color: SUBTLE, marginTop: 4 }}>To use your own email, verify it in Settings.</div>
            </FormRow>

            <FormRow label="To" isMobile={isMobile}>
              <EmailChipInput emails={to} onChange={setTo} placeholder="Recipient email" />
              <div style={{ marginTop: 6, fontSize: 13 }}>
                {!showCc && <button onClick={() => setShowCc(true)} style={{ background: "none", border: "none", color: BRAND, cursor: "pointer", fontSize: 13, padding: 0, marginRight: 12 }}>Cc</button>}
                {!showBcc && <button onClick={() => setShowBcc(true)} style={{ background: "none", border: "none", color: BRAND, cursor: "pointer", fontSize: 13, padding: 0 }}>Bcc</button>}
              </div>
            </FormRow>

            {showCc && <FormRow label="Cc" isMobile={isMobile}><EmailChipInput emails={cc} onChange={setCc} placeholder="Cc email" /></FormRow>}
            {showBcc && <FormRow label="Bcc" isMobile={isMobile}><EmailChipInput emails={bcc} onChange={setBcc} placeholder="Bcc email" /></FormRow>}

            <FormRow label="" isMobile={isMobile}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TEXT, cursor: "pointer" }}>
                <input type="checkbox" checked={sendMeCopy} onChange={e => setSendMeCopy(e.target.checked)} />
                Send me a copy
              </label>
            </FormRow>

            <FormRow label="Subject" isMobile={isMobile}>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle} />
            </FormRow>

            <FormRow label="" isMobile={isMobile}>
              <button onClick={() => setAttachPdf(!attachPdf)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: attachPdf ? "#ecfdf5" : "#fef3c7", color: attachPdf ? "#22c55e" : "#92400e", border: "1px solid " + (attachPdf ? "#a7f3d0" : "#fde68a"), borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
                <Paperclip size={14} />
                {attachPdf ? "PDF attached" : "PDF not attached"}
              </button>
            </FormRow>

            <FormRow label="Email body" isMobile={isMobile}>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={10} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
            </FormRow>

            <div style={{ marginTop: 8, fontSize: 13 }}>
              <button style={{ background: "none", border: "none", color: BRAND, cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" }}>Manage online delivery settings</button>
            </div>

          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: PAGE_BG, borderLeft: isMobile ? "none" : "1px solid " + BORDER, borderTop: isMobile ? "1px solid " + BORDER : "none" }}>
          <div style={{ maxWidth: 560, margin: "0 auto", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 32, color: SUBTLE, fontSize: 14, textAlign: "center" }}>Email preview lands in PR-RS.3</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "14px 24px", background: "#fff", borderTop: "1px solid " + BORDER }}>
        <button onClick={() => navigate("/invoices/" + id + "/edit")} style={{ background: "none", border: "none", color: SUBTLE, fontSize: 14, cursor: "pointer", textDecoration: "underline" }}>Back</button>
        <button disabled style={{ padding: "8px 16px", background: BRAND, color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "not-allowed", opacity: 0.6 }}>Send invoice</button>
      </div>
    </div>
  );
}
