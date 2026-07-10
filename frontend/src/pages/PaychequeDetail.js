import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  HelpCircle, X, ChevronDown, BookOpen, Printer,
  RotateCcw, Trash2, Edit, AlertTriangle,
} from "lucide-react";

import {
  formatCurrency, formatDate, formatPeriodLong, employeeNameFromPaycheque,
} from "../utils/paychequeStatus";
import PayStub from "../components/payroll/PayStub";
import CreateAdjustmentModal from "../components/payroll/CreateAdjustmentModal";
import AdjustmentGuardModal from "../components/payroll/AdjustmentGuardModal";
import VoidPaychequeModal from "../components/payroll/VoidPaychequeModal";
import DeletePaychequeModal from "../components/payroll/DeletePaychequeModal";
import DeleteGuardModal from "../components/payroll/DeleteGuardModal";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const BRAND = "#0F9599";
const BRAND_DARK = "#0F6E56";
const BRAND_SOFT = "#E1F5EE";
const BRAND_SOFT_BORDER = "#B8E2D2";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const TEXT_TERTIARY = "#9CA3AF";
const BG_CARD = "#FFFFFF";
const BG_PAGE = "#F9FAFB";
const BORDER = "#E5E7EB";
const WARNING = "#B45309";

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  Authorization: "Bearer " + getToken(),
  "Content-Type": "application/json",
});

function Section({ title, expanded, onToggle, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", borderBottom: "0.5px solid " + BORDER, cursor: "pointer" }}>
        <ChevronDown size={14} style={{ color: TEXT_SECONDARY, transform: expanded ? "none" : "rotate(-90deg)", transition: "transform 0.15s" }} />
        <h3 style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>{title}</h3>
      </div>
      {expanded && children}
    </div>
  );
}

function PayTable({ lines = [], total }) {
  return (
    <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderTop: "none", borderRadius: "0 0 6px 6px", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 70px 80px 80px", alignItems: "center", padding: "8px 14px", background: BG_PAGE, borderBottom: "0.5px solid " + BORDER, fontSize: 10, fontWeight: 500, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4 }}>
        <div>Type</div>
        <div style={{ textAlign: "right" }}>Hours</div>
        <div style={{ textAlign: "right" }}>Rate</div>
        <div style={{ textAlign: "right" }}>Current</div>
        <div style={{ textAlign: "right" }}>YTD</div>
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 56px 70px 80px 80px", alignItems: "center", padding: "9px 14px", fontSize: 12, color: TEXT_PRIMARY, borderBottom: "0.5px solid #F3F4F6" }}>
          <div>{l.type}</div>
          <div style={{ textAlign: "right" }}>{l.hours != null ? Number(l.hours).toFixed(2) : ""}</div>
          <div style={{ textAlign: "right" }}>{l.rate != null ? formatCurrency(l.rate) : ""}</div>
          <div style={{ textAlign: "right" }}>{formatCurrency(l.current)}</div>
          <div style={{ textAlign: "right" }}>{formatCurrency(l.ytd)}</div>
        </div>
      ))}
      {total && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 70px 80px 80px", alignItems: "center", padding: "9px 14px", fontSize: 12, color: TEXT_PRIMARY, background: BG_PAGE, fontWeight: 500 }}>
          <div>Total</div><div></div><div></div>
          <div style={{ textAlign: "right" }}>{formatCurrency(total.current)}</div>
          <div style={{ textAlign: "right" }}>{formatCurrency(total.ytd)}</div>
        </div>
      )}
    </div>
  );
}

function TaxTable({ lines = [], total }) {
  return (
    <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderTop: "none", borderRadius: "0 0 6px 6px", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px", alignItems: "center", padding: "8px 14px", background: BG_PAGE, borderBottom: "0.5px solid " + BORDER, fontSize: 10, fontWeight: 500, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4 }}>
        <div>Type</div>
        <div style={{ textAlign: "right" }}>Current</div>
        <div style={{ textAlign: "right" }}>YTD</div>
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px", alignItems: "center", padding: "9px 14px", fontSize: 12, color: TEXT_PRIMARY, borderBottom: "0.5px solid #F3F4F6" }}>
          <div>{l.type}</div>
          <div style={{ textAlign: "right" }}>{formatCurrency(l.current)}</div>
          <div style={{ textAlign: "right" }}>{formatCurrency(l.ytd)}</div>
        </div>
      ))}
      {total && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px", alignItems: "center", padding: "9px 14px", fontSize: 12, color: TEXT_PRIMARY, background: BG_PAGE, fontWeight: 500 }}>
          <div>Total</div>
          <div style={{ textAlign: "right" }}>{formatCurrency(total.current)}</div>
          <div style={{ textAlign: "right" }}>{formatCurrency(total.ytd)}</div>
        </div>
      )}
    </div>
  );
}

export default function PaychequeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [pc, setPc] = useState(null);
    const [adjustOpenModal, setAdjustOpenModal] = useState(false);
    const [guardOpenModal, setGuardOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memo, setMemo] = useState("");
  const [expanded, setExpanded] = useState({ pay: true, employee_taxes: true, employer_taxes: true, deductions: true });
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const adjustRef = useRef(null);

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!adjustOpen) return;
    const onClick = (e) => {
      if (adjustRef.current && !adjustRef.current.contains(e.target)) setAdjustOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [adjustOpen]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL + "/api/v1/payroll/paycheques/" + id, { headers: authHeaders() });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid or expired token. Please log in again.");
        if (res.status === 404) throw new Error("Paycheque not found.");
        throw new Error("Could not load paycheque");
      }
      const data = await res.json();
      setPc(data);
      setMemo(data.memo || "");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveMemo = async () => {
    if (!pc) return;
    if (memo === (pc.memo || "")) return;
    try {
      await fetch(API_URL + "/api/v1/payroll/paycheques/" + pc.id, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ memo }),
      });
      setPc({ ...pc, memo });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleVoid = async (reason) => {
    const res = await fetch(API_URL + "/api/v1/payroll/paycheques/" + pc.id + "/void", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Could not void paycheque");
    }
    setPc({ ...pc, status: "voided" });
  };

  const handleDelete = async () => {
    const res = await fetch(API_URL + "/api/v1/payroll/paycheques/" + pc.id, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Could not delete paycheque");
    }
    navigate("/payroll/paycheques");
  };

  const close = () => navigate("/payroll/paycheques");

  const totalDeductions = useMemo(() => {
    if (!pc || !pc.deductions_contributions || !pc.deductions_contributions.total) return 0;
    return parseFloat(pc.deductions_contributions.total.current || 0) || 0;
  }, [pc]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: TEXT_SECONDARY, fontFamily: "inherit" }}>Loading...</div>;
  }
  if (error || !pc) {
    return (
      <div style={{ padding: 40, fontFamily: "inherit", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "#991B1B", marginBottom: 12 }}>{error || "Paycheque not available."}</div>
        <button onClick={close} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 5, background: BRAND, color: "white", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Back to list</button>
      </div>
    );
  }

  const name = employeeNameFromPaycheque(pc);
  const grossLabel = formatCurrency(pc.total_pay || pc.gross_pay || (pc.pay && pc.pay.total && pc.pay.total.current), pc.currency);
  const netLabel = formatCurrency(pc.net_pay, pc.currency);
  const empTaxTotal = pc.employee_taxes && pc.employee_taxes.total ? parseFloat(pc.employee_taxes.total.current || 0) : 0;

  return (
    <div className="paycheque-print-area" style={{ background: BG_CARD, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
      <style>{`
        @page {
          margin: 12mm 10mm;
        }
        @media print {
          /* Hide everything, then show only the pay stub */
          body * { visibility: hidden; }
          .pay-stub-print-only, .pay-stub-print-only * { visibility: visible; }
          .pay-stub-print-only {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .pay-stub-print-only * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
        }
        /* On screen, hide the pay stub - it's only for print */
        @media screen {
          .pay-stub-print-only { display: none; }
        }
      `}</style>

      <div className="pay-stub-print-only">
        <PayStub data={pc} />
      </div>

      <div className="no-print" style={{ padding: "12px 20px", borderBottom: "0.5px solid #F3F4F6", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        <div ref={adjustRef} style={{ position: "relative" }}>
          <button onClick={() => setAdjustOpen(!adjustOpen)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 5, background: "white", border: "0.5px solid " + BORDER, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, color: TEXT_PRIMARY, fontWeight: 500, fontFamily: "inherit" }}>
            Make adjustment <ChevronDown size={11} />
          </button>
          {adjustOpen && (
            <div style={{ position: "absolute", right: 0, top: 36, background: "white", border: "0.5px solid " + BORDER, borderRadius: 8, padding: 4, width: 180, zIndex: 50, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <div onClick={() => { setAdjustOpen(false); if (pc && pc.is_adjustment) { setGuardOpenModal(true); } else { setAdjustOpenModal(true); } }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, color: TEXT_PRIMARY }}>
                <Edit size={13} style={{ color: TEXT_SECONDARY }} />Edit
              </div>
              <div onClick={() => { setAdjustOpen(false); setVoidOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, color: WARNING }}>
                <RotateCcw size={13} />Void
              </div>
              <div onClick={() => { setAdjustOpen(false); setDeleteOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, color: "#DC2626" }}>
                <Trash2 size={13} />Delete
              </div>
            </div>
          )}
        </div>
        <HelpCircle size={18} style={{ color: TEXT_SECONDARY, cursor: "pointer" }} onClick={() => alert("Help coming soon")} />
        <X size={18} style={{ color: TEXT_SECONDARY, cursor: "pointer" }} onClick={close} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 16px", maxWidth: 880, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {pc && pc.is_adjustment && (
            <div className="no-print" style={{
              background: "#FEF3C7", border: "1px solid #FDE68A",
              borderRadius: 8, padding: "12px 14px", marginBottom: 18,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "#FDE68A", color: "#92400E",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 2,
              }}>
                <AlertTriangle size={16} strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 11, color: "#92400E",
                  letterSpacing: "0.5px", textTransform: "uppercase",
                  fontWeight: 700, marginBottom: 3,
                }}>Adjustment cheque</div>
                <div style={{ fontSize: 13, color: "#1A2332", fontWeight: 600, marginBottom: 4 }}>
                  This pay stub was created to correct a previous pay stub.
                </div>
                {pc.adjustment_reason && (
                  <div style={{ fontSize: 12.5, color: "#1A2332", fontWeight: 500 }}>
                    <span style={{ fontWeight: 700 }}>Reason:</span> {pc.adjustment_reason}
                  </div>
                )}
              </div>
            </div>
          )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, color: TEXT_SECONDARY, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Pay to</div>
            <div style={{ fontSize: 22, color: TEXT_PRIMARY, fontWeight: 500 }}>{name}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: BRAND_DARK, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Net pay</div>
            <div style={{ fontSize: 24, color: BRAND_DARK, fontWeight: 500 }}>{netLabel}</div>
          </div>
        </div>

        <div style={{ background: BG_PAGE, border: "0.5px solid " + BORDER, borderRadius: 8, padding: "12px 16px", marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            <div>
              <div style={{ fontSize: 10, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 500 }}>Employee address</div>
              <div style={{ fontSize: 12, color: TEXT_PRIMARY, marginTop: 3, lineHeight: 1.4, whiteSpace: "pre-line" }}>{pc.employee_address || pc.address || "-"}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 500 }}>Pay date</div>
              <div style={{ fontSize: 12, color: TEXT_PRIMARY, marginTop: 3 }}>{formatDate(pc.pay_date)}</div>
              <div style={{ fontSize: 10, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 500, marginTop: 8 }}>Pay period</div>
              <div style={{ fontSize: 12, color: TEXT_PRIMARY, marginTop: 3 }}>{formatPeriodLong(pc.pay_period_start || (pc.payPeriod && pc.payPeriod.start), pc.pay_period_end || (pc.payPeriod && pc.payPeriod.end))}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 500 }}>Paid from</div>
              <div style={{ fontSize: 12, color: TEXT_PRIMARY, marginTop: 3 }}>{pc.paid_from || "-"}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 500 }}>Paid by</div>
              <div style={{ fontSize: 12, color: TEXT_PRIMARY, marginTop: 3 }}>
                {pc.pay_method === "direct_deposit" ? "Direct deposit" : "Cheque"}
                {pc.net_pay && (" (" + formatCurrency(pc.net_pay, pc.currency) + ")")}
              </div>
            </div>
          </div>
        </div>

        <Section title="Pay" expanded={expanded.pay} onToggle={() => setExpanded({ ...expanded, pay: !expanded.pay })}>
          <PayTable lines={(pc.pay && pc.pay.lines) || []} total={pc.pay && pc.pay.total} />
        </Section>

        <Section title="Employee taxes" expanded={expanded.employee_taxes} onToggle={() => setExpanded({ ...expanded, employee_taxes: !expanded.employee_taxes })}>
          <TaxTable lines={(pc.employee_taxes && pc.employee_taxes.lines) || []} total={pc.employee_taxes && pc.employee_taxes.total} />
        </Section>

        <Section title="Employer taxes" expanded={expanded.employer_taxes} onToggle={() => setExpanded({ ...expanded, employer_taxes: !expanded.employer_taxes })}>
          <TaxTable lines={(pc.employer_taxes && pc.employer_taxes.lines) || []} total={pc.employer_taxes && pc.employer_taxes.total} />
        </Section>

        {pc.deductions_contributions && pc.deductions_contributions.lines && pc.deductions_contributions.lines.length > 0 && (
          <Section title="Deductions and contributions" expanded={expanded.deductions} onToggle={() => setExpanded({ ...expanded, deductions: !expanded.deductions })}>
            <TaxTable lines={pc.deductions_contributions.lines} total={pc.deductions_contributions.total} />
          </Section>
        )}

        <div style={{ background: "#F0FAFA", border: "0.5px solid " + BRAND_SOFT_BORDER, borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: BRAND_DARK, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>Net pay calculation</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", rowGap: 6, fontSize: 12 }}>
            <div style={{ color: TEXT_PRIMARY }}>Gross pay</div>
            <div style={{ textAlign: "right", color: TEXT_PRIMARY, fontWeight: 500 }}>{grossLabel}</div>
            <div style={{ color: TEXT_SECONDARY }}>Less: employee taxes</div>
            <div style={{ textAlign: "right", color: WARNING }}>({formatCurrency(empTaxTotal)})</div>
            <div style={{ color: TEXT_SECONDARY }}>Less: deductions</div>
            <div style={{ textAlign: "right", color: WARNING }}>({formatCurrency(totalDeductions)})</div>
            <div style={{ gridColumn: "1 / span 2", height: 1, background: BRAND_SOFT_BORDER, margin: "3px 0" }}></div>
            <div style={{ color: BRAND_DARK, fontWeight: 500 }}>Net pay</div>
            <div style={{ textAlign: "right", color: BRAND_DARK, fontWeight: 500 }}>{netLabel}</div>
          </div>
        </div>

        <div style={{ marginBottom: 4 }}>
          <label style={{ display: "block", fontSize: 10, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 500, marginBottom: 6 }}>Memo</label>
          <textarea
            rows={2}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={saveMemo}
            placeholder="Add a note for this paycheque (saved with the record)"
            style={{ width: "100%", padding: "8px 10px", fontSize: 12, borderRadius: 5, border: "0.5px solid " + BORDER, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", color: TEXT_PRIMARY }}
          />
        </div>
      </div>

      <div style={{ padding: "12px 24px", borderTop: "0.5px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: BG_CARD }}>
        <button onClick={close} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 5, background: "white", color: TEXT_PRIMARY, border: "0.5px solid " + BORDER, cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Close</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => alert("Transaction journal coming soon")} style={{ fontSize: 12, padding: "8px 14px", borderRadius: 5, background: "white", color: BRAND, border: "0.5px solid " + BRAND, cursor: "pointer", fontWeight: 500, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <BookOpen size={13} />Transaction journal
          </button>
          <button onClick={() => window.print()} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 5, background: BRAND, color: "white", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Printer size={13} />Print pay stub
          </button>
        </div>
      </div>

      <CreateAdjustmentModal
        open={adjustOpenModal}
        onClose={() => setAdjustOpenModal(false)}
        originalStub={pc}
        onCreated={() => { window.location.reload(); }}
      />
      <AdjustmentGuardModal
        open={guardOpenModal}
        onClose={() => setGuardOpenModal(false)}
        stub={pc}
        onVoid={() => setVoidOpen(true)}
      />
      <VoidPaychequeModal open={voidOpen} onClose={() => setVoidOpen(false)} paycheque={pc} onConfirm={handleVoid} />
      <DeleteGuardModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        stub={pc}
        onVoid={() => setVoidOpen(true)}
      />
    </div>
  );
}
