import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Mail, Phone, X, Check } from "lucide-react";

/*
  Novala — Identity Verification Modal (premium refresh, real backend)
  - Refined fintech minimalism, Novala teal (#0F9599)
  - Sliding segmented control: Text message / Email / Call
  - 6-cell OTP: auto-advance, paste, teal focus, GREEN tick on correct code
  - Validation is server-side: live POST /verify/check-code on every 6-digit code
  - Account owner's phone/email pulled from /auth/profile (read-only)
*/

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || "";
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const TEAL = "#0F9599";
const TEAL_DARK = "#0B7377";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const MUTED = "#9AA8A8";
const BORDER = "#DDE5E5";
const GREEN = "#10A35A";
const RED = "#D9453C";

const METHODS = [
  { key: "text", label: "Text message", icon: MessageSquare, verb: "Check your text messages" },
  { key: "email", label: "Email", icon: Mail, verb: "Check your email" },
  { key: "call", label: "Call", icon: Phone, verb: "Answer your phone" },
];

export default function NovalaVerifyModal({ onClose = () => {}, onVerified = () => {} }) {
  const [method, setMethod] = useState("text");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle"); // idle | error | success | verified
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [destinationFromApi, setDestinationFromApi] = useState("");
  const inputs = useRef([]);

  const activeIndex = METHODS.findIndex((m) => m.key === method);
  const current = METHODS[activeIndex];
  const Icon = current.icon;
  const code = digits.join("");
  const filled = code.length === 6;
  const localDest = method === "email" ? email : phone;
  const destination = destinationFromApi || localDest;
  const hasDest = !!(method === "email" ? email : phone) || !!destinationFromApi;

  // [Mount] fetch the account owner's profile (phone + email)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/v1/auth/profile`, { headers: authHeaders() });
        if (r.ok) {
          const u = await r.json();
          setPhone(u.phone || "");
          setEmail(u.email || "");
        }
      } catch (_) {}
    })();
  }, []);

  // [Method change] kick off /verify/send-code
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/v1/payroll/verify/send-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ method }),
        });
        const d = await r.json();
        if (!cancelled) setDestinationFromApi(d.destination || "");
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  // [Code change] live server-side validation when 6 digits are entered
  useEffect(() => {
    if (status === "verified") return;
    if (!filled) {
      if (status !== "idle") setStatus("idle");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/v1/payroll/verify/check-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ code }),
        });
        const d = await r.json();
        if (!cancelled) setStatus(d.valid === true ? "success" : "error");
      } catch (e) {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const setDigit = (i, v) => {
    const ch = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const onPaste = (e) => {
    e.preventDefault();
    const txt = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!txt) return;
    const next = ["", "", "", "", "", ""];
    txt.split("").forEach((c, idx) => (next[idx] = c));
    setDigits(next);
    inputs.current[Math.min(txt.length, 5)]?.focus();
  };

  const reset = async () => {
    setDigits(["", "", "", "", "", ""]);
    setStatus("idle");
    inputs.current[0]?.focus();
    // Resend code
    try {
      const r = await fetch(`${API_URL}/api/v1/payroll/verify/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ method }),
      });
      const d = await r.json();
      setDestinationFromApi(d.destination || "");
    } catch (e) {}
  };

  const cellBorder = (ch) => {
    if (status === "success" || status === "verified") return GREEN;
    if (status === "error") return RED;
    if (ch) return TEAL;
    return BORDER;
  };
  const cellBg = (ch) => {
    if (status === "success" || status === "verified") return "#ECF9F2";
    if (status === "error") return "#FDECEB";
    return "#FFFFFF";
  };

  return (
    <div style={S.backdrop}>
      <style>{CSS}</style>
      <div style={S.card} className="nv-card">
        <button style={S.close} aria-label="Close" onClick={onClose} className="nv-close">
          <X size={18} strokeWidth={2.2} />
        </button>

        <div style={S.wordmark}>NOVALA</div>

        {status === "verified" ? (
          <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
            <div style={S.successRing} className="nv-pop">
              <Check size={34} strokeWidth={3} color="#fff" />
            </div>
            <h2 style={S.title}>Identity verified</h2>
            <p style={S.sub}>You're all set. Sending the invite now.</p>
          </div>
        ) : (
          <>
            <h2 style={S.title}>{current.verb}</h2>
            <p style={S.sub}>Enter the verification code we sent you to verify your identity.</p>

            <div style={S.medallionWrap}>
              <div style={S.medallion} className="nv-float">
                <Icon size={28} strokeWidth={1.9} color={TEAL} />
              </div>
            </div>

            <div style={S.segment}>
              <div
                style={{
                  ...S.segIndicator,
                  width: `calc((100% - 8px) / 3)`,
                  transform: `translateX(${activeIndex * 100}%)`,
                }}
              />
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => { setMethod(m.key); setDigits(["","","","","",""]); setStatus("idle"); }}
                  style={{
                    ...S.segBtn,
                    color: m.key === method ? INK : MUTED,
                    fontWeight: m.key === method ? 700 : 500,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div style={S.destBlock}>
              <span style={S.destLabel}>We sent a code to</span>
              {hasDest ? (
                <span style={S.destValue}>{destination}</span>
              ) : (
                <span style={S.destEmpty}>
                  No {method === "email" ? "email" : "phone"} on file — add one in account settings
                </span>
              )}
            </div>

            <label style={S.otpLabel}>Enter the 6-digit code</label>
            <div
              style={{ ...S.otpRow }}
              className={status === "error" ? "nv-shake" : ""}
              onPaste={onPaste}
            >
              {digits.map((ch, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <input
                    ref={(el) => (inputs.current[i] = el)}
                    value={ch}
                    inputMode="numeric"
                    maxLength={1}
                    disabled={!hasDest}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    className="nv-cell"
                    style={{
                      ...S.cell,
                      borderColor: cellBorder(ch),
                      background: hasDest ? cellBg(ch) : "#F4F6F6",
                      color: status === "error" ? RED : (status === "success" || status === "verified") ? GREEN : INK,
                    }}
                  />
                </div>
              ))}
              {(status === "success") && (
                <div style={S.tick} className="nv-pop">
                  <Check size={16} strokeWidth={3} color="#fff" />
                </div>
              )}
            </div>
            {status === "error" && (
              <p style={S.errText}>That code didn't work. Try again.</p>
            )}

            <button
              disabled={status !== "success"}
              onClick={() => { setStatus("verified"); setTimeout(onVerified, 700); }}
              className="nv-primary"
              style={{
                ...S.primary,
                background: status === "success" ? TEAL : "#E7ECEC",
                color: status === "success" ? "#fff" : MUTED,
                cursor: status === "success" ? "pointer" : "not-allowed",
                boxShadow: status === "success" ? "0 8px 20px -8px rgba(15,149,153,0.6)" : "none",
              }}
            >
              Continue
            </button>

            <button className="nv-ghost" style={S.ghost} onClick={reset}>
              I didn't get a {method === "email" ? "email" : method === "call" ? "call" : "text message"}
            </button>

            {method !== "call" && (
              <button style={S.link} className="nv-link" onClick={() => { setMethod("call"); setDigits(["","","","","",""]); setStatus("idle"); }}>
                Call me instead
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  backdrop: {
    position: "fixed", inset: 0, display: "grid", placeItems: "center",
    background: "rgba(14,26,26,0.45)", backdropFilter: "blur(6px)", padding: 20,
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", zIndex: 10001,
  },
  card: {
    width: 420, maxWidth: "100%", background: "#fff", borderRadius: 24,
    padding: "40px 36px 30px", position: "relative",
    border: "1px solid rgba(14,26,26,0.05)",
    boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 32px 64px -24px rgba(11,55,57,0.35)",
  },
  close: {
    position: "absolute", top: 16, right: 16, width: 34, height: 34, borderRadius: 999,
    border: "none", background: "transparent", color: SUB, display: "grid",
    placeItems: "center", cursor: "pointer",
  },
  wordmark: {
    textAlign: "center", color: TEAL, fontWeight: 800, fontSize: 15,
    letterSpacing: "0.32em", marginBottom: 18, paddingLeft: "0.32em",
  },
  title: { textAlign: "center", color: INK, fontSize: 23, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.01em" },
  sub: { textAlign: "center", color: SUB, fontSize: 14.5, lineHeight: 1.55, margin: "0 auto 22px", maxWidth: 300 },
  medallionWrap: { display: "grid", placeItems: "center", marginBottom: 22 },
  medallion: {
    width: 76, height: 76, borderRadius: 22, display: "grid", placeItems: "center",
    background: "radial-gradient(120% 120% at 30% 20%, #E6F6F6 0%, #D2EEEE 100%)",
    border: "1px solid rgba(15,149,153,0.18)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 22px -12px rgba(15,149,153,0.55)",
  },
  segment: {
    position: "relative", display: "flex", background: "#F1F5F5", borderRadius: 14,
    padding: 4, marginBottom: 20,
  },
  segIndicator: {
    position: "absolute", top: 4, left: 4, bottom: 4, borderRadius: 10,
    background: "#fff", boxShadow: "0 1px 3px rgba(16,24,40,0.12)",
    transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
  },
  segBtn: {
    flex: 1, position: "relative", zIndex: 1, border: "none", background: "transparent",
    padding: "9px 0", fontSize: 13.5, cursor: "pointer", borderRadius: 10,
    fontFamily: "inherit", transition: "color 0.2s",
  },
  destBlock: { textAlign: "center", marginBottom: 22, display: "flex", flexDirection: "column", gap: 4 },
  destLabel: { color: SUB, fontSize: 13 },
  destValue: { color: INK, fontSize: 16, fontWeight: 700, letterSpacing: "0.01em" },
  destEmpty: { color: MUTED, fontSize: 13.5, fontStyle: "italic" },
  otpLabel: { display: "block", color: SUB, fontSize: 13, fontWeight: 600, marginBottom: 10 },
  otpRow: { position: "relative", display: "flex", gap: 9, justifyContent: "space-between", marginBottom: 8 },
  cell: {
    width: 48, height: 56, borderRadius: 13, border: "1.6px solid", textAlign: "center",
    fontSize: 22, fontWeight: 700, outline: "none", fontFamily: "inherit",
    transition: "border-color 0.18s, background 0.18s, box-shadow 0.18s",
  },
  tick: {
    position: "absolute", right: -6, top: -6, width: 24, height: 24, borderRadius: 999,
    background: GREEN, display: "grid", placeItems: "center",
    boxShadow: "0 4px 10px -2px rgba(16,163,90,0.6)",
  },
  errText: { color: RED, fontSize: 12.5, fontWeight: 600, margin: "0 0 6px" },
  primary: {
    width: "100%", height: 52, borderRadius: 13, border: "none", marginTop: 14,
    fontSize: 15.5, fontWeight: 700, fontFamily: "inherit",
    transition: "transform 0.15s, box-shadow 0.2s, background 0.2s",
  },
  ghost: {
    width: "100%", height: 50, borderRadius: 13, marginTop: 10, background: "#fff",
    border: `1.5px solid ${BORDER}`, color: "#334", fontSize: 14.5, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", transition: "background 0.18s, border-color 0.18s",
  },
  link: {
    display: "block", margin: "16px auto 0", background: "none", border: "none",
    color: TEAL, fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: "inherit",
  },
  successRing: {
    width: 78, height: 78, borderRadius: 999, background: GREEN, display: "grid",
    placeItems: "center", margin: "8px auto 18px",
    boxShadow: "0 14px 30px -10px rgba(16,163,90,0.6)",
  },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.nv-card { animation: nvIn 0.34s cubic-bezier(0.16,1,0.3,1); }
@keyframes nvIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: none; } }
.nv-cell:focus { border-color: ${TEAL} !important; box-shadow: 0 0 0 4px rgba(15,149,153,0.14); }
.nv-close:hover { background: #F1F5F5; color: ${INK}; }
.nv-primary:hover:not(:disabled) { transform: translateY(-1px); background: ${TEAL_DARK} !important; }
.nv-ghost:hover { background: #F9FAFA; border-color: #C9D4D4; }
.nv-link:hover { color: ${TEAL_DARK}; }
.nv-float { animation: nvFloat 3.6s ease-in-out infinite; }
@keyframes nvFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
.nv-pop { animation: nvPop 0.3s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes nvPop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.nv-shake { animation: nvShake 0.4s; }
@keyframes nvShake { 0%,100%{transform:translateX(0);} 20%,60%{transform:translateX(-7px);} 40%,80%{transform:translateX(7px);} }
`;
