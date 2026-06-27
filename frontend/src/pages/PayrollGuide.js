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

export default function PayrollGuide({ embeddedInPanel = false, onClose }) {
  const navigate = useNavigate();
  const { askAndopen } = useAI();

  // Compact sizes when embedded in a narrow panel
  const SZ = embeddedInPanel ? {
    contentPad: "20px 22px 50px", contentMaxW: "100%",
    heroPad: "20px 18px", heroH1: 21, heroP: 13, heroEyebrow: 10.5,
    flowPad: 16, flowTitle: 11, stepNum: 28, stepName: 13.5, stepGap: 8,
    secPad: "18px 18px", secNum: 28, secNumRadius: 7, secH2: 15,
    secTime: 10.5, secBody: 13, secLineH: 1.6,
    whyPad: "11px 13px", whyFont: 12, whyLabel: 10,
    btnPad: "8px 14px", btnFont: 12.5,
    faqTitle: 11, faqMargin: "22px 0 10px",
    faqSummaryPad: "12px 16px", faqSummaryFont: 13,
    faqAnswerPad: "11px 16px 14px", faqAnswerFont: 12.5,
    nexaPad: 18, nexaAvatar: 44, nexaH3: 14, nexaP: 12, nexaBtnPad: "9px 18px", nexaBtnFont: 13,
    logoSize: 38, brandName: 19,
  } : {
    contentPad: "28px 32px 100px", contentMaxW: 900,
    heroPad: "34px 30px", heroH1: 32, heroP: 15.5, heroEyebrow: 11,
    flowPad: "24px 28px", flowTitle: 13, stepNum: 36, stepName: 12.5, stepGap: 8,
    secPad: "28px 30px", secNum: 32, secNumRadius: 8, secH2: 19,
    secTime: 12, secBody: 14.5, secLineH: 1.7,
    whyPad: "14px 18px", whyFont: 13.5, whyLabel: 11.5,
    btnPad: "10px 18px", btnFont: 13.5,
    faqTitle: 13, faqMargin: "36px 0 14px",
    faqSummaryPad: "16px 20px", faqSummaryFont: 14.5,
    faqAnswerPad: "14px 20px 18px", faqAnswerFont: 13.5,
    nexaPad: "28px 30px", nexaAvatar: 56, nexaH3: 17, nexaP: 13.5, nexaBtnPad: "11px 22px", nexaBtnFont: 14,
    logoSize: 44, brandName: 22,
  };

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: FONT, color: C.text }}>
      <div style={{ maxWidth: SZ.contentMaxW, margin: "0 auto", padding: SZ.contentPad }}>

        {!embeddedInPanel && (
          <button onClick={() => navigate("/payroll/overview")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: C.tealInk, cursor: "pointer", background: "none", border: "none", fontFamily: FONT, marginBottom: 14, padding: 0 }}>
            <ChevronLeft size={14} /> Back to Payroll overview
          </button>
        )}

        {/* Novala brand */}
        {embeddedInPanel && (
          <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 6 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <img src="/logo512.png" alt="Novala" style={{ width: SZ.logoSize, height: SZ.logoSize, borderRadius: 10, objectFit: "contain", background: "#fff", padding: 4, boxShadow: "0 2px 8px rgba(16,26,43,0.08)" }} />
              <span style={{ fontSize: SZ.brandName, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>Novala</span>
            </div>
          </div>
        )}

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #EAF8F4, #F1F8F6)", border: "1px solid #D5EDE6", borderRadius: 18, padding: SZ.heroPad, marginBottom: 24, textAlign: "center" }}>
          <div style={{ fontSize: SZ.heroEyebrow, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.tealInk, marginBottom: 8 }}>Welcome to Novala payroll</div>
          <h1 style={{ fontSize: SZ.heroH1, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.2 }}>Payroll, simplified</h1>
          <p style={{ fontSize: SZ.heroP, color: C.muted, maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>
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
          <section key={step.num} style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 14, padding: SZ.secPad, marginBottom: 14, boxShadow: "0 1px 2px rgba(16,26,43,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: SZ.secNum, height: SZ.secNum, borderRadius: SZ.secNumRadius, background: C.tealSoft, color: C.tealInk, display: "grid", placeItems: "center", flex: "0 0 " + SZ.secNum + "px", fontWeight: 700, fontSize: SZ.secNum >= 32 ? 14 : 12.5 }}>{step.num}</div>
              <h2 style={{ fontSize: SZ.secH2, fontWeight: 600, color: C.ink, letterSpacing: "-0.01em", flex: 1, minWidth: 0 }}>{step.title}</h2>
              <span style={{ marginLeft: "auto", fontSize: SZ.secTime, fontWeight: 600, color: C.muted, background: C.lineSoft, padding: "3px 9px", borderRadius: 20 }}>{step.time}</span>
            </div>
            <div style={{ fontSize: SZ.secBody, color: C.text, lineHeight: SZ.secLineH }}>
              <p style={{ marginBottom: 12 }}>{step.intro}</p>
              <div style={{ background: C.tealSoft, borderLeft: "3px solid " + C.teal, padding: SZ.whyPad, margin: "12px 0", borderRadius: "0 8px 8px 0", fontSize: SZ.whyFont }}>
                <strong style={{ display: "block", color: C.tealInk, fontSize: SZ.whyLabel, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>Why this matters</strong>
                {step.why}
              </div>
              <p style={{ marginBottom: 12 }}>{step.extra}</p>
              <button onClick={() => navigate(step.route)} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.teal, color: "#fff", border: "none", borderRadius: 9, padding: SZ.btnPad, fontWeight: 600, fontSize: SZ.btnFont, cursor: "pointer", marginTop: 10, fontFamily: FONT, boxShadow: "0 1px 3px rgba(21,160,140,0.18)" }}>
                {step.cta} <ChevronRight size={14} />
              </button>
            </div>
          </section>
        ))}

        {/* FAQ */}
        <div style={{ fontSize: SZ.faqTitle, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.faint, margin: SZ.faqMargin, padding: "0 4px" }}>Frequently asked questions</div>
        {FAQS.map((faq, i) => (
          <details key={i} style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
            <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: SZ.faqSummaryPad, fontSize: SZ.faqSummaryFont, fontWeight: 600, color: C.ink }}>
              {faq.q}
              <ChevronDown size={16} style={{ color: C.muted, flex: "0 0 16px" }} />
            </summary>
            <div style={{ padding: SZ.faqAnswerPad, fontSize: SZ.faqAnswerFont, color: C.text, lineHeight: 1.6, borderTop: "1px solid " + C.lineSoft }}>
              {faq.a}
            </div>
          </details>
        ))}

        {/* Nexa CTA */}
        <div style={{ background: "linear-gradient(135deg, #0A1A1E, #12262B)", color: "#fff", borderRadius: 14, padding: SZ.nexaPad, marginTop: 22, display: "flex", flexDirection: embeddedInPanel ? "column" : "row", alignItems: "center", gap: embeddedInPanel ? 12 : 20, textAlign: embeddedInPanel ? "center" : "left", boxShadow: "0 4px 16px rgba(18,38,43,0.18)" }}>
          <div style={{ width: SZ.nexaAvatar, height: SZ.nexaAvatar, borderRadius: "50%", background: "linear-gradient(135deg, " + C.teal + ", #0EA5E9)", display: "grid", placeItems: "center", flex: "0 0 " + SZ.nexaAvatar + "px", fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>N</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: SZ.nexaH3, fontWeight: 600, marginBottom: 3, color: "#fff" }}>Still have questions?</h3>
            <p style={{ fontSize: SZ.nexaP, color: "rgba(255,255,255,0.7)", margin: 0 }}>Nexa, your Novala assistant, can answer payroll questions in plain language and walk you through anything in the app.</p>
          </div>
          <button onClick={() => askAndopen("Hi! I have questions about payroll on Novala. Can you help?")} style={{ background: C.teal, color: "#fff", border: "none", borderRadius: 9, padding: SZ.nexaBtnPad, fontWeight: 600, fontSize: SZ.nexaBtnFont, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT, flex: "0 0 auto", boxShadow: "0 2px 8px rgba(21,160,140,0.28)" }}>
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
