import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, CreditCard, LogOut } from "lucide-react";

const FONT = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
const TEAL = "#0F9599";
const TEAL_TINT = "rgba(15,149,153,0.10)";
const TEXT = "#0E1A1A";
const MUTED = "#5B6B6B";
const FAINT = "#9DA8A8";
const BG = "#F4F7F7";
const CARD = "#FFFFFF";
const BORDER = "#E2E8E8";
const HAIR = "#EFF2F2";

export default function SubscriptionExpired() {
  const navigate = useNavigate();
  const [subHover, setSubHover] = useState(false);
  const [logoutHover, setLogoutHover] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: BG,
        fontFamily: FONT,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
      }}
    >
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          padding: 44,
          maxWidth: 460,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 16px rgba(14,26,26,0.04)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: TEAL_TINT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 22px",
          }}
        >
          <Sparkles size={28} color={TEAL} />
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: TEXT,
            letterSpacing: "-0.02em",
            marginBottom: 10,
          }}
        >
          Your free trial has ended
        </div>

        <div
          style={{
            fontSize: 14,
            color: MUTED,
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          To continue using Novala, please subscribe to a plan. Your data is safe and will be restored as soon as you subscribe.
        </div>

        <button
          onClick={() => navigate("/pricing")}
          onMouseEnter={() => setSubHover(true)}
          onMouseLeave={() => setSubHover(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: subHover ? "#1A2828" : "#0E1A1A",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 600,
            padding: "12px 24px",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(14,26,26,0.20)",
            fontFamily: FONT,
            width: "100%",
            marginBottom: 18,
            transition: "background 120ms ease",
          }}
        >
          <CreditCard size={16} />
          Subscribe to continue
        </button>

        <button
          onClick={handleLogout}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: logoutHover ? "#E8ECEC" : "#F4F7F7",
            color: logoutHover ? TEXT : MUTED,
            fontSize: 12,
            fontWeight: 600,
            padding: "8px 18px",
            border: `1px solid ${HAIR}`,
            borderRadius: 99,
            cursor: "pointer",
            fontFamily: FONT,
            transition: "background 120ms ease, color 120ms ease",
          }}
        >
          <LogOut size={13} />
          Log out
        </button>
      </div>

      <div
        style={{
          marginTop: 24,
          fontSize: 12,
          color: FAINT,
          textAlign: "center",
        }}
      >
        Need help? Contact{" "}
        <span style={{ color: TEAL, fontWeight: 600 }}>
          [email protected]
        </span>
      </div>
    </div>
  );
}
