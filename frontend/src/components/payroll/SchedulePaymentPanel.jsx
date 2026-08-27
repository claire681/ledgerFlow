import React, { useState, useEffect, useMemo } from "react";
import {
  X, Info, ChevronRight, ChevronDown, Eye, Check, CheckCircle2, AlertCircle, AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../utils/apiFetch";
import DatePicker from "../DatePicker";
import HowToPayCRA from "./HowToPayCRA";

// Federal Taxes Pay & File drawer.
// Right-side sliding panel over dimmed backdrop.
// Views: schedule -> processing -> confirm -> Done triggers onPaid.

const T = {
  teal: "#15A08C", tealHover: "#0F8474", tealTint: "#E1F5EE", tealInk: "#0F6E56",
  slate: "#12262B", muted: "#12262B", card: "#FFFFFF",
  line: "#E7EAF0", lineStrong: "#D5DBE3", dark: "#0E1A1A",
  red: "#C5483B", redTint: "#FEF5F5", redBorder: "#F5C6CB", redInk: "#7C1621",
  amber: "#B45309", amberTint: "#FFF8E5", amberBorder: "#F0D775", amberInk: "#7A5B0F",
  infoTint: "#EAF2FB", info: "#2B6CB0",
};
const tnum = { fontVariantNumeric: "tabular-nums" };

const S = {
  btnPrimary: { font: "inherit", fontWeight: 600, fontSize: 13.5, border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", background: T.dark, color: "#fff", display: "inline-flex", alignItems: "center", gap: 8 },
  btnOutline: { font: "inherit", fontWeight: 600, fontSize: 13.5, borderRadius: 10, padding: "10px 18px", cursor: "pointer", background: T.card, color: T.slate, border: "1px solid " + T.lineStrong },
  field: { marginTop: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: T.slate, marginBottom: 6 },
  input: { width: "100%", border: "1px solid " + T.lineStrong, borderRadius: 10, padding: "11px 13px", font: "inherit", fontSize: 14, color: T.slate, background: T.card, boxSizing: "border-box" },
  kvCap: { fontSize: 11, fontWeight: 700, letterSpacing: ".4px", color: T.muted, textTransform: "uppercase", marginBottom: 3 },
  divider: { height: 1, background: T.line, margin: "20px 0" },
};

function Money({ v, size = 17, weight = 700, color = T.slate }) {
  return <span style={{ ...tnum, fontSize: size, fontWeight: weight, color }}>${v}</span>;
}

function Banner({ text }) {
  return (
    <div style={{ display: "flex", gap: 10, background: T.infoTint, borderRadius: 11, padding: "12px 14px", fontSize: 12.5, lineHeight: 1.45, color: "#274156", marginBottom: 12 }}>
      <Info size={17} color={T.info} style={{ flex: "0 0 auto", marginTop: 1 }} />
      <div>{text}</div>
    </div>
  );
}

function ConfRow({ capL, valL, capR, valR, mono }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
      <div>
        <div style={S.kvCap}>{capL}</div>
        <div style={{ ...(mono ? tnum : {}), fontSize: 12.5, fontWeight: 600 }}>{valL}</div>
      </div>
      {capR && (
        <div style={{ textAlign: "right" }}>
          <div style={S.kvCap}>{capR}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{valR}</div>
        </div>
      )}
    </div>
  );
}

// Parse a display amount like "2,847.61" or 2847.61 to a Number
function parseAmount(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  return parseFloat(String(v).replace(/,/g, "")) || 0;
}

// Format money for display
function fmtMoney(n) {
  const num = parseAmount(n);
  const abs = Math.abs(num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (num < 0 ? "-$" : "$") + abs;
}

// Today as ISO YYYY-MM-DD
function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// Format ISO date as dd/mm/yyyy for display
function fmtDate(iso) {
  if (!iso) return "";
  const parts = String(iso).slice(0, 10).split("-");
  if (parts.length !== 3) return iso;
  return parts[2] + "/" + parts[1] + "/" + parts[0];
}

export default function SchedulePaymentPanel({ open, onClose, obligation, onPaid }) {
  const qc = useQueryClient();

  const [view, setView] = useState("schedule");   // schedule | processing | confirm | error
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [chequeQueue, setChequeQueue] = useState(false);
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [chequeNo, setChequeNo] = useState("");
  const [notes, setNotes] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [saveError, setSaveError] = useState("");

  // -------- Fetch bank accounts --------
  const { data: bankAccounts = [], isLoading: banksLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const res = await apiFetch("/api/v1/bank-accounts");
      if (!res.ok) throw new Error("Failed to load bank accounts");
      return res.json();
    },
    refetchOnWindowFocus: false,
    enabled: !!open,
  });

  // Default the bank selection to the user's default account (or first one)
  useEffect(() => {
    if (!open || bankAccounts.length === 0) return;
    if (bankAccountId && bankAccounts.some(a => a.id === bankAccountId)) return;
    const def = bankAccounts.find(a => a.is_default) || bankAccounts[0];
    if (def) setBankAccountId(def.id);
  }, [open, bankAccounts, bankAccountId]);

  // Reset when a new obligation opens
  useEffect(() => {
    if (open) {
      setView("schedule");
      setShowBreakdown(false);
      setChequeQueue(false);
      setPaymentDate(todayISO());
      setChequeNo("");
      setNotes("");
      setSaveError("");
    }
  }, [open, obligation]);

  const selectedBank = useMemo(
    () => bankAccounts.find(a => a.id === bankAccountId) || null,
    [bankAccounts, bankAccountId]
  );

  const paymentAmount = parseAmount(obligation?.amount);

  const insufficientFunds = useMemo(() => {
    if (!selectedBank) return null;
    const bal = parseAmount(selectedBank.current_balance);
    const after = bal - paymentAmount;
    if (after >= 0) return null;
    return { overdrawBy: Math.abs(after) };
  }, [selectedBank, paymentAmount]);

  // -------- Save payment --------
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        bank_account_id: bankAccountId || null,
        source_type: obligation?.source_type || "pd7a",
        source_ref: obligation?.source_ref || null,
        source_name: obligation?.taxName || "Payment",
        amount: paymentAmount,
        payment_date: paymentDate,
        cheque_no: chequeNo || null,
        notes: notes || null,
        print_cheque_queue: chequeQueue,
      };
      const res = await apiFetch("/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to save payment");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      setView("confirm");
    },
    onError: (e) => {
      setSaveError(e.message || "Something went wrong");
      setView("error");
    },
  });

  function handleSave() {
    if (!bankAccounts.length) {
      setSaveError("You need to add a bank account first. Go to Payroll > Bank accounts.");
      setView("error");
      return;
    }
    if (!bankAccountId) {
      setSaveError("Please select a bank account.");
      return;
    }
    if (!paymentDate) {
      setSaveError("Please enter a payment date.");
      return;
    }
    setSaveError("");
    setView("processing");
    saveMutation.mutate();
  }

  function finishPay() {
    onPaid && onPaid();
    onClose && onClose();
  }

  if (!obligation) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={view === "processing" ? undefined : onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(10,20,25,.42)",
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: "opacity .2s", zIndex: 40,
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 480, maxWidth: "96vw",
        background: T.card, boxShadow: "-12px 0 40px rgba(16,30,40,.18)",
        transform: open ? "none" : "translateX(100%)",
        transition: "transform .26s cubic-bezier(.4,0,.2,1)",
        zIndex: 50, display: "flex", flexDirection: "column",
      }}>
        {/* Head */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: 20, borderBottom: "1px solid " + T.line }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: T.dark }}>
            {view === "confirm" ? "Payment recorded" : view === "error" ? "Something went wrong" : "Schedule payment and filing"}
          </h2>
          <button onClick={onClose} style={{ position: "absolute", right: 16, top: 16, width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: T.slate, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "22px 24px", position: "relative" }}>
          {/* Schedule view */}
          {view === "schedule" && (
            <div>
              {obligation.status === "pastDue" && (
                <Banner text="This payment is past due and you probably owe a penalty and interest. Make this payment and contact the agency." />
              )}
              {obligation.status !== "pastDue" && (
                <Banner text="Enter the payment date. Once you record the payment, Novala shows specific instructions on how to pay." />
              )}

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".6px", color: T.muted, textTransform: "uppercase" }}>Pay</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{obligation.taxName}</span>
                  <Money v={obligation.amount} size={18} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <div>
                    <div style={S.kvCap}>Liability period</div>
                    <div style={{ ...tnum, fontSize: 12.5, fontWeight: 600 }}>{obligation.liability}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={S.kvCap}>Due date</div>
                    <div style={{ ...tnum, fontSize: 12.5, fontWeight: 600 }}>{obligation.dueDate}</div>
                  </div>
                </div>
                <div onClick={() => setShowBreakdown((s) => !s)} style={{ marginTop: 10, fontSize: 12.5, color: T.tealInk, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <ChevronRight size={13} style={{ transform: showBreakdown ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                  {showBreakdown ? "Hide breakdown" : "Show breakdown"}
                </div>
                {showBreakdown && obligation.breakdown && (
                  <div style={{ marginTop: 8, border: "1px solid " + T.line, borderRadius: 10, overflow: "hidden" }}>
                    {obligation.breakdown.map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", fontSize: 12.5, borderBottom: "1px solid " + T.line }}>
                        <span style={{ color: T.muted }}>{k}</span>
                        <span style={{ ...tnum, fontWeight: 600 }}>${v}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", fontSize: 12.5, fontWeight: 700, background: "#FAFBFC" }}>
                      <span>Total</span>
                      <span style={tnum}>${obligation.amount}</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={S.divider} />

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".6px", color: T.muted, textTransform: "uppercase" }}>File</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>Payroll remittance</div>
                <div style={{ fontSize: 13, color: T.slate, marginTop: 2 }}>Statement of Account (PD7A)</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <div>
                    <div style={S.kvCap}>Liability period</div>
                    <div style={{ ...tnum, fontSize: 12.5, fontWeight: 600 }}>{obligation.liability}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={S.kvCap}>Due date</div>
                    <div style={{ ...tnum, fontSize: 12.5, fontWeight: 600 }}>{obligation.dueDate}</div>
                  </div>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: T.tealInk, fontWeight: 600, fontSize: 13.5, cursor: "pointer", marginTop: 12 }}>
                  <Eye size={16} /> Preview
                </div>
              </div>

              <div style={S.divider} />

              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>How this will be paid and filed</div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Outside of Novala</div>
                  <div style={{ fontSize: 13, color: T.slate, lineHeight: 1.45 }}>Make the payment yourself and we will add it to your books here.</div>
                </div>
                <div onClick={() => setChequeQueue((c) => !c)} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, cursor: "pointer", fontSize: 13.5 }}>
                  <span style={{ width: 18, height: 18, border: "1.5px solid " + (chequeQueue ? T.teal : T.lineStrong), background: chequeQueue ? T.teal : "transparent", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {chequeQueue && <Check size={12} color="#fff" strokeWidth={3} />}
                  </span>
                  Add to print cheque queue
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Now for the details</div>

                {/* Bank account selector */}
                <div style={S.field}>
                  <label style={S.label}>Record to</label>
                  {banksLoading ? (
                    <div style={{ ...S.input, color: T.muted }}>Loading accounts...</div>
                  ) : bankAccounts.length === 0 ? (
                    <div style={{ background: T.amberTint, border: "1px solid " + T.amberBorder, color: T.amberInk, padding: "10px 14px", borderRadius: 10, fontSize: 13, display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <AlertTriangle size={16} style={{ flex: "0 0 auto", marginTop: 1 }} />
                      <span>
                        No bank accounts yet. <a href="/payroll/bank-accounts" style={{ color: T.amberInk, fontWeight: 700, textDecoration: "underline" }}>Add one first</a>.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div style={{ position: "relative" }}>
                        <select
                          value={bankAccountId}
                          onChange={(e) => setBankAccountId(e.target.value)}
                          style={{
                            ...S.input,
                            appearance: "none",
                            paddingRight: 40,
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                        >
                          {bankAccounts.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.name} {a.last_4 ? "(••••" + a.last_4 + ")" : ""} — {fmtMoney(a.current_balance)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} color={T.slate} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      </div>
                      {selectedBank && (
                        <div style={{ ...tnum, fontSize: 12.5, color: parseAmount(selectedBank.current_balance) < 0 ? T.red : T.slate, fontWeight: 600, marginTop: 6 }}>
                          Balance: {fmtMoney(selectedBank.current_balance)}
                        </div>
                      )}
                      {insufficientFunds && (
                        <div style={{ marginTop: 8, background: T.amberTint, border: "1px solid " + T.amberBorder, color: T.amberInk, padding: "10px 14px", borderRadius: 8, fontSize: 12.5, display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <AlertTriangle size={15} style={{ flex: "0 0 auto", marginTop: 1 }} />
                          <span>
                            <b>Insufficient funds.</b> This account will be overdrawn by {fmtMoney(insufficientFunds.overdrawBy)} after this payment. You can still record it.
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Premium DatePicker */}
                <div style={S.field}>
                  <label style={S.label}>Payment date</label>
                  <DatePicker value={paymentDate} onChange={setPaymentDate} />
                </div>

                <div style={S.field}>
                  <label style={S.label}>Cheque number <span style={{ color: T.slate, fontWeight: 500 }}>(optional)</span></label>
                  <input style={{ ...S.input, ...tnum }} placeholder="0001" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Notes <span style={{ color: T.slate, fontWeight: 500 }}>(optional)</span></label>
                  <input style={S.input} placeholder="Add a note" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                {saveError && view === "schedule" && (
                  <div style={{ marginTop: 12, background: T.redTint, border: "1px solid " + T.redBorder, color: T.redInk, padding: "10px 14px", borderRadius: 8, fontSize: 12.5, display: "flex", alignItems: "center", gap: 10 }}>
                    <AlertCircle size={15} />
                    {saveError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirmation view */}
          {view === "confirm" && (
            <HowToPayCRA obligation={obligation} />
          )}

          {view === "error" && (
            <div>
              <div style={{ background: T.redTint, border: "1px solid " + T.redBorder, color: T.redInk, padding: "14px 16px", borderRadius: 10, fontSize: 13.5, display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
                <AlertCircle size={20} style={{ flex: "0 0 auto", marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Could not save the payment</div>
                  <div>{saveError}</div>
                </div>
              </div>
              <div style={{ fontSize: 13.5, color: T.slate, lineHeight: 1.5 }}>
                Your entries are still here. Click <b>Try again</b> to retry, or <b>Back</b> to change something first.
              </div>
            </div>
          )}

          {/* Processing overlay */}
          {view === "processing" && (
            <div style={{ position: "absolute", inset: 0, background: T.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, zIndex: 2 }}>
              <div style={{ width: 46, height: 46, border: "4px solid " + T.tealTint, borderTopColor: T.teal, borderRadius: "50%", animation: "ftspin .8s linear infinite" }} />
              <div style={{ fontSize: 15, fontWeight: 600, textAlign: "center", minHeight: 22, color: T.dark }}>Recording your payment...</div>
              <style>{`@keyframes ftspin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid " + T.line, padding: "14px 24px", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          {view === "confirm" && (
            <button style={{ ...S.btnPrimary, minWidth: 110 }} onClick={finishPay}>Done</button>
          )}
          {view === "error" && (
            <>
              <button style={S.btnOutline} onClick={() => { setSaveError(""); setView("schedule"); }}>Back</button>
              <button style={S.btnPrimary} onClick={handleSave}>Try again</button>
            </>
          )}
          {view === "schedule" && (
            <>
              <button style={S.btnOutline} onClick={onClose}>Cancel</button>
              <button style={S.btnPrimary} onClick={handleSave} disabled={saveMutation.isPending || banksLoading}>
                {saveMutation.isPending ? "Saving..." : "Pay & file"}
              </button>
            </>
          )}
          {view === "processing" && (
            <button style={{ ...S.btnPrimary, opacity: .5, cursor: "wait" }} disabled>Saving...</button>
          )}
        </div>
      </div>
    </>
  );
}