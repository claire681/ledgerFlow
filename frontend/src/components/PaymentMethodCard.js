import React from "react";
import { CreditCard, FileText } from "lucide-react";

const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  ink: "#0E1A1A", muted: "#12262B", line: "#E7EAF0", page: "#F8F9FA",
  brand: "#15A08C", brandDark: "#0F6E56", brandBg: "#E1F5EE",
  chipBg: "#E7EAF0",
};

const METHOD_LABEL = {
  "Cheque": "Paper cheque issued each pay period",
  "Direct deposit": "Deposited to a linked bank account",
  "Cash": "Paid in cash each pay period",
};

export default function PaymentMethodCard(props) {
  const section = props.section;
  const isOpen = props.isOpen;
  const onToggleOpen = props.onToggleOpen;
  const employee = props.employee || {};

  function openEdit() {
    window.dispatchEvent(new CustomEvent("novala:openPaymentMethodModal"));
  }

  const method = employee.payment_method || employee.method || "Cheque";
  const descr = METHOD_LABEL[method] || "Payment method for this employee";

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 12, marginBottom: 12, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", cursor: "pointer", borderBottom: isOpen ? "1px solid " + C.line : "0" }} onClick={onToggleOpen}>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Payment method</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 2 }}>How {employee.first_name || "this employee"} receives their pay.</div>
        </div>
        <a onClick={function(e) { e.stopPropagation(); openEdit(); }}
          style={{ fontSize: 13, color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer", marginRight: 12 }}>
          Edit
        </a>
        <span style={{ color: C.muted, fontSize: 14 }}>{isOpen ? "\u25be" : "\u25b8"}</span>
      </div>

      {isOpen && (
        <div style={{ padding: "4px 22px 22px" }}>
          {/* Hero */}
          <div style={{ marginTop: 14, padding: "18px 20px", background: C.page, borderRadius: 10, border: "1px solid " + C.line }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: C.ink, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, letterSpacing: "-0.01em" }}>{method}</div>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginTop: 3 }}>{descr}</div>
              </div>
              <span style={{ padding: "5px 12px", background: C.brandBg, color: C.brandDark, borderRadius: 6, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>Active</span>
            </div>
          </div>

          {/* Notice */}
          <div style={{ marginTop: 14, padding: "12px 14px", background: C.page, border: "1px solid " + C.line, borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
            </svg>
            <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>
              Direct deposit and bank connection are coming soon. Cheque is the current working payment method.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}