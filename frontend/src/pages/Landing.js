// Novala landing page (v2). AI assistant name: Nexa (confirmed). Use "Nexa AI" consistently throughout.
// Phase A: Hero, Stats strip, How it works, Features grid. Phase B adds dark band, testimonials, CTA, FAQ.
// Phase C adds the Features modal and wires the "View all features" button.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check, FileText, Wallet, BarChart3, Receipt, BookOpen, CreditCard,
} from "lucide-react";

import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";

// TODO Phase A2 (after Claire uploads images to src/assets/landing/):
// import heroDashboard from "../assets/landing/hero-dashboard.jpg";
// import step1Snap from "../assets/landing/step1-snap.jpg";
// import step2Extract from "../assets/landing/step2-extract.jpg";
// import step3Books from "../assets/landing/step3-books.jpg";

const BRAND = "#0F9599";
const BRAND_DEEP = "#0E4B4D";
const BRAND_TINT = "rgba(15, 149, 153, 0.10)";
const TEXT_INK = "#0E2A2A";
const TEXT_DARK = "#5A6970";
const TEXT_MUTED = "#9CA3AF";
const BG_PAGE = "#F4F8F8";
const BG_SOFT = "#F7F9F9";
const BORDER = "#EAF0F0";
const FONT_STACK = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

const CONTAINER = { maxWidth: 1240, margin: "0 auto", padding: "0 28px" };

function ImagePlaceholder({ filename, label, ratio }) {
  return (
    <div style={{
      borderRadius: 18,
      overflow: "hidden",
      background: "linear-gradient(135deg, #E8F0EF 0%, #F4F8F8 100%)",
      aspectRatio: ratio || "16/11",
      display: "grid",
      placeItems: "center",
      border: "0.5px dashed " + BORDER,
    }}>
      <div style={{ textAlign: "center", color: TEXT_MUTED, padding: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 11, fontFamily: "monospace" }}>src/assets/landing/{filename}</div>
      </div>
    </div>
  );
}

function Hero() {
  const navigate = useNavigate();
  return (
    <section style={{ position: "relative", background: "#FFFFFF", padding: "80px 0 100px", overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: -200, right: -200,
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(15, 149, 153, 0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={CONTAINER}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 60, alignItems: "center", position: "relative", zIndex: 1 }}>
          <div>
            <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, padding: "6px 14px", background: BRAND_TINT, color: BRAND_DEEP, borderRadius: 999, letterSpacing: "0.02em", marginBottom: 24 }}>
              One platform. Every part of your business.
            </span>
            <h1 style={{ fontSize: "clamp(40px, 5vw, 60px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.025em", lineHeight: 1.05, margin: "0 0 22px" }}>
              Run your <span style={{ color: BRAND }}>whole business</span> from one place.
            </h1>
            <p style={{ fontSize: 18, color: TEXT_DARK, lineHeight: 1.6, margin: "0 0 32px", maxWidth: 540 }}>
              Accounting, payroll, invoicing, and reports. All connected, automated, and ready when you are.
            </p>
            <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
              <button onClick={() => navigate("/register")} style={{ background: BRAND, color: "#FFFFFF", fontSize: 15, fontWeight: 700, padding: "14px 26px", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: FONT_STACK, boxShadow: "0 6px 18px rgba(15, 149, 153, 0.30)" }}>
                Start your free trial
              </button>
              <button onClick={() => navigate("/pricing")} style={{ background: "transparent", color: TEXT_INK, fontSize: 15, fontWeight: 700, padding: "14px 26px", border: "1.5px solid " + BORDER, borderRadius: 10, cursor: "pointer", fontFamily: FONT_STACK }}>
                See pricing
              </button>
            </div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              {["30-day free trial", "No credit card", "Cancel anytime"].map(t => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: TEXT_DARK, fontWeight: 500 }}>
                  <Check size={14} color={BRAND} strokeWidth={3} />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ boxShadow: "0 30px 80px rgba(8, 32, 31, 0.18)" }}>
            <ImagePlaceholder filename="hero-dashboard.jpg" label="Hero: desktop dashboard plus phone" ratio="16/11" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  const stats = [
    { value: "10,000+", label: "Receipts handled daily" },
    { value: "98%", label: "Match accuracy" },
    { value: "8 hrs", label: "Saved per week" },
    { value: "47 sec", label: "Upload to recorded" },
  ];
  return (
    <section style={{ background: BG_PAGE, padding: "50px 0 40px" }}>
      <div style={CONTAINER}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: TEXT_DARK, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>
          Illustrative figures, confirm or replace with real numbers before publishing.
        </p>
      </div>
    </section>
  );
}

function StepCard({ step, stepNum }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#FFFFFF",
        border: "0.5px solid " + BORDER,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: hovered ? "0 22px 48px rgba(8,32,31,0.14)" : "0 1px 2px rgba(8,32,31,0.04)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.28s ease, box-shadow 0.28s ease",
      }}
    >
      <div style={{ height: 170, overflow: "hidden" }}>
        <div style={{ height: "100%", transform: hovered ? "scale(1.04)" : "scale(1)", transition: "transform 0.4s ease" }}>
          <ImagePlaceholder filename={step.img} label={step.imgLabel} ratio="auto" />
        </div>
      </div>
      <div style={{ padding: 26 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: BRAND, letterSpacing: "0.08em", marginBottom: 10 }}>
          {String(stepNum).padStart(2, "0")}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT_INK, letterSpacing: "-0.01em", margin: "0 0 10px", lineHeight: 1.3 }}>
          {step.title}
        </h3>
        <p style={{ fontSize: 14, color: TEXT_DARK, lineHeight: 1.6, margin: 0 }}>
          {step.body}
        </p>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { title: "Snap or upload", body: "Take a photo of a receipt, upload a PDF, or forward an email. Novala handles everything from there.", img: "step1-snap.jpg", imgLabel: "Step 1: person photographing receipt" },
    { title: "Nexa AI extracts and categorizes", body: "Nexa AI reads the details and automatically categorizes transactions for you.", img: "step2-extract.jpg", imgLabel: "Step 2: phone with extraction cards" },
    { title: "Books updated automatically", body: "Nexa AI updates your books in real time. Everything stays organized, accurate, and up to date.", img: "step3-books.jpg", imgLabel: "Step 3: laptop with dashboard" },
  ];
  return (
    <section style={{ background: "#FFFFFF", padding: "100px 0" }}>
      <div style={CONTAINER}>
        <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 50px" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: BRAND, marginBottom: 12 }}>How it works</span>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 18px" }}>
            From upload to recorded in seconds.
          </h2>
          <p style={{ fontSize: 16, color: TEXT_DARK, lineHeight: 1.6, margin: 0 }}>
            Three steps. No accountant required. No spreadsheets harmed.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {steps.map((s, i) => <StepCard key={i} step={s} stepNum={i + 1} />)}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }) {
  const [hovered, setHovered] = useState(false);
  const Icon = feature.icon;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#FFFFFF",
        border: "0.5px solid " + BORDER,
        borderRadius: 18,
        padding: 26,
        boxShadow: hovered ? "0 22px 48px rgba(8,32,31,0.14)" : "0 1px 2px rgba(8,32,31,0.04)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.28s ease, box-shadow 0.28s ease",
      }}
    >
      <div style={{
        width: 50, height: 50, borderRadius: 14,
        background: "linear-gradient(135deg, " + BRAND + " 0%, " + BRAND_DEEP + " 100%)",
        boxShadow: "0 10px 22px rgba(15, 149, 153, 0.30)",
        display: "grid", placeItems: "center",
        marginBottom: 18,
      }}>
        <Icon size={22} color="#FFFFFF" strokeWidth={2} />
      </div>
      <div style={{ fontSize: 16.5, fontWeight: 700, color: TEXT_INK, letterSpacing: "-0.01em", lineHeight: 1.3, marginBottom: 6 }}>
        {feature.title}
      </div>
      <p style={{ fontSize: 13.5, color: TEXT_DARK, lineHeight: 1.55, margin: 0 }}>
        {feature.note}
      </p>
    </div>
  );
}

function FeaturesGrid({ onViewAll }) {
  const features = [
    { icon: Receipt, title: "Receipt scanner", note: "Snap, upload, or forward, and Nexa AI does the rest." },
    { icon: BookOpen, title: "Smart bookkeeping", note: "Transactions categorized and reconciled automatically." },
    { icon: FileText, title: "Invoicing", note: "Branded invoices that get paid faster." },
    { icon: CreditCard, title: "Online payments", note: "Card and bank payments built in." },
    { icon: Wallet, title: "Payroll", note: "Run payroll in minutes with year end tax forms." },
    { icon: BarChart3, title: "Reports and dashboards", note: "See where the money is, in real time." },
  ];
  return (
    <section style={{ background: "linear-gradient(180deg, #FFFFFF 0%, " + BG_SOFT + " 100%)", padding: "100px 0" }}>
      <div style={CONTAINER}>
        <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 50px" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: BRAND, marginBottom: 12 }}>What is inside</span>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 18px" }}>
            Everything your business runs on.
          </h2>
          <p style={{ fontSize: 16, color: TEXT_DARK, lineHeight: 1.6, margin: 0 }}>
            Six core tools that work together so your data only has to live in one place.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {features.map((f, i) => <FeatureCard key={i} feature={f} />)}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 44 }}>
          <button
            onClick={onViewAll}
            style={{
              background: "transparent", color: BRAND,
              fontSize: 14, fontWeight: 700,
              padding: "13px 26px",
              border: "1.5px solid " + BRAND, borderRadius: 10,
              cursor: "pointer", fontFamily: FONT_STACK,
            }}
          >
            View all features
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const handleViewAll = () => {
    // Phase C: open Features modal here.
    alert("Features modal coming in Phase C.");
  };
  return (
    <div style={{ fontFamily: FONT_STACK, color: TEXT_INK, background: BG_PAGE }}>
      <MarketingHeader />
      <Hero />
      <StatsStrip />
      <HowItWorks />
      <FeaturesGrid onViewAll={handleViewAll} />
      {/* TODO Phase B: Dark band, Testimonials, Big CTA, FAQ */}
      <MarketingFooter />
    </div>
  );
}
