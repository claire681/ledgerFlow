import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, X } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const authHeaders = () => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : "",
  };
};

const DISMISS_KEY = "novala_dismiss_company_banner";

/**
 * CompanyProfileBanner
 * -------------------
 * Nudge banner that appears on pages like Dashboard and Payroll if
 * the user's company profile is incomplete. Fetches completeness
 * status from GET /api/v1/company/profile/completeness.
 *
 * - Renders nothing while loading.
 * - Renders nothing if profile is complete.
 * - Renders nothing if user has dismissed it (per browser).
 * - Otherwise shows a teal banner with count of missing fields and a
 *   button that navigates to /settings/company.
 */
export default function CompanyProfileBanner() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check localStorage first
    if (localStorage.getItem(DISMISS_KEY) === "true") {
      setDismissed(true);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(API_URL + "/api/v1/company/profile/completeness", { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch (e) {
        // Silent fail - if endpoint is down, just hide banner
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  const handleComplete = () => {
    navigate("/settings/company");
  };

  // Don't render anything if:
  // - Still loading
  // - Profile is complete
  // - User dismissed
  if (dismissed) return null;
  if (!status) return null;
  if (status.is_complete) return null;

  const missingCount = (status.missing_fields || []).length;

  return (
    <div style={{
      background: "linear-gradient(135deg, #E1F5EE 0%, #D4EFE6 100%)",
      border: "1px solid rgba(21, 160, 140, 0.2)",
      borderRadius: 12,
      padding: "18px 20px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      marginBottom: 20,
      fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: "#15A08C",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Building2 size={22} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14.5,
          fontWeight: 600,
          color: "#0B7377",
          marginBottom: 3,
          letterSpacing: "-0.01em",
        }}>
          Complete your company profile
        </div>
        <div style={{
          fontSize: 13,
          color: "#2C3644",
          lineHeight: 1.5,
        }}>
          Add your business details to send professional invoices and pay stubs.
          {missingCount > 0 && (
            <span style={{ fontWeight: 600, color: "#0B7377" }}>
              {" • "}{missingCount} field{missingCount === 1 ? "" : "s"} missing
            </span>
          )}
        </div>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}>
        <button
          onClick={handleComplete}
          style={{
            background: "#15A08C",
            color: "white",
            border: "none",
            padding: "9px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#0B7377"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#15A08C"}
        >
          Complete profile
          <ArrowRight size={14} />
        </button>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            background: "transparent",
            color: "#4B5563",
            border: "none",
            width: 32,
            height: 32,
            borderRadius: 6,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}