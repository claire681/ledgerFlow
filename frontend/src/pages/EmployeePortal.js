import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, Zap, ShieldCheck, Shield, Lock, Bell, Eye, Clock,
  Check, CheckCircle2, Wallet, Umbrella, Calendar, FileText, TrendingUp,
  Receipt, Landmark, Timer, UserCheck, Folder, Smartphone, Globe,
  LayoutGrid, MoreHorizontal, Coffee, Square, Repeat, Settings,
  HelpCircle, ChevronDown, ArrowRight, Play
} from "lucide-react";

import heroPhoto from "../assets/portal/hero-caregiver.jpg";
import testimonialPhoto from "../assets/portal/testimonial.jpg";
import cardInvitePhoto from "../assets/portal/card-invite.jpg";
import cardAppPhoto from "../assets/portal/card-app.jpg";

// ============================================================
// EmployeePortal: marketing page explaining the team app.
// Path: /employee-portal
// Source spec: EmployeePortal v2 (Jun 14, 2026).
//
// TODOs (frontend-first phase, swap during backend phase):
//   1. Inline Header/Footer here are placeholders. Swap to the
//      shared marketing header and footer used by Pricing.js.
//   2. The "Novala" wordmark with the teal Activity square is a
//      placeholder. Swap to the real Logo component everywhere.
//   3. Color constants live in this file. Move them to light.js.
//      NIGHT, NIGHT_2, MINT, ORANGE may need new tokens.
//   4. Drop the four photos into src/assets/portal/ and replace
//      the four PhotoFrame placeholders with <img> tags:
//        hero-caregiver.jpg   (760 x 950)
//        testimonial.jpg      (360 x 360)
//        card-invite.jpg      (900 x 380)
//        card-app.jpg         (900 x 380)
//
// Open decisions defaulted (awaiting Claire confirm):
//   1. Geofence: copy stays vague ("leaves the work location").
//   2. Launch countries: country neutral ("such as T4 or W-2").
//   3. Testimonial: kept, labelled illustrative.
//   4. Schedule and Shared documents: "Coming soon" kept.
//   5. Sample data: kept (e.g. $1,853.73 net, 74.0 hrs).
//      Industry neutral: "38 visits" was dropped from hero chip.
// ============================================================

// Tokens
const BRAND = "#0F9599";
const BRAND_DARK = "#0B7377";
const BRAND_DEEP = "#0E4B4D";
const NIGHT = "#0E3B3A";
const NIGHT_2 = "#124A47";
const MINT = "#2FE3BE";
const ORANGE = "#F2994A";
const RED = "#EB5757";
const TEAL = "#0F9599";
const TEXT_INK = "#0E2A2A";
const TEXT_DARK = "#5A6970";
const TEXT_DIM = "#9CA3AF";
const TEXT_DIM_ON_DARK = "rgba(240, 250, 248, 0.65)";
const BG_PAGE = "#FFFFFF";
const BG_SOFT = "#F7F9F9";
const BORDER = "#E5E7EB";
const BORDER_ON_DARK = "rgba(255, 255, 255, 0.12)";
const FONT_STACK = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

const CONTAINER = { maxWidth: 1240, margin: "0 auto", padding: "0 28px" };

// Helpers
function Pill({ icon: Icon, children, dark }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: 999,
      background: dark ? "rgba(47, 227, 190, 0.10)" : "rgba(15, 149, 153, 0.08)",
      border: "0.5px solid " + (dark ? "rgba(47, 227, 190, 0.30)" : "rgba(15, 149, 153, 0.20)"),
      color: dark ? MINT : BRAND, fontSize: 12, fontWeight: 600, letterSpacing: "0.01em",
    }}>
      {Icon && <Icon size={13} />} {children}
    </span>
  );
}

// PhotoFrame: placeholder gradient. Replace with <img> when assets land.
function PhotoFrame({ aspectRatio, label, hint, accent }) {
  return (
    <div style={{
      width: "100%", aspectRatio: aspectRatio || "1/1", borderRadius: 18, overflow: "hidden",
      position: "relative",
      background: "linear-gradient(135deg, " + (accent || NIGHT_2) + " 0%, " + BRAND_DEEP + " 60%, " + NIGHT + " 100%)",
      display: "grid", placeItems: "center",
      color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 30%, rgba(47, 227, 190, 0.18), transparent 60%)" }} />
      <div style={{ position: "relative", textAlign: "center", padding: 16 }}>
        <div>{label}</div>
        {hint && <div style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.4)", marginTop: 6, textTransform: "none", letterSpacing: 0 }}>{hint}</div>}
      </div>
    </div>
  );
}

function HeroStat({ top, bottom }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: MINT, letterSpacing: "-0.01em" }}>{top}</div>
      <div style={{ fontSize: 12.5, color: TEXT_DIM_ON_DARK, marginTop: 3 }}>{bottom}</div>
    </div>
  );
}

function RoundButton({ icon: Icon, label, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: color, display: "grid", placeItems: "center", boxShadow: "0 4px 10px " + color + "33" }}>
        <Icon size={22} color="#FFFFFF" />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: TEXT_INK }}>{label}</span>
    </div>
  );
}

function Legend({ color, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
        <span style={{ fontSize: 10, color: TEXT_DARK }}>{label}</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_INK, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

// Day-in-life screens
function TrackTimeScreen() {
  return (
    <div style={{ padding: "8px 18px 14px", display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", background: BG_SOFT, borderRadius: 8, padding: 3, fontSize: 11, fontWeight: 600 }}>
        <div style={{ flex: 1, padding: "6px 0", textAlign: "center", background: "#FFFFFF", borderRadius: 6, color: BRAND, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>Time clock</div>
        <div style={{ flex: 1, padding: "6px 0", textAlign: "center", color: TEXT_DIM }}>Timesheets</div>
      </div>
      <div style={{ textAlign: "center", padding: "4px 0" }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: TEXT_INK, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>1h 04m 05s</div>
        <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2 }}>Start time: Today, 8:37 AM</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "10px 12px", border: "0.5px solid " + BORDER }}>
          <div style={{ fontSize: 9, color: TEXT_DIM, fontWeight: 600 }}>Clocked in</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_INK, marginTop: 2 }}>8:00 AM</div>
        </div>
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "10px 12px", border: "0.5px solid " + BORDER }}>
          <div style={{ fontSize: 9, color: TEXT_DIM, fontWeight: 600 }}>Added today</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_INK, marginTop: 2 }}>7h 30m</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: "auto", paddingTop: 8 }}>
        <RoundButton icon={Coffee} label="Break" color={ORANGE} />
        <RoundButton icon={Square} label="Clock out" color={RED} />
        <RoundButton icon={Repeat} label="Switch" color={TEAL} />
      </div>
    </div>
  );
}

function OverviewScreen() {
  const pct = 7.5 / 8;
  const r = 36;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ padding: "8px 18px 14px", display: "flex", flexDirection: "column", gap: 11, height: "100%" }}>
      <div style={{ background: "#FFFFFF", border: "0.5px solid " + BORDER, borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <svg width={84} height={84} viewBox="-46 -46 92 92">
          <circle r={r} fill="none" stroke={BG_SOFT} strokeWidth="8" />
          <circle r={r} fill="none" stroke={BRAND} strokeWidth="8" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90)" strokeLinecap="round" />
          <text textAnchor="middle" dy=".3em" fontSize="13" fontWeight="700" fill={TEXT_INK}>7h 30m</text>
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: TEXT_DIM, fontWeight: 600 }}>Day total</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_INK, marginTop: 2 }}>of 8 hours</div>
          <div style={{ fontSize: 9, color: TEXT_DIM, marginTop: 4 }}>Clocked in 8:00 AM</div>
        </div>
      </div>
      <div style={{ background: "#FFFFFF", border: "0.5px solid " + BORDER, borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 9, color: TEXT_DIM, fontWeight: 600 }}>Latest pay</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: TEXT_INK, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>$762.66</div>
            <div style={{ fontSize: 9, color: TEXT_DIM, marginTop: 2 }}>Paid Jun 13</div>
          </div>
          <span style={{ fontSize: 9, color: BRAND, fontWeight: 700 }}>View all</span>
        </div>
      </div>
      <div style={{ background: "#FFFFFF", border: "0.5px solid " + BORDER, borderRadius: 12, padding: 12 }}>
        <div style={{ fontSize: 9, color: TEXT_DIM, fontWeight: 600 }}>Next shift</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_INK, marginTop: 2 }}>Jun 16, 9:00 AM to 5:00 PM</div>
        <div style={{ fontSize: 9, color: TEXT_DIM, marginTop: 4 }}>Time off balance: 37.92 hrs</div>
      </div>
    </div>
  );
}

function MoneyScreen() {
  const net = 10072 / 12680;
  const tax = 2488 / 12680;
  const ded = 120 / 12680;
  const r = 36;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ padding: "8px 18px 14px", display: "flex", flexDirection: "column", gap: 11, height: "100%" }}>
      <div style={{ background: "#FFFFFF", border: "0.5px solid " + BORDER, borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <svg width={84} height={84} viewBox="-46 -46 92 92">
          <circle r={r} fill="none" stroke={BG_SOFT} strokeWidth="9" />
          <circle r={r} fill="none" stroke={BRAND} strokeWidth="9" strokeDasharray={c} strokeDashoffset={c * (1 - net)} transform="rotate(-90)" />
          <circle r={r} fill="none" stroke={MINT} strokeWidth="9" strokeDasharray={c} strokeDashoffset={c - (c * tax)} transform={"rotate(" + (-90 + 360 * net) + ")"} />
          <circle r={r} fill="none" stroke={ORANGE} strokeWidth="9" strokeDasharray={c} strokeDashoffset={c - (c * ded)} transform={"rotate(" + (-90 + 360 * (net + tax)) + ")"} />
          <text textAnchor="middle" dy="-.1em" fontSize="8" fill={TEXT_DIM}>Gross 2026</text>
          <text textAnchor="middle" dy="1em" fontSize="11" fontWeight="800" fill={TEXT_INK}>$12,560</text>
        </svg>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <Legend color={BRAND} label="Net pay" value="$10,072" />
          <Legend color={MINT} label="Tax withheld" value="$2,488" />
          <Legend color={ORANGE} label="Deductions" value="$120" />
        </div>
      </div>
      <div style={{ background: "#FFFFFF", border: "0.5px solid " + BORDER, borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 9, color: TEXT_DIM, fontWeight: 600 }}>Latest pay</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: TEXT_INK, marginTop: 2 }}>$762.66</div>
            <div style={{ fontSize: 9, color: TEXT_DIM, marginTop: 2 }}>74 hours</div>
          </div>
          <span style={{ fontSize: 9, color: BRAND, fontWeight: 700 }}>View details</span>
        </div>
      </div>
    </div>
  );
}

// Reusable phone with both tab bar variants
function PhoneMock({ screen, activeTab, barVariant }) {
  const TIME_TABS = [
    { label: "Overview", icon: LayoutGrid },
    { label: "Track Time", icon: Timer },
    { label: "Schedule", icon: Calendar },
    { label: "Money", icon: Wallet },
    { label: "More", icon: MoreHorizontal },
  ];
  const PAY_TABS = [
    { label: "Money", icon: Wallet },
    { label: "Time Off", icon: Umbrella },
    { label: "Taxes", icon: Receipt },
    { label: "Settings", icon: Settings },
    { label: "Help", icon: HelpCircle },
  ];
  const tabs = barVariant === "pay" ? PAY_TABS : TIME_TABS;
  return (
    <div style={{
      width: 290, height: 580, background: "#1A2B2B", borderRadius: 36, padding: 8,
      boxShadow: "0 30px 60px rgba(15, 149, 153, 0.18)", position: "relative",
    }}>
      <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 110, height: 22, background: "#1A2B2B", borderRadius: 12, zIndex: 2 }} />
      <div style={{ background: "#F7F9F9", height: "100%", borderRadius: 30, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ height: 38, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: TEXT_INK }}>
          <span>9:41</span>
          <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
            <svg width={14} height={9} viewBox="0 0 14 9"><rect x="0" y="6" width="2" height="3" fill={TEXT_INK} /><rect x="3" y="4" width="2" height="5" fill={TEXT_INK} /><rect x="6" y="2" width="2" height="7" fill={TEXT_INK} /><rect x="9" y="0" width="2" height="9" fill={TEXT_INK} /></svg>
            <span style={{ display: "inline-block", width: 22, height: 10, border: "1px solid " + TEXT_INK, borderRadius: 2, position: "relative" }}>
              <span style={{ position: "absolute", inset: 1, background: TEXT_INK, borderRadius: 1, width: "70%" }} />
            </span>
          </span>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>{screen}</div>
        <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 6px 14px", background: "#FFFFFF", borderTop: "0.5px solid " + BORDER }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = t.label === activeTab;
            return (
              <div key={t.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: active ? BRAND : "#9CA3AF" }}>
                <Icon size={18} />
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.01em" }}>{t.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===== Sections =====

// TODO: replace with shared marketing header
function Header() {
  const navigate = useNavigate();
  return (
    <header style={{ background: NIGHT, borderBottom: "0.5px solid " + BORDER_ON_DARK, padding: "16px 0" }}>
      <div style={{ ...CONTAINER, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
          {/* TODO: replace with real Logo component */}
          <div style={{ width: 28, height: 28, borderRadius: 7, background: BRAND, display: "grid", placeItems: "center" }}>
            <Activity size={16} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.01em" }}>Novala</span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {["Product", "Solutions", "Pricing", "Resources"].map(item => (
            <span key={item} onClick={() => item === "Pricing" && navigate("/pricing")} style={{ fontSize: 13.5, fontWeight: 600, color: TEXT_DIM_ON_DARK, cursor: "pointer" }}>{item}</span>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span onClick={() => navigate("/login")} style={{ fontSize: 13.5, fontWeight: 600, color: TEXT_DIM_ON_DARK, cursor: "pointer" }}>Sign in</span>
          <button onClick={() => navigate("/pricing")} style={{ background: MINT, color: NIGHT, fontSize: 13.5, fontWeight: 700, padding: "9px 18px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: FONT_STACK }}>
            Get started
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section style={{ background: NIGHT, padding: "60px 0 100px", position: "relative", overflow: "hidden", color: "#FFFFFF" }}>
      <div style={{ ...CONTAINER, display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
        <div>
          <Pill icon={Zap} dark>Hours that fill themselves in</Pill>
          <h1 style={{ fontSize: "clamp(40px, 5vw, 60px)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.05, letterSpacing: "-0.025em", margin: "20px 0 22px" }}>
            Your team's hours, <span style={{ color: MINT }}>filled in automatically.</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: "rgba(240, 250, 248, 0.75)", margin: "0 0 28px", maxWidth: 540 }}>
            Your team clocks in and out, and the hours fill themselves into payroll. Novala even reminds anyone who leaves still clocked in, so the numbers stay right. You review, approve, and pay.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 36 }}>
            <button style={{ background: MINT, color: NIGHT, fontSize: 15, fontWeight: 700, padding: "13px 22px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: FONT_STACK, display: "inline-flex", alignItems: "center", gap: 8 }}>
              Get started <ArrowRight size={16} />
            </button>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: TEXT_DIM_ON_DARK, cursor: "pointer", fontWeight: 600 }}>
              <span style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "grid", placeItems: "center" }}>
                <Play size={11} fill="#FFFFFF" color="#FFFFFF" />
              </span>
              See how it works
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, borderTop: "0.5px solid " + BORDER_ON_DARK, paddingTop: 24 }}>
            <HeroStat top="1 invite" bottom="Team self setup" />
            <HeroStat top="Automatic" bottom="Hours into payroll" />
            <HeroStat top="Smart" bottom="Clock-out reminders" />
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: -20, background: "radial-gradient(circle, rgba(47, 227, 190, 0.18) 0%, transparent 70%)", filter: "blur(20px)" }} />
          <div style={{ position: "relative", borderRadius: 20, overflow: "hidden" }}>
            <img src={heroPhoto} alt="A caregiver checking their phone" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
          <div style={{ position: "absolute", top: 70, left: -36, background: "#FFFFFF", color: TEXT_INK, padding: "12px 14px", borderRadius: 12, boxShadow: "0 16px 30px rgba(0,0,0,0.18)", display: "flex", alignItems: "flex-start", gap: 10, maxWidth: 230, fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(242, 153, 74, 0.16)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Bell size={14} color={ORANGE} />
            </span>
            <span>
              <div style={{ color: TEXT_DARK, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Reminder</div>
              You left while clocked in
            </span>
          </div>
          <div style={{ position: "absolute", bottom: 48, right: -28, background: "#FFFFFF", color: TEXT_INK, padding: "14px 16px", borderRadius: 14, boxShadow: "0 16px 30px rgba(0,0,0,0.18)", minWidth: 230 }}>
            <div style={{ fontSize: 10, color: TEXT_DIM, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Net pay this period</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_INK, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>$1,853.73</div>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: TEXT_DARK, marginTop: 7, fontWeight: 600 }}>
              <span>74.0 hrs</span>
              <span>Paid Jun 13</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofBar() {
  const items = [
    { icon: Lock, label: "Bank grade security" },
    { icon: Bell, label: "Clock-out reminders" },
    { icon: Zap, label: "Hours filled automatically" },
    { icon: Globe, label: "Multi country payroll ready" },
  ];
  return (
    <section style={{ background: NIGHT_2, padding: "22px 0", borderTop: "0.5px solid " + BORDER_ON_DARK, borderBottom: "0.5px solid " + BORDER_ON_DARK }}>
      <div style={{ ...CONTAINER, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, color: TEXT_DIM_ON_DARK }}>
              <Icon size={16} color={MINT} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{it.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SignatureFlow() {
  const steps = [
    { num: "01", icon: Clock, title: "Clock in, clock out", body: "Your team taps clock in and clock out. On a correct clock out the worked time is calculated.", chip: "8:00 to 3:30, auto" },
    { num: "02", icon: Bell, title: "Hours fill themselves in", body: "Worked time drops onto the timesheet. Leave while clocked in and Novala reminds you to clock out.", chip: "Reminder sent if you forget" },
    { num: "03", icon: ShieldCheck, title: "You approve", body: "Review anything that needs a look and fix a missed clock out before pay runs. Multiple rates and stat pay applied.", chip: "Approved for pay" },
    { num: "04", icon: Wallet, title: "Pay lands", body: "Approved hours flow into the pay run. The worker sees the result.", chip: "$1,853.73 net" },
  ];
  return (
    <section style={{ background: BG_PAGE, padding: "100px 0" }}>
      <div style={CONTAINER}>
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 50px" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: BRAND, marginBottom: 12 }}>The Novala difference</span>
          <h2 style={{ fontSize: "clamp(34px, 4vw, 46px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 20px" }}>
            Hours in, pay out, automatically
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: TEXT_DARK, margin: 0 }}>
            Generic payroll asks you to chase and key in timesheets. Novala fills hours in and carries them to a paycheque, so the numbers tie out from the worked hour to the deposit.
          </p>
        </div>
        <div style={{ background: BG_SOFT, border: "0.5px solid " + BORDER, borderRadius: 18, padding: 32 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, alignItems: "stretch" }}>
            {steps.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.num} style={{ background: "#FFFFFF", border: "0.5px solid " + BORDER, borderRadius: 14, padding: "22px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: "0.08em", marginBottom: 14 }}>{s.num}</div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(15, 149, 153, 0.08)", display: "grid", placeItems: "center", marginBottom: 14 }}>
                    <Icon size={20} color={BRAND} />
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: TEXT_INK, marginBottom: 6, letterSpacing: "-0.01em" }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: TEXT_DARK, lineHeight: 1.5, marginBottom: 16 }}>{s.body}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", background: BG_SOFT, border: "0.5px solid " + BORDER, borderRadius: 999, fontSize: 11.5, fontWeight: 600, color: BRAND_DARK }}>
                    <Check size={12} /> {s.chip}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 13.5, color: TEXT_DARK, textAlign: "center", margin: "26px 0 0", fontStyle: "italic" }}>
            One thread from worked hour to deposit, so the question "why was I paid this?" always has an answer.
          </p>
        </div>
      </div>
    </section>
  );
}

function DayInLife() {
  const blocks = [
    { eyebrow: "For your team", title: "Their whole work life, one tap away", copy: "Tap clock in. Tap clock out. The worked time becomes hours that drop straight onto the timesheet. If they leave while still clocked in, Novala reminds them so the numbers stay right.", checklist: ["Clock in and out (hours fill on a correct clock out)", "Reminder to clock out if they leave the work location", "Pay stubs and tax forms free to them"], screen: <TrackTimeScreen />, bar: "time", tab: "Track Time", reverse: false },
    { eyebrow: "For your team", title: "Today at a glance", copy: "An overview screen pulls the day, the latest pay, and the next shift into one view. No app hunting for the basics.", checklist: ["Day total and clock in status", "Latest pay and upcoming shift", "Time off balance"], screen: <OverviewScreen />, bar: "time", tab: "Overview", reverse: true },
    { eyebrow: "For you, the owner", title: "Approve once, pay with confidence", copy: "You see the same Money, Time Off, Taxes, Settings, Help tabs the team uses, with full owner detail behind every number. Approve, file, done.", checklist: ["Net pay, taxes, deductions at a glance", "Year to date and latest pay", "Year end tax documents"], screen: <MoneyScreen />, bar: "pay", tab: "Money", reverse: false },
  ];
  return (
    <section style={{ background: BG_SOFT, padding: "100px 0" }}>
      <div style={CONTAINER}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 60px" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: BRAND, marginBottom: 12 }}>A day in the life</span>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
            What it looks like, day to day
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 80 }}>
          {blocks.map((b, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
              <div style={{ order: b.reverse ? 2 : 1 }}>
                <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: BRAND, marginBottom: 10 }}>{b.eyebrow}</span>
                <h3 style={{ fontSize: 30, fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 16px" }}>{b.title}</h3>
                <p style={{ fontSize: 15.5, color: TEXT_DARK, lineHeight: 1.6, margin: "0 0 22px" }}>{b.copy}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {b.checklist.map((c, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: TEXT_INK }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(15, 149, 153, 0.10)", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>
                        <Check size={11} color={BRAND} />
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ order: b.reverse ? 1 : 2, display: "grid", placeItems: "center" }}>
                <div style={{ position: "relative", width: 360, height: 600, display: "grid", placeItems: "center" }}>
                  <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: "rgba(15, 149, 153, 0.06)" }} />
                  <div style={{ position: "relative" }}>
                    <PhoneMock screen={b.screen} activeTab={b.tab} barVariant={b.bar} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  const features = [
    { icon: FileText, title: "Pay stubs and history" },
    { icon: TrendingUp, title: "Year to date earnings" },
    { icon: Receipt, title: "Year end tax documents", note: "The right year-end form for their country (such as T4 or W-2) to view and download." },
    { icon: Landmark, title: "Direct deposit" },
    { icon: Timer, title: "Clock in and out" },
    { icon: Umbrella, title: "Time off" },
    { icon: Calendar, title: "Schedule", comingSoon: true },
    { icon: UserCheck, title: "Self setup and profile" },
    { icon: Folder, title: "Shared documents", comingSoon: true },
    { icon: Bell, title: "Notifications" },
    { icon: Shield, title: "Secure, role based access" },
    { icon: Smartphone, title: "Web and mobile" },
  ];
  return (
    <section style={{ background: BG_PAGE, padding: "100px 0" }}>
      <div style={CONTAINER}>
        <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 50px" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: BRAND, marginBottom: 12 }}>One portal, everything they need</span>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 18px" }}>
            All the pay and time tools, in one place
          </h2>
          <p style={{ fontSize: 16, color: TEXT_DARK, lineHeight: 1.6, margin: 0 }}>
            Your team gets the full set of self serve tools, with tax forms and rules that match the country they work in.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} style={{ background: "#FFFFFF", border: "0.5px solid " + BORDER, borderRadius: 12, padding: 20, position: "relative" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(15, 149, 153, 0.08)", display: "grid", placeItems: "center", marginBottom: 14 }}>
                  <Icon size={18} color={BRAND} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_INK, letterSpacing: "-0.01em" }}>{f.title}</div>
                {f.note && <div style={{ fontSize: 12, color: TEXT_DARK, marginTop: 6, lineHeight: 1.5 }}>{f.note}</div>}
                {f.comingSoon && (
                  <span style={{ position: "absolute", top: 16, right: 16, padding: "3px 8px", background: "rgba(242, 153, 74, 0.12)", color: "#C2691E", border: "0.5px solid rgba(242, 153, 74, 0.30)", borderRadius: 999, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Coming soon
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const items = [
    { icon: CheckCircle2, title: "Nothing pays without your approval", body: "Hours fill in automatically, but the pay run waits for your review. If someone misses a clock out, you fix it before pay runs." },
    { icon: Eye, title: "Everyone sees only what they should", body: "Each person sees their own pay and schedule. You see everyone. Clear roles, no oversharing." },
    { icon: Bell, title: "Reminders keep hours honest", body: "If a phone leaves the work location while still clocked in, Novala sends a reminder to clock out, so hours do not run long by accident." },
  ];
  return (
    <section style={{ background: NIGHT, color: "#FFFFFF", padding: "100px 0" }}>
      <div style={CONTAINER}>
        <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 50px" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MINT, marginBottom: 12 }}>Trust, built in</span>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 18px" }}>
            Automatic, but never out of your hands
          </h2>
          <p style={{ fontSize: 16, color: "rgba(240, 250, 248, 0.75)", lineHeight: 1.6, margin: 0 }}>
            Hours fill in on their own, and you stay fully in control of what gets paid.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div key={i} style={{ background: NIGHT_2, border: "0.5px solid " + BORDER_ON_DARK, borderRadius: 14, padding: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: "rgba(47, 227, 190, 0.10)", display: "grid", placeItems: "center", marginBottom: 18 }}>
                  <Icon size={22} color={MINT} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em", marginBottom: 10 }}>{it.title}</div>
                <p style={{ fontSize: 14, color: "rgba(240, 250, 248, 0.72)", lineHeight: 1.6, margin: 0 }}>{it.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section style={{ background: BG_PAGE, padding: "100px 0" }}>
      <div style={CONTAINER}>
        <div style={{ position: "relative", background: "linear-gradient(135deg, " + BRAND + " 0%, " + NIGHT + " 100%)", borderRadius: 22, padding: "60px 56px", color: "#FFFFFF", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, " + ORANGE + " 0%, transparent 70%)", opacity: 0.45 }} />
          <div style={{ position: "absolute", bottom: -120, right: 100, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, " + ORANGE + " 0%, transparent 70%)", opacity: 0.25 }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "180px 1fr", gap: 44, alignItems: "center" }}>
            <div>
              <div style={{ width: 160, height: 160, borderRadius: "50%", padding: 5, background: ORANGE, overflow: "hidden" }}>
                <div style={{ borderRadius: "50%", overflow: "hidden", width: "100%", height: "100%" }}>
                  <img src={testimonialPhoto} alt="Customer testimonial" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              </div>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>A. Bennett</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 3, fontStyle: "italic" }}>Business owner (illustrative)</div>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 22, color: "#FFFFFF", lineHeight: 1.45, fontWeight: 500, letterSpacing: "-0.01em", margin: "0 0 18px" }}>
                "The hours just show up. I look once, fix anything off, and pay. The team gets paid right, every time, with none of us doing the timesheet dance."
              </p>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", fontStyle: "italic", lineHeight: 1.5 }}>
                Illustrative quote, shown until a real customer testimonial is ready to publish with consent.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function KnowledgeCards() {
  const cards = [
    { title: "Invite your team to add their own info", body: "Send one invite. Your team adds their own banking, contact, and tax forms straight from their phone, so you do not type any of it.", img: cardInvitePhoto },
    { title: "Track time and pay in one app", body: "One app for clock in and out, the latest pay, the next shift, and year end tax documents. No second app, no extra logins.", img: cardAppPhoto },
  ];
  return (
    <section style={{ background: BG_SOFT, padding: "100px 0" }}>
      <div style={CONTAINER}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h2 style={{ fontSize: "clamp(30px, 3.5vw, 40px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", margin: 0 }}>Build your knowledge</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ background: "#FFFFFF", border: "0.5px solid " + BORDER, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: 230 }}>
                <img src={c.img} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 38%", display: "block" }} />
              </div>
              <div style={{ padding: 28 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: TEXT_INK, letterSpacing: "-0.01em", margin: "0 0 10px" }}>{c.title}</h3>
                <p style={{ fontSize: 14.5, color: TEXT_DARK, lineHeight: 1.6, margin: "0 0 18px" }}>{c.body}</p>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: BRAND, cursor: "pointer" }}>
                  Learn more <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  const qs = [
    { q: "What makes Novala different from generic payroll apps?", a: "Most payroll apps make you chase, collect, and key in timesheets every period. Novala flips it: your team clocks in and out, the worked hours fill themselves onto the timesheet, and Novala reminds anyone who leaves while still clocked in to clock out. You review and approve, then the hours flow straight into the pay run." },
    { q: "How does the clock-out reminder work?", a: "Location is used only for the reminder, with your team's consent, not to track them through the day. If a phone leaves the work location while still clocked in, Novala sends a clock-out reminder. If a clock out gets missed, you correct it on the timesheet before pay runs." },
    { q: "How do I invite my team to start using it?", a: "From the Add employee flow, choose Employee self setup and send one invite. The employee gets a link to a secure, tokened page where they fill in their banking, tax forms, contact info, and emergency contact themselves. Their status on your Employees page updates as they complete it." },
    { q: "What can my team update themselves?", a: "Personal details and address, direct deposit banking, tax forms (such as TD1 or W-4), and emergency contact. Sensitive employer-controlled fields stay with you." },
    { q: "Is the app free for my team?", a: "Yes. Pay stubs, year end tax documents, time tracking, time off, and notifications are free for every employee on your account. There is no per-seat charge for them." },
    { q: "Can my team still see their pay if I pause payroll?", a: "Yes. Past pay stubs and year end tax documents stay available to your team in the app, even if you pause or change plans, so they always have what they need for the bank, the landlord, and tax time." },
  ];
  return (
    <section style={{ background: BG_PAGE, padding: "100px 0" }}>
      <div style={{ ...CONTAINER, maxWidth: 880 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", margin: 0 }}>Frequently asked questions</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {qs.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ border: "0.5px solid " + BORDER, borderRadius: 12, background: "#FFFFFF", overflow: "hidden" }}>
                <div onClick={() => setOpen(isOpen ? -1 : i)} style={{ padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <span style={{ fontSize: 15.5, fontWeight: 700, color: TEXT_INK, letterSpacing: "-0.005em" }}>{it.q}</span>
                  <span style={{ color: BRAND, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                    <ChevronDown size={18} />
                  </span>
                </div>
                {isOpen && (
                  <div style={{ padding: "0 22px 22px", fontSize: 14.5, color: TEXT_DARK, lineHeight: 1.65 }}>
                    {it.a}
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

function CurvedCloser() {
  const navigate = useNavigate();
  return (
    <section style={{ background: BG_PAGE }}>
      <svg style={{ display: "block", width: "100%", height: 90 }} viewBox="0 0 1440 90" preserveAspectRatio="none">
        <path d="M0,90 Q720,-20 1440,90 Z" fill={BRAND} />
      </svg>
      <div style={{ background: BRAND, color: "#FFFFFF", padding: "20px 0 120px", textAlign: "center" }}>
        <div style={CONTAINER}>
          <h2 style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.025em", lineHeight: 1.1, margin: "0 auto 36px", maxWidth: 900 }}>
            Hours in, pay out. It really is that simple.
          </h2>
          <button onClick={() => navigate("/pricing")} style={{ background: NIGHT, color: "#FFFFFF", fontSize: 16, fontWeight: 700, padding: "16px 32px", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: FONT_STACK, display: "inline-flex", alignItems: "center", gap: 9 }}>
            Get started <ArrowRight size={17} />
          </button>
          <div style={{ marginTop: 24 }}>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", textDecoration: "underline" }}>
              Important offers, pricing details, and disclaimers
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// TODO: replace with shared marketing footer
function Footer() {
  return (
    <footer style={{ background: NIGHT, color: "rgba(240, 250, 248, 0.75)", padding: "60px 0 32px", borderTop: "0.5px solid " + BORDER_ON_DARK }}>
      <div style={CONTAINER}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: BRAND, display: "grid", placeItems: "center" }}>
                <Activity size={16} color="#FFFFFF" />
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>Novala</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(240, 250, 248, 0.6)", lineHeight: 1.6, margin: 0, maxWidth: 280 }}>
              Hours in, pay out. The team app that fills payroll in for you.
            </p>
          </div>
          {[
            { h: "Product", links: ["Pricing", "Payroll", "Time tracking", "Employee app"] },
            { h: "Solutions", links: ["For owners", "For teams", "Multi country"] },
            { h: "Resources", links: ["Help center", "Knowledge base", "Status", "Changelog"] },
            { h: "Company", links: ["About", "Contact", "Terms", "Privacy"] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 14 }}>{col.h}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                {col.links.map(l => (
                  <li key={l} style={{ fontSize: 13, color: "rgba(240, 250, 248, 0.6)", cursor: "pointer" }}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "0.5px solid " + BORDER_ON_DARK, paddingTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontSize: 12, color: "rgba(240, 250, 248, 0.5)" }}>(c) 2026 Novala. All rights reserved.</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(240, 250, 248, 0.6)", padding: "6px 12px", border: "0.5px solid " + BORDER_ON_DARK, borderRadius: 6, cursor: "pointer" }}>
            <Globe size={13} /> Canada (EN) <ChevronDown size={13} />
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function EmployeePortal() {
  return (
    <div style={{ fontFamily: FONT_STACK, color: TEXT_INK, background: BG_PAGE }}>
      <Header />
      <Hero />
      <ProofBar />
      <SignatureFlow />
      <DayInLife />
      <FeatureGrid />
      <TrustSection />
      <Testimonial />
      <KnowledgeCards />
      <FAQ />
      <CurvedCloser />
      <Footer />
    </div>
  );
}
