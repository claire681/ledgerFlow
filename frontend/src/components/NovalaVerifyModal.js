import React, { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquare, Mail, Phone, X, Check } from "lucide-react";

const TEAL = "#0F9599";
const TEAL_DARK = "#0B7377";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const MUTED = "#9AA8A8";
const BORDER = "#DDE5E5";
const GREEN = "#10A35A";
const RED = "#D9453C";

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

const METHODS = [
  { key: "text",  label: "Text message", Icon: MessageSquare, title: "Check your text messages", resendLabel: "I didn't get a text message", emptyState: "No phone on file, add one in account settings" },
  { key: "email", label: "Email",        Icon: Mail,          title: "Check your email",          resendLabel: "I didn't get an email",        emptyState: "No email on file, add one in account settings" },
  { key: "call",  label: "Call",         Icon: Phone,         title: "Answer your phone",         resendLabel: "I didn't get a call",          emptyState: "No phone on file, add one in account settings" }
];

function formatPhone(p) {
  if (!p) return "";
  const digits = String(p).replace(/[^\d+]/g, "");
  if (digits.startsWith("+1") && digits.length === 12) {
    return "+1 (" + digits.slice(2, 5) + ") " + digits.slice(5, 8) + "-" + digits.slice(8);
  }
  return digits;
}

export default function NovalaVerifyModal({
  phone = "",
  email = "",
  correctCode = "123456",
  onClose = () => {},
  onVerified = () => {},
  onCodeSubmit = null,
  onResend = null,
  defaultMethod = "text"
}) {
  const [method, setMethod] = useState(defaultMethod);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle");
  const inputRefs = useRef([]);

  const activeMethod = METHODS.find((m) => m.key === method);
  const activeIndex = METHODS.findIndex((m) => m.key === method);
  const ActiveIcon = activeMethod.Icon;

  const destination = useMemo(() => {
    if (method === "email") return email;
    return formatPhone(phone);
  }, [method, phone, email]);

  const hasDestination = !!destination;
  const codeStr = code.join("");
  const isFull = codeStr.length === 6;
  const isMatch = isFull && codeStr === String(correctCode);

  useEffect(() => {
    if (!isFull) {
      setStatus((prev) => (prev === "success" || prev === "error") ? "idle" : prev);
      return;
    }
    let cancelled = false;
    (async () => {
      if (typeof onCodeSubmit === "function") {
        try {
          const ok = await onCodeSubmit(codeStr);
          if (!cancelled) setStatus((prev) => prev === "verified" ? prev : (ok ? "success" : "error"));
        } catch (e) {
          if (!cancelled) setStatus((prev) => prev === "verified" ? prev : "error");
        }
      } else {
        const ok = codeStr === String(correctCode);
        if (!cancelled) setStatus((prev) => prev === "verified" ? prev : (ok ? "success" : "error"));
      }
    })();
    return () => { cancelled = true; };
  }, [codeStr, isFull]);

  const resetCode = () => {
    setCode(["", "", "", "", "", ""]);
    setStatus("idle");
    setTimeout(() => {
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, 0);
  };

  const handleChange = (i, v) => {
    const ch = v.replace(/\D/g, "").slice(-1);
    if (!ch) return;
    const next = code.slice();
    next[i] = ch;
    setCode(next);
    if (i < 5 && inputRefs.current[i + 1]) inputRefs.current[i + 1].focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (code[i]) {
        const next = code.slice();
        next[i] = "";
        setCode(next);
      } else if (i > 0) {
        if (inputRefs.current[i - 1]) inputRefs.current[i - 1].focus();
        const next = code.slice();
        next[i - 1] = "";
        setCode(next);
      }
    }
    if (e.key === "ArrowLeft" && i > 0 && inputRefs.current[i - 1]) inputRefs.current[i - 1].focus();
    if (e.key === "ArrowRight" && i < 5 && inputRefs.current[i + 1]) inputRefs.current[i + 1].focus();
  };

  const handlePaste = (e) => {
    const txt = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!txt) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let j = 0; j < txt.length; j++) next[j] = txt[j];
    setCode(next);
    const last = Math.min(txt.length, 5);
    if (inputRefs.current[last]) inputRefs.current[last].focus();
  };

  const handleSwitchMethod = (key) => {
    if (key === method) return;
    setMethod(key);
    resetCode();
  };

  const handleResend = () => {
    resetCode();
    if (typeof onResend === "function") {
      onResend();
    }
  };

  const handleContinue = () => {
    if (status !== "success") return;
    setStatus("verified");
    setTimeout(() => onVerified(), 1200);
  };

  const getCellStyle = (i) => {
    let borderColor = BORDER;
    let background = "#fff";
    let color = INK;
    if (!hasDestination) {
      background = "#F4F6F6"; color = MUTED;
    } else if (status === "success" || status === "verified") {
      borderColor = GREEN; background = "#ECF9F2"; color = GREEN;
    } else if (status === "error") {
      borderColor = RED; background = "#FDECEB"; color = RED;
    } else if (code[i]) {
      borderColor = TEAL;
    }
    return {
      width: 48,
      height: 56,
      borderRadius: 13,
      border: "1.6px solid " + borderColor,
      background: background,
      color: color,
      fontSize: 22,
      fontWeight: 700,
      textAlign: "center",
      outline: "none",
      transition: "border-color 0.18s, background 0.18s, box-shadow 0.18s",
      fontFamily: FONT
    };
  };

  const continueEnabled = status === "success";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(14,26,26,0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: FONT
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes nvIn    { from{opacity:0;transform:translateY(12px) scale(0.97);} to{opacity:1;transform:none;} }
        @keyframes nvFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
        @keyframes nvPop   { from{transform:scale(0.4);opacity:0;} to{transform:scale(1);opacity:1;} }
        @keyframes nvShake { 0%,100%{transform:translateX(0);} 20%,60%{transform:translateX(-7px);} 40%,80%{transform:translateX(7px);} }
        .nv-otp-cell:focus    { border-color: ${TEAL} !important; box-shadow: 0 0 0 4px rgba(15,149,153,0.14) !important; }
        .nv-resend-btn:hover  { background: #F9FAFA !important; border-color: #C9D4D4 !important; }
        .nv-call-link:hover   { color: ${TEAL_DARK} !important; }
        .nv-continue-on:hover { background: ${TEAL_DARK} !important; transform: translateY(-1px); }
        .nv-close:hover       { background: #F1F5F5 !important; color: ${INK} !important; }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "relative",
          width: 420,
          maxWidth: "100%",
          background: "#fff",
          borderRadius: 24,
          padding: "40px 36px 30px",
          border: "1px solid rgba(14,26,26,0.05)",
          boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 32px 64px -24px rgba(11,55,57,0.35)",
          animation: "nvIn 0.34s cubic-bezier(0.16,1,0.3,1)"
        }}
        onClick={(e) => { e.stopPropagation(); }}
      >
        <button
          type="button"
          className="nv-close"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 16, right: 16,
            width: 34, height: 34, borderRadius: 999,
            border: "none", background: "transparent", color: SUB, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.18s, color 0.18s"
          }}
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        {status === "verified" ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{
                width: 78, height: 78, borderRadius: 999, background: GREEN,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 14px 30px -10px rgba(16,163,90,0.6)",
                animation: "nvPop 0.4s cubic-bezier(0.34,1.56,0.64,1)"
              }}>
                <Check size={34} strokeWidth={3} color="#fff" />
              </div>
            </div>
            <div style={{ color: INK, fontSize: 23, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 8 }}>
              Identity verified
            </div>
            <div style={{ color: SUB, fontSize: 14.5, lineHeight: 1.55, maxWidth: 280, margin: "0 auto" }}>
              You're all set. Sending the invite now.
            </div>
          </div>
        ) : (
          <>
            <div style={{
              textAlign: "center", color: TEAL, fontWeight: 800, fontSize: 15,
              letterSpacing: "0.32em", paddingLeft: "0.32em", marginBottom: 18
            }}>
              NOVALA
            </div>

            <div style={{
              textAlign: "center", color: INK, fontSize: 23, fontWeight: 700,
              letterSpacing: "-0.01em", marginBottom: 8
            }}>
              {activeMethod.title}
            </div>

            <div style={{
              textAlign: "center", color: SUB, fontSize: 14.5, lineHeight: 1.55,
              maxWidth: 300, margin: "0 auto 22px"
            }}>
              Enter the verification code we sent you to verify your identity.
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
              <div style={{
                width: 76, height: 76, borderRadius: 22,
                background: "radial-gradient(120% 120% at 30% 20%, #E6F6F6 0%, #D2EEEE 100%)",
                border: "1px solid rgba(15,149,153,0.18)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 22px -12px rgba(15,149,153,0.55)",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "nvFloat 3.6s ease-in-out infinite"
              }}>
                <ActiveIcon size={28} strokeWidth={1.9} color={TEAL} />
              </div>
            </div>

            <div style={{
              position: "relative", display: "flex",
              background: "#F1F5F5", borderRadius: 14, padding: 4, marginBottom: 20
            }}>
              <div style={{
                position: "absolute", top: 4, bottom: 4, left: 4,
                width: "calc((100% - 8px) / 3)", borderRadius: 10,
                background: "#fff", boxShadow: "0 1px 3px rgba(16,24,40,0.12)",
                transform: "translateX(" + (activeIndex * 100) + "%)",
                transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)"
              }} />
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => handleSwitchMethod(m.key)}
                  style={{
                    flex: 1, zIndex: 1, background: "transparent", border: "none",
                    padding: "9px 0", fontSize: 13.5, borderRadius: 10, cursor: "pointer",
                    transition: "color 0.2s", fontFamily: FONT,
                    color: m.key === method ? INK : MUTED,
                    fontWeight: m.key === method ? 700 : 500
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{ color: SUB, fontSize: 13, marginBottom: 4 }}>
                We sent a code to
              </div>
              {hasDestination ? (
                <div style={{ color: INK, fontSize: 16, fontWeight: 700 }}>
                  {destination}
                </div>
              ) : (
                <div style={{ color: MUTED, fontSize: 13.5, fontStyle: "italic" }}>
                  {activeMethod.emptyState}
                </div>
              )}
            </div>

            <div style={{ color: SUB, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              Enter the 6-digit code
            </div>

            <div style={{
              position: "relative", display: "flex", gap: 9, justifyContent: "space-between",
              animation: status === "error" ? "nvShake 0.4s" : "none"
            }}>
              {code.map((c, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={c}
                  disabled={!hasDestination}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="nv-otp-cell"
                  style={getCellStyle(i)}
                />
              ))}
              {(status === "success" || status === "verified") && (
                <div style={{
                  position: "absolute", top: -6, right: -6,
                  width: 24, height: 24, borderRadius: 999, background: GREEN,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 10px -2px rgba(16,163,90,0.6)",
                  animation: "nvPop 0.3s cubic-bezier(0.34,1.56,0.64,1)"
                }}>
                  <Check size={16} strokeWidth={3} color="#fff" />
                </div>
              )}
            </div>

            {status === "error" && (
              <div style={{ color: RED, fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>
                That code didn't work. Try again.
              </div>
            )}

            <button
              type="button"
              disabled={!continueEnabled}
              onClick={handleContinue}
              className={continueEnabled ? "nv-continue-on" : ""}
              style={{
                width: "100%", height: 52, borderRadius: 13, border: "none",
                cursor: continueEnabled ? "pointer" : "not-allowed",
                fontFamily: FONT, fontSize: 15.5, fontWeight: 700, marginTop: 14,
                transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
                background: continueEnabled ? TEAL : "#E7ECEC",
                color: continueEnabled ? "#fff" : MUTED,
                boxShadow: continueEnabled ? "0 8px 20px -8px rgba(15,149,153,0.6)" : "none"
              }}
            >
              Continue
            </button>

            <button
              type="button"
              onClick={handleResend}
              className="nv-resend-btn"
              style={{
                width: "100%", height: 50, borderRadius: 13,
                background: "#fff", border: "1.5px solid " + BORDER,
                color: "#334", fontWeight: 600, fontSize: 14.5, cursor: "pointer",
                marginTop: 10, transition: "background 0.18s, border-color 0.18s", fontFamily: FONT
              }}
            >
              {activeMethod.resendLabel}
            </button>

            {method !== "call" && (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => handleSwitchMethod("call")}
                  className="nv-call-link"
                  style={{
                    background: "transparent", border: "none", color: TEAL,
                    fontWeight: 700, fontSize: 14.5, cursor: "pointer",
                    transition: "color 0.18s", fontFamily: FONT
                  }}
                >
                  Call me instead
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
