import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Search, Filter, Printer, FileText,
} from "lucide-react";
import ResourcesDrawer from "../components/payroll/ResourcesDrawer";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const authHeaders = () => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : "",
  };
};

// Design tokens (match PayrollTaxes.js and previews)
const INK = "#000000";
const DARK = "#1A2332";
const LINE = "#E7EAF0";
const LINE_STRONG = "#D1D5DB";
const BG = "#F4F6F8";
const CARD = "#FFFFFF";
const TEAL = "#15A08C";
const TEAL_INK = "#0B7377";

// Form-type display metadata; extend when new countries/forms added
const FORM_DESCRIPTIONS = {
  PD7A: "Statement of Account for Current Source Deductions",
  T4: "Statement of Remuneration Paid",
  T4A: "Statement of Pension, Retirement, Annuity, and Other Income",
  "941": "Employer's Quarterly Federal Tax Return",
  W2: "Wage and Tax Statement",
  EPS: "Employer Payment Summary",
  BAS: "Business Activity Statement",
};

function formatDMY(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function ArchivedForms() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${API_URL}/api/v1/payroll/taxes/archived-forms`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        setForms(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        setError("Could not load archived forms: " + e.message);
        setLoading(false);
      });
  }, []);

  // Client-side filtering
  const filtered = forms.filter((f) => {
    if (search) {
      const q = search.toLowerCase();
      const desc = (FORM_DESCRIPTIONS[f.form_type] || "").toLowerCase();
      const hay = [
        f.form_type || "",
        desc,
        f.period_label || "",
        f.country || "",
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (startDate && f.period_end < startDate) return false;
    if (endDate && f.period_start > endDate) return false;
    return true;
  });

  return (
    <div style={{
      background: BG,
      minHeight: "100vh",
      fontFamily: "Inter, 'Plus Jakarta Sans', sans-serif",
      color: INK,
      fontSize: 14,
      lineHeight: 1.5,
      fontWeight: 500,
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 24px 60px" }}>
        <a
          onClick={() => navigate("/payroll/taxes")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: TEAL_INK,
            fontWeight: 700,
            marginBottom: 14,
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          Back to Payroll taxes
        </a>

        <h1 style={{
          fontSize: 24, fontWeight: 700, margin: "0 0 20px", color: INK,
        }}>
          Archived forms
        </h1>

        {/* Toolbar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
          flexWrap: "wrap",
        }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: 11, color: DARK }}>
              <Search size={16} strokeWidth={2.5} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              style={{
                padding: "9px 12px 9px 36px",
                width: 240,
                border: "1px solid " + LINE_STRONG,
                borderRadius: 10,
                fontSize: 14,
                fontFamily: "inherit",
                background: "white",
                color: INK,
                fontWeight: 600,
                outline: "none",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = TEAL}
              onBlur={(e) => e.currentTarget.style.borderColor = LINE_STRONG}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: DARK, fontWeight: 700 }}>Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: "9px 12px",
                border: "1px solid " + LINE_STRONG,
                borderRadius: 10,
                fontSize: 14,
                fontFamily: "inherit",
                background: "white",
                color: INK,
                fontWeight: 600,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: DARK, fontWeight: 700 }}>End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: "9px 12px",
                border: "1px solid " + LINE_STRONG,
                borderRadius: 10,
                fontSize: 14,
                fontFamily: "inherit",
                background: "white",
                color: INK,
                fontWeight: 600,
                outline: "none",
              }}
            />
          </div>

          <button
            onClick={() => { setSearch(""); setStartDate(""); setEndDate(""); }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 14px",
              borderRadius: 8,
              height: 40,
              background: "white",
              border: "1px solid " + LINE_STRONG,
              color: INK,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
          >
            <Filter size={14} strokeWidth={2.5} />
            Clear filters
          </button>

          <div style={{ flex: 1 }} />

          <button
            onClick={() => window.print()}
            style={ghostBtn}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#EEF1F4"; e.currentTarget.style.color = INK; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = DARK; }}
          >
            <Printer size={14} strokeWidth={2.5} />
            Print
          </button>

          <button
            onClick={() => setResourcesOpen(true)}
            style={ghostBtn}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#EEF1F4"; e.currentTarget.style.color = INK; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = DARK; }}
          >
            <FileText size={14} strokeWidth={2.5} />
            Resources
          </button>
        </div>

        {/* Count */}
        <div style={{ color: DARK, margin: "14px 0", fontSize: 13, fontWeight: 600 }}>
          {loading
            ? "Loading..."
            : `${filtered.length} form${filtered.length === 1 ? "" : "s"} found`}
        </div>

        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FCA5A5",
            borderRadius: 8, padding: "10px 12px", marginBottom: 14,
            color: "#991B1B", fontSize: 13, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        {/* Form cards */}
        {!loading && filtered.length === 0 && !error && (
          <div style={{
            background: CARD,
            border: "1px dashed " + LINE_STRONG,
            borderRadius: 12,
            padding: "40px 20px",
            textAlign: "center",
            color: DARK,
            fontWeight: 600,
          }}>
            {forms.length === 0
              ? "No archived forms yet. Archive a PD7A from the Payroll taxes page."
              : "No forms match your filters."}
          </div>
        )}

        {filtered.map((f) => (
          <FormCard
            key={f.id}
            form={f}
            onView={() => navigate(`/payroll/taxes/archived/${f.id}`)}
          />
        ))}
      </div>

      <ResourcesDrawer
        open={resourcesOpen}
        onClose={() => setResourcesOpen(false)}
        onNavigate={(path) => navigate(path)}
        country="CA"
      />
    </div>
  );
}

const ghostBtn = {
  background: "transparent",
  border: "none",
  color: DARK,
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "inherit",
  fontWeight: 700,
};

function FormCard({ form, onView }) {
  const desc = FORM_DESCRIPTIONS[form.form_type] || "";
  const periodLine = `${formatDMY(form.period_start)} to ${formatDMY(form.period_end)}${form.period_label ? ` (${form.period_label})` : ""}`;

  return (
    <div
      onClick={onView}
      style={{
        background: CARD,
        border: "1px solid " + LINE,
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 18,
        marginBottom: 12,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = TEAL;
        e.currentTarget.style.background = "#FAFBFC";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = LINE;
        e.currentTarget.style.background = CARD;
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <span style={{ color: DARK, marginTop: 2 }}>
          <ChevronRight size={14} strokeWidth={2.5} />
        </span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: INK }}>
            {form.form_type}
          </div>
          <div style={{ color: DARK, fontSize: 13, marginTop: 2, fontWeight: 600 }}>
            {desc}
          </div>
          <div style={{ color: DARK, fontSize: 13, marginTop: 2, fontWeight: 600 }}>
            {periodLine}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{
          fontWeight: 700, fontSize: 14, color: INK, whiteSpace: "nowrap",
        }}>
          Archived {formatDMY(form.archived_at)}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          style={{
            padding: "10px 18px",
            background: "white",
            border: "1px solid " + LINE_STRONG,
            color: INK,
            fontWeight: 700,
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 14,
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
          onMouseLeave={(e) => e.currentTarget.style.background = "white"}
        >
          View
        </button>
      </div>
    </div>
  );
}