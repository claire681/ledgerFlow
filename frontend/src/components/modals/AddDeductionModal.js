import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, ArrowLeft } from "lucide-react";
import EditModal from "./EditModal";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const C = {
  ink: "#0E1A1A",
  muted: "#12262B",
  line: "#E7EAF0",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  page: "#F8F9FA",
};

const CATEGORIES = [
  { key: "retirement", title: "Retirement plans", subtitle: "RRSP, pension, or other registered retirement savings. Pre-tax by default. Employer match optional.", defaultPlan: "Group RRSP", empUnit: "%", erUnit: "%", isPreTax: true },
  { key: "health", title: "Health insurance", subtitle: "Extended health, dental, or vision premium. Employee-paid, employer-paid, or split.", defaultPlan: "Extended health premium", empUnit: "$", erUnit: "$", isPreTax: false },
  { key: "other", title: "Other deductions", subtitle: "Garnishments, union dues, uniform costs, loan repayments, or any custom deduction.", defaultPlan: "Custom deduction", empUnit: "$", erUnit: "$", isPreTax: false },
];

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

export default function AddDeductionModal(props) {
  const queryClient = useQueryClient();
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const employee = props.employee || {};

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(null);
  const [name, setName] = useState("");
  const [empAmount, setEmpAmount] = useState("");
  const [empUnit, setEmpUnit] = useState("$");
  const [erAmount, setErAmount] = useState("");
  const [erUnit, setErUnit] = useState("$");
  const [preTax, setPreTax] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(function() {
    if (isOpen) {
      setStep(1); setCategory(null);
      setName(""); setEmpAmount(""); setErAmount("");
      setEmpUnit("$"); setErUnit("$");
      setPreTax(false);
      setSaving(false); setSaveError(null);
    }
  }, [isOpen]);

  function pickCategory(cat) {
    setCategory(cat);
    setName(cat.defaultPlan);
    setEmpUnit(cat.empUnit);
    setErUnit(cat.erUnit);
    setPreTax(cat.isPreTax);
  }

  const canContinue = !!category;
  const canSave = !!name && !!empAmount && !!category;

  async function handleSave() {
    if (!employee.id || !category) return;
    setSaving(true); setSaveError(null);
    try {
      // Step 1: Create the deduction type in the catalog
      const empUnitPct = empUnit === "%";
      const dtBody = {
        name: name,
        calc_method: empUnitPct ? "percent_gross" : "fixed",
        default_amount: empAmount === "" ? null : Number(empAmount),
        unit_label: empUnitPct ? "% of gross" : null,
        is_pre_tax: preTax,
        is_default: false,
        country: "CA",
      };
      const dtRes = await fetch(API + "/api/v1/deduction-types", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
        body: JSON.stringify(dtBody),
      });
      if (!dtRes.ok) {
        const txt = await dtRes.text();
        throw new Error("Could not create deduction type: " + (txt || dtRes.status));
      }
      const newDeductionType = await dtRes.json();

      // Step 2: Assign it to the employee
      var body = {
        employee_id: employee.id,
        deduction_type_id: newDeductionType.id,
        amount_override: empAmount === "" ? null : Number(empAmount),
        unit_label_override: empUnitPct ? "%" : null,
        notes: null,
      };
      const r = await fetch(API + "/api/v1/employee-deduction-items", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error("Add failed: " + (txt || r.status));
      }
      setSaving(false);
      queryClient.invalidateQueries({ queryKey: ["deduction-items"] });
      onSaved && onSaved();
    } catch (e) {
      setSaving(false); setSaveError(e.message || "Add failed");
    }
  }

  function handleSaveOrContinue() {
    if (step === 1) {
      if (canContinue) setStep(2);
    } else {
      handleSave();
    }
  }

  const employeeName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "this employee";
  const positionRaw = employee.position_title || "";
  const subtitle = positionRaw ? (employeeName + " \u00b7 " + positionRaw) : employeeName;
  const firstName = employee.first_name || "employee";

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSaveOrContinue}
      title="Add deduction or contribution"
      subtitle={subtitle}
      iconLetter={"\u2212"}
      saving={saving}
      saveError={saveError}
      saveDisabled={step === 1 ? !canContinue : !canSave || saving}
      hasUnsavedChanges={step === 2 && canSave}
      saveLabel={step === 1 ? "Continue" : ("Add to " + firstName)}
      secondaryAction={
        step === 2 ? (
          <a
            onClick={function() { setStep(1); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.brandDark, textDecoration: "underline", fontWeight: 700, cursor: "pointer" }}
          >
            <ArrowLeft size={15} /> Back
          </a>
        ) : (
          <a
            href="mailto:support@getnovala.com?subject=Feedback%20on%20add%20deduction"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.brandDark, textDecoration: "underline", fontWeight: 700 }}
          >
            <MessageSquare size={15} /> Give feedback
          </a>
        )
      }
    >
      {step === 1 && (
        <StepOne category={category} onPick={pickCategory} onContinueStep={function() { if (canContinue) setStep(2); }} />
      )}
      {step === 2 && category && (
        <StepTwo
          category={category}
          name={name} setName={setName}
          empAmount={empAmount} setEmpAmount={setEmpAmount}
          empUnit={empUnit} setEmpUnit={setEmpUnit}
          erAmount={erAmount} setErAmount={setErAmount}
          erUnit={erUnit} setErUnit={setErUnit}
          preTax={preTax} setPreTax={setPreTax}
        />
      )}
    </EditModal>
  );
}

function StepOne(props) {
  return (
    <>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
        What type of item are you adding?
      </div>
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 20, lineHeight: 1.5 }}>
        Statutory deductions (CPP, EI, income tax) are calculated automatically. Use this to add voluntary items only.
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {CATEGORIES.map(function(c) {
          const on = props.category && props.category.key === c.key;
          return (
            <div
              key={c.key}
              onClick={function() { props.onPick(c); }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "14px 16px",
                border: on ? "2px solid " + C.brand : "1px solid " + C.line,
                borderRadius: 10,
                background: on ? C.brandBg : "#FFFFFF",
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 700 }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, marginTop: 2, lineHeight: 1.4 }}>{c.subtitle}</div>
              </div>
              {on && (
                <div style={{ width: 20, height: 20, borderRadius: 10, background: C.brand, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function StepTwo(props) {
  const c = props.category;
  return (
    <>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 20 }}>{c.title} details</div>

      <FormLabel>Item name</FormLabel>
      <div style={inputBox}>
        <input
          type="text"
          value={props.name}
          onChange={function(e) { props.setName(e.target.value); }}
          placeholder={c.defaultPlan}
          style={inputStyle}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
        <div>
          <FormLabel>Employee contributes</FormLabel>
          <AmountPair value={props.empAmount} setValue={props.setEmpAmount} unit={props.empUnit} setUnit={props.setEmpUnit} />
        </div>
        <div>
          <FormLabel>Employer contributes (optional)</FormLabel>
          <AmountPair value={props.erAmount} setValue={props.setErAmount} unit={props.erUnit} setUnit={props.setErUnit} />
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <div
          onClick={function() { props.setPreTax(!props.preTax); }}
          style={{
            width: 20, height: 20, borderRadius: 5,
            background: props.preTax ? C.brand : "#FFFFFF",
            border: props.preTax ? "0" : "1.5px solid " + C.line,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {props.preTax && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>}
        </div>
        <div>
          <div style={{ fontSize: 13, color: C.ink, fontWeight: 700 }}>Pre-tax deduction</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Reduces federal and provincial taxable income (typical for RRSP, some benefit plans).</div>
        </div>
      </div>

      {c.key === "retirement" && (
        <div style={{ marginTop: 16, padding: "12px 14px", background: C.brandBg, borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.brandDark} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
          </svg>
          <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 500, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700 }}>Employer match note:</span> The employer contribution is a taxable benefit reported on the T4.
          </span>
        </div>
      )}

      {c.key === "other" && (
        <div style={{ marginTop: 16, padding: "12px 14px", background: C.page, border: "1px solid " + C.line, borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
          </svg>
          <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>
            Court-ordered garnishments and union dues are typically post-tax. Uniform costs and loan repayments are usually post-tax as well.
          </span>
        </div>
      )}
    </>
  );
}

function AmountPair(props) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", height: 44, padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF" }}>
        {props.unit === "$" && <span style={{ color: C.muted, marginRight: 8, fontWeight: 600 }}>$</span>}
        <input
          type="text"
          value={props.value}
          onChange={function(e) { props.setValue(e.target.value); }}
          style={{ border: 0, outline: "none", fontSize: 14, color: C.ink, flex: 1, fontFamily: FONT, fontVariantNumeric: "tabular-nums", fontWeight: 500, background: "transparent" }}
        />
        {props.unit === "%" && <span style={{ color: C.muted, marginLeft: 6, fontWeight: 600 }}>%</span>}
      </div>
      <select
        value={props.unit}
        onChange={function(e) { props.setUnit(e.target.value); }}
        style={{ height: 44, padding: "0 12px", border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF", fontSize: 13.5, color: C.ink, fontWeight: 500, cursor: "pointer", fontFamily: FONT }}
      >
        <option value="$">$ per pay</option>
        <option value="%">% of gross</option>
      </select>
    </div>
  );
}

function FormLabel(props) {
  return <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#12262B", marginBottom: 7 }}>{props.children}</label>;
}

const inputBox = { display: "flex", alignItems: "center", height: 44, padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF" };
const inputStyle = { border: 0, outline: "none", fontSize: 14, color: C.ink, flex: 1, fontFamily: FONT, fontWeight: 500, background: "transparent" };