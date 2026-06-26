import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ChevronDown, Users, Calendar, Landmark,
  Play, FileText, MessageCircle,
} from "lucide-react";
import useAI from "../hooks/useAI";

const C = {
  ink: "#12262B", text: "#1B2533", muted: "#66748B", faint: "#94A0B2",
  teal: "#15A08C", tealD: "#0F8474", tealInk: "#0E8A78", tealSoft: "#E3F4F0",
  line: "#E7EAF0", lineSoft: "#F1F3F7", surface: "#F4F6F8",
};
const FONT = "Inter, system-ui, sans-serif";

const STEPS = [
  {
    num: 1, title: "Add your team", time: "5 to 10 min per person",
    Icon: Users,
    intro: "Start by adding everyone you pay. For each person, you enter their name, contact info, hire date, pay rate, and tax form details (TD1 for Canada, W-4 for US, P45 for UK, TFN declaration for Australia). Novala adapts the form based on the country your business is in.",
    why: "Tax calculations cannot happen without each employee's tax form. Novala uses this info to figure out how much federal, provincial, and CPP/EI to withhold from every paycheque.",
    extra: "You can also invite employees to fill in their own details by email. They get a secure link, enter their info, and you save time.",
    cta: "Go to Employees", route: "/payroll/employees",
  },
  {
    num: 2, title: "Set up your pay schedule", time: "2 min",
    Icon: Calendar,
    intro: 'Tell Novala how often you pay your team. The options are weekly, bi-weekly, semi-monthly (the 15th and end of the month), or monthly.',
    why: "Your pay schedule controls when paydays land and what time period each run covers. Novala uses it to count down to payday on your dashboard and to lock the right pay period for each run.",
    extra: "You can have different schedules for different groups of employees, for example bi-weekly for hourly staff and monthly for salaried managers.",
    cta: "Go to Payroll settings", route: "/payroll/settings",
  },
  {
    num: 3, title: "Connect a bank account", time: "5 min plus 1 to 2 days verify",
    Icon: Landmark,
    intro: "Connect the business chequing account that payroll will draw from. Novala asks for your bank name, account holder name, and the account identifiers for your country (transit and institution for Canada, routing for US, sort code for UK, BSB for Australia).",
    why: "Without a connected bank account, employees can only be paid by cheque. Direct deposit needs the account verified first; Novala does this with a small test deposit that takes 1 to 2 business days.",
    extra: "Your bank info is encrypted and never shared. It is only used to send payments to your employees and to file payroll taxes.",
    cta: "Connect bank", route: "/payroll/overview",
  },
  {
    num: 4, title: "Run payroll", time: "10 to 15 min per run",
    Icon: Play,
    intro: "When payday is coming up, open Run payroll. You will see every employee on this pay schedule, with cells for regular hours, stat holiday hours, and any one-time stat pay or bonus. Type the hours, and Novala calculates gross pay, deductions, and net pay live.",
    why: "This is the actual paycheque-cutting moment. Novala saves your work as you go (auto-save), so you can leave and come back. When the numbers look right, you preview, then finalize. The run is locked.",
    extra: "You can export the run as Excel or PDF for your records, or save it for later if you are not ready to finalize.",
    cta: "Run payroll", route: "/payroll/run",
  },
  {
    num: 5, title: "Pay your payroll taxes", time: "Monthly or quarterly",
    Icon: FileText,
    intro: "Every paycheque includes deductions for federal tax, provincial or state tax, and social contributions (CPP and EI in Canada, Social Security in the US, NI in the UK, super in Australia). You owe the tax agency this amount, plus the employer portion.",
    why: "Missing tax remittance deadlines means penalties and interest. Novala tracks what is owed and when, and shows the next deadline on your Payroll overview so nothing slips through.",
    extra: "Once you sign the tax authorization forms, Novala can e-file and pay these for you automatically. Until then, you remit them manually using the totals Novala calculates.",
    cta: "View tax dashboard", route: "/payroll/settings",
  },
];

const FAQS = [
  { q: "How long does it take to set up payroll on Novala?", a: "Most businesses are ready to run their first payroll in 30 to 60 minutes. Adding employees takes the longest because of all the tax info per person. Once setup is done, each pay run takes 10 to 15 minutes." },
  { q: "What if I have already paid employees this year on another system?", a: "You can import your year-to-date payroll history so that T4s and year-end forms are accurate. Have your pay stubs or payroll reports ready before you start." },
  { q: "Can I pay employees in different countries?", a: "Yes. Novala supports Canada, United States, United Kingdom, and Australia for payroll, with country-specific tax forms, withholdings, and bank rails. Other countries can be added by entering the account identifiers manually." },
  { q: "What if direct deposit is not set up yet?", a: "You can still run payroll. Novala falls back to cheque as the payment method for everyone until direct deposit is connected and verified. You can switch to direct deposit any time after verification finishes." },
  { q: "Is my data safe?", a: "Yes. All payroll data, bank info, and tax IDs are encrypted at rest and in transit. Novala never shares your information with third parties beyond what is required to pay employees and file taxes." },
  { q: "Can I change my pay schedule later?", a: "Yes, you can change your pay schedule at any time in Payroll settings. The new schedule takes effect from the next pay period; existing finalized runs are not affected." },
];

export default function PayrollGuide() {
  const navigate = useNavigate();
  const { askAndopen } = useAI();

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: FONT, color: C.text }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 32px 100px" }}>

        <button onClick={() => navigate("/payroll/overview")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: C.tealInk, cursor: "pointer", background: "none", border: "none", fontFamily: FONT, marginBottom: 14, padding: 0 }}>
          <ChevronLeft size={14} /> Back to Payroll overview
        </button>

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #EAF8F4, #F1F8F6)", border: "1px solid #D5EDE6", borderRadius: 18, padding: "34px 30px", marginBottom: 32, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.tealInk, marginBottom: 10 }}>Welcome to Novala payroll</div>
          <h1 style={{ fontSize: 32, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em", marginBottom: 10 }}>Payroll, simplified</h1>
          <p style={{ fontSize: 15.5, color: C.muted, maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>
            Running payroll on Novala takes five steps. This guide walks you through each one, so you know what is happening, why it matters, and where to find it in the app.
          </p>
        </div>

        {/* Flow diagram */}
        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 14, padding: "24px 28px", marginBottom: 36, boxShadow: "0 1px 2px rgba(16,26,43,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.faint, marginBottom: 18, textAlign: "center" }}>How payroll works on Novala</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, alignItems: "start" }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ textAlign: "center", position: "relative", padding: "0 4px" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.teal, color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 10px", fontSize: 14, fontWeight: 700, boxShadow: "0 2px 8px rgba(21,160,140,0.28)" }}>{step.num}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>{step.title.replace("Set up your ", "Set ").replace("Pay your payroll taxes", "Pay tax")}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step sections */}
        {STEPS.map(step => (
          <section key={step.num} style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 14, padding: "28px 30px", marginBottom: 18, boxShadow: "0 1px 2px rgba(16,26,43,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.tealSoft, color: C.tealInk, display: "grid", placeItems: "center", flex: "0 0 32px", fontWeight: 700, fontSize: 14 }}>{step.num}</div>
              <h2 style={{ fontSize: 19, fontWeight: 600, color: C.ink, letterSpacing: "-0.01em" }}>{step.title}</h2>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: C.muted, background: C.lineSoft, padding: "4px 10px", borderRadius: 20 }}>{step.time}</span>
            </div>
            <div style={{ fontSize: 14.5, color: C.text, lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>{step.intro}</p>
              <div style={{ background: C.tealSoft, borderLeft: "3px solid " + C.teal, padding: "14px 18px", margin: "14px 0", borderRadius: "0 10px 10px 0", fontSize: 13.5 }}>
                <strong style={{ display: "block", color: C.tealInk, fontSize: 11.5, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Why this matters</strong>
                {step.why}
              </div>
              <p style={{ marginBottom: 12 }}>{step.extra}</p>
              <button onClick={() => navigate(step.route)} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.teal, color: "#fff", border: "none", borderRadius: 9, padding: "10px 18px", fontWeight: 600, fontSize: 13.5, cursor: "pointer", marginTop: 10, fontFamily: FONT, boxShadow: "0 1px 3px rgba(21,160,140,0.18)" }}>
                {step.cta} <ChevronRight size={14} />
              </button>
            </div>
          </section>
        ))}

        {/* FAQ */}
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.faint, margin: "36px 0 14px", padding: "0 6px" }}>Frequently asked questions</div>
        {FAQS.map((faq, i) => (
          <details key={i} style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
            <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", fontSize: 14.5, fontWeight: 600, color: C.ink }}>
              {faq.q}
              <ChevronDown size={16} style={{ color: C.muted, flex: "0 0 16px" }} />
            </summary>
            <div style={{ padding: "14px 20px 18px", fontSize: 13.5, color: C.text, lineHeight: 1.65, borderTop: "1px solid " + C.lineSoft }}>
              {faq.a}
            </div>
          </details>
        ))}

        {/* Nexa CTA */}
        <div style={{ background: "linear-gradient(135deg, #0A1A1E, #12262B)", color: "#fff", borderRadius: 16, padding: "28px 30px", marginTop: 30, display: "flex", alignItems: "center", gap: 20, boxShadow: "0 4px 16px rgba(18,38,43,0.18)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, " + C.teal + ", #0EA5E9)", display: "grid", placeItems: "center", flex: "0 0 56px", fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>N</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, color: "#fff" }}>Still have questions?</h3>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.7)", margin: 0 }}>Nexa, your Novala assistant, can answer payroll questions in plain language and walk you through anything in the app.</p>
          </div>
          <button onClick={() => askAndopen("Hi! I have questions about payroll on Novala. Can you help?")} style={{ background: C.teal, color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT, flex: "0 0 auto", boxShadow: "0 2px 8px rgba(21,160,140,0.28)" }}>
            <MessageCircle size={14} /> Ask Nexa
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 18 }}>
          Or <button onClick={() => askAndopen("Hi! I need help.")} style={{ background: "none", border: "none", color: C.tealInk, fontWeight: 600, cursor: "pointer", fontFamily: FONT, fontSize: 13, textDecoration: "underline" }}>Contact us</button> for support that needs a human.
        </div>
      </div>
    </div>
  );
}
