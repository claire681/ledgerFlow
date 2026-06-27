import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, Sparkles } from "lucide-react";

const C = {
  ink: "#0A1A1E", text: "#1B2533", muted: "#5C6A7A", faint: "#8B97A8",
  line: "#E4E8EE", lineSoft: "#EEF1F5", surface: "#FAFBFC",
  teal: "#15A08C", tealD: "#0F8474", tealInk: "#0B6B5C", tealSoft: "#EAF6F3",
};
const FONT = "Inter, system-ui, sans-serif";

const SCREENS = {
  company: {
    title: "Company details",
    subtitle: "Set your registered business name, address, country, and currency.",
    csTitle: "Company details editor",
    features: [
      "Edit your business legal name and trading name",
      "Set your registered business address",
      "Change your country and base currency",
      "Set your fiscal year start date",
    ],
  },
  schedule: {
    title: "Pay schedule",
    subtitle: "Choose how often paydays happen and when the first one is.",
    csTitle: "Pay schedule editor",
    features: [
      "Select pay frequency (weekly, bi-weekly, semi-monthly, monthly)",
      "Set your first payday and the period it covers",
      "Configure multiple schedules for different employee groups",
      "Adjust how holidays shift pay dates",
    ],
  },
  tax: {
    title: "Tax registration",
    subtitle: "Add your business tax IDs so Novala can calculate and remit payroll taxes.",
    csTitle: "Tax registration form",
    features: [
      "Enter your country-specific business tax number",
      "Add your payroll tax account registration",
      "Set your filing cadence (monthly, quarterly, annually)",
      "Authorize Novala to e-file payroll taxes on your behalf",
    ],
  },
  review: {
    title: "Review and authorize",
    subtitle: "Confirm your setup and authorize Novala to start processing payroll.",
    csTitle: "Final review and authorization",
    features: [
      "Review every section of your payroll setup",
      "Confirm authorized signer details",
      "Sign off so Novala can start running pay runs",
      "Receive a confirmation summary by email",
    ],
  },
};

export default function PayrollSettingsStub() {
  const navigate = useNavigate();
  const { screen } = useParams();
  const s = SCREENS[screen] || SCREENS.company;

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: FONT, color: C.text, padding: "32px 40px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted, marginBottom: 18 }}>
          <span onClick={() => navigate("/payroll/overview")} style={{ color: C.tealInk, cursor: "pointer", fontWeight: 500 }}>Payroll</span>
          <ChevronRight size={11} style={{ color: C.faint }} />
          <span style={{ color: C.tealInk, fontWeight: 500 }}>Settings</span>
          <ChevronRight size={11} style={{ color: C.faint }} />
          <span>{s.title}</span>
        </div>

        <button onClick={() => navigate("/payroll/overview")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: C.tealInk, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 16, fontFamily: FONT }}>
          <ChevronLeft size={12} /> Back to Payroll overview
        </button>

        <h1 style={{ fontSize: 26, fontWeight: 600, color: C.ink, letterSpacing: "-0.018em", marginBottom: 8 }}>{s.title}</h1>
        <p style={{ fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 1.6, maxWidth: 580 }}>{s.subtitle}</p>

        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 12, padding: "48px 40px", textAlign: "center", maxWidth: 640, boxShadow: "0 1px 2px rgba(10,26,30,0.04)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.tealSoft, color: C.tealInk, display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
            <Clock size={30} />
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.tealSoft, color: C.tealInk, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 20, marginBottom: 16 }}>
            <Sparkles size={11} /> Coming soon
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: "-0.015em", marginBottom: 10 }}>{s.csTitle}</h2>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 460, margin: "0 auto 24px" }}>
            We are building this setup screen now. For tonight, you can complete the rest of payroll setup using the steps that are already working.
          </p>

          <div style={{ textAlign: "left", background: C.surface, border: "1px solid " + C.lineSoft, borderRadius: 8, padding: "18px 22px", margin: "0 auto 28px", maxWidth: 480 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>What you'll be able to do here</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {s.features.map((f, i) => (
                <li key={i} style={{ fontSize: 13, color: C.text, padding: "5px 0 5px 18px", position: "relative", lineHeight: 1.5 }}>
                  <span style={{ position: "absolute", left: 0, top: 13, width: 8, height: 1, background: C.teal }}></span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => navigate("/payroll/overview")} style={{ background: C.teal, color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", fontWeight: 500, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: FONT }}>
              <ChevronLeft size={11} /> Back to setup
            </button>
          </div>

          <div style={{ marginTop: 18, fontSize: 12.5, color: C.muted }}>
            Already working: <strong style={{ color: C.ink, fontWeight: 600 }}>Add employee</strong> and <strong style={{ color: C.ink, fontWeight: 600 }}>Connect bank</strong> are live now.
          </div>
        </div>
      </div>
    </div>
  );
}
