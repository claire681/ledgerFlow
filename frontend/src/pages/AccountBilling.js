import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CreditCard, ExternalLink, RefreshCw } from "lucide-react";

const API = "https://api.getnovala.com/api/v1";
const TEAL = "#0F9599";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const MUTED = "#9AA8A8";
const BORDER = "#DDE5E5";
const RED = "#D9453C";

const PLAN_INFO = {
  essentials: { name: "Essentials", price: 19 },
  premium:    { name: "Premium",    price: 49 },
  scale:      { name: "Scale",      price: 99 },
};
const PAYROLL_INFO = {
  core:    { name: "Payroll Core",    price: 25 },
  premium: { name: "Payroll Premium", price: 40 },
  elite:   { name: "Payroll Elite",   price: 80 },
};

function parseSlug(slug) {
  if (!slug) return { plan: null, payroll: null, total: 0 };
  const parts = slug.split("_payroll_");
  const plan = PLAN_INFO[parts[0]] || null;
  const payroll = parts[1] ? PAYROLL_INFO[parts[1]] : null;
  const total = (plan ? plan.price : 0) + (payroll ? payroll.price : 0);
  return { plan, payroll, total };
}

export default function AccountBilling() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
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
      setLoading(false);
    })();
  }, [navigate]);

  const slug = (sub && sub.plan_slug) || (user && user.plan) || "";
  const { plan, payroll, total } = parseSlug(slug);
  const status = (user && user.subscription_status) || "";
  const isTrialing = status === "trialing";
  const nextChargeRaw = sub && sub.current_period_end;
  const nextChargeDate = nextChargeRaw
    ? new Date(nextChargeRaw).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const paypalAutopay = "https://www.paypal.com/myaccount/autopay/";

  const card = { background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 16 };
  const lineRow = { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "12px 0", borderBottom: `1px solid ${BORDER}` };
  const eyebrow = { fontSize: 11, fontWeight: 700, color: SUB, letterSpacing: "0.1em", textTransform: "uppercase" };

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFA", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
        <Link to="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: SUB, fontSize: 14, textDecoration: "none" }}>
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: INK, margin: "16px 0 8px", letterSpacing: "-0.02em" }}>Billing</h1>
        <p style={{ fontSize: 14, color: SUB, margin: "0 0 24px" }}>Manage your subscription and payment method.</p>

        {loading ? (
          <div style={card}><div style={{ color: MUTED, textAlign: "center", padding: 24 }}>Loading...</div></div>
        ) : (
          <>
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={eyebrow}>Current plan</div>
                {isTrialing && (
                  <div style={{ background: "rgba(15,149,153,0.10)", color: TEAL, padding: "4px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Free trial</div>
                )}
              </div>
              {plan ? (
                <>
                  <div style={lineRow}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: INK }}>{plan.name}</div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Billed monthly</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: INK }}>${plan.price}/mo</div>
                  </div>
                  {payroll && (
                    <div style={lineRow}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: INK }}>{payroll.name}</div>
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Flat tier rate</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: INK }}>${payroll.price}/mo</div>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 0 0" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>Total monthly</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: INK }}>${total}/mo</div>
                  </div>
                </>
              ) : (
                <div style={{ padding: "24px 0", textAlign: "center", color: MUTED }}>No active subscription</div>
              )}
            </div>

            {nextChargeDate && (
              <div style={card}>
                <div style={eyebrow}>{isTrialing ? "Trial ends and first charge" : "Next charge"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: INK }}>{nextChargeDate}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: INK }}>${total}.00</div>
                </div>
              </div>
            )}

            <div style={{ ...card, padding: 0, overflow: "hidden" }}>
              <ActionRow Icon={RefreshCw} label="Change plan" sub="Upgrade or downgrade your subscription" onClick={() => navigate("/pricing")} />
              <ActionRow Icon={ExternalLink} label="Manage payment method" sub="Update card or PayPal account via PayPal" href={paypalAutopay} border />
              <ActionRow Icon={CreditCard} label="Cancel subscription" sub={isTrialing && nextChargeDate ? `Cancel via PayPal. Your trial continues until ${nextChargeDate}` : "Cancel via PayPal"} href={paypalAutopay} danger border />
            </div>

            <div style={{ fontSize: 12, color: MUTED, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
              Need help? Contact support at <a href="mailto:[email protected]" style={{ color: TEAL }}>[email protected]</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ActionRow({ Icon, label, sub, onClick, href, border, danger }) {
  const inner = (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderTop: border ? "1px solid #DDE5E5" : "none", cursor: "pointer", transition: "background 0.15s" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: danger ? "rgba(217,69,60,0.10)" : "rgba(15,149,153,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color={danger ? "#D9453C" : "#0F9599"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? "#D9453C" : "#0E1A1A" }}>{label}</div>
        <div style={{ fontSize: 12, color: "#5B6B6B", marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>{inner}</a>;
  }
  return <div onClick={onClick}>{inner}</div>;
}
