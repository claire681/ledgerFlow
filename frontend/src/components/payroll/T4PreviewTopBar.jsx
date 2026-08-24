import React from "react";
import { ArrowLeft, FileDown, Calendar, ChevronDown, ChevronRight } from "lucide-react";

/**
 * T4PreviewTopBar
 * ---------------
 * Shared top bar for all T4 preview pages (Summary, Employer slips, Employee slips).
 * Renders a breadcrumb, a title with subtitle, a year selector, and a primary Download button.
 * Hidden when printing via the .t4-noprint class.
 *
 * Props:
 * - title: string  e.g. "T4 employer slips"
 * - subtitle: string  e.g. "Employer copy · file with XML · 8 employees"
 * - year: number  current year value
 * - onYearChange: (newYear: number) => void  optional; if omitted year is a static label
 * - onDownload: () => void  called when the primary button is clicked
 * - downloadLabel: string  defaults to "Download PDF"
 * - downloadDisabled: boolean
 * - loading: boolean  shows a loading label instead of the subtitle when true
 * - error: boolean  shows an error label instead of the subtitle when true
 */
export default function T4PreviewTopBar({
  title,
  subtitle,
  year,
  onYearChange,
  onDownload,
  downloadLabel = "Download PDF",
  downloadDisabled = false,
  loading = false,
  error = false,
}) {
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= currentYear - 5; y--) yearOptions.push(y);

  const displaySub = loading ? "Loading..." : error ? "Error loading data" : subtitle;

  return (
    <div className="t4-noprint" style={{
      background: "#fff",
      borderBottom: "1px solid #D5DBE3",
      position: "sticky",
      top: 0,
      zIndex: 5,
      width: "100vw",
      marginLeft: "calc(50% - 50vw)",
      marginRight: "calc(50% - 50vw)",
      boxSizing: "border-box",
    }}>
      {/* Breadcrumb */}
      <div style={{
        padding: "10px 20px 0",
        fontSize: 12,
        color: "#1B2533",
        fontWeight: 500,
        fontFamily: "Inter, system-ui, sans-serif",
      }}>
        <a
          href="/payroll/taxes"
          style={{ color: "#1B2533", textDecoration: "none" }}
        >
          Payroll taxes
        </a>
        <ChevronRight size={12} style={{ margin: "0 4px", verticalAlign: "middle", color: "#66748B" }} />
        <a
          href="/payroll/taxes/filings"
          style={{ color: "#1B2533", textDecoration: "none" }}
        >
          Filings
        </a>
        <ChevronRight size={12} style={{ margin: "0 4px", verticalAlign: "middle", color: "#66748B" }} />
        <span style={{ fontWeight: 700, color: "#12262B" }}>{title}</span>
      </div>

      {/* Main row */}
      <div style={{
        padding: "12px 20px 16px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: "Inter, system-ui, sans-serif",
      }}>
        <button
          onClick={() => window.location.href = "/payroll/taxes/filings"}
          style={{
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: 13,
            border: "1.5px solid #12262B",
            borderRadius: 8,
            padding: "8px 14px",
            cursor: "pointer",
            background: "#fff",
            color: "#12262B",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "0.12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#15A08C"; e.currentTarget.style.color = "#0E8A78"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#12262B"; e.currentTarget.style.color = "#12262B"; }}
        >
          <ArrowLeft size={15} strokeWidth={2.5} /> Back
        </button>

        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <h2 style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: "#12262B",
            letterSpacing: "-0.01em",
            fontFamily: "inherit",
          }}>
            {title}
          </h2>
          <div style={{
            fontSize: 12,
            color: "#66748B",
            marginTop: 2,
            fontFamily: "inherit",
          }}>
            {displaySub}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {onYearChange ? (
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid #D5DBE3",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "#12262B",
              background: "#fff",
              fontFamily: "inherit",
              pointerEvents: "none",
            }}>
              <Calendar size={14} strokeWidth={2} />
              <span>{year}</span>
              <ChevronDown size={14} strokeWidth={2.5} style={{ marginLeft: 2 }} />
            </div>
            <select
              value={year}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        ) : (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            border: "1px solid #D5DBE3",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "#12262B",
            background: "#fff",
          }}>
            <Calendar size={14} strokeWidth={2} />
            {year}
          </div>
        )}

        <button
          onClick={onDownload}
          disabled={downloadDisabled}
          style={{
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: 13,
            border: "none",
            borderRadius: 8,
            padding: "9px 18px",
            cursor: downloadDisabled ? "not-allowed" : "pointer",
            background: downloadDisabled ? "#6E7883" : "#12262B",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        >
          <FileDown size={16} strokeWidth={2.2} /> {downloadLabel}
        </button>
      </div>
    </div>
  );
}