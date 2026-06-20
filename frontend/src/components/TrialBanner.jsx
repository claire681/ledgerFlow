import React, { useState, useEffect } from "react";
import { Clock, AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = "https://api.getnovala.com/api/v1";

const TIERS = {
  info:    { bg: "rgba(15,149,153,0.08)", border: "#0F9599", text: "#0F9599", btn: "#0F9599", btnHover: "#0B7A7E", Icon: Clock },
  warning: { bg: "rgba(245,158,11,0.10)", border: "#F59E0B", text: "#92400E", btn: "#F59E0B", btnHover: "#D97706", Icon: Clock },
  urgent:  { bg: "rgba(239,68,68,0.10)", border: "#EF4444", text: "#991B1B", btn: "#EF4444", btnHover: "#B91C1C", Icon: AlertCircle },
};

const PLAN_PRICES = {
  essentials: 19, premium: 49, scale: 99,
  essentials_payroll_core: 44, essentials_payroll_premium: 59, essentials_payroll_elite: 99,
  premium_payroll_core: 74, premium_payroll_premium: 89, premium_payroll_elite: 129,
  scale_payroll_core: 124, scale_payroll_premium: 139, scale_payroll_elite: 179,
};

function prettyPlan(slug) {
  if (!slug) return "";
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const parts = slug.split("_payroll_");
  return parts.length === 2 ? `${cap(parts[0])} + Payroll ${cap(parts[1])}` : cap(slug);
}

export default function TrialBanner() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sub, setSub] = useState(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    (async () => {
      try {
        const [uRes, sRes] = await Promise.all([
          fetch(`${API}/auth/me`, { headers }),
          fetch(`${API}/subscriptions/me`, { headers }),
        ]);
        if (uRes.ok) setUser(await uRes.json());
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData) setSub(sData);
        }
      } catch (_) {}
    })();
  }, []);

  if (!user) return null;
  if (user.subscription_status !== "trialing") return null;

  const trialEndsAtRaw = user.trial_ends_at || (sub && sub.current_period_end);
  if (!trialEndsAtRaw) return null;

  const trialEnd = new Date(typeof trialEndsAtRaw === "string" && !trialEndsAtRaw.endsWith("Z") && !trialEndsAtRaw.includes("+")
    ? trialEndsAtRaw + "Z" : trialEndsAtRaw);
  const now = new Date();
  const daysRemaining = Math.ceil((trialEnd - now) / 86400000);
  if (daysRemaining < 0) return null;

  const tier = daysRemaining >= 8 ? TIERS.info
            : daysRemaining >= 4 ? TIERS.warning
            : TIERS.urgent;
  const { bg, border, text, btn, btnHover, Icon } = tier;

  const planSlug = (sub && sub.plan_slug) || user.plan || "";
  const planName = prettyPlan(planSlug);
  const price = PLAN_PRICES[planSlug] || 0;

  const headline = daysRemaining === 0 ? "Your free trial ends today"
                : daysRemaining === 1 ? "Your free trial ends tomorrow"
                : `${daysRemaining} days left in your free trial`;

  const trialEndStr = trialEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const subline = planName && price
    ? `${planName} renews ${trialEndStr} at $${price.toFixed(2)}/mo`
    : `Renews ${trialEndStr}`;

  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderRadius: 12,
      padding: "14px 18px", marginBottom: 20,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: border,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={20} color="#FFFFFF" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 2 }}>{headline}</div>
          <div style={{
            fontSize: 12, color: "#5B6B6B", lineHeight: 1.4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{subline}</div>
        </div>
      </div>
      <button
        onClick={() => navigate("/account/billing")}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? btnHover : btn, color: "#FFFFFF",
          padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          border: "none", cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: "inherit", transition: "background 0.15s",
        }}>
        Manage subscription <ArrowRight size={14} />
      </button>
    </div>
  );
}
