import React, { useEffect, useMemo, useState } from "react";
import { HelpCircle, X, MessageSquare, ExternalLink, Check } from "lucide-react";
import EditModal, { CollapsibleSection } from "./EditModal";
import { getFederalBPA, getProvincialBPA } from "../../utils/basicPersonalAmounts";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const C = {
  ink: "#0E1A1A",
  muted: "#12262B",
  line: "#E7EAF0",
  page: "#F8F9FA",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
};

const TD1_FEDERAL_URL = "https://www.canada.ca/en/revenue-agency/services/forms-publications/td1-personal-tax-credits-returns/td1-forms-pay-received-on-january-1-later.html";
const TD1_PROVINCIAL_URL = "https://www.canada.ca/en/revenue-agency/services/forms-publications/td1-personal-tax-credits-returns.html";

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

// Convert "Yes"/"No"/boolean/null to boolean
function toBool(v) {
  if (v === true || v === "Yes" || v === "yes" || v === 1 || v === "1") return true;
  return false;
}
// Convert boolean back to "Yes"/"No" for backend
function toYN(b) { return b ? "Yes" : "No"; }

// Format money for input display (allow raw digits, no formatting during typing)
function fmtMoney(v) {
  if (v === null || v === undefined || v === "") return "";
  return String(v);
}

export default function TaxWithholdingsModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const employee = props.employee || {};
  const taxInfo = employee.tax_info || {};

  const currentYear = new Date().getFullYear();
  const province = (taxInfo.provinceEmp || "").toUpperCase();
  const fedBPA = getFederalBPA(currentYear);
  const provBPA = getProvincialBPA(province, currentYear);

  const initial = useMemo(function() {
    return {
      federalTD1: taxInfo.federalTD1 != null && taxInfo.federalTD1 !== ""
        ? String(taxInfo.federalTD1)
        : String(fedBPA || ""),
      additionalTax: taxInfo.additionalTax != null && taxInfo.additionalTax !== ""
        ? String(taxInfo.additionalTax)
        : "",
      provincialTD1: taxInfo.provincialTD1 != null && taxInfo.provincialTD1 !== ""
        ? String(taxInfo.provincialTD1)
        : (provBPA != null ? String(provBPA) : ""),
      cppExempt: toBool(taxInfo.cppExempt),
      eiExempt: toBool(taxInfo.eiExempt),
      fedTaxExempt: toBool(taxInfo.fedTaxExempt),
    };
  }, [employee.id, isOpen, taxInfo.federalTD1, taxInfo.additionalTax, taxInfo.provincialTD1, taxInfo.cppExempt, taxInfo.eiExempt, taxInfo.fedTaxExempt, fedBPA, provBPA]);

  const [federalTD1, setFederalTD1] = useState(initial.federalTD1);
  const [additionalTax, setAdditionalTax] = useState(initial.additionalTax);
  const [provincialTD1, setProvincialTD1] = useState(initial.provincialTD1);
  const [cppExempt, setCppExempt] = useState(initial.cppExempt);
  const [eiExempt, setEiExempt] = useState(initial.eiExempt);
  const [fedTaxExempt, setFedTaxExempt] = useState(initial.fedTaxExempt);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(function() {
    if (isOpen) {
      setFederalTD1(initial.federalTD1);
      setAdditionalTax(initial.additionalTax);
      setProvincialTD1(initial.provincialTD1);
      setCppExempt(initial.cppExempt);
      setEiExempt(initial.eiExempt);
      setFedTaxExempt(initial.fedTaxExempt);
      setSaving(false);
      setSaveError(null);
    }
  }, [isOpen, initial]);

  const hasUnsavedChanges = (
    federalTD1 !== initial.federalTD1 ||
    additionalTax !== initial.additionalTax ||
    provincialTD1 !== initial.provincialTD1 ||
    cppExempt !== initial.cppExempt ||
    eiExempt !== initial.eiExempt ||
    fedTaxExempt !== initial.fedTaxExempt
  );

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const newTaxInfo = Object.assign({}, taxInfo, {
      federalTD1: federalTD1 ? Number(federalTD1) : null,
      additionalTax: additionalTax ? Number(additionalTax) : null,
      provincialTD1: provincialTD1 ? Number(provincialTD1) : null,
      cppExempt: toYN(cppExempt),
      eiExempt: toYN(eiExempt),
      fedTaxExempt: toYN(fedTaxExempt),
    });
    try {
      const r = await fetch(API + "/api/v1/payroll/employees/" + employee.id, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ tax_info: newTaxInfo }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error("Save failed: " + (txt || r.status));
      }
      setSaving(false);
      onSaved && onSaved();
    } catch (e) {
      setSaving(false);
      setSaveError(e.message || "Save failed");
    }
  }

  const employeeName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "Employee";
  const positionRaw = employee.position_title || employee.role || "";
  const subtitle = positionRaw ? (employeeName + " \u00b7 " + positionRaw) : employeeName;
  const firstName = employee.first_name || "this employee";

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="Edit tax withholdings"
      subtitle={subtitle}
      iconLetter="%"
      saving={saving}
      saveError={saveError}
      saveDisabled={!hasUnsavedChanges}
      hasUnsavedChanges={hasUnsavedChanges}
      saveLabel="Save tax setup"
      secondaryAction={
        <a
          href="mailto:support@getnovala.com?subject=Feedback%20on%20Tax%20withholdings"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.brandDark, textDecoration: "underline", fontWeight: 700 }}
        >
          <MessageSquare size={15} /> Give feedback
        </a>
      }
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 20 }}>
        What are {firstName}'s withholdings?
      </div>

      <CollapsibleSection title="Federal withholding" defaultOpen={true}>
        <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55, marginBottom: 14, fontWeight: 500 }}>
          The TD1 Personal Tax Credits Return determines how much federal tax is withheld. The {currentYear} federal basic personal amount is prefilled.{" "}
          <a
            href={TD1_FEDERAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: C.brandDark, textDecoration: "underline", fontWeight: 700 }}
          >
            Need a blank TD1 form?
          </a>
        </div>

        <FormLabel>Federal TD1 amount</FormLabel>
        <MoneyInput value={federalTD1} onChange={setFederalTD1} />

        <div style={{ height: 14 }} />

        <FormLabel>Additional federal tax withheld per pay</FormLabel>
        <MoneyInput value={additionalTax} onChange={setAdditionalTax} placeholder="0.00" />
      </CollapsibleSection>

      <CollapsibleSection
        title={province ? "Provincial withholding (" + province + ")" : "Provincial withholding"}
        defaultOpen={true}
      >
        {!province && (
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55, marginBottom: 12, fontWeight: 500 }}>
            Set a province of employment on the Employment details section to enable provincial withholding.
          </div>
        )}
        {province && (
          <>
            <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55, marginBottom: 14, fontWeight: 500 }}>
              The {currentYear} {province} basic personal amount is prefilled from the TD1{province} form.{" "}
              <a
                href={TD1_PROVINCIAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: C.brandDark, textDecoration: "underline", fontWeight: 700 }}
              >
                Need a blank provincial TD1 form?
              </a>
            </div>
            <FormLabel>Provincial TD1 amount</FormLabel>
            <MoneyInput value={provincialTD1} onChange={setProvincialTD1} />
          </>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Tax exemptions" subtitle="Optional" defaultOpen={true}>
        <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55, marginBottom: 8, fontWeight: 500 }}>
          Only check these if {firstName} is exempt from the corresponding contribution or tax. Most employees are not exempt.
        </div>
        <CheckboxRow
          checked={cppExempt}
          onToggle={function() { setCppExempt(!cppExempt); }}
          title="Exempt from CPP"
          subtitle="Canada Pension Plan contributions will not be deducted."
        />
        <CheckboxRow
          checked={eiExempt}
          onToggle={function() { setEiExempt(!eiExempt); }}
          title="Exempt from EI"
          subtitle="Employment Insurance premiums will not be deducted."
        />
        <CheckboxRow
          checked={fedTaxExempt}
          onToggle={function() { setFedTaxExempt(!fedTaxExempt); }}
          title="Exempt from federal income tax"
          subtitle="No federal income tax will be withheld."
        />
      </CollapsibleSection>
    </EditModal>
  );
}

// -- Sub-components --

function FormLabel(props) {
  return (
    <label style={{
      display: "block", fontSize: 13, fontWeight: 700,
      color: "#12262B", marginBottom: 7,
    }}>
      {props.children}
    </label>
  );
}

function MoneyInput(props) {
  return (
    <div style={{
      display: "flex", alignItems: "center", height: 44,
      padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF",
    }}>
      <span style={{ color: C.muted, marginRight: 8, fontWeight: 600 }}>$</span>
      <input
        type="text"
        value={props.value}
        placeholder={props.placeholder || ""}
        onChange={function(e) { props.onChange(e.target.value); }}
        style={{
          border: 0, outline: "none", fontSize: 14, color: C.ink,
          flex: 1, fontFamily: FONT, fontVariantNumeric: "tabular-nums", fontWeight: 500,
          background: "transparent",
        }}
      />
    </div>
  );
}

function CheckboxRow(props) {
  const checked = props.checked;
  return (
    <div
      onClick={props.onToggle}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "12px 0", borderTop: "1px solid " + C.line,
        cursor: "pointer", userSelect: "none",
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 5,
        border: checked ? "0" : "1.5px solid " + C.line,
        background: checked ? C.brand : "#FFFFFF",
        flexShrink: 0, marginTop: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {checked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{props.title}</div>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 2, lineHeight: 1.5 }}>
          {props.subtitle}
        </div>
      </div>
    </div>
  );
}