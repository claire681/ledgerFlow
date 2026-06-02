import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import { X, Paperclip, Check } from "lucide-react";

const BRAND = "#0F5959";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const BORDER = "#DDE5E5";
const GREEN = "#10A35A";

const KEYFRAMES = `
@keyframes fbIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: none; } }
@keyframes fbPop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
`;

async function sendFeedback({ message, source, filename }) {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("novala_token") ||
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("token") ||
    "";
  const apiBase =
    process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_API_BASE_URL ||
    "";
  const res = await fetch(`${apiBase}/api/v1/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      page_context: source || null,
      attachment_filename: filename || null,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Request failed: ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

export function FeedbackWidget({ onClose, source }) {
  const [message, setMessage] = useState("");
  const [filename, setFilename] = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const fileInputRef = useRef(null);

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true); setErr("");
    try {
      await sendFeedback({ message: message.trim(), source, filename });
      setSent(true);
      setTimeout(() => onClose(), 1600);
    } catch (e) {
      setErr(e?.message || "Failed to send. Try again.");
      setSending(false);
    }
  };

  const iconBtn = {
    width: 32, height: 32, borderRadius: 999,
    background: "transparent", border: "none", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    color: SUB,
  };

  const node = (
    <>
      <style>{KEYFRAMES}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed", bottom: 24, right: 24,
          width: 360, maxHeight: 480, background: "#fff", borderRadius: 18,
          border: "1px solid rgba(14,26,26,0.05)",
          boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 24px 48px -16px rgba(11,55,57,0.25)",
          animation: "fbIn 0.34s cubic-bezier(0.16,1,0.3,1)",
          zIndex: 10000,
          display: "flex", flexDirection: "column",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: "1px solid #F0F2F2",
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: INK }}>Send us a message</h3>
          <button onClick={onClose} style={iconBtn} aria-label="Close">
            <X size={18} strokeWidth={2.1} />
          </button>
        </div>

        {sent ? (
          <div style={{ padding: "32px 24px", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: GREEN,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 14, alignSelf: "center",
              boxShadow: "0 14px 30px -10px rgba(16,163,90,0.6)",
              animation: "fbPop 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
              <Check size={32} color="#fff" strokeWidth={3} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 4 }}>Thanks for the feedback</div>
            <div style={{ fontSize: 13.5, color: SUB }}>We'll review it shortly.</div>
          </div>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Give feedback or ask for help"
              autoFocus
              style={{
                flex: 1, minHeight: 160, padding: "14px 18px",
                border: "none", outline: "none", resize: "none",
                fontFamily: "inherit", fontSize: 14, color: INK, background: "transparent",
                lineHeight: 1.55,
              }}
            />
            {filename && (
              <div style={{
                margin: "0 16px 8px 16px", padding: "8px 12px",
                background: "#F1F5F5", borderRadius: 8,
                fontSize: 12.5, color: SUB,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <Paperclip size={14} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{filename}</span>
                <button onClick={() => setFilename(null)} style={{ background: "none", border: "none", cursor: "pointer", color: SUB, padding: 2, display: "inline-flex" }} aria-label="Remove attachment">
                  <X size={14} />
                </button>
              </div>
            )}
            {err && (
              <div style={{
                margin: "0 16px 8px 16px", padding: "8px 12px",
                background: "#FDECEB", color: "#D9453C",
                fontSize: 12.5, borderRadius: 8, fontWeight: 500,
              }}>{err}</div>
            )}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: 12, borderTop: "1px solid #F0F2F2",
            }}>
              <button onClick={() => setShowAttach(true)} style={iconBtn} title="Attach a file" aria-label="Attach a file">
                <Paperclip size={18} strokeWidth={1.9} />
              </button>
              <button
                onClick={send}
                disabled={!message.trim() || sending}
                style={{
                  padding: "9px 22px", borderRadius: 10, border: "none",
                  background: message.trim() && !sending ? BRAND : "#E7ECEC",
                  color: message.trim() && !sending ? "#fff" : "#9AA8A8",
                  fontWeight: 700, fontSize: 14,
                  cursor: message.trim() && !sending ? "pointer" : "not-allowed",
                  boxShadow: message.trim() && !sending ? "0 6px 14px -6px rgba(15,89,89,0.5)" : "none",
                  transition: "all 0.18s",
                }}
              >
                {sending ? "Sending…" : "Next"}
              </button>
            </div>
          </>
        )}
      </div>

      {showAttach && (
        <AttachFileDialog
          onClose={() => setShowAttach(false)}
          onChoose={(file) => {
            setFilename(file?.name);
            setShowAttach(false);
          }}
          fileInputRef={fileInputRef}
        />
      )}
    </>
  );
  return ReactDOM.createPortal(node, document.body);
}

function AttachFileDialog({ onClose, onChoose, fileInputRef }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(14,26,26,0.45)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10001,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 18, padding: 32, width: 380,
          border: "1px solid rgba(14,26,26,0.05)",
          boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 32px 64px -24px rgba(11,55,57,0.35)",
          animation: "fbIn 0.34s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <h3 style={{ margin: "0 0 22px 0", fontSize: 18, fontWeight: 700, color: INK, letterSpacing: "-0.01em" }}>
          Attach a file
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChoose(file);
          }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => fileInputRef.current?.click()} style={{
            flex: 1, padding: "11px 16px", borderRadius: 10,
            background: BRAND, color: "#fff", border: "none",
            fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>
            Choose a file…
          </button>
          <button onClick={onClose} style={{
            padding: "11px 22px", borderRadius: 10,
            background: "transparent", color: SUB, border: `1.5px solid ${BORDER}`,
            fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
