import React, { useState, useEffect } from "react";
import {
  X, Info, ChevronRight, ChevronDown, Eye, Check, Calendar, CheckCircle2,
} from "lucide-react";

// Federal Taxes Pay & File drawer.
// Right-side sliding panel over dimmed backdrop.
// Views: schedule -> processing -> confirm -> Done triggers onPaid.

const T = {
  teal: "#15A08C", tealHover: "#0F8474", tealTint: "#E1F5EE", tealInk: "#0F6E56",
  slate: "#12262B", muted: "#66748B", card: "#FFFFFF",
  line: "#E7EAF0", lineStrong: "#D5DBE3", dark: "#0E1A1A",
  red: "#D6455B", infoTint: "#EAF2FB", info: "#2B6CB0",
};
const tnum = { fontVariantNumeric: "tabular-nums" };

const S = {
  btnPrimary: { font: "inherit", fontWeight: 600, fontSize: 13.5, border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", background: T.dark, color: "#fff" },
  btnOutline: { font: "inherit", fontWeight: 600, fontSize: 13.5, borderRadius: 10, padding: "10px 18px", cursor: "pointer", background: T.card, color: T.slate, border: "1px solid " + T.lineStrong },
  field: { marginTop: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: T.slate, marginBottom: 6 },
  input: { width: "100%", border: "1px solid " + T.lineStrong, borderRadius: 10, padding: "11px 13px", font: "inherit", fontSize: 14, color: T.slate, background: T.card },
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
      <div>{text} <span style={{ color: T.info, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Show more</span></div>
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

export default function SchedulePaymentPanel({ open, onClose, obligation, recordTo, onPaid }) {
  const [view, setView] = useState("schedule");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [chequeQueue, setChequeQueue] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toLocaleDateString("en-GB").replace(/\//g, "/"));
  const [chequeNo, setChequeNo] = useState("");
  const [notes, setNotes] = useState("");
  const [procMsg, setProcMsg] = useState("");

  // Reset when opening a new obligation
  useEffect(() => {
    if (open) {
      setView("schedule");
      setShowBreakdown(false);
    }
  }, [open, obligation]);

  // Processing animation
  useEffect(() => {
    if (view !== "processing") return;
    const steps = ["Recording your payment", "Filing your PD7A", "Updating your books", "Almost done"];
    let i = 0;
    setProcMsg(steps[0]);
    const iv = setInterval(() => {
      i = i + 1;
      if (i < steps.length) setProcMsg(steps[i]);
    }, 700);
    const done = setTimeout(() => setView("confirm"), 2800);
    return () => { clearInterval(iv); clearTimeout(done); };
  }, [view]);

  function finishPay() {
    onPaid && onPaid();
    onClose && onClose();
  }

  if (!obligation) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
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
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
            {view === "confirm" ? "Confirmation" : "Schedule payment and filing"}
          </h2>
          <button onClick={onClose} style={{ position: "absolute", right: 16, top: 16, width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: T.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "22px 24px", position: "relative" }}>
          {view !== "confirm" && (
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
                <div onClick={() => setShowBreakdown((s) => !s)} style={{ marginTop: 10, fontSize: 12.5, color: T.teal, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
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
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>PD7A</div>
                <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>Statement of Account for Current Source Deductions</div>
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
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: T.teal, fontWeight: 600, fontSize: 13.5, cursor: "pointer", marginTop: 12 }}>
                  <Eye size={16} /> Preview
                </div>
              </div>

              <div style={S.divider} />

              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>How this will be paid and filed</div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Outside of Novala</div>
                  <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.45 }}>Make the payment yourself and we will add it to your books here.</div>
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
                <div style={S.field}>
                  <label style={S.label}>Record to</label>
                  <div style={{ ...S.input, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                    {recordTo?.name || "Select account"} <ChevronDown size={16} color={T.muted} />
                  </div>
                  {recordTo && (
                    <div style={{ ...tnum, fontSize: 12.5, color: recordTo.negative ? T.red : T.muted, fontWeight: 600, marginTop: 6 }}>
                      Balance: -${(recordTo.balance || "").replace("-", "")}
                    </div>
                  )}
                </div>
                <div style={S.field}>
                  <label style={S.label}>Payment date</label>
                  <div style={{ position: "relative" }}>
                    <input style={{ ...S.input, ...tnum }} value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                    <Calendar size={17} color={T.muted} style={{ position: "absolute", right: 13, top: 12, pointerEvents: "none" }} />
                  </div>
                </div>
                <div style={S.field}>
                  <label style={S.label}>Cheque number <span style={{ color: T.muted, fontWeight: 500 }}>(optional)</span></label>
                  <input style={{ ...S.input, ...tnum }} placeholder="0001" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Notes <span style={{ color: T.muted, fontWeight: 500 }}>(optional)</span></label>
                  <input style={S.input} placeholder="Add a note" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {view === "confirm" && (
            <div>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.tealTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "6px auto 16px" }}>
                <CheckCircle2 size={30} color={T.teal} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{obligation.taxName}</span>
                <Money v={obligation.amount} size={18} />
              </div>
              <div style={{ ...tnum, textAlign: "right", fontSize: 12.5, fontWeight: 600, marginTop: 4 }}>Due {obligation.dueDate}</div>
              <ConfRow capL="Liability period" valL={obligation.liability} capR="Payment method" valR="Outside of Novala" mono />
              <ConfRow capL="Payment date" valL={paymentDate} mono />
              <div style={S.divider} />
              <div style={{ fontSize: 16, fontWeight: 600 }}>PD7A</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>Statement of Account for Current Source Deductions</div>
              <ConfRow capL="Liability period" valL={obligation.liability} capR="Filing method" valR="Outside of Novala" mono />
              <ConfRow capL="Filing date" valL={paymentDate} mono />
            </div>
          )}

          {/* Processing overlay */}
          {view === "processing" && (
            <div style={{ position: "absolute", inset: 0, background: T.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, zIndex: 2 }}>
              <div style={{ width: 46, height: 46, border: "4px solid " + T.tealTint, borderTopColor: T.teal, borderRadius: "50%", animation: "ftspin .8s linear infinite" }} />
              <div style={{ fontSize: 15, fontWeight: 600, textAlign: "center", minHeight: 22 }}>{procMsg}</div>
              <style>{`@keyframes ftspin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid " + T.line, padding: "14px 24px", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          {view === "confirm" ? (
            <button style={{ ...S.btnPrimary, minWidth: 110 }} onClick={finishPay}>Done</button>
          ) : (
            <>
              <button style={S.btnOutline} onClick={onClose}>Cancel</button>
              <button style={S.btnPrimary} onClick={() => setView("processing")} disabled={view === "processing"}>Pay &amp; file</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}