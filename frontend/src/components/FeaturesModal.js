// Features modal opened from the Landing v2 "View all features" button.
// Seven categories, scrollable body, sticky header/footer, closes on Close, overlay click, Escape.
// Body scroll locks while open.

import React, { useState, useEffect } from "react";
import {
  X, BookOpen, Landmark, ArrowLeftRight, Sparkles, List, FileText, CheckCircle2,
  Receipt, Wallet, FolderOpen, Users, Upload,
  Repeat, CreditCard, Bell,
  Banknote, Calendar, UserPlus, Shield,
  Percent, MapPin, BarChart3, Clipboard,
  LayoutDashboard, TrendingUp, Scale, Activity,
  Smartphone, Zap, Lock, Cloud, Download,
} from "lucide-react";

const BRAND = "#0F9599";
const BRAND_DEEP = "#0E4B4D";
const TEXT_INK = "#0E2A2A";
const TEXT_DARK = "#5A6970";
const TEXT_TERTIARY = "#9CA3AF";
const BG_SOFT = "#F7F9F9";
const BORDER = "#EAF0F0";
const FONT_STACK = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

const CATEGORIES = [
  {
    label: "Bookkeeping and accounting",
    items: [
      { icon: BookOpen, title: "Smart bookkeeping", note: "Books that sort themselves out, automatically." },
      { icon: Landmark, title: "Bank feed sync", note: "Pull every transaction straight from your bank." },
      { icon: ArrowLeftRight, title: "Transaction matching", note: "Match payments to invoices in one click." },
      { icon: Sparkles, title: "Smart categorization", note: "Nexa AI puts every transaction in the right bucket." },
      { icon: List, title: "Chart of accounts", note: "A clear, structured view of every account." },
      { icon: FileText, title: "Journal entries", note: "Record entries with full audit history." },
      { icon: CheckCircle2, title: "Reconciliation", note: "Reconcile statements without the headache." },
    ],
  },
  {
    label: "Receipts and expenses",
    items: [
      { icon: Receipt, title: "Receipt scanner", note: "Snap or upload, and Nexa AI reads the details." },
      { icon: Wallet, title: "Expense tracking", note: "Track every dollar out, by category." },
      { icon: FolderOpen, title: "Document storage", note: "All your receipts and bills in one searchable place." },
      { icon: Users, title: "Vendor management", note: "Keep vendor records, terms, and history together." },
      { icon: Upload, title: "Bulk uploads", note: "Drop in dozens of receipts at once." },
    ],
  },
  {
    label: "Invoicing and payments",
    items: [
      { icon: FileText, title: "Branded invoices", note: "Invoices that match your brand and get paid faster." },
      { icon: Repeat, title: "Recurring billing", note: "Bill on a schedule, automatically." },
      { icon: CreditCard, title: "Online payments", note: "Accept card and bank payments built right in." },
      { icon: Bell, title: "Payment reminders", note: "Polite, automated nudges for unpaid invoices." },
      { icon: Users, title: "Customer management", note: "Customer profiles, history, and payment terms." },
    ],
  },
  {
    label: "Payroll and team",
    items: [
      { icon: Wallet, title: "Payroll runs", note: "Run payroll in minutes, with rules per country." },
      { icon: Banknote, title: "Direct deposit", note: "Pay your team straight to their bank." },
      { icon: Calendar, title: "Time off tracking", note: "Track vacation and sick days in one place." },
      { icon: FileText, title: "Year end tax forms", note: "The right form per country (such as T4 or W-2)." },
      { icon: UserPlus, title: "Multi user team access", note: "Give your team access to what they need." },
      { icon: Shield, title: "Role based permissions", note: "Decide who sees and changes what." },
    ],
  },
  {
    label: "Tax and compliance",
    items: [
      { icon: Percent, title: "Sales tax tracking", note: "Sales tax calculated and tracked for you." },
      { icon: MapPin, title: "Federal and regional", note: "Federal and regional rules built in." },
      { icon: BarChart3, title: "Year end reports", note: "Reports ready when filing season arrives." },
      { icon: Clipboard, title: "Audit trail", note: "Every change is logged, with who and when." },
    ],
  },
  {
    label: "Reports and intelligence",
    items: [
      { icon: LayoutDashboard, title: "Live dashboards", note: "See where the money is, in real time." },
      { icon: TrendingUp, title: "Profit and loss", note: "Up to the minute profit and loss view." },
      { icon: Scale, title: "Balance sheet", note: "Assets, liabilities, and equity at a glance." },
      { icon: Activity, title: "Cash flow statement", note: "Where cash is coming from and going to." },
      { icon: BarChart3, title: "Custom reports", note: "Slice and dice on the metrics you care about." },
      { icon: Sparkles, title: "Nexa assistant", note: "Ask in plain English, get the real number." },
    ],
  },
  {
    label: "Platform",
    items: [
      { icon: Smartphone, title: "Mobile app", note: "Full Novala on iOS and Android." },
      { icon: Zap, title: "Integrations", note: "Connect the banks, cards, and apps you use." },
      { icon: Lock, title: "Bank-grade security", note: "Encryption, role based access, continuous backups." },
      { icon: Cloud, title: "Continuous backups", note: "Your data is backed up every minute." },
      { icon: Download, title: "Anytime exports", note: "Export your data anytime, in standard formats." },
    ],
  },
];

function FeatureItem({ item }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", gap: 14,
        padding: 14,
        background: hovered ? BG_SOFT : "#FFFFFF",
        border: "0.5px solid " + BORDER,
        borderRadius: 12,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 24px rgba(8,32,31,0.10)" : "none",
        transition: "transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: "linear-gradient(135deg, " + BRAND + " 0%, " + BRAND_DEEP + " 100%)",
        boxShadow: "0 6px 14px rgba(15, 149, 153, 0.25)",
        display: "grid", placeItems: "center",
        flexShrink: 0,
      }}>
        <Icon size={17} color="#FFFFFF" strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_INK, letterSpacing: "-0.005em", marginBottom: 3 }}>{item.title}</div>
        <div style={{ fontSize: 12.5, color: TEXT_DARK, lineHeight: 1.5 }}>{item.note}</div>
      </div>
    </div>
  );
}

export default function FeaturesModal({ open, onClose, onSeePricing }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Products and features"
      style={{
        position: "fixed", inset: 0,
        background: "rgba(8, 32, 31, 0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "grid", placeItems: "center",
        padding: 20,
        fontFamily: FONT_STACK,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF", borderRadius: 20,
          width: "100%", maxWidth: 1100, maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 30px 80px rgba(0,0,0,0.30)",
          overflow: "hidden",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 28px",
          borderBottom: "0.5px solid " + BORDER,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/logo512.png" width="26" height="26" alt="Novala" style={{ borderRadius: 6, display: "block" }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.01em" }}>Novala</span>
            </div>
            <nav style={{ display: "flex", gap: 22 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: BRAND, cursor: "pointer" }}>Products and features</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_DARK, cursor: "pointer" }}>Plans and pricing</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_DARK, cursor: "pointer" }}>Learn and support</span>
            </nav>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent", border: "none", padding: 6,
              borderRadius: 8, cursor: "pointer", color: TEXT_DARK,
              display: "grid", placeItems: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "32px 28px", overflowY: "auto", flex: 1 }}>
          {CATEGORIES.map((cat, i) => (
            <div key={i} style={{ marginBottom: i < CATEGORIES.length - 1 ? 36 : 0 }}>
              <h3 style={{ fontSize: 11.5, fontWeight: 700, color: TEXT_TERTIARY, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px" }}>{cat.label}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                {cat.items.map((item, j) => <FeatureItem key={j} item={item} />)}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: "16px 28px",
          borderTop: "0.5px solid " + BORDER,
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12,
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent", color: TEXT_INK,
              fontSize: 14, fontWeight: 700,
              padding: "10px 20px",
              border: "1px solid " + BORDER, borderRadius: 8,
              cursor: "pointer", fontFamily: FONT_STACK,
            }}
          >
            Close
          </button>
          <button
            onClick={onSeePricing}
            style={{
              background: BRAND, color: "#FFFFFF",
              fontSize: 14, fontWeight: 700,
              padding: "10px 22px",
              border: "none", borderRadius: 8,
              cursor: "pointer", fontFamily: FONT_STACK,
              boxShadow: "0 4px 12px rgba(15, 149, 153, 0.25)",
            }}
          >
            See pricing
          </button>
        </div>
      </div>
    </div>
  );
}
