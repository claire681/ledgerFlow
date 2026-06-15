// Novala landing page (v2). AI assistant name: Nexa (confirmed). Use "Nexa AI" consistently throughout.
// Phase A: Hero, Stats strip, How it works, Features grid. Phase B adds dark band, testimonials, CTA, FAQ.
// Phase C adds the Features modal and wires the "View all features" button.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check, FileText, Wallet, BarChart3, Receipt, BookOpen, CreditCard,
  Star, Shield, Sparkles, Zap, Lock, ChevronDown,
} from "lucide-react";

import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";
import FeaturesModal from "../components/FeaturesModal";

import heroDashboard from "../assets/landing/hero-dashboard.jpg";
import step1Snap from "../assets/landing/step1-snap.jpg";
import step2Extract from "../assets/landing/step2-extract.jpg";
import step3Books from "../assets/landing/step3-books.jpg";
import avatarOwner from "../assets/landing/avatar-owner.jpg";
import avatarFounder from "../assets/landing/avatar-founder.jpg";
import avatarOps from "../assets/landing/avatar-ops.jpg";


const BRAND = "#0F9599";
const BRAND_DEEP = "#0E4B4D";
const BRAND_TINT = "rgba(15, 149, 153, 0.10)";
const MINT = "#2FE3BE";
const NIGHT = "#0E3B3A";
const NIGHT_2 = "#124A47";
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
          <div style={{ boxShadow: "0 30px 80px rgba(8, 32, 31, 0.18)", borderRadius: 18, overflow: "hidden" }}>
            <img src={heroDashboard} alt="Novala dashboard on desktop and phone" style={{ width: "100%", height: "auto", display: "block" }} />
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
        <img
          src={step.img}
          alt={step.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transform: hovered ? "scale(1.04)" : "scale(1)",
            transition: "transform 0.4s ease",
          }}
        />
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
    { title: "Snap or upload", body: "Take a photo of a receipt, upload a PDF, or forward an email. Novala handles everything from there.", img: step1Snap },
    { title: "Nexa AI extracts and categorizes", body: "Nexa AI reads the details and automatically categorizes transactions for you.", img: step2Extract },
    { title: "Books updated automatically", body: "Nexa AI updates your books in real time. Everything stays organized, accurate, and up to date.", img: step3Books },
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

function DarkCard({ feature }) {
  const [hovered, setHovered] = useState(false);
  const Icon = feature.icon;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)",
        border: "0.5px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 22,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.28s ease, background 0.28s ease",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: "rgba(47, 227, 190, 0.15)",
        display: "grid", placeItems: "center",
        marginBottom: 14,
      }}>
        <Icon size={20} color={MINT} strokeWidth={2} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em", marginBottom: 6 }}>{feature.title}</div>
      <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.55, margin: 0 }}>{feature.note}</p>
    </div>
  );
}

function DarkBand() {
  const features = [
    { icon: BookOpen, title: "Smart bookkeeping", note: "Books that sort themselves out, automatically." },
    { icon: CreditCard, title: "Invoicing and payments", note: "Branded invoices and online payments built in." },
    { icon: Wallet, title: "Payroll and team", note: "Run payroll in minutes, with the right tax forms per country." },
    { icon: Shield, title: "Tax and compliance", note: "Audit trails, year end forms, and clear records." },
    { icon: BarChart3, title: "Reports and intelligence", note: "Live dashboards and plain English answers from Nexa AI." },
    { icon: Sparkles, title: "Nexa assistant", note: "Ask in your own words and get the real number, with sources." },
    { icon: Zap, title: "Integrations", note: "Connects to the banks, cards, and apps you already use." },
    { icon: Lock, title: "Bank-grade security", note: "Encryption, role based access, continuous backups." },
  ];
  return (
    <section style={{ background: "linear-gradient(180deg, " + NIGHT + " 0%, " + NIGHT_2 + " 100%)", padding: "100px 0", color: "#FFFFFF" }}>
      <div style={CONTAINER}>
        <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 50px" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MINT, marginBottom: 12 }}>The whole back office</span>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 18px" }}>
            One login for the whole back office.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>
            Eight tools, one source of truth. No tab juggling, no copy and paste between systems.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {features.map((f, i) => <DarkCard key={i} feature={f} />)}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ data }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: "linear-gradient(135deg, " + NIGHT + " 0%, " + NIGHT_2 + " 100%)",
        borderRadius: 22,
        padding: 32,
        color: "#FFFFFF",
        overflow: "hidden",
        boxShadow: hovered ? "0 28px 60px rgba(8,32,31,0.25)" : "0 6px 18px rgba(8,32,31,0.10)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.28s ease, box-shadow 0.28s ease",
      }}
    >
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "#E08A3C" }} />
      <div style={{ position: "absolute", bottom: -100, right: 80, width: 200, height: 200, borderRadius: "50%", background: "#6E7A3F" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
          {[0,1,2,3,4].map(i => (
            <Star key={i} size={16} color="#F2B544" fill="#F2B544" />
          ))}
        </div>
        <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: "0 0 28px", color: "rgba(255,255,255,0.95)" }}>
          {data.quote}
        </p>
        <div style={{ height: 1, background: "rgba(255,255,255,0.15)", margin: "0 0 22px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            border: "2.5px solid #E08A3C",
            overflow: "hidden",
            flexShrink: 0,
          }}>
            <img src={data.avatar} alt={data.role} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.005em" }}>{data.name}</div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)" }}>{data.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Testimonials() {
  const testimonials = [
    {
      quote: "Novala took the receipt pile and the spreadsheet juggling off our plate. I see real numbers across all our locations in one place now, and our books close on time.",
      name: "Owner",
      role: "Multi-location services business",
      avatar: avatarOwner,
    },
    {
      quote: "I used to spend Friday nights reconciling. Now Novala does it, and I actually trust the books at month end. Nexa AI flags the weird stuff before I have to.",
      name: "Founder",
      role: "eCommerce brand",
      avatar: avatarFounder,
    },
    {
      quote: "Payroll runs in minutes and our team gets clear pay stubs. The questions about hours and deductions stopped, which is a win on its own.",
      name: "Operations Director",
      role: "Professional services firm",
      avatar: avatarOps,
    },
  ];
  return (
    <section style={{ background: BG_PAGE, padding: "100px 0" }}>
      <div style={CONTAINER}>
        <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 50px" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: BRAND, marginBottom: 12 }}>What teams say</span>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 18px" }}>
            Trusted by businesses that ship.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
          {testimonials.map((t, i) => <TestimonialCard key={i} data={t} />)}
        </div>
        <p style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>
          Quotes and faces are illustrative placeholders, replace with real, consented customers before publishing.
        </p>
      </div>
    </section>
  );
}

function BigCTA() {
  const navigate = useNavigate();
  return (
    <section style={{ background: BG_PAGE, padding: "80px 0" }}>
      <div style={CONTAINER}>
        <div style={{
          background: "linear-gradient(135deg, " + BRAND + " 0%, " + BRAND_DEEP + " 100%)",
          borderRadius: 24,
          padding: "60px 40px",
          textAlign: "center",
          color: "#FFFFFF",
          boxShadow: "0 30px 60px rgba(15, 149, 153, 0.30)",
        }}>
          <h2 style={{ fontSize: "clamp(30px, 3.5vw, 38px)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 14px" }}>
            Find the plan that fits.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, margin: "0 auto 28px", maxWidth: 540 }}>
            Start free, upgrade when you need more. No contracts, no hidden fees.
          </p>
          <button onClick={() => navigate("/pricing")} style={{
            background: "#FFFFFF", color: BRAND_DEEP,
            fontSize: 15, fontWeight: 700,
            padding: "14px 30px",
            border: "none", borderRadius: 10,
            cursor: "pointer", fontFamily: FONT_STACK,
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
          }}>
            See pricing
          </button>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(null);
  const items = [
    { q: "What is Novala?", a: "Novala is an all in one platform for small and growing businesses. It combines accounting, payroll, invoicing, and reports with Nexa AI, so your books stay accurate and your time stays freed up for the work that actually matters." },
    { q: "How does the receipt scanner work?", a: "Snap a photo of a receipt, upload a PDF, or forward an email. Nexa AI reads the details, categorizes the transaction, and updates your books in real time. No manual entry required." },
    { q: "Is my financial data secure?", a: "Yes. Novala uses bank-grade encryption, role based access controls, and continuous backups. Your data is stored in audited, certified cloud infrastructure with regular security reviews." },
    { q: "Can I try Novala before paying?", a: "Yes. Every plan starts with a 30-day free trial, no credit card required. Cancel anytime during the trial and you will not be charged." },
    { q: "Does Novala work for my industry?", a: "Novala works well for service, professional, retail, healthcare, nonprofit, and construction businesses. The platform adapts to your country's tax rules and the type of work you do." },
  ];
  return (
    <section style={{ background: "#FFFFFF", padding: "100px 0" }}>
      <div style={{ ...CONTAINER, maxWidth: 820 }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: BRAND, marginBottom: 12 }}>Questions</span>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
            Frequently asked.
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ background: "#FFFFFF", border: "0.5px solid " + BORDER, borderRadius: 14, overflow: "hidden" }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{ width: "100%", background: "transparent", padding: "20px 24px", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, fontSize: 16, fontWeight: 700, color: TEXT_INK, cursor: "pointer", textAlign: "left", fontFamily: FONT_STACK, letterSpacing: "-0.005em" }}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} color={TEXT_DARK} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s ease", flexShrink: 0 }} />
                </button>
                {isOpen && (
                  <div style={{ padding: "0 24px 22px", fontSize: 14.5, color: TEXT_DARK, lineHeight: 1.65 }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function LandingV2() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const handleViewAll = () => setModalOpen(true);
  const handleClose = () => setModalOpen(false);
  const handleSeePricing = () => {
    setModalOpen(false);
    navigate("/pricing");
  };
  return (
    <div style={{ fontFamily: FONT_STACK, color: TEXT_INK, background: BG_PAGE }}>
      <MarketingHeader onFeaturesClick={handleViewAll} />
      <Hero />
      <StatsStrip />
      <HowItWorks />
      <FeaturesGrid onViewAll={handleViewAll} />
      <DarkBand />
      <Testimonials />
      <BigCTA />
      <FAQ />
      <MarketingFooter />
      <FeaturesModal open={modalOpen} onClose={handleClose} onSeePricing={handleSeePricing} />
    </div>
  );
}
