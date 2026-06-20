import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Receipt,
  Users,
  Sparkles,
  RefreshCw,
  CreditCard,
  X,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const FONT = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
const TEAL = "#0F9599";
const TEAL_DARK = "#0F6E56";
const TEAL_TINT = "rgba(15,149,153,0.10)";
const TEAL_TINT_STRONG = "rgba(15,149,153,0.12)";
const TEXT = "#0E1A1A";
const MUTED = "#5B6B6B";
const FAINT = "#9DA8A8";
const BG = "#F4F7F7";
const CARD = "#FFFFFF";
const BORDER = "#E2E8E8";
const HAIR = "#EFF2F2";
const DANGER = "#D9453C";
const DANGER_TINT = "rgba(217,69,60,0.10)";

const PLAN_INFO = {
  essentials: {
    name: "Essentials",
    price: 19,
    description: "Accounting, invoicing, expense tracking, reports",
  },
  premium: {
    name: "Premium",
    price: 39,
    description: "Everything in Essentials plus advanced reports and Nexa AI",
  },
  scale: {
    name: "Scale",
    price: 89,
    description: "Multi entity, unlimited users, priority support",
  },
};

const PAYROLL_INFO = {
  core: {
    name: "Payroll Core",
    price: 25,
    description: "Run payroll for up to 5 employees",
  },
  premium: {
    name: "Payroll Premium",
    price: 40,
    description: "Run payroll, paystubs, tax filings for your team",
  },
};

function parseSlug(slug) {
  if (!slug) return { base: null, payroll: null };
  const parts = slug.split("_payroll_");
  return { base: parts[0] || null, payroll: parts[1] || null };
}

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function fmtDateShort(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function daysBetween(a, b) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function AccountBilling() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sub, setSub] = useState(null);
  const [error, setError] = useState(null);
  const [backHover, setBackHover] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    Promise.all([
      fetch(`${API}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : Promise.reject(r))),
      fetch(`${API}/api/v1/subscriptions/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : Promise.reject(r))),
    ])
      .then(([u, s]) => {
        setUser(u);
        setSub(s);
      })
      .catch(() => setError("Could not load billing info."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const planParts = useMemo(() => {
    if (!sub?.plan_slug) return { base: null, payroll: null, total: 0 };
    const { base, payroll } = parseSlug(sub.plan_slug);
    const baseInfo = base && PLAN_INFO[base];
    const payrollInfo = payroll && PAYROLL_INFO[payroll];
    const total = (baseInfo?.price || 0) + (payrollInfo?.price || 0);
    return { base, baseInfo, payroll, payrollInfo, total };
  }, [sub]);

  const isTrialing =
    sub?.status === "trialing" || user?.subscription_status === "trialing";

  const trialMath = useMemo(() => {
    if (!isTrialing) return null;
    const end = sub?.current_period_end || user?.trial_ends_at;
    if (!end) return null;
    const now = new Date();
    const endDate = new Date(end);
    const daysLeft = daysBetween(now, endDate);
    const totalDays = 14;
    const used = Math.max(0, totalDays - daysLeft);
    const pct = Math.min(100, Math.max(2, Math.round((used / totalDays) * 100)));
    return { end, daysLeft, used, totalDays, pct };
  }, [isTrialing, sub, user]);

  const planFullName = useMemo(() => {
    if (!planParts.baseInfo) return "Your plan";
    const baseName = planParts.baseInfo.name;
    const payrollName = planParts.payrollInfo?.name;
    return payrollName ? `${baseName} + ${payrollName}` : baseName;
  }, [planParts]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          fontFamily: FONT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: MUTED,
          fontSize: 14,
        }}
      >
        Loading billing...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          fontFamily: FONT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: DANGER,
          fontSize: 14,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        fontFamily: FONT,
        padding: "32px 20px 64px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <button
          onClick={() => navigate("/dashboard")}
          onMouseEnter={() => setBackHover(true)}
          onMouseLeave={() => setBackHover(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: backHover ? "#1A2828" : "#0E1A1A",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 16px",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(14,26,26,0.20)",
            marginBottom: 28,
            fontFamily: FONT,
            transition: "background 120ms ease",
          }}
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </button>

        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: TEXT,
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}
        >
          Billing
        </div>
        <div style={{ fontSize: 14, color: MUTED, marginBottom: 28 }}>
          Manage your subscription, payment method, and trial status.
        </div>

        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: 26,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 22,
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: MUTED,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Current plan
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: TEXT,
                  letterSpacing: "-0.01em",
                  marginBottom: 3,
                }}
              >
                {planFullName}
              </div>
              <div style={{ fontSize: 12, color: MUTED }}>
                Billed monthly via PayPal
              </div>
            </div>
            {isTrialing && (
              <div
                style={{
                  background: TEAL_TINT,
                  color: TEAL_DARK,
                  padding: "5px 11px",
                  borderRadius: 99,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <Sparkles size={12} />
                Free trial
              </div>
            )}
          </div>

          <div
            style={{
              borderTop: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
              padding: "14px 0",
              marginBottom: 18,
            }}
          >
            {planParts.baseInfo && (
              <PlanLineItem
                icon={<Receipt size={18} color={TEAL} />}
                name={planParts.baseInfo.name}
                description={planParts.baseInfo.description}
                price={planParts.baseInfo.price}
              />
            )}
            {planParts.payrollInfo && (
              <PlanLineItem
                icon={<Users size={18} color={TEAL} />}
                name={planParts.payrollInfo.name}
                description={planParts.payrollInfo.description}
                price={planParts.payrollInfo.price}
                topBorder
              />
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <div style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>
              Total monthly
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: TEXT,
                letterSpacing: "-0.02em",
              }}
            >
              ${planParts.total}
              <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>
                /mo
              </span>
            </div>
          </div>
        </div>

        {isTrialing && trialMath && (
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: 22,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: MUTED,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Trial countdown
                </div>
                <div style={{ fontSize: 13, color: MUTED }}>
                  First charge on{" "}
                  <span style={{ color: TEXT, fontWeight: 700 }}>
                    {fmtDate(trialMath.end)}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: TEAL,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {trialMath.daysLeft}
                </div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>
                  days left
                </div>
              </div>
            </div>

            <div
              style={{
                height: 6,
                background: HAIR,
                borderRadius: 99,
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${trialMath.pct}%`,
                  background: TEAL,
                  borderRadius: 99,
                  transition: "width 600ms ease",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: FAINT,
              }}
            >
              <div>
                <span style={{ color: TEXT, fontWeight: 700 }}>
                  Started {fmtDateShort(sub?.current_period_start)}
                </span>
              </div>
              <div>
                <span style={{ color: TEXT, fontWeight: 700 }}>
                  ${planParts.total}.00 on {fmtDateShort(trialMath.end)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <ActionRow
            icon={<RefreshCw size={18} color={TEAL} />}
            label="Change plan"
            description="Upgrade, downgrade, or switch add ons"
            onClick={() => navigate("/pricing")}
            trailing="chevron"
          />
          <ActionRow
            icon={<CreditCard size={18} color={TEAL} />}
            label="Manage payment method"
            description="Update card or PayPal account via PayPal"
            onClick={() =>
              window.open("https://www.paypal.com/myaccount/autopay/", "_blank")
            }
            trailing="external"
            border
          />
          <ActionRow
            icon={<X size={18} color={DANGER} />}
            iconBg={DANGER_TINT}
            label="Cancel subscription"
            description="Cancel via PayPal. Trial continues until your end date"
            onClick={() =>
              window.open("https://www.paypal.com/myaccount/autopay/", "_blank")
            }
            trailing="external"
            border
            danger
          />
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 11.5,
            color: FAINT,
          }}
        >
          Need help? Contact{" "}
          <span style={{ color: TEAL, fontWeight: 600 }}>
            [email protected]
          </span>
        </div>
      </div>
    </div>
  );
}

function PlanLineItem({ icon, name, description, price, topBorder }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "8px 0",
        borderTop: topBorder ? `1px dashed ${HAIR}` : "none",
        marginTop: topBorder ? 4 : 0,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: TEAL_TINT_STRONG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: TEXT,
            marginBottom: 2,
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 11.5, color: MUTED }}>{description}</div>
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: TEXT,
          whiteSpace: "nowrap",
        }}
      >
        ${price}
        <span style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>/mo</span>
      </div>
    </div>
  );
}

function ActionRow({
  icon,
  iconBg,
  label,
  description,
  onClick,
  trailing,
  border,
  danger,
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 20px",
        cursor: "pointer",
        borderTop: border ? `1px solid ${HAIR}` : "none",
        background: hover ? "#FAFBFB" : "transparent",
        transition: "background 120ms ease",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: iconBg || TEAL_TINT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: danger ? DANGER : TEXT,
            marginBottom: 1,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 11.5, color: MUTED }}>{description}</div>
      </div>
      {trailing === "chevron" ? (
        <ChevronRight size={16} color={FAINT} />
      ) : (
        <ExternalLink size={16} color={FAINT} />
      )}
    </div>
  );
}
