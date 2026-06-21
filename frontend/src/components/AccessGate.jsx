import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

// Paths always accessible regardless of subscription status.
// These are auth flows, the gate destination itself, and routes that let
// expired users come back (pricing, account billing, onboarding).
const ALWAYS_ACCESSIBLE = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/account/billing",
  "/subscription/expired",
  "/onboarding",
];

function isAlwaysAccessible(path) {
  return ALWAYS_ACCESSIBLE.some(
    (p) => path === p || path.startsWith(p + "/")
  );
}

export default function AccessGate() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;

    if (isAlwaysAccessible(path)) return;

    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;

    fetch(`${API}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (cancelled || !user) return;

        const status = (user.subscription_status || "").toLowerCase();
        const trialEnd = user.trial_ends_at
          ? new Date(user.trial_ends_at)
          : null;
        const now = new Date();

        // Active paying customer: allow
        if (status === "active") return;

        // Trialing user with trial not yet expired: allow
        if (status === "trialing" && trialEnd && trialEnd > now) return;

        // Otherwise: gate
        navigate("/subscription/expired");
      })
      .catch(() => {
        // Silent fail; let other handlers manage network errors
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  return null;
}
