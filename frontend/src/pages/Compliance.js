import React, { useState, useMemo } from "react";
import {
  Search, ChevronRight, ArrowRight, ExternalLink,
  CircleDollarSign, ShieldCheck, FileText, TrendingUp,
  Globe, CalendarClock, FileCheck2, MapPin, Lock,
} from "lucide-react";

// Compliance news and information (Payroll > Compliance).
// Curated compliance resources. All links are real, official URLs (external ones open in a
// new tab); "Learn more" sub-links point to Novala help articles where available.
// URL verification: Government pages move over time. Spot-check the URLs below periodically
// (annually at minimum). If a page has moved, use the official replacement rather than
// dropping the link.
// URLs verified: 2026-07-16

const T = {
  teal: "#15A08C", tealHover: "#0F8474", tealTint: "#E1F5EE", tealInk: "#0F6E56",
  slate: "#12262B", muted: "#66748B", pagebg: "#F4F6F8", card: "#FFFFFF",
  line: "#E7EAF0", lineStrong: "#D5DBE3", dark: "#0E1A1A",
};

// Data-driven so items can be added, reordered, retired, or re-pointed without
// touching layout. Consider fetching this from a Novala-managed content source
// in a future release so compliance updates don't require a deploy.
const ITEMS = [
  {
    icon: CircleDollarSign, category: "Provincial",
    title: "Minimum wage requirements for Canada provinces and territories",
    desc: "Learn about current minimum wage requirements for Canada provinces and territories.",
    href: "https://minwage-salairemin.service.canada.ca/en/intro.html",
    external: true,
  },
  {
    icon: ShieldCheck, category: "Federal",
    title: "What you need to know about FINTRAC",
    desc: "Learn about FINTRAC and review important FAQs related to the program and how Novala complies with the requirements.",
    href: "https://www.fintrac-canafe.gc.ca/",
    external: true,
  },
  {
    icon: FileText, category: "Year-end",
    title: "Annual Canadian Dental Care Plan reporting requirements",
    desc: "Learn how to meet mandatory reporting requirements for T4 and T4A slips and manage your setup within Novala.",
    href: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/completing-filing-information-returns/t4-information-employers.html",
    external: true,
  },
  {
    icon: TrendingUp, category: "Federal",
    title: "Second Canadian Pension Plan and Quebec Pension Plan",
    desc: "A second earnings ceiling is used to determine additional CPP and QPP contributions for employees.",
    href: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/canada-pension-plan-cpp/second-additional-cpp-contribution-rates-maximums.html",
    external: true,
  },
  {
    icon: Globe, category: "Federal",
    title: "Canada Revenue Agency payroll homepage",
    desc: "Review the official homepage of the Canada Revenue Agency for information helpful to employers that are new to payroll.",
    href: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll.html",
    external: true,
  },
  {
    icon: FileText, category: "Year-end",
    title: "Filling out the T4 tax form",
    desc: "Learn how to properly fill out the T4 tax form via the Canada Revenue Agency website.",
    href: "https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t4.html",
    external: true,
  },
  {
    icon: CalendarClock, category: "Federal",
    title: "Important tax remittance deadlines",
    desc: "Review important tax remittance deadlines via the Canada Revenue Agency website.",
    href: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/remitting-source-deductions/when-remit-your-source-deductions.html",
    external: true,
  },
  {
    icon: FileCheck2, category: "Federal",
    title: "Record of Employment (ROE) guide",
    desc: "Official Service Canada guide for creating and submitting Records of Employment.",
    href: "https://www.canada.ca/en/employment-social-development/programs/ei/ei-list/reports/roe-guide.html",
    external: true,
  },
  {
    icon: MapPin, category: "Provincial",
    title: "Homepage of Revenu Québec",
    desc: "Find helpful information and links on the homepage of Revenu Québec.",
    href: "https://www.revenuquebec.ca/en/",
    external: true,
    subLink: {
      label: "Filing RL-slips using software (IN-412.A)",
      href: "https://www.revenuquebec.ca/en/businesses/rl-slips-and-summaries/filing-rl-slips-and-summaries/using-software/",
      external: true,
    },
  },
];

const CATEGORIES = ["All", "Federal", "Provincial", "Year-end"];

function ext(external) {
  return external ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

function Card({ item }) {
  const [hover, setHover] = useState(false);
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      {...ext(item.external)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: T.card, border: "1px solid " + (hover ? T.teal : T.line), borderRadius: 16,
        padding: 20, display: "flex", gap: 15, textDecoration: "none", color: "inherit",
        position: "relative", transition: "border-color .15s, box-shadow .15s, transform .15s",
        boxShadow: hover ? "0 8px 24px rgba(16,30,40,.08)" : "none",
        transform: hover ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ flex: "0 0 44px", width: 44, height: 44, borderRadius: 12, background: T.tealTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={22} color={T.tealInk} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.3, color: hover ? T.tealHover : T.slate, transition: "color .15s" }}>
          {item.title}
          {item.external && (
            <span style={{ fontSize: 11, fontWeight: 600, color: T.tealInk, background: T.tealTint, borderRadius: 6, padding: "2px 7px", marginLeft: 8, whiteSpace: "nowrap", verticalAlign: "middle", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ExternalLink size={11} strokeWidth={2.2} /> External
            </span>
          )}
        </div>
        <div style={{ marginTop: 6, fontSize: 13.5, color: T.slate, fontWeight: 500, lineHeight: 1.5 }}>{item.desc}</div>
        {item.subLink && (
          <a
            href={item.subLink.href}
            {...ext(item.subLink.external)}
            onClick={(e) => e.stopPropagation()}
            style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: T.teal, textDecoration: "none" }}
          >
            {item.subLink.label} <ArrowRight size={14} strokeWidth={2} />
          </a>
        )}
      </div>
      <div style={{ position: "absolute", top: 20, right: 18, color: hover ? T.teal : T.lineStrong, transform: hover ? "translateX(2px)" : "none", transition: "color .15s, transform .15s" }}>
        <ChevronRight size={18} strokeWidth={2} />
      </div>
    </a>
  );
}

function Compliance() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ITEMS.filter((it) => {
      const inCat = cat === "All" || it.category === cat;
      const inQ = !q || it.title.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q);
      return inCat && inQ;
    });
  }, [query, cat]);

  return (
    <div style={{ background: T.pagebg, minHeight: "100%", fontFamily: "'Inter', system-ui, sans-serif", color: T.slate }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "34px 28px 60px" }}>
        <div style={{ fontSize: 12.5, color: T.slate, fontWeight: 500, display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
          <span>Payroll</span><span style={{ color: T.lineStrong }}>/</span><span style={{ color: "#000", fontWeight: 600 }}>Compliance</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#000", letterSpacing: "-.3px" }}>Compliance news and information</h1>
        <div style={{ marginTop: 8, fontSize: 15, color: T.slate, fontWeight: 500, maxWidth: 760, lineHeight: 1.5 }}>
          Review the latest compliance information, along with year-end content, to help your business navigate complex payroll topics.
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 18px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240, display: "flex", alignItems: "center", gap: 9, background: T.card, border: "1px solid " + T.line, borderRadius: 11, padding: "9px 13px" }}>
            <Search size={17} color="#5C6A7A" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search compliance topics"
              style={{ border: "none", outline: "none", font: "inherit", fontSize: 14, color: T.slate, width: "100%", background: "transparent" }}
            />
          </div>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 11, padding: "9px 14px",
                fontSize: 13.5, fontWeight: 600, cursor: "pointer", font: "inherit",
                background: cat === c ? T.dark : T.card, color: cat === c ? "#fff" : T.slate,
                border: "1px solid " + (cat === c ? T.dark : T.line),
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: T.card, border: "1px solid " + T.line, borderRadius: 16, padding: "40px 20px", textAlign: "center", color: T.slate, fontSize: 14, fontWeight: 500 }}>
            No topics match your search.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {filtered.map((it) => <Card key={it.title} item={it} />)}
          </div>
        )}

        <div style={{ marginTop: 26, background: T.card, border: "1px solid " + T.line, borderRadius: 16, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EEF1F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={20} color={T.slate} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 14, color: "#000", fontWeight: 600 }}>Need a hand with a filing?</b>
            <p style={{ fontSize: 13, color: T.slate, fontWeight: 500, marginTop: 2 }}>Reach our payroll support team for help with T4s, remittances, and year-end.</p>
          </div>
          <a href="mailto:support@getnovala.com" style={{ background: T.dark, color: "#fff", fontWeight: 600, fontSize: 13.5, padding: "10px 16px", borderRadius: 10, textDecoration: "none", boxShadow: "0 1px 2px rgba(16,30,40,.08)" }}>Contact support</a>
        </div>
      </div>
    </div>
  );
}

export default Compliance;